const test = require('tape-catch');
const {
  createGLContext,
  getContextDebugInfo,
  isWebGL,
  isWebGL2,
  resizeGLContext
} = require('@luma.gl/webgl');
const {gl, glDebug, gl2, gl2Debug} = getWebGLContexts({webgl2: false});
test('WebGL#headless context creation', t => {
  t.ok(isWebGL(gl), 'Context creation ok');
  t.end();
});

test('WebGL#getContextDebugInfo', t => {
  const info = getContextDebugInfo(gl);
  t.ok(typeof info.vendor === 'string', 'info.vendor ok');
  t.ok(typeof info.renderer === 'string', 'info.renderer ok');
  t.end();
});

test('WebGL#isWebGL1', t => {
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

test('WebGL#isWebGL2', t => {
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

test('WebGL#resizeGLContext', t => {
  const glContext = {
    canvas: {width: 10, height: 20}
  };

  // update drawing buffer size to simulate gl context
  glContext.drawingBufferWidth = glContext.canvas.width;
  glContext.drawingBufferHeight = glContext.canvas.height;
  resizeGLContext(glContext);

  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 1},
    'Canvas size info should be cached'
  );

  // update drawing buffer size to simulate gl context
  glContext.drawingBufferWidth = Math.floor(glContext.canvas.width * 12.5);
  glContext.drawingBufferHeight = Math.floor(glContext.canvas.height * 12.5);
  resizeGLContext(glContext, {useDevicePixels: 12.5});

  t.deepEqual(
    glContext.luma.canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: 12.5},
    'Canvas size info should be updated'
  );

  t.end();
});

// Helper methods

function getWebGLContexts() {
  return {
    gl: createGLContext({webgl1: true, webgl2: false, debug: false}),
    glDebug: createGLContext({webgl1: true, webgl2: false, debug: true}),
    gl2: createGLContext({webgl1: false, webgl2: true, debug: false}),
    gl2Debug: createGLContext({webgl1: false, webgl2: true, debug: true})
  };
}
