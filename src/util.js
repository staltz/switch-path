export function isPattern(candidate) {
  return typeof candidate === `string` &&
    (candidate.charAt(0) === `/` || candidate === `*`)
}

export function isRouteDefinition(candidate) {
  return !candidate || typeof candidate !== `object` ?
    false : isPattern(Object.keys(candidate)[0])
}

export function traverseRoutes(routes, callback) {
  const keys = Object.keys(routes)
  for (let i = 0; i < keys.length; ++i) {
    const pattern = keys[i]
    if (pattern === `*`) {
      continue
    }
    callback(pattern)
  }
}

export function isNotNull(candidate) {
  return candidate !== null
}

export function splitPath(path) {
  return path.split(`/`).filter(s => !!s)
}

export function isParam(candidate) {
  return candidate.match(/:\w+/) !== null
}

export function extractPartial(sourcePath, pattern) {
  const patternParts = splitPath(pattern)
  const sourceParts = splitPath(sourcePath)

  const matchedParts = []

  for (let i = 0; i < patternParts.length; ++i) {
    matchedParts.push(sourceParts[i])
  }

  return matchedParts.filter(isNotNull).join(`/`)
}

export function unprefixed(fullString, prefix) {
  return fullString.split(prefix)[1]
}
