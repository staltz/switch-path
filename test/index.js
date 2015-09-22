/* global describe, it */
import {expect} from 'chai';
import switchPath from '../src/index';

describe('switchPath', () => {
  it('should match a basic path', () => {
    const {path, value} = switchPath('/home/foo', {
      '/bar': 123,
      '/home/foo': 456,
    });
    expect(path).to.be.equal('/home/foo');
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
});
