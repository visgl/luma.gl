import test from 'tape-promise/tape';
import {getContextDebugInfo, isWebGL, isWebGL2, resizeGLContext} from '@luma.gl/gltools';
import {createTestContext} from '@luma.gl/test-utils';

const {gl, glDebug, gl2, gl2Debug} = getWebGLContexts();

const glContext = {
  canvas: {clientWidth: 10, clientHeight: 20}
};

/** @type {WebGLRenderingContext} */
// @ts-ignore
const glMock = glContext;

test('WebGL#headless context creation', (t) => {
  t.ok(isWebGL(gl), 'Context creation ok');
  t.end();
});

test('WebGL#getContextDebugInfo', (t) => {
  const info = getContextDebugInfo(gl);
  t.ok(typeof info.vendor === 'string', 'info.vendor ok');
  t.ok(typeof info.renderer === 'string', 'info.renderer ok');
  t.end();
});

test('WebGL#isWebGL1', (t) => {
  t.ok(isWebGL(gl), 'isWebGL should return true WebGL context');
  t.ok(isWebGL(glDebug), 'isWebGL should return true on WebGL debug context');

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  t.ok(isWebGL2(gl2), 'isWebGL should return true WebGL2 context');
  t.ok(isWebGL2(gl2Debug), 'isWebGL should return true on WebGL2 debug context');

  t.end();
});

test('WebGL#isWebGL2', (t) => {
  t.notOk(isWebGL2(gl), 'isWebGL2 should return false WebGL context');
  t.notOk(isWebGL2(glDebug), 'isWebGL2 should return false on WebGL debug context');

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  t.ok(isWebGL2(gl2), 'isWebGL2 should return true WebGL2 context');
  t.ok(isWebGL2(gl2Debug), 'isWebGL2 should return true on WebGL2 debug context');

  t.end();
});

test('WebGL#resizeGLContext', (t) => {
  // Using default pixel ratio of 1
  // update drawing buffer size to simulate gl context
  glContext.drawingBufferWidth = glContext.canvas.clientWidth;
  glContext.drawingBufferHeight = glContext.canvas.clientHeight;

  resizeGLContext(glMock);
  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 1},
    'Canvas size info should be cached'
  );

  // update drawing buffer size to simulate gl context
  // Using custom device pixel ratio
  let DPR = 12.5;
  glContext.drawingBufferWidth = Math.floor(glContext.canvas.clientWidth * DPR);
  glContext.drawingBufferHeight = Math.floor(glContext.canvas.clientHeight * DPR);
  resizeGLContext(glMock, {useDevicePixels: DPR});
  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // trigger again without any changes
  resizeGLContext(glMock, {useDevicePixels: 12.5});
  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 12.5},
    'Cached canvas size should remain same'
  );

  // update device pixel ratio
  DPR = 5;
  // update drawing buffer size to simulate gl context
  glContext.drawingBufferWidth = Math.floor(glContext.canvas.clientWidth * DPR);
  glContext.drawingBufferHeight = Math.floor(glContext.canvas.clientHeight * DPR);
  resizeGLContext(glMock, {useDevicePixels: DPR});
  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight
  Object.assign(glContext, {canvas: {clientWidth: 5, clientHeight: 2}});
  // update drawing buffer size to simulate gl context
  glContext.drawingBufferWidth = Math.floor(glContext.canvas.clientWidth * DPR);
  glContext.drawingBufferHeight = Math.floor(glContext.canvas.clientHeight * DPR);
  resizeGLContext(glMock, {useDevicePixels: DPR});
  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {clientWidth: 5, clientHeight: 2, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight to undefiend, should use canvas.width and height
  // and use 1.0 as devicePixelRatio
  Object.assign(glContext.canvas, {clientWidth: undefined, clientHeight: undefined});
  // update drawing buffer size to simulate gl context
  glContext.drawingBufferWidth = Math.floor(glContext.canvas.width); // DPR is 1
  glContext.drawingBufferHeight = Math.floor(glContext.canvas.height); // DPR is 1
  resizeGLContext(glMock, {useDevicePixels: DPR});
  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {
      clientWidth: glContext.canvas.width,
      clientHeight: glContext.canvas.height,
      devicePixelRatio: 1.0
    },
    'Should fallback to canvas size clientWidth/clientHeight are not availbe'
  );

  // trigger resize again
  resizeGLContext(glMock, {useDevicePixels: DPR});
  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {
      clientWidth: glContext.canvas.width,
      clientHeight: glContext.canvas.height,
      devicePixelRatio: 1.0
    },
    'Cached canvas size info should remain same'
  );

  t.end();
});

// Helper methods

function getWebGLContexts() {
  return {
    gl: createTestContext({webgl1: true, webgl2: false, debug: false}),
    glDebug: createTestContext({webgl1: true, webgl2: false, debug: true}),
    gl2: createTestContext({webgl1: false, webgl2: true, debug: false}),
    gl2Debug: createTestContext({webgl1: false, webgl2: true, debug: true})
  };
}
