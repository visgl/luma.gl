// luma.gl, MIT license
import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';

// import {luma} from '@luma.gl/api';

test('WebGLDevice#info', (t) => {
  for (const device of getWebGLTestDevices()) {
    // TODO
    t.ok(typeof device.info.vendor === 'string', 'info.vendor ok');
    t.ok(typeof device.info.renderer === 'string', 'info.renderer ok');
  }
  t.end();
});

test('WebGLDevice#lost (Promise)', async (t) => {
  // const device = await luma.createDevice({webgl2: false});

  // // Wrap in a promise to make sure tape waits for us
  // await new Promise<void>(async (resolve) => {
  //   setTimeout(async () => {
  //     const cause = await device.lost;
  //     t.equal(cause.reason, 'destroyed', `Context lost: ${cause.message}`);
  //     t.end();
  //     resolve();
  //   }, 0);
  //   device.loseDevice();
  // });

  // device.destroy();
  t.end();
});

test.skip('WebGLDevice#resize', (t) => {
  // Using default pixel ratio of 1
  // update drawing buffer size to simulate webgl1Device context
  // webgl1Device.canvasContext.resize({width: 10, height: 20, useDevicePixels: 1});
  // t.deepEqual(
  //   webgl1Device.canvasContext._canvasSizeInfo,
  //   {clientWidth: 10, clientHeight: 20, devicePixelRatio: 1},
  //   'Canvas size info should be cached'
  // );

  // // update drawing buffer size to simulate webgl1Device context
  // // Using custom device pixel ratio
  // const DPR = 12.5;
  // webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  // t.deepEqual(
  //   webgl1Device.canvasContext._canvasSizeInfo,
  //   {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
  //   'Cached canvas size info should be updated'
  // );

  // // trigger again without any changes
  // webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  // t.deepEqual(
  //   webgl1Device.canvasContext._canvasSizeInfo,
  //   {clientWidth: 10, clientHeight: 20, devicePixelRatio: 12.5},
  //   'Cached canvas size should remain same'
  // );

  /*
  // update device pixel ratio
  DPR = 5;
  webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  // update drawing buffer size to simulate webgl1Device context
  webgl1Device.gl.drawingBufferWidth = Math.floor(webgl1Device.gl.canvas.clientWidth * DPR);
  webgl1Device.gl.drawingBufferHeight = Math.floor(webgl1Device.gl.canvas.clientHeight * DPR);
  webgl1Device.webglDizeGLContext({useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight
  Object.assign(webgl1Device.gl.canvas, {canvas: {clientWidth: 5, clientHeight: 2}});
  // update drawing buffer size to simulate webgl1Device context
  webgl1Device.gl.drawingBufferWidth = Math.floor(webgl1Device.gl.canvas.clientWidth * DPR);
  webgl1Device.gl.drawingBufferHeight = Math.floor(webgl1Device.gl.canvas.clientHeight * DPR);
  webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device._canvasSizeInfo,
    {clientWidth: 5, clientHeight: 2, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight to undefiend, should use canvas.width and height
  // and use 1.0 as devicePixelRatio
  Object.assign(webgl1Device.gl.canvas, {clientWidth: undefined, clientHeight: undefined});
  // update drawing buffer size to simulate webgl1Device context
  webgl1Device.gl.drawingBufferWidth = Math.floor(webgl1Device.gl.canvas.width); // DPR is 1
  webgl1Device.gl.drawingBufferHeight = Math.floor(webgl1Device.gl.canvas.height); // DPR is 1
  webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device._canvasSizeInfo,
    {
      clientWidth: webgl1Device.gl.canvas.width,
      clientHeight: webgl1Device.gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Should fallback to canvas size clientWidth/clientHeight are not availbe'
  );

  // trigger resize again
  webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device._canvasSizeInfo,
    {
      clientWidth: webgl1Device.gl.canvas.width,
      clientHeight: webgl1Device.gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Cached canvas size info should remain same'
  );
  */

  t.end();
});
