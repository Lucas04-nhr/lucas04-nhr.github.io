// Build the personal AltStore source from upstream sources and GitHub Releases.
//
// Usage: node .github/scripts/altstore-sync.mjs [config.json]
//
// - Upstream sources (e.g. AltGallery's all-apps.json) are copied as-is,
//   minus any bundle identifiers listed in `exclude`.
// - Each entry in `apps` is built from its GitHub repo's releases: every
//   release with an asset matching `assetPattern` becomes a version.
//   `excludeTags` skips releases whose tag matches it (e.g. betas that are
//   not marked as prereleases). With `versionFromIPA`, each version and
//   build number are read from the IPA's Info.plist instead of the tag, for
//   projects whose tags don't match the IPA they ship; AltStore and
//   SideStore reject a download whose version differs from the source.
// - Custom apps come first and win over upstream apps with the same
//   bundle identifier; earlier upstreams win over later ones.
// - The file already at `output` is treated as the previous source: if a
//   custom app's repo can't be read, its previous entry is kept with a
//   warning. A failed upstream aborts the run without writing.
// - In GitHub Actions, `changed`, `summary` and `warnings` are written to
//   GITHUB_OUTPUT so later steps can upload the file and send a notification.
//
// Set GITHUB_TOKEN (or GH_TOKEN) to avoid the anonymous API rate limit.

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const configPath = resolve(root, process.argv[2] ?? '.github/altstore/config.json')
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
const inActions = Boolean(process.env.GITHUB_ACTIONS)
const warnings = []

function warn(message) {
  warnings.push(message)
  console.warn(inActions ? `::warning title=altstore-sync::${message}` : `warning: ${message}`)
}

async function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT)
    return
  const delimiter = `EOF_${Math.random().toString(36).slice(2)}`
  await appendFile(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${value}\n${delimiter}\n`)
}

async function request(url, extraHeaders, read) {
  const headers = { 'User-Agent': 'lucas04-nhr-altstore-sync', ...extraHeaders }
  if (new URL(url).hostname === 'api.github.com') {
    headers.Accept = 'application/vnd.github+json'
    headers['X-GitHub-Api-Version'] = '2022-11-28'
    if (token)
      headers.Authorization = `Bearer ${token}`
  }

  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers })
      if (!response.ok)
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      return await read(response)
    }
    catch (error) {
      lastError = error
      if (attempt < 3)
        await new Promise(r => setTimeout(r, attempt * 2000))
    }
  }
  throw new Error(`${url}: ${lastError.message}`)
}

function fetchJSON(url) {
  return request(url, {}, response => response.json())
}

// Bytes [start, end) of a file. GitHub's release downloads accept explicit
// ranges but not suffix ranges such as "bytes=-100", so callers pass the
// asset size. A server that ignores Range sends the whole file with 200.
function fetchRange(url, start, end) {
  return request(url, { Range: `bytes=${start}-${end - 1}` }, async (response) => {
    const buffer = Buffer.from(await response.arrayBuffer())
    return response.status === 206 ? buffer : buffer.subarray(start, end)
  })
}

// Reads the given string keys from the top-level dictionary of an XML or
// binary (bplist00) property list.
function plistStrings(buffer, keys) {
  if (buffer.toString('latin1', 0, 8) !== 'bplist00') {
    const xml = buffer.toString('utf8')
    return Object.fromEntries(keys.map(key =>
      [key, xml.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`))?.[1]]))
  }

  const trailer = buffer.subarray(buffer.length - 32)
  const offsetSize = trailer[6]
  const refSize = trailer[7]
  const topObject = Number(trailer.readBigUInt64BE(16))
  const offsetTable = Number(trailer.readBigUInt64BE(24))
  const uint = (pos, size) => {
    let value = 0
    for (let i = 0; i < size; i++)
      value = value * 256 + buffer[pos + i]
    return value
  }
  // The marker's high nibble is the type and its low nibble the length; a
  // length of 0xF means an integer object with the real length follows.
  const object = (ref) => {
    const pos = uint(offsetTable + ref * offsetSize, offsetSize)
    let length = buffer[pos] & 0x0F
    let start = pos + 1
    if (length === 0x0F) {
      const size = 1 << (buffer[start] & 0x0F)
      length = uint(start + 1, size)
      start += 1 + size
    }
    return { type: buffer[pos] >> 4, length, start }
  }
  const string = (ref) => {
    const { type, length, start } = object(ref)
    if (type === 0x5)
      return buffer.toString('latin1', start, start + length)
    if (type === 0x6)
      return Buffer.from(buffer.subarray(start, start + length * 2)).swap16().toString('utf16le')
    return undefined
  }

  const dict = object(topObject)
  if (dict.type !== 0xD)
    throw new Error('Info.plist is not a dictionary')
  const result = {}
  for (let i = 0; i < dict.length; i++) {
    const key = string(uint(dict.start + i * refSize, refSize))
    if (keys.includes(key))
      result[key] = string(uint(dict.start + (dict.length + i) * refSize, refSize))
  }
  return result
}

