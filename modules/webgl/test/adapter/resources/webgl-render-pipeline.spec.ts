// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {GL} from '@luma.gl/constants';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

// Shader with two uniform blocks to verify uniformBlockBinding argument order.
const VS_TWO_UBOS = /* glsl */ `\
#version 300 es
layout(std140) uniform;

uniform BlockA {
  float valueA;
} blockA;

uniform BlockB {
  float valueB;
} blockB;

in float position;

void main() {
  gl_Position = vec4(blockA.valueA + blockB.valueB + position, 0.0, 0.0, 1.0);
}
`;

const FS_TWO_UBOS = /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0);
}
`;

/**
 * Verifies that gl.uniformBlockBinding is called with the correct argument order:
 *   uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding)
 *
 * The WebGL2 API signature is:
 *   - 2nd arg: uniformBlockIndex (from getUniformBlockIndex)
 *   - 3rd arg: uniformBlockBinding (the binding point number)
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/uniformBlockBinding
 * TypeScript: lib.dom.d.ts defines:
 *   uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: GLuint, uniformBlockBinding: GLuint): void
 */
test('WEBGLRenderPipeline#uniformBlockBinding argument order with multiple UBOs', async t => {
  const device = await getWebGLTestDevice();
  const {gl} = device;

  // Compile and link shader program with two uniform blocks
  const vsShader = gl.createShader(GL.VERTEX_SHADER)!;
  gl.shaderSource(vsShader, VS_TWO_UBOS);
  gl.compileShader(vsShader);
  if (!gl.getShaderParameter(vsShader, GL.COMPILE_STATUS)) {
    t.fail(`Vertex shader compile error: ${gl.getShaderInfoLog(vsShader)}`);
    t.end();
    return;
  }

  const fsShader = gl.createShader(GL.FRAGMENT_SHADER)!;
  gl.shaderSource(fsShader, FS_TWO_UBOS);
  gl.compileShader(fsShader);
  if (!gl.getShaderParameter(fsShader, GL.COMPILE_STATUS)) {
    t.fail(`Fragment shader compile error: ${gl.getShaderInfoLog(fsShader)}`);
    t.end();
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vsShader);
  gl.attachShader(program, fsShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, GL.LINK_STATUS)) {
    t.fail(`Program link error: ${gl.getProgramInfoLog(program)}`);
    t.end();
    return;
  }

  t.pass('Shader program with two uniform blocks compiled and linked');

  // Get GL-assigned block indices
  const blockIndexA = gl.getUniformBlockIndex(program, 'BlockA');
  const blockIndexB = gl.getUniformBlockIndex(program, 'BlockB');

  t.notEqual(blockIndexA, GL.INVALID_INDEX, `BlockA has valid index: ${blockIndexA}`);
  t.notEqual(blockIndexB, GL.INVALID_INDEX, `BlockB has valid index: ${blockIndexB}`);

  // Assign distinct binding points (intentionally not 0 or 1 to avoid
  // coincidental matches with GL-assigned block indices)
  const bindingPointForA = 3;
  const bindingPointForB = 7;

  gl.uniformBlockBinding(program, blockIndexA, bindingPointForA);
  gl.uniformBlockBinding(program, blockIndexB, bindingPointForB);

  // Query back to verify the binding was applied correctly
  const reportedBindingA = gl.getActiveUniformBlockParameter(
    program,
    blockIndexA,
    GL.UNIFORM_BLOCK_BINDING
  );
  const reportedBindingB = gl.getActiveUniformBlockParameter(
    program,
    blockIndexB,
    GL.UNIFORM_BLOCK_BINDING
  );

  t.equal(
    reportedBindingA,
    bindingPointForA,
    `BlockA bound to point ${bindingPointForA} (got ${reportedBindingA})`
  );
  t.equal(
    reportedBindingB,
    bindingPointForB,
    `BlockB bound to point ${bindingPointForB} (got ${reportedBindingB})`
  );

  // Cleanup
  gl.deleteProgram(program);
  gl.deleteShader(vsShader);
  gl.deleteShader(fsShader);
  device.destroy();
  t.end();
});
