/* global describe, it */
import * as assert from 'assert';
import switchPath from '../src';

describe('switchPath basic usage', () => {
  it('should match a basic path', () => {
    const {path, value} = switchPath('/home/foo', {
      '/bar': 123,
      '/home/foo': 456,
    });

    assert.strictEqual(path, '/home/foo');
    assert.strictEqual(value, 456);
  });

  it('should match a root base path in a nested configuration', () => {
    const {path, value} = switchPath('/', {
      '/': 123,
      '/home': {
        '/': 456,
        '/foo': 789,
      },
    });

    assert.strictEqual(path, '/');
    assert.strictEqual(value, 123);
  });

  it('should match a nested root path in a very nested configuration', () => {
    const {path, value} = switchPath('/home', {
      '/': 12,
      '/home': {
        '/': 34,
        '/foo': {
          '/': 56,
        },
      },
    });

    assert.strictEqual(path, '/home');
    assert.strictEqual(value, 34);
  });

  it('should match a nested root path in a very nested configuration', () => {
    const {path, value} = switchPath('/home/foo/bar', {
      '/': 12,
      '/home': {
        '/': 34,
        '/foo': {
          '/': 56,
          '/bar': 78,
        },
      },
    });

    assert.strictEqual(path, '/home/foo/bar');
    assert.strictEqual(value, 78);
  });

  it('should match a base path having a match in a sibling\'s nested configuration', () => {
    const {path, value} = switchPath('/bar', {
      '/bar': 123,
      '/home': {
        '/': 456,
        '/foo': 789,
      },
    });

    assert.strictEqual(path, '/bar');
    assert.strictEqual(value, 123);
  });

  it('should match a base path in a nested configuration', () => {
    const {path, value} = switchPath('/home', {
      '/bar': 123,
      '/home': {
        '/': 456,
        '/foo': 789,
      },
    });

    assert.strictEqual(path, '/home');
    assert.strictEqual(value, 456);
  });

  it('should match a basic path in a nested configuration', () => {
    const {path, value} = switchPath('/home/foo', {
      '/bar': 123,
      '/home': {
        '/foo': 456,
      },
    });

    assert.strictEqual(path, '/home/foo');
    assert.strictEqual(value, 456);
  });

  it('should match a path on an incomplete pattern', () => {
    const {path, value} = switchPath('/home/foo', {
      '/bar': 123,
      '/home': 456,
    });

    assert.strictEqual(path, '/home');
    assert.strictEqual(value, 456);
  });

  it('should match an incomplete pattern on multipart path', () => {
    const {path, value} = switchPath('/home/foo/bar', {
      '/home': {
        '/': 123,
        '/foo': 456,
      },
    });

    assert.strictEqual(path, '/home/foo');
    assert.strictEqual(value, 456);
  });

  it('should not match a path overoptimistically', () => {
    const {path, value} = switchPath('/home/33/books/10', {
      '/': 123,
      '/authors': 234,
      '/books': {
        '/': 345,
        '/:id': 456,
      },
    });

    assert.strictEqual(path, null);
    assert.strictEqual(value, null);
  });

  it('should return match to a notFound pattern if provided', () => {
    const {path, value} = switchPath('/home/33/books/10', {
      '/': 123,
      '/authors': 234,
      '/books': {
        '/': 345,
        '/:id': 456,
      },
      '*': 'Route not defined',
    });

    assert.strictEqual(path, '/home/33/books/10');
    assert.strictEqual(value, 'Route not defined');
  });

  it('should not prematurely match a notFound pattern', () => {
    const {path, value} = switchPath('/home/foo', {
      '*': 0,
      '/bar': 123,
      '/home': 456,
    });

    assert.strictEqual(path, '/home');
    assert.strictEqual(value, 456);
  });

  it('should match a path with an extra trailing slash', () => {
    const {path, value} = switchPath('/home/foo/', {
      '/bar': 123,
      '/home': {
        '/foo': 456,
      },
    });

    assert.strictEqual(path, '/home/foo');
    assert.strictEqual(value, 456);
  });

  it('should match a path with a parameter', () => {
    const {path, value} = switchPath('/home/1736', {
      '/bar': 123,
      '/home/:id': (id: number) => `id is ${id}`,
    });

    assert.strictEqual(path, '/home/1736');
    assert.strictEqual(value, 'id is 1736');
  });

  it('should match a path with a parameter in a nested configuration', () => {
    const {path, value} = switchPath('/home/1736', {
      '/bar': 123,
      '/home': {
        '/:id': (id: number) => `id is ${id}`,
      },
    });

    assert.strictEqual(path, '/home/1736');
    assert.strictEqual(value, 'id is 1736');
  });

  it('should match the base of a path with a parameter in a nested configuration', () => {
    const {path, value} = switchPath('/1736', {
      '/bar': 123,
      '/:id': {
        '/': (id: number) => `id is ${id}`,
        '/home': 789,
      },
    });

    assert.strictEqual(path, '/1736');
    assert.strictEqual(value, 'id is 1736');
  });
});

