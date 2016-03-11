# `switchPath`

> Advanced `switch case` for URLs, a small tool for routing in JavaScript

[![npm version](https://badge.fury.io/js/switch-path.svg)](https://badge.fury.io/js/switch-path)

```
npm install switch-path
```

## Usage

Basic usage:

```js
const {path, value} = switchPath('/home/foo', {
  '/bar': 123,
  '/home/foo': 456,
});
// path is `/home/foo`
// value is 456
```

Supports trailing slashes

```js
const {path, value} = switchPath('/home/foo/', {
  '/bar': 123,
  '/home/foo': 456,
});
// path is `/home/foo`
// value is 456
```

Supports nested route configuration:

```js
const {path, value} = switchPath('/home/foo', {
  '/bar': 123,
  '/home': {
    '/foo': 456,
  },
});
// path is `/home/foo`
// value is 456
```
Supports base paths in nested route configurations
```js
const {path, value} = switchPath('/home', {
  '/bar': 123,
  '/home': {
    '/': 456,
    '/foo': 789
  }
});
// path is `/home`
// value is 456
```

Incomplete patterns will be optimistically matched:

```js
const {path, value} = switchPath('/home/foo', {
  '/bar': 123,
  '/home': 456,
});
// path is `/home`
// value is 456
```

Optional not found pattern:

```js
const {path, value} = switchPath('/home/33', {
  '/': 123,
  'books': {
    '/': 456,
    '/:id': 789
  },
  '*': 'Route not found'
});
// path = '/home/33'
// value = 'Route not found'
```
Match a route with `:param` parameters and get the parameter value in a function:

```js
const {path, value} = switchPath('/home/1736', {
  '/bar': 123,
  '/home/:id': id => `id is ${id}`,
});
// path is `/home/1736`
// value is 'id is 1736'
```

Match a route with `:param` parameters also inside nested configurations:

```js
const {path, value} = switchPath('/home/1736', {
  '/bar': 123,
  '/home': {
    '/:id': id => `id is ${id}`,
  },
});
// path is `/home/1736`
// value is 'id is 1736'
```

Match a route with `:param` parameters base inside nested configurations:

```js
const {path, value} = switchPath('/1736', {
  '/bar': 123,
  '/:id': {
    '/': id => `id is ${id}`,
    '/home': 789
  }
});
// path is `/1736`
// value is 'id is 1736'
```
