const {createGLContext} = require('../../src/headless');
const {isWebGLContext} = require('../../src/webgl/webgl-checks');

const test = require('tape-catch');

test('WebGL#headless context creation', t => {
  const gl = createGLContext();
  t.ok(isWebGLContext(gl), 'Context creation ok');
  t.end();
});
