// luma.gl, MIT license

// eslint-disable-next-line
import {Program, VertexShader, FragmentShader} from '@luma.gl/webgl-legacy';
import {createTestContext} from '@luma.gl/test-utils';

const gl = createTestContext();

const VS = `
attribute vec3 positions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
}
`;

const FS = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const vs = new VertexShader(gl, VS);
const fs = new FragmentShader(gl, FS);

export default function coreLayersBench(suite) {
  return suite

    .group('PROGRAM FROM SHADERS')
    .add('Program from shader source', () => {
      return new Program(gl, {vs: VS, fs: FS});
    })
    .add('Program from cached shaders', () => {
      return new Program(gl, {vs, fs});
    });
}
