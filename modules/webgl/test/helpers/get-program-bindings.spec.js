import test from 'tape-promise/tape';
import GL from '@luma.gl/constants';
import {Program} from '@luma.gl/gltools';
import {getProgramBindings} from '@luma.gl/webgl/adapter/helpers/get-program-bindings';
import {fixture} from 'test/setup';

const vs = `
attribute vec3 positions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec3 vPosition;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vPosition = positions;
}
`;

const fs = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('WebGL2#getProgramBindings#varyings', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const program = new Program(gl2, {fs, vs, varyings: ['vPosition', 'gl_Position']});

  const bindings = getProgramBindings(gl2, program.handle);

  t.equals(bindings.varyings[0].name, 'vPosition');
  t.equals(bindings.varyings[1].name, 'gl_Position');
  t.end();
});

test('WebGL2#getProgramBindings#varyings', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let program = new Program(gl2, {fs, vs, varyings: ['vPosition', 'gl_Position']});

  // @ts-ignore
  let varyingMap = program.configuration.varyingInfosByName;
  t.equals(varyingMap.vPosition.location, 0);
  t.equals(varyingMap.gl_Position.location, 1);

  program = new Program(gl2, {
    fs,
    vs,
    varyings: ['vPosition', 'gl_Position'],
    bufferMode: GL.INTERLEAVED_ATTRIBS
  });
  // @ts-ignore
  varyingMap = program.configuration.varyingInfosByName;
  t.equals(varyingMap.vPosition.location, 0);
  t.equals(varyingMap.gl_Position.location, 1);
  t.end();
});