describe('switchPath corner cases', () => {
  it('should match more specific path in case many match', () => {
    const {path, value} = switchPath('/home/1736', {
      '/home/:id': (id: number) => `id is ${id}`,
      '/': 'root',
    });

    assert.strictEqual(path, '/home/1736');
    assert.strictEqual(value, 'id is 1736');
  });

  it('should match exact path in case many match', () => {
    const {path, value} = switchPath('/', {
      '/home/:id': (id: number) => `id is ${id}`,
      '/': 'root',
    });

    assert.strictEqual(path, '/');
    assert.strictEqual(value, 'root');
  });

  it('should call valueFn with a single param as spread, not as array', () => {
    const {path, value} = switchPath('/home/123', {
      '/home/:id': (id: string) => {
        assert.ok(!Array.isArray(id));
        assert.strictEqual(typeof id, 'string');
        assert.strictEqual(id, '123');
        return 0;
      },
      '/': 'root',
    });

    assert.strictEqual(path, '/home/123');
    assert.strictEqual(value, 0);
  });

  it('should call valueFn with multiple params as spread, not as array', () => {
    const {path, value} = switchPath('/home/123/blast', {
      '/home/:id/:second': (id: string, second: string) => {
        assert.ok(!Array.isArray(id));
        assert.ok(typeof id === 'string');
        assert.ok(id === '123');
        assert.ok(!Array.isArray(second));
        assert.ok(typeof second === 'string');
        assert.ok(second === 'blast');
        return 0;
      },
      '/': 'root',
    });

    assert.strictEqual(path, '/home/123/blast');
    assert.strictEqual(value, 0);
  });

  it('should not match unrelated paths that have with params', () => {
    const {path, value} = switchPath('/home/123', {
      '/': 'root',
      '/home/:id': (id: string) => `home is ${id}`,
      '/external/:id': (id: string) => `external is ${id}`,
    });

    assert.strictEqual(path, '/home/123');
    assert.strictEqual(value, 'home is 123');
  });

  it('should partially match :key type params', () => {
    const {path, value} = switchPath('/home/123/456', {
      '/': 'root',
      '/home/:id': (id: string) => `home is ${id}`,
      '/external/:id': (id: string) => `external is ${id}`,
    });

    assert.strictEqual(path, '/home/123');
    assert.strictEqual(value, 'home is 123');
  });

  it('should partially match multiple :key type params', () => {
    const {path, value} = switchPath('/home/123/456/something', {
      '/': 'root',
      '/home/:id/:other': (id: string, other: string) => `${id}:${other}`,
      '/external/:id/:other': () => `external`,
    });

    assert.strictEqual(path, '/home/123/456');
    assert.strictEqual(value, '123:456');
  });

  it('should not match a :key type route if no params are given', () => {
    const {path, value} = switchPath('/', {
      '/': 'root',
      '/:id': (id: string) => `${id}`,
    });

    assert.strictEqual(path, '/');
    assert.strictEqual(value, 'root');
  });
});
