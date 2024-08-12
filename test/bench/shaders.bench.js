// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// eslint-disable-next-line
import {Program, VertexShader, FragmentShader} from '@luma.gl/webgl-legacy';
import {createTestContext} from '@luma.gl/test-utils';

const gl = createTestContext();

const VS = `
in vec3 positions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
}
`;

const FS = `
out vec4 fragColor;
void main(void) {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
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
