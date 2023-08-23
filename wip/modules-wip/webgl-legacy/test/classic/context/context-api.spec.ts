import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

import {getContextDebugInfo, isWebGL, isWebGL2, resizeGLContext} from '@luma.gl/webgl-legacy';

const gl1 = webgl1Device.gl;
const gl2 = webgl2Device?.gl2;

test('WebGL#getContextDebugInfo', (t) => {
  const info = getContextDebugInfo(gl1);
  t.ok(typeof info.vendor === 'string', 'info.vendor ok');
  t.ok(typeof info.renderer === 'string', 'info.renderer ok');
  t.end();
});

test('WebGL#headless context creation', (t) => {
  t.ok(isWebGL(gl1), 'Context creation ok');
  t.end();
});

test('WebGL#isWebGL1', (t) => {
  t.ok(isWebGL(gl1), 'isWebGL should return true WebGL context');
  // t.ok(isWebGL(gl1Debug), 'isWebGL should return true on WebGL debug context');

  if (gl2) {
    t.ok(isWebGL(gl2), 'isWebGL2 should return true for WebGL2 context');
    // t.ok(isWebGL(gl2Debug), 'isWebGL2 should return true for WebGL2 debug context');
  }

  t.end();
});

test.skip('WebGL#isWebGL2', (t) => {
  t.notOk(isWebGL2(gl1), 'isWebGL2 should return false WebGL context');
  // t.notOk(isWebGL2(gl1Debug), 'isWebGL2 should return false on WebGL debug context');

  if (gl2) {
    t.ok(isWebGL2(gl2), 'isWebGL2 should return true WebGL2 context');
    // t.ok(isWebGL2(gl2Debug), 'isWebGL2 should return true on WebGL2 debug context');
    return;
  }

  t.end();
});

// TODO - device new tests for context resize
test.skip('WebGL#resizeGLContext', (t) => {
  // Using default pixel ratio of 1
  // update drawing buffer size to simulate gl context
  // gl.drawingBufferWidth = gl.canvas.clientWidth;
  // gl.drawingBufferHeight = gl.canvas.clientHeight;

  resizeGLContext(gl1);
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 1},
    'Canvas size info should be cached'
  );

  // update drawing buffer size to simulate gl context
  // Using custom device pixel ratio
  let DPR = 12.5;
  // gl.drawingBufferWidth = Math.floor(gl.canvas.clientWidth * DPR);
  // gl.drawingBufferHeight = Math.floor(gl.canvas.clientHeight * DPR);
  resizeGLContext(gl1, {useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // trigger again without any changes
  resizeGLContext(gl1, {useDevicePixels: 12.5});
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 12.5},
    'Cached canvas size should remain same'
  );

  // update device pixel ratio
  DPR = 5;
  // update drawing buffer size to simulate gl context
  // gl.drawingBufferWidth = Math.floor(gl.canvas.clientWidth * DPR);
  // gl.drawingBufferHeight = Math.floor(gl.canvas.clientHeight * DPR);
  resizeGLContext(gl1, {useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight
  Object.assign(gl1, {canvas: {clientWidth: 5, clientHeight: 2}});
  // update drawing buffer size to simulate gl context
  // gl.drawingBufferWidth = Math.floor(gl.canvas.clientWidth * DPR);
  // gl.drawingBufferHeight = Math.floor(gl.canvas.clientHeight * DPR);
  resizeGLContext(gl1, {useDevicePixels: DPR});
  t.deepEqual(
    webgl1Device.canvasContext._canvasSizeInfo,
    {clientWidth: 5, clientHeight: 2, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  /*
  // update clientWidth and clientHeight to undefiend, should use canvas.width and height
  // and use 1.0 as devicePixelRatio
  Object.assign(gl1.canvas, {clientWidth: undefined, clientHeight: undefined});
  // update drawing buffer size to simulate gl context
  gl1.drawingBufferWidth = Math.floor(gl.canvas.width); // DPR is 1
  gl1.drawingBufferHeight = Math.floor(gl.canvas.height); // DPR is 1
  resizeGLContext(gl, {useDevicePixels: DPR});
  t.deepEqual(
    getWebGLDevice(gl)._canvasSizeInfo,
    {
      clientWidth: gl.canvas.width,
      clientHeight: gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Should fallback to canvas size clientWidth/clientHeight are not availbe'
  );

  // trigger resize again
  resizeGLContext(gl, {useDevicePixels: DPR});
  t.deepEqual(
    getWebGLDevice(gl)._canvasSizeInfo,
    {
      clientWidth: gl.canvas.width,
      clientHeight: gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Cached canvas size info should remain same'
  );
  */

  t.end();
});
