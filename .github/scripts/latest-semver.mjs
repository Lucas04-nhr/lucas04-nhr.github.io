const pattern = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/

function parse(version) {
  const match = version.match(pattern)
  if (!match)
    return null

  return {
    version: version.replace(/^v/, '').replace(/\+.*/, ''),
    core: match.slice(1, 4).map(Number),
    prerelease: match[4]?.split('.') ?? null,
  }
}

function compareIdentifier(left, right) {
  const leftNumeric = /^\d+$/.test(left)
  const rightNumeric = /^\d+$/.test(right)

  if (leftNumeric && rightNumeric)
    return Number(BigInt(left) - BigInt(right))
  if (leftNumeric !== rightNumeric)
    return leftNumeric ? -1 : 1
  if (left === right)
    return 0
  return left < right ? -1 : 1
}

function compare(left, right) {
  for (let index = 0; index < left.core.length; index++) {
    if (left.core[index] !== right.core[index])
      return left.core[index] - right.core[index]
  }

  if (left.prerelease === null || right.prerelease === null) {
    if (left.prerelease === right.prerelease)
      return 0
    return left.prerelease === null ? 1 : -1
  }

  const length = Math.max(left.prerelease.length, right.prerelease.length)
  for (let index = 0; index < length; index++) {
    if (left.prerelease[index] === undefined)
      return -1
    if (right.prerelease[index] === undefined)
      return 1

    const result = compareIdentifier(left.prerelease[index], right.prerelease[index])
    if (result !== 0)
      return result
  }

  return 0
}

const versions = process.argv.slice(2).map(parse).filter(Boolean)
versions.sort(compare)
console.log(versions.at(-1)?.version ?? '')