// Reads the app's Info.plist from an IPA (a zip archive) with range
// requests: the end-of-central-directory record, the central directory,
// then the plist itself. Only a few KB are downloaded per IPA.
async function ipaVersion(url, size) {
  const tailStart = Math.max(0, size - 22 - 0xFFFF)
  const tail = await fetchRange(url, tailStart, size)
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4B, 0x05, 0x06]))
  if (eocd < 0)
    throw new Error('not a zip archive')
  const directorySize = tail.readUInt32LE(eocd + 12)
  const directoryOffset = tail.readUInt32LE(eocd + 16)
  if (directoryOffset === 0xFFFFFFFF)
    throw new Error('ZIP64 archives are not supported')

  const directory = directoryOffset >= tailStart
    ? tail.subarray(directoryOffset - tailStart, directoryOffset - tailStart + directorySize)
    : await fetchRange(url, directoryOffset, directoryOffset + directorySize)
  let plist
  for (let p = 0; p + 46 <= directory.length && directory.readUInt32LE(p) === 0x02014B50;) {
    const nameLength = directory.readUInt16LE(p + 28)
    const name = directory.toString('utf8', p + 46, p + 46 + nameLength)
    if (/^Payload\/[^/]+\.app\/Info\.plist$/.test(name)) {
      plist = {
        method: directory.readUInt16LE(p + 10),
        compressedSize: directory.readUInt32LE(p + 20),
        offset: directory.readUInt32LE(p + 42),
      }
      break
    }
    p += 46 + nameLength + directory.readUInt16LE(p + 30) + directory.readUInt16LE(p + 32)
  }
  if (!plist)
    throw new Error('no Payload/*.app/Info.plist')

  // The local header's name and extra fields can differ in length from the
  // central directory's, so read it before the data.
  const header = await fetchRange(url, plist.offset, plist.offset + 30)
  const dataStart = plist.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28)
  const data = await fetchRange(url, dataStart, dataStart + plist.compressedSize)
  if (plist.method !== 0 && plist.method !== 8)
    throw new Error(`unsupported zip compression method ${plist.method}`)
  const info = plistStrings(plist.method === 8 ? inflateRawSync(data) : data,
    ['CFBundleShortVersionString', 'CFBundleVersion'])
  if (!info.CFBundleShortVersionString)
    throw new Error('Info.plist has no CFBundleShortVersionString')
  return { version: info.CFBundleShortVersionString, buildVersion: info.CFBundleVersion }
}

async function readPrevious(path) {
  try {
    const text = await readFile(path, 'utf8')
    return text.trim() ? JSON.parse(text) : null
  }
  catch {
    return null
  }
}

