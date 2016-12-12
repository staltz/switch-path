export interface RouteDefinitions extends Object {
  [path: string]: RouteDefinitions | any;
}

export interface SwitchPathReturn {
  path: string | null;
  value: any | null;
}