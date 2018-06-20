import test from 'tape-catch';
import {Program} from 'luma.gl';
import ProgramConfiguration from 'luma.gl/webgl/program-configuration';
import {fixture} from 'luma.gl/test/setup';

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

test('WebGL2#ProgramConfiguration', t => {
  const {gl} = fixture;

  t.ok(ProgramConfiguration, 'ProgramConfiguration import successful');

  const program = new Program(gl, {vs, fs});
  const configuration = program.getConfiguration();

  t.ok(configuration, 'ProgramConfiguration construction successful');

  // TODO - check that info about attributes and varyings have been correctly extracted

  t.end();
});
