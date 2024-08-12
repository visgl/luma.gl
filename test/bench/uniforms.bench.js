// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Program} from '@luma.gl/webgl-legacy';
import {createTestContext} from '@luma.gl/test-utils';
const gl = createTestContext();

const VS = `
uniform vec3 positions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
}
`;

const FS = `
out vec4 fragColor
void main(void) {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const program = new Program(gl, {vs: VS, fs: FS});

const projectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const projectionMatrixTyped = new Float32Array(projectionMatrix);
const projectionMatrixIntTyped = new Int32Array(projectionMatrix);
const positions = [0, 0, 1];
const positionsTyped = new Float32Array(positions);
const positionsIntTyped = new Int32Array(positions);

export default function uniformsBench(suite) {
  return suite

    .group('SET UNIFORMS')

    .add('Set vec3 uniform from Float32Array', () => {
      program.setUniforms({positions: positionsTyped});
    })
    .add('Set vec3 uniform from plain array', () => {
      program.setUniforms({positions});
    })
    .add('Set vec3 uniform from Int32Array', () => {
      program.setUniforms({positions: positionsIntTyped});
    })

    .add('Set mat4 uniform from Float32Array', () => {
      program.setUniforms({uPMatrix: projectionMatrixTyped});
    })
    .add('Set mat4 uniform from plain array', () => {
      program.setUniforms({uPMatrix: projectionMatrix});
    })
    .add('Set mat4 uniform from Int32Array', () => {
      program.setUniforms({uPMatrix: projectionMatrixIntTyped});
    });
}
