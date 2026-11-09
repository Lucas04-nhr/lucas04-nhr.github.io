// Build the personal AltStore source from upstream sources and GitHub Releases.
//
// Usage: node .github/scripts/altstore-sync.mjs [config.json]
//
// - Upstream sources (e.g. AltGallery's all-apps.json) are copied as-is,
//   minus any bundle identifiers listed in `exclude`.
// - Each entry in `apps` is built from its GitHub repo's releases: every
//   release with an asset matching `assetPattern` becomes a version.
//   `excludeTags` skips releases whose tag matches it (e.g. betas that are
//   not marked as prereleases).
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

async function fetchJSON(url) {
  const headers = { 'User-Agent': 'lucas04-nhr-altstore-sync' }
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
      return await response.json()
    }
    catch (error) {
      lastError = error
      if (attempt < 3)
        await new Promise(r => setTimeout(r, attempt * 2000))
    }
  }
  throw new Error(`${url}: ${lastError.message}`)
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
  const releases = await fetchJSON(`https://api.github.com/repos/${entry.github}/releases?per_page=30`)

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

    // Tags like "v8.0.17+339" carry build metadata. The build number in a
    // Flutter-style asset name ("App_8.0.18+344.ipa") is the IPA's
    // CFBundleVersion, so use it as buildVersion; the tag's may differ.
    const version = release.tag_name.replace(/^v/i, '').replace(/\+.*$/, '')
    const buildVersion = asset.name.match(/\+(\d+)\.ipa$/i)?.[1]
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
