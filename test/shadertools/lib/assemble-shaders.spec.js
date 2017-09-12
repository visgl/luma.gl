import 'luma.gl/headless';
import {createGLContext, assembleShaders, picking} from 'luma.gl';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};
const VS_GLSL_300 = `\
#version 300 es

in vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;
const FS_GLSL_300 = `\
#version 300 es

#ifdef GL_ES
precision highp float;
#endif

out vec4 fragmentColor;

void main(void) {
  fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('assembleShaders#import', t => {
  t.ok(assembleShaders !== undefined, 'assembleShaders import successful');
  t.end();
});

test('assembleShaders#version_directive', t => {
  const assembleResult = assembleShaders(fixture.gl, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [picking]
  });
  // Verify version directive remains as first line.
  t.equal(assembleResult.vs.indexOf('#version 300 es'), 0, 'version directive should be first statement');
  t.equal(assembleResult.fs.indexOf('#version 300 es'), 0, 'version directive should be first statement');
  t.end();
});
