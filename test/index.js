/* global describe, it */
import {expect} from 'chai';
import switchPath from '../src/index';

describe('switchPath basic usage', () => {
  it('should match a basic path', () => {
    const {path, value} = switchPath('/home/foo', {
      '/bar': 123,
      '/home/foo': 456,
    });
    expect(path).to.be.equal('/home/foo');
    expect(value).to.be.equal(456);
  });

  it('should match a root base path in a nested configuration', () => {
    const {path, value} = switchPath('/', {
      '/': 123,
      '/home': {
        '/': 456,
        '/foo': 789
      }
    });
    expect(path).to.be.equal('/');
    expect(value).to.be.equal(123);
  });

  it('should match a nested root path in a very nested configuration', () => {
    const {path, value} = switchPath('/home', {
      '/': 12,
      '/home': {
        '/': 34,
        '/foo': {
          '/': 56
        }
      }
    });
    expect(path).to.be.equal('/home');
    expect(value).to.be.equal(34);
  });

  it('should match a nested root path in a very nested configuration', () => {
    const {path, value} = switchPath('/home/foo/bar', {
      '/': 12,
      '/home': {
        '/': 34,
        '/foo': {
          '/': 56,
          '/bar': 78
        }
      }
    });
    expect(path).to.be.equal('/home/foo/bar');
    expect(value).to.be.equal(78);
  });

  it('should match a base path having a match in a sibling\'s nested configuration', () => {
    const {path, value} = switchPath('/bar', {
      '/bar': 123,
      '/home': {
        '/': 456,
        '/foo': 789
      }
    });
    expect(path).to.be.equal('/bar');
    expect(value).to.be.equal(123);
  });

  it('should match a base path in a nested configuration', () => {
    const {path, value} = switchPath('/home', {
      '/bar': 123,
      '/home': {
        '/': 456,
        '/foo': 789
      }
    });
    expect(path).to.be.equal('/home');
    expect(value).to.be.equal(456);
  });

  it('should match a basic path in a nested configuration', () => {
    const {path, value} = switchPath('/home/foo', {
      '/bar': 123,
      '/home': {
        '/foo': 456,
      },
    });
    expect(path).to.be.equal('/home/foo');
    expect(value).to.be.equal(456);
  });

  it('should match a path on an incomplete pattern', () => {
    const {path, value} = switchPath('/home/foo', {
      '/bar': 123,
      '/home': 456,
    });
    expect(path).to.be.equal('/home');
    expect(value).to.be.equal(456);
  });

  it('should match an incomplete pattern on multipart path', () => {
    const {path, value} = switchPath('/home/foo/bar', {
      '/home': {
        '/': 123,
        '/foo': 456
      }
    });
    expect(path).to.be.equal('/home/foo');
    expect(value).to.be.equal(456);
  });

  it('should not match a path overoptimistically', () => {
    const {path, value} = switchPath('/home/33/books/10', {
      '/': 123,
      '/authors': 234,
      '/books': {
        '/': 345,
        '/:id': 456
      }
    });
    expect(path).to.be.equal(null);
    expect(value).to.be.equal(null);
  });

  it('should return match to a notFound pattern if provided', () => {
    const {path, value} = switchPath('/home/33/books/10', {
      '/': 123,
      '/authors': 234,
      '/books': {
        '/': 345,
        '/:id': 456
      },
      '*': 'Route not defined'
    });
    expect(path).to.be.equal('/home/33/books/10');
    expect(value).to.be.equal('Route not defined');
  });

  it('should not prematurely match a notFound pattern', () => {
    const {path, value} = switchPath('/home/foo', {
      '*': 0,
      '/bar': 123,
      '/home': 456,
    });
    expect(path).to.be.equal('/home');
    expect(value).to.be.equal(456);
  });

  it('should match a path with an extra trailing slash', () => {
    const {path, value} = switchPath('/home/foo/', {
      '/bar': 123,
      '/home': {
        '/foo': 456
      }
    });
    expect(path).to.be.equal('/home/foo');
    expect(value).to.be.equal(456);
  });

  it('should match a path with a parameter', () => {
    const {path, value} = switchPath('/home/1736', {
      '/bar': 123,
      '/home/:id': id => `id is ${id}`,
    });
    expect(path).to.be.equal('/home/1736');
    expect(value).to.be.equal('id is 1736');
  });

  it('should match a path with a parameter in a nested configuration', () => {
    const {path, value} = switchPath('/home/1736', {
      '/bar': 123,
      '/home': {
        '/:id': id => `id is ${id}`,
      },
    });
    expect(path).to.be.equal('/home/1736');
    expect(value).to.be.equal('id is 1736');
  });

  it('should match the base of a path with a parameter in a nested configuration', () => {
    const {path, value} = switchPath('/1736', {
      '/bar': 123,
      '/:id': {
        '/': id => `id is ${id}`,
        '/home': 789
      }
    });
    expect(path).to.be.equal('/1736');
    expect(value).to.be.equal('id is 1736');
  });
});

