import {
  isPattern,
  isRouteDefinition,
  traverseRoutes,
  isNotNull,
  splitPath,
  isParam,
  extractPartial,
  unprefixed,
} from './util';

import { RouteDefinitions, SwitchPathReturn } from './types';

function switchPathInputGuard(path: string, routes: RouteDefinitions) {
  if (!isPattern(path)) {
    throw new Error(`First parameter to switchPath must be a route path.`);
  }
  if (!isRouteDefinition(routes)) {
    throw new Error(`Second parameter to switchPath must be an object ` +
      `containing route patterns.`);
  }
}

function validatePath(sourcePath: string, matchedPath: string): string | null {
  const sourceParts = splitPath(sourcePath);
  const matchedParts = splitPath(matchedPath);

  for (let i = 0; i < matchedParts.length; ++i) {
    if (matchedParts[i] !== sourceParts[i]) {
      return null;
    }
  }

  return `/${extractPartial(sourcePath, matchedPath)}`;
}

function betterMatch(candidate: string | null, reference: string | null): boolean {
  if (!isNotNull(candidate)) {
    return false;
  }
  if (!isNotNull(reference)) {
    return true;
  }
  if (!validatePath(candidate as string, reference as string)) {
    return false;
  }
  return (candidate as string).length >= (reference as string).length;
}

function matchesWithParams(sourcePath: string, pattern: string): Array<string> {
  const sourceParts = splitPath(sourcePath);
  const patternParts = splitPath(pattern);

  const params = patternParts
    .map((part, i) => isParam(part) ? sourceParts[i] : null)
    .filter(isNotNull);

  const matched = patternParts
    .every((part, i) => isParam(part) || part === sourceParts[i]);

  return matched ? params as Array<string> : [];
}

function getParamFnValue(
  paramFn: RouteDefinitions | ((...args: any[]) => any),
  params: Array<string>): any
{
  const _paramFn: any = isRouteDefinition(paramFn) ? (paramFn as RouteDefinitions)[`/`] : paramFn;
  return typeof _paramFn === `function` ? _paramFn(...params) : _paramFn;
}

type ValidationObject = {
  sourcePath: string,
  matchedPath: string | null,
  matchedValue: any | null,
  routes: RouteDefinitions,
};

function validate({sourcePath, matchedPath, matchedValue, routes}: ValidationObject) {
  let path = matchedPath ? validatePath(sourcePath, matchedPath) : null;
  let value = matchedValue;
  if (!path) {
    path = routes[`*`] ? sourcePath : null;
    value = path ? routes[`*`] : null;
  }
  return {path, value};
}

export default function switchPath(
  sourcePath: string,
  routes: RouteDefinitions): SwitchPathReturn
{
  switchPathInputGuard(sourcePath, routes);
  let matchedPath: string | null = null;
  let matchedValue: string | null = null;

  traverseRoutes(routes, function matchPattern(pattern) {
    if (sourcePath.search(pattern) === 0 && betterMatch(pattern, matchedPath)) {
      matchedPath = pattern;
      matchedValue = routes[pattern];
    }

    const params = matchesWithParams(sourcePath, pattern).filter(Boolean);

    if (params.length > 0 && betterMatch(sourcePath, matchedPath)) {
      matchedPath = extractPartial(sourcePath, pattern);
      matchedValue = getParamFnValue(routes[pattern], params);
    }

    if (isRouteDefinition(routes[pattern]) && params.length === 0) {
      if (sourcePath !== `/`) {
        const child = switchPath(
          unprefixed(sourcePath, pattern) || `/`,
          routes[pattern],
        );
        const nestedPath = pattern + child.path;
        if (child.path !== null &&
          betterMatch(nestedPath, matchedPath))
        {
          matchedPath = nestedPath;
          matchedValue = child.value;
        }
      }
    }
  });

  return validate({sourcePath, matchedPath, matchedValue, routes});
}