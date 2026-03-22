import {expect, test} from 'vitest';
import { Buffer } from '@luma.gl/core';
import { GL } from '@luma.gl/constants';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { WEBGLRenderPass } from '@luma.gl/webgl';
const VS_THREE_UBOS = /* glsl */`\
#version 300 es
layout(std140) uniform;

uniform BlockA {
  float valueA;
} blockA;

uniform BlockB {
  float valueB;
} blockB;

uniform BlockC {
  float valueC;
} blockC;

const vec2 POSITIONS[3] = vec2[3](
  vec2(0.0, 0.5),
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5)
);

void main() {
  float offset = blockA.valueA + blockB.valueB + blockC.valueC;
  gl_Position = vec4(POSITIONS[gl_VertexID] + vec2(offset * 0.0), 0.0, 1.0);
}
`;
const FS_THREE_UBOS = /* glsl */`\
#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);
}
`;
const VS_MIXED_SAMPLERS = /* glsl */`\
#version 300 es

void main() {
  vec2 positions[3] = vec2[3](
    vec2(0.0, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5)
  );
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
}
`;
const FS_MIXED_SAMPLERS = /* glsl */`\
#version 300 es
precision highp float;

uniform sampler2D colorTexture;
uniform samplerCube cubeTexture;

out vec4 fragColor;

void main() {
  vec4 color = texture(colorTexture, vec2(0.5, 0.5));
  vec4 environment = texture(cubeTexture, normalize(vec3(0.2, 0.3, 1.0)));
  fragColor = mix(color, environment, 0.5);
}
`;
async function waitForLinkStatus(renderPipeline: {
  linkStatus: 'pending' | 'success' | 'error';
}): Promise<'pending' | 'success' | 'error'> {
  for (let iteration = 0; iteration < 50 && renderPipeline.linkStatus === 'pending'; iteration++) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  return renderPipeline.linkStatus;
}
test('WEBGLRenderPipeline#uniformBlockBinding applies block indices in the correct argument position', async () => {
  const device = await getWebGLTestDevice();
  const {
    gl
  } = device;
  const vs = device.createShader({
    stage: 'vertex',
    source: VS_THREE_UBOS
  });
  const fs = device.createShader({
    stage: 'fragment',
    source: FS_THREE_UBOS
  });
  const renderPipeline = device.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list'
  });
  const linkStatus = await waitForLinkStatus(renderPipeline);
  expect(linkStatus, 'render pipeline linked successfully').toBe('success');
  if (linkStatus !== 'success') {
    renderPipeline.destroy();
    vs.destroy();
    fs.destroy();
    device.destroy();
    return;
  }
  const blockIndexByName = {
    BlockA: gl.getUniformBlockIndex(renderPipeline.handle, 'BlockA'),
    BlockB: gl.getUniformBlockIndex(renderPipeline.handle, 'BlockB'),
    BlockC: gl.getUniformBlockIndex(renderPipeline.handle, 'BlockC')
  };
  expect(blockIndexByName.BlockA, `BlockA has valid index`).not.toBe(GL.INVALID_INDEX);
  expect(blockIndexByName.BlockB, `BlockB has valid index`).not.toBe(GL.INVALID_INDEX);
  expect(blockIndexByName.BlockC, `BlockC has valid index`).not.toBe(GL.INVALID_INDEX);

  // Reorder bindings to a 3-cycle so swapped uniformBlockBinding arguments produce different results.
  renderPipeline.shaderLayout.bindings = [renderPipeline.shaderLayout.bindings.find(binding => binding.name === 'BlockB')!, renderPipeline.shaderLayout.bindings.find(binding => binding.name === 'BlockC')!, renderPipeline.shaderLayout.bindings.find(binding => binding.name === 'BlockA')!];
  const bufferA = device.createBuffer({
    usage: Buffer.UNIFORM,
    data: new Float32Array([1, 0, 0, 0])
  });
  const bufferB = device.createBuffer({
    usage: Buffer.UNIFORM,
    data: new Float32Array([2, 0, 0, 0])
  });
  const bufferC = device.createBuffer({
    usage: Buffer.UNIFORM,
    data: new Float32Array([3, 0, 0, 0])
  });
  renderPipeline.setBindings({
    BlockA: bufferA,
    BlockB: bufferB,
    BlockC: bufferC
  });
  const vertexArray = device.createVertexArray({
    shaderLayout: renderPipeline.shaderLayout,
    bufferLayout: renderPipeline.bufferLayout
  });
  const renderPass = new WEBGLRenderPass(device, {});
  const didDraw = renderPipeline.draw({
    renderPass,
    vertexArray,
    vertexCount: 3
  });
  expect(didDraw, 'draw triggers binding application').toBeTruthy();
  const expectedBindingPointByName = {
    BlockB: 0,
    BlockC: 1,
    BlockA: 2
  };
  for (const blockName of ['BlockA', 'BlockB', 'BlockC'] as const) {
    const reportedBinding = gl.getActiveUniformBlockParameter(renderPipeline.handle, blockIndexByName[blockName], GL.UNIFORM_BLOCK_BINDING);
    expect(reportedBinding, `${blockName} is bound to point ${expectedBindingPointByName[blockName]}`).toBe(expectedBindingPointByName[blockName]);
  }
  renderPass.end();
  vertexArray.destroy();
  bufferA.destroy();
  bufferB.destroy();
  bufferC.destroy();
  renderPipeline.destroy();
  vs.destroy();
  fs.destroy();
  device.destroy();
});
test('WEBGLRenderPipeline initializes mixed sampler uniforms before validation', async () => {
  const device = await getWebGLTestDevice();
  const vs = device.createShader({
    stage: 'vertex',
    source: VS_MIXED_SAMPLERS
  });
  const fs = device.createShader({
    stage: 'fragment',
    source: FS_MIXED_SAMPLERS
  });
  const renderPipeline = device.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list'
  });
  const linkStatus = await waitForLinkStatus(renderPipeline);
  expect(linkStatus, 'render pipeline with sampler2D and samplerCube links successfully').toBe('success');
  renderPipeline.destroy();
  vs.destroy();
  fs.destroy();
  device.destroy();
});