describe('switchPath corner cases', () => {
  it('should match more specific path in case many match', () => {
    const {path, value} = switchPath('/home/1736', {
      '/home/:id': id => `id is ${id}`,
      '/': 'root',
    });
    expect(path).to.be.equal('/home/1736');
    expect(value).to.be.equal('id is 1736');
  });

  it('should match exact path in case many match', () => {
    const {path, value} = switchPath('/', {
      '/home/:id': id => `id is ${id}`,
      '/': 'root',
    });
    expect(path).to.be.equal('/');
    expect(value).to.be.equal('root');
  });

  it('should call valueFn with a single param as spread, not as array', () => {
    const {path, value} = switchPath('/home/123', {
      '/home/:id': id => {
        expect(Array.isArray(id)).to.be.equal(false);
        expect(typeof id).to.be.equal('string');
        expect(id).to.be.equal('123');
        return 0; },
      '/': 'root',
    });
    expect(path).to.be.equal('/home/123');
    expect(value).to.be.equal(0);
  });

  it('should call valueFn with multiple params as spread, not as array', () => {
    const {path, value} = switchPath('/home/123/blast', {
      '/home/:id/:second': (id, second) => {
        expect(Array.isArray(id)).to.be.equal(false);
        expect(typeof id).to.be.equal('string');
        expect(id).to.be.equal('123');
        expect(Array.isArray(second)).to.be.equal(false);
        expect(typeof second).to.be.equal('string');
        expect(second).to.be.equal('blast');
        return 0; },
      '/': 'root',
    });
    expect(path).to.be.equal('/home/123/blast');
    expect(value).to.be.equal(0);
  });

  it('should not match unrelated paths that have with params', () => {
    const {path, value} = switchPath('/home/123', {
      '/': 'root',
      '/home/:id': id => `home is ${id}`,
      '/external/:id': id => `external is ${id}`,
    });
    expect(path).to.be.equal('/home/123');
    expect(value).to.be.equal('home is 123');
  });

  it('should partially match :key type params', () => {
    const {path, value} = switchPath('/home/123/456', {
      '/': 'root',
      '/home/:id': id => `home is ${id}`,
      '/external/:id': id => `external is ${id}`,
    });
    expect(path).to.be.equal('/home/123');
    expect(value).to.be.equal('home is 123');
  });

  it('should partially match multiple :key type params', () => {
    const {path, value} = switchPath('/home/123/456/something', {
      '/': 'root',
      '/home/:id/:other': (id, other) => `${id}:${other}`,
      '/external/:id/:other': (id, other) => `external`,
    });
    expect(path).to.be.equal('/home/123/456')
    expect(value).to.be.equal('123:456')
  })

  it('should not match a :key type route if no params are given', () => {
    const {path, value} = switchPath('/', {
      '/': 'root',
      '/:id': (id) => `$id`
    })

    expect(path).to.be.equal('/')
    expect(value).to.be.equal('root')
  })
});
