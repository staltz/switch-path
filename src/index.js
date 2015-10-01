function isPattern(candidate) {
  return typeof candidate === `string` && candidate.charAt(0) === `/`
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

function handleTrailingSlash(paramsFn) {
  if (isRouteConfigurationObject(paramsFn)) {
    return paramsFn[`/`]
  }
  return paramsFn
}

function getParamsFnValue(paramFn, params) {
  return handleTrailingSlash(paramFn)(params)
}

function validateMatchedPath(matchedPath, sourcePath, value) {
  if (matchedPath !== sourcePath && matchedPath !== sourcePath.slice(0, -1)) {
    return {path: null, value: null}
  }
  return {path: matchedPath, value}
}

function switchPath(sourcePath, routes) {
  validateSwitchPathPreconditions(sourcePath, routes)
  let matchedPath = null
  let value = null
  for (let pattern in routes) {
    if (!routes.hasOwnProperty(pattern)) {
      continue
    }
    validatePatternPreconditions(pattern)
    if (sourcePath.search(pattern) === 0 && matchedPath === null) {
      matchedPath = pattern
      value = routes[pattern]
    }
    const params = matchesWithParams(sourcePath, pattern)
    if (params.length > 0) {
      matchedPath = sourcePath
      value = getParamsFnValue(routes[pattern], params)
    }
    if (isRouteConfigurationObject(routes[pattern]) && params.length === 0) {
      const child = switchPath(unprefixed(sourcePath, pattern), routes[pattern])
      if (child.path !== null) {
        matchedPath = pattern + child.path
        value = child.value
      }
    }
    if (pattern === sourcePath) {
      return {path: pattern, value: handleTrailingSlash(routes[pattern])}
    }
  }

  return validateMatchedPath(matchedPath, sourcePath, value)
}

module.exports = switchPath
