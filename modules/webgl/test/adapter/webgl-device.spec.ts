// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';
import {WebGLDevice} from '@luma.gl/webgl';

test('WebGLDevice#lost (Promise)', async (t) => {
  const device = await WebGLDevice.create();

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(async (resolve) => {
    setTimeout(async () => {
      const cause = await device.lost;
      t.equal(cause.reason, 'destroyed', `Context lost: ${cause.message}`);
      t.end();
      resolve();
    }, 0);
    device.loseDevice();
  });

  device.destroy();
});

test.skip('WebGLDevice#resize', (t) => {
  // Using default pixel ratio of 1
  // update drawing buffer size to simulate webglDevice context
  webglDevice.canvasContext.resize({width: 10, height: 20, useDevicePixels: 1});
  t.deepEqual(
    webglDevice.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 1},
    'Canvas size info should be cached'
  );

  // update drawing buffer size to simulate webglDevice context
  // Using custom device pixel ratio
  const DPR = 12.5;
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // trigger again without any changes
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 12.5},
    'Cached canvas size should remain same'
  );

  /*
  // update device pixel ratio
  DPR = 5;
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  // update drawing buffer size to simulate webglDevice context
  webglDevice.gl.drawingBufferWidth = Math.floor(webglDevice.gl.canvas.clientWidth * DPR);
  webglDevice.gl.drawingBufferHeight = Math.floor(webglDevice.gl.canvas.clientHeight * DPR);
  webglDevice.webglDizeGLContext({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight
  Object.assign(webglDevice.gl.canvas, {canvas: {clientWidth: 5, clientHeight: 2}});
  // update drawing buffer size to simulate webglDevice context
  webglDevice.gl.drawingBufferWidth = Math.floor(webglDevice.gl.canvas.clientWidth * DPR);
  webglDevice.gl.drawingBufferHeight = Math.floor(webglDevice.gl.canvas.clientHeight * DPR);
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {clientWidth: 5, clientHeight: 2, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight to undefiend, should use canvas.width and height
  // and use 1.0 as devicePixelRatio
  Object.assign(webglDevice.gl.canvas, {clientWidth: undefined, clientHeight: undefined});
  // update drawing buffer size to simulate webglDevice context
  webglDevice.gl.drawingBufferWidth = Math.floor(webglDevice.gl.canvas.width); // DPR is 1
  webglDevice.gl.drawingBufferHeight = Math.floor(webglDevice.gl.canvas.height); // DPR is 1
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {
      clientWidth: webglDevice.gl.canvas.width,
      clientHeight: webglDevice.gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Should fallback to canvas size clientWidth/clientHeight are not availbe'
  );

  // trigger resize again
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {
      clientWidth: webglDevice.gl.canvas.width,
      clientHeight: webglDevice.gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Cached canvas size info should remain same'
  );
  */

  t.end();
});
