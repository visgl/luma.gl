// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape.js';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {AsyncTexture} from '@luma.gl/engine';

test('AsyncTexture#readAsync', async t => {
  const device = await getWebGLTestDevice();

  const data = new Uint8Array([1, 2, 3, 4]);
  const texture = new AsyncTexture(device, {
    data,
    width: 1,
    height: 1,
    format: 'rgba8unorm'
  });

  await texture.ready;
  const resultBuffer = await texture.readAsync();
  const result = new Uint8Array(resultBuffer);
  t.deepEqual(result, data, 'read back expected texture data');

  texture.destroy();
  t.end();
});

// import test from 'tape-promise/tape';
// import {getWebGLTestDevice} from '@luma.gl/test-utils';

// import {AsyncTexture} from '@luma.gl/engine';
// import {Texture} from '@luma.gl/core';

// test.skip('Texture#async constructor', async t => {
//   let texture = new AsyncTexture(webglDevice, {});
//   t.ok(texture.texture instanceof Texture, 'Synchronous Texture construction successful');
//   t.equal(texture.loaded, false, 'Sync Texture marked as loaded');
//   texture.destroy();

//   let loadCompleted;
//   const loadPromise = new Promise(resolve => {
//     loadCompleted = resolve; // eslint-disable-line
//   });
//   texture = new AsyncTexture(gl, loadPromise);
//   t.ok(texture.texture instanceof Texture, 'Asynchronous Texture construction successful');
//   t.equal(texture.loaded, false, 'Async Texture initially marked as not loaded');

//   loadPromise.then(() => {
//     t.equal(texture.loaded, true, 'Async Texture marked as loaded on promise completion');
//     t.end();
//   });

//   loadCompleted(null);
// });

/*
test.skip('WebGL2#Texture resize', (t) => {
  let texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 2,
    mipmaps: true
  });

  texture.resize({
    width: 4,
    height: 4,
    mipmaps: true
  });

  t.ok(texture.mipmaps, 'mipmaps should set to true for POT.');

  texture.resize({
    width: 3,
    height: 3,
    mipmaps: true
  });

  t.notOk(texture.mipmaps, 'mipmaps should set to false when resizing to NPOT.');

  texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 2,
    mipmaps: true
  });

  texture.resize({
    width: 4,
    height: 4
  });

  t.notOk(texture.mipmaps, 'mipmaps should set to false when resizing.');

  t.end();
});
*/

