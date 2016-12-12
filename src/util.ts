import { RouteDefinitions } from './types';

export function isPattern(candidate: string) {
  return candidate.charAt(0) === `/` || candidate === `*`;
}

export function isRouteDefinition(candidate: any | undefined) {
  return !candidate || typeof candidate !== `object` ?
    false : isPattern(Object.keys(candidate)[0]);
}

export function traverseRoutes(routes: RouteDefinitions, callback: (pattern: string) => any) {
  const keys = Object.keys(routes);

  for (let i = 0; i < keys.length; ++i) {
    const pattern = keys[i];
    if (pattern === `*`)
      continue;

    callback(pattern);
  }
}

export function isNotNull(candidate: any): boolean {
  return candidate !== null;
}

export function splitPath(path: string): Array<string> {
  return path.split(`/`).filter(s => !!s);
}

export function isParam(candidate: string): boolean {
  return candidate.match(/:\w+/) !== null;
}

export function extractPartial(sourcePath: string, pattern: string): string {
  const patternParts = splitPath(pattern);
  const sourceParts = splitPath(sourcePath);

  const matchedParts = [];

  for (let i = 0; i < patternParts.length; ++i) {
    matchedParts.push(sourceParts[i]);
  }

  return matchedParts.filter(isNotNull).join(`/`);
}

export function unprefixed(fullString: string, prefix: string): string {
  return fullString.split(prefix)[1];
}
