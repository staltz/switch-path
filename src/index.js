function isPattern(candidate) {
  return typeof candidate === `string` &&
    (candidate.charAt(0) === `/` || candidate === `*`)
}

function isRouteConfigurationObject(routes) {
  if (typeof routes !== `object`) {
    return false
  }
  for (let path in routes) {
    if (routes.hasOwnProperty(path)) {
      return isPattern(path)
    }
  }
}

function unprefixed(fullStr, prefix) {
  return fullStr.split(prefix)[1]
}

function matchesWithParams(sourcePath, pattern) {
  const sourceParts = sourcePath.split(`/`).filter(s => s.length > 0)
  const patternParts = pattern.split(`/`).filter(s => s.length > 0)
  const params = patternParts.map((patternPart, index) => {
    if (patternPart.match(/:\w+/) !== null) {
      return sourceParts[index]
    } else {
      return null
    }
  }).filter(x => x !== null)
  return params
}

function validateSwitchPathPreconditions(sourcePath, routes) {
  if (typeof sourcePath !== `string`) {
    throw new Error(`Invalid source path. We expected to see a string given ` +
      `as the sourcePath (first argument) to switchPath.`)
  }
  if (!isRouteConfigurationObject(routes)) {
    throw new Error(`Invalid routes object. We expected to see a routes ` +
      `configuration object where keys are strings that look like '/foo'. ` +
      `These keys must start with a slash '/'.`)
  }
}

function validatePatternPreconditions(pattern) {
  if (!isPattern(pattern)) {
    throw new Error(`Paths in route configuration must be strings that start ` +
      `with a slash '/'.`)
  }
}

function isNormalPattern(routes, pattern) {
  if (pattern === `*` || !routes.hasOwnProperty(pattern)) {
    return false
  }
  return true
}

function handleTrailingSlash(paramsFn) {
  if (isRouteConfigurationObject(paramsFn)) {
    return paramsFn[`/`]
  }
  return paramsFn
}

function getParamsFnValue(paramFn, params) {
  const _paramFn = handleTrailingSlash(paramFn)
  if (typeof _paramFn !== `function`) {
    return _paramFn
  }
  return _paramFn(params)
}

function splitPath(path) {
  const pathParts = path.split(`/`)
  if (pathParts[pathParts.length - 1] === ``) {
    pathParts.pop()
  }
  return pathParts
}

function validatePath(sourcePath, matchedPath) {
  if (matchedPath === null) {
    return ``
  }
  const sourceParts = splitPath(sourcePath)
  const matchedParts = splitPath(matchedPath)
  const validPath = sourceParts.map((part, index) => {
    if (part !== matchedParts[index]) {
      return null
    }
    return part
  }).filter(x => x !== null).join(`/`)
  return validPath
}

function validate({sourcePath, matchedPath, value, routes}) {
  let validPath = validatePath(sourcePath, matchedPath)
  if (!validPath) {
    validPath = !routes[`*`] ? null : sourcePath
    const validValue = !validPath ? null : routes[`*`]
    return {
      validPath,
      validValue,
    }
  }
  return {validPath, validValue: value}
}

function betterMatch(candidate, reference) {
  if (candidate === null) {
    return false
  }
  if (reference === null) {
    return true
  }
  return candidate.length >= reference.length
}

function switchPath(sourcePath, routes) {
  validateSwitchPathPreconditions(sourcePath, routes)
  let matchedPath = null
  let value = null
  for (let pattern in routes) {
    if (!isNormalPattern(routes, pattern)) {
      continue
    }
    validatePatternPreconditions(pattern)
    if (sourcePath.search(pattern) === 0 && betterMatch(pattern, matchedPath)) {
      matchedPath = pattern
      value = routes[pattern]
    }
    const params = matchesWithParams(sourcePath, pattern)
    if (params.length > 0 && betterMatch(sourcePath, matchedPath)) {
      matchedPath = sourcePath
      value = getParamsFnValue(routes[pattern], params)
    }
    if (isRouteConfigurationObject(routes[pattern]) && params.length === 0) {
      const child = switchPath(unprefixed(sourcePath, pattern), routes[pattern])
      const nestedPath = pattern + child.path
      if (child.path !== null && betterMatch(nestedPath, matchedPath)) {
        matchedPath = nestedPath
        value = child.value
      }
    }
    if (pattern === sourcePath) {
      return {path: pattern, value: handleTrailingSlash(routes[pattern])}
    }
  }

  const {validPath, validValue} = validate({
    sourcePath,
    matchedPath,
    value,
    routes,
  })
  return {path: validPath, value: validValue}
}

module.exports = switchPath
