// luma.gl, MIT license
import test from 'tape-promise/tape';
import {createTestDevice, webgl1Device, webgl2Device} from '@luma.gl/test-utils';
import {isWebGL, isWebGL2} from '@luma.gl/webgl-legacy';

const webgl1DebugDevice = createTestDevice({webgl1: true, webgl2: false, debug: true});
const webgl2DebugDevice = createTestDevice({webgl1: false, webgl2: true, debug: true});

test('WebGLDevice#headless context creation', (t) => {
  t.ok(isWebGL(webgl1Device.gl), 'Context creation ok');
  t.end();
});

test('WebGLDevice#getContextDebugInfo', (t) => {
  const info = webgl1Device.info;
  t.ok(typeof info.vendor === 'string', 'info.vendor ok');
  t.ok(typeof info.renderer === 'string', 'info.renderer ok');
  t.end();
});

test('WebGLDevice#isWebGL1', (t) => {
  t.ok(isWebGL(webgl1Device.gl), 'isWebGL should return true on WebGL1 device');
  t.ok(isWebGL(webgl1DebugDevice.gl), 'isWebGL should return true on WebGL1 debug device');
  t.notOk(isWebGL2(webgl1DebugDevice.gl2), 'isWebGL2 should return false on WebGL1 debug device');

  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  t.ok(isWebGL2(webgl2Device.gl), 'isWebGL should return true WebGL2 device');
  t.ok(isWebGL2(webgl2DebugDevice.gl2), 'isWebGL should return true on WebGL2 debug device');

  t.end();
});

test('WebGLDevice#isWebGL2', (t) => {
  t.notOk(isWebGL2(webgl1Device.gl), 'isWebGL2 should return false WebGL device');
  t.notOk(isWebGL2(webgl1DebugDevice.gl2), 'isWebGL2 should return false on WebGL debug device');

  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  t.ok(isWebGL2(webgl2Device.gl2), 'isWebGL2 should return true WebGL2 device');
  t.ok(isWebGL2(webgl2DebugDevice.gl2), 'isWebGL2 should return true on WebGL2 debug device');

  t.end();
});

test.skip('WebGLDevice#resize', (t) => {
  // Using default pixel ratio of 1
  // update drawing buffer size to simulate webgl1Device context
  webgl1Device.canvasContext.resize({width: 10, height: 20, useDevicePixels: 1});
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 1},
    'Canvas size info should be cached'
  );

  // update drawing buffer size to simulate webgl1Device context
  // Using custom device pixel ratio
  const DPR = 12.5;
  webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // trigger again without any changes
  webgl1Device.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 12.5},
    'Cached canvas size should remain same'
  );

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