// Release bodies may be bilingual. With `releaseNotes: "en"`, keep only the
// paragraphs without CJK text and drop separators and repeated headings.
function releaseNotes(release, language) {
  const body = (release.body ?? '').replace(/\r\n?/g, '\n').trim()
  let notes = body
  if (language === 'en') {
    const paragraphs = body.split(/\n\s*\n/).map(p => p.trim())
      .filter(p => p && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(p))
      .filter(p => !/^[-—_*=\s]+$/.test(p))
    notes = [...new Set(paragraphs)].join('\n\n') || body
  }
  return notes || release.name || release.tag_name
}

async function buildApp(entry) {
  const maxVersions = entry.maxVersions ?? 5
  const pattern = new RegExp(entry.assetPattern ?? '\\.ipa$', 'i')
  const excludeTags = entry.excludeTags ? new RegExp(entry.excludeTags, 'i') : null
  // GitHub lists releases by tag rather than by publish time, so a new
  // pre-release on a newer commit can come after an older tagged release.
  // AltStore and SideStore treat the first version as the latest, so sort
  // newest first. Drafts have no publish time and are skipped below.
  const releases = (await fetchJSON(`https://api.github.com/repos/${entry.github}/releases?per_page=30`))
    .sort((a, b) => String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')))

  const versions = []
  const seenVersions = new Set()
  let latestRelease
  for (const release of releases) {
    if (versions.length >= maxVersions)
      break
    if (release.draft || (release.prerelease && !entry.includePrereleases))
      continue
    if (excludeTags?.test(release.tag_name))
      continue
    const asset = release.assets.find(a => pattern.test(a.name))
    if (!asset)
      continue

    let version, buildVersion
    if (entry.versionFromIPA) {
      // Asspp, for example, has shipped a 4.2.0 build under the 4.2.2 tag.
      try {
        ({ version, buildVersion } = await ipaVersion(asset.browser_download_url, asset.size))
      }
      catch (error) {
        warn(`${entry.github} ${release.tag_name}: can't read the version from ${asset.name} (${error.message}); skipping it`)
        continue
      }
      console.log(`  ${release.tag_name}: ${asset.name} is ${version} (${buildVersion ?? 'no build'})`)
    }
    else {
      // Tags like "v8.0.17+339" carry build metadata. The build number in a
      // Flutter-style asset name ("App_8.0.18+344.ipa") is the IPA's
      // CFBundleVersion, so use it as buildVersion; the tag's may differ.
      // Tags that are not a version, such as GestaltX's beta tags
      // ("sha-557369f"), take the version from the asset name instead
      // ("GestaltX_1.1.0+11100024.ipa"); releases with neither are skipped.
      version = release.tag_name.replace(/^v/i, '').replace(/\+.*$/, '')
      if (!/^\d/.test(version)) {
        const fromAsset = asset.name.match(/_v?(\d[^_+]*?)(?:\+\d+)?\.ipa$/i)?.[1]
        if (!fromAsset) {
          console.log(`  skip ${release.tag_name}: no version in the tag or in ${asset.name}`)
          continue
        }
        version = fromAsset
      }
      buildVersion = asset.name.match(/\+(\d+)\.ipa$/i)?.[1]
    }
    const key = `${version}+${buildVersion ?? ''}`
    if (seenVersions.has(key))
      continue
    seenVersions.add(key)

    latestRelease ??= release
    versions.push({
      version,
      ...(buildVersion ? { buildVersion } : {}),
      date: release.published_at.slice(0, 10),
      localizedDescription: releaseNotes(release, entry.releaseNotes),
      downloadURL: asset.browser_download_url,
      size: asset.size,
      ...(entry.minOSVersion ? { minOSVersion: entry.minOSVersion } : {}),
    })
  }

  if (!versions.length)
    throw new Error(`no release asset of ${entry.github} matches ${pattern}`)

  const app = { ...entry.app, versions }
  const latest = versions[0]
  const news = {
    appID: app.bundleIdentifier,
    title: `${app.name} ${latest.version} · ${latest.date}`,
    identifier: `${app.name}-release-${latestRelease.tag_name}`,
    caption: `${app.name} ${latest.version} is available.`,
    date: latestRelease.published_at,
    tintColor: app.tintColor,
    notify: true,
    url: latestRelease.html_url,
  }
  return { app, news }
}

// One line per app that was added, removed or changed its latest version.
function describeChanges(before, after) {
  const latest = source => new Map((source?.apps ?? []).map(a => [a.bundleIdentifier, a]))
  const old = latest(before)
  const now = latest(after)
  const lines = []
  for (const [id, app] of now) {
    const version = app.versions?.[0]?.version ?? '?'
    const prev = old.get(id)
    if (!prev)
      lines.push(`- Added ${app.name} ${version}`)
    else if (prev.versions?.[0]?.version !== version)
      lines.push(`- ${app.name}: ${prev.versions?.[0]?.version ?? '?'} → ${version}`)
  }
  for (const [id, app] of old) {
    if (!now.has(id))
      lines.push(`- Removed ${app.name}`)
  }
  return lines
}

const config = JSON.parse(await readFile(configPath, 'utf8'))
const outputPath = resolve(root, config.output)
const previous = await readPrevious(outputPath)

const apps = []
const news = []
const seen = new Set()

function addApp(app, origin) {
  if (seen.has(app.bundleIdentifier)) {
    console.log(`  skip ${app.bundleIdentifier} from ${origin}: already listed`)
    return false
  }
  seen.add(app.bundleIdentifier)
  apps.push(app)
  return true
}

for (const entry of config.apps ?? []) {
  console.log(`==> ${entry.github}`)
  try {
    const built = await buildApp(entry)
    addApp(built.app, entry.github)
    news.push(built.news)
    console.log(`  ${built.app.versions.length} version(s), latest ${built.app.versions[0].version}`)
  }
  catch (error) {
    const id = entry.app.bundleIdentifier
    const kept = previous?.apps?.find(a => a.bundleIdentifier === id)
    if (!kept)
      throw new Error(`${entry.github} failed and has no previous entry: ${error.message}`)
    warn(`${entry.github} failed (${error.message}); keeping its previous entry`)
    addApp(kept, `${entry.github} (previous)`)
    news.push(...(previous.news ?? []).filter(n => n.appID === id))
  }
}

for (const upstream of config.upstreams ?? []) {
  console.log(`==> ${upstream.name}`)
  const source = await fetchJSON(upstream.url)
  if (!Array.isArray(source.apps))
    throw new Error(`${upstream.name}: response has no apps array`)

  const exclude = new Set(upstream.exclude ?? [])
  const added = new Set()
  for (const app of source.apps) {
    if (!exclude.has(app.bundleIdentifier) && addApp(app, upstream.name))
      added.add(app.bundleIdentifier)
  }
  news.push(...(source.news ?? []).filter(n => !n.appID || added.has(n.appID)))
  console.log(`  ${added.size} of ${source.apps.length} app(s) added`)
}

const uniqueNews = [...new Map(news.map(n => [n.identifier, n])).values()]
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))

const { featuredApps, ...sourceMeta } = config.source
const output = {
  ...sourceMeta,
  ...(featuredApps ? { featuredApps: featuredApps.filter(id => seen.has(id)) } : {}),
  apps,
  news: config.maxNews ? uniqueNews.slice(0, config.maxNews) : uniqueNews,
}

const text = `${JSON.stringify(output, null, 2)}\n`
const changed = !previous || `${JSON.stringify(previous, null, 2)}\n` !== text
const counts = `${apps.length} app(s), ${output.news.length} news item(s)`

if (changed) {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, text)
  console.log(`Wrote ${config.output}: ${counts}`)
}
else {
  console.log(`No changes: ${counts}`)
}

const changes = describeChanges(previous, output)
const summary = [
  `- Source: ${counts}`,
  ...(changes.length ? changes : changed ? ['- Metadata or news changed; no app versions changed'] : []),
].join('\n')

await setOutput('changed', String(changed))
await setOutput('summary', summary)
await setOutput('warnings', warnings.map(w => `- ${w}`).join('\n'))
if (process.env.GITHUB_STEP_SUMMARY)
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `### AltStore source\n\n${summary}\n`)
