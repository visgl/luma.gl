import test from 'tape-promise/tape';
import {Texture2D} from '@luma.gl/webgl-legacy';

import {fixture} from 'test/setup';

test('WebGL#Texture2D construct/delete', (t) => {
  const {gl} = fixture;

  t.throws(
    // @ts-expect-error
    () => new Texture2D(),
    /.*WebGLRenderingContext.*/,
    'Texture2D throws on missing gl context'
  );

  const texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D repeated delete successful');

  t.end();
});

test('WebGL#Texture2D async constructor', (t) => {
  const {gl} = fixture;

  let texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Synchronous Texture2D construction successful');
  t.equal(texture.loaded, true, 'Sync Texture2D marked as loaded');
  texture.destroy();

  let loadCompleted;
  const loadPromise = new Promise((resolve) => {
    loadCompleted = resolve; // eslint-disable-line
  });
  // @ts-ignore
  texture = new Texture2D(gl, loadPromise);
  t.ok(texture instanceof Texture2D, 'Asynchronous Texture2D construction successful');
  t.equal(texture.loaded, false, 'Async Texture2D initially marked as not loaded');

  loadPromise.then(() => {
    t.equal(texture.loaded, true, 'Async Texture2D marked as loaded on promise completion');
    t.end();
  });

  loadCompleted(null);
});

test('WebGL#Texture2D buffer update', (t) => {
  const {gl} = fixture;

  let texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});
