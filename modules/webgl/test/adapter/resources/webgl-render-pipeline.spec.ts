// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';

import {Buffer} from '@luma.gl/core';
import {GL} from '@luma.gl/webgl/constants';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {WEBGLRenderPass} from '@luma.gl/webgl';

const VS_THREE_UBOS = /* glsl */ `\
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

const FS_THREE_UBOS = /* glsl */ `\
#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);
}
`;

const VS_MIXED_SAMPLERS = /* glsl */ `\
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

const VS_INDEXED_DRAW = /* glsl */ `\
#version 300 es

const vec2 POSITIONS[3] = vec2[3](
  vec2(0.0, 0.5),
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5)
);

void main() {
  gl_Position = vec4(POSITIONS[gl_VertexID], 0.0, 1.0);
}
`;

const FS_MIXED_SAMPLERS = /* glsl */ `\
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

it('WEBGLRenderPipeline assigns uniform block binding points only when they change', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;

  const vs = device.createShader({stage: 'vertex', source: VS_THREE_UBOS});
  const fs = device.createShader({stage: 'fragment', source: FS_THREE_UBOS});
  const renderPipeline = device.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const linkStatus = await waitForLinkStatus(renderPipeline);
  expect(linkStatus, 'render pipeline linked successfully').toBe('success');
  if (linkStatus !== 'success') {
    renderPipeline.destroy();
    vs.destroy();
    fs.destroy();
    return;
  }

  const buffers = [1, 2, 3].map(value =>
    device.createBuffer({usage: Buffer.UNIFORM, data: new Float32Array([value, 0, 0, 0])})
  );
  const bindings = {BlockA: buffers[0], BlockB: buffers[1], BlockC: buffers[2]};
  const vertexArray = device.createVertexArray({
    shaderLayout: renderPipeline.shaderLayout,
    bufferLayout: renderPipeline.bufferLayout
  });

  const calls: string[] = [];
  const getUniformBlockIndex = gl.getUniformBlockIndex;
  const uniformBlockBinding = gl.uniformBlockBinding;
  gl.getUniformBlockIndex = (program, name) => {
    calls.push(`index ${name}`);
    return getUniformBlockIndex.call(gl, program, name);
  };
  gl.uniformBlockBinding = (program, index, bindingPoint) => {
    calls.push(`binding ${index} ${bindingPoint}`);
    uniformBlockBinding.call(gl, program, index, bindingPoint);
  };

  try {
    const draw = () => {
      const renderPass = new WEBGLRenderPass(device, {});
      renderPass.setPipeline(renderPipeline);
      renderPass.setBindings(bindings);
      renderPass.setVertexArray(vertexArray);
      expect(renderPass.draw({vertexCount: 3}), 'draw succeeded').toBe(true);
      renderPass.end();
    };

    draw();
    expect(
      calls.filter(call => call.startsWith('index')),
      'block indices looked up'
    ).toHaveLength(3);
    calls.length = 0;
    draw();
    expect(calls, 'unchanged binding points are not assigned again').toEqual([]);

    renderPipeline.shaderLayout.bindings = [...renderPipeline.shaderLayout.bindings].reverse();
    draw();
    expect(
      calls.filter(call => call.startsWith('index')),
      'block indices are cached'
    ).toEqual([]);
    for (const [bindingPoint, binding] of renderPipeline.shaderLayout.bindings.entries()) {
      const blockIndex = getUniformBlockIndex.call(gl, renderPipeline.handle, binding.name);
      expect(
        gl.getActiveUniformBlockParameter(
          renderPipeline.handle,
          blockIndex,
          GL.UNIFORM_BLOCK_BINDING
        ),
        `${binding.name} follows the reordered layout`
      ).toBe(bindingPoint);
    }
  } finally {
    gl.getUniformBlockIndex = getUniformBlockIndex;
    gl.uniformBlockBinding = uniformBlockBinding;
    vertexArray.destroy();
    for (const buffer of buffers) buffer.destroy();
    renderPipeline.destroy();
    vs.destroy();
    fs.destroy();
  }
});

it('WEBGLRenderPipeline#uniformBlockBinding applies block indices in the correct argument position', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;

  const vs = device.createShader({stage: 'vertex', source: VS_THREE_UBOS});
  const fs = device.createShader({stage: 'fragment', source: FS_THREE_UBOS});
  const renderPipeline = device.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  const linkStatus = await waitForLinkStatus(renderPipeline);
  expect(linkStatus, 'render pipeline linked successfully').toBe('success');
  if (linkStatus !== 'success') {
    renderPipeline.destroy();
    vs.destroy();
    fs.destroy();
    device.destroy();
    void 0;
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
  renderPipeline.shaderLayout.bindings = [
    renderPipeline.shaderLayout.bindings.find(binding => binding.name === 'BlockB')!,
    renderPipeline.shaderLayout.bindings.find(binding => binding.name === 'BlockC')!,
    renderPipeline.shaderLayout.bindings.find(binding => binding.name === 'BlockA')!
  ];

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

  renderPipeline.setBindings({BlockA: bufferA, BlockB: bufferB, BlockC: bufferC});

  const vertexArray = device.createVertexArray({
    shaderLayout: renderPipeline.shaderLayout,
    bufferLayout: renderPipeline.bufferLayout
  });
  const renderPass = new WEBGLRenderPass(device, {});

  const didDraw = renderPipeline.draw({renderPass, vertexArray, vertexCount: 3});
  expect(Boolean(didDraw), 'draw triggers binding application').toBe(true);

  const expectedBindingPointByName = {
    BlockB: 0,
    BlockC: 1,
    BlockA: 2
  };

  for (const blockName of ['BlockA', 'BlockB', 'BlockC'] as const) {
    const reportedBinding = gl.getActiveUniformBlockParameter(
      renderPipeline.handle,
      blockIndexByName[blockName],
      GL.UNIFORM_BLOCK_BINDING
    );
    expect(
      reportedBinding,
      `${blockName} is bound to point ${expectedBindingPointByName[blockName]}`
    ).toBe(expectedBindingPointByName[blockName]);
  }

  renderPass.end();

  const canonicalRenderPass = new WEBGLRenderPass(device, {});
  expect(
    () => canonicalRenderPass.setBindings({BlockA: bufferA}),
    'pass bindings require an active pipeline'
  ).toThrow(/setPipeline.*must be called before setBindings/);
  canonicalRenderPass.setPipeline(renderPipeline);
  canonicalRenderPass.setBindings({BlockA: bufferA, BlockB: bufferB, BlockC: bufferC});
  canonicalRenderPass.setVertexArray(vertexArray);
  expect(
    Boolean(canonicalRenderPass.draw({vertexCount: 3})),
    'render pass owns WebGL pipeline, bindings, vertex array, and draw state'
  ).toBe(true);
  canonicalRenderPass.end();

  vertexArray.destroy();
  bufferA.destroy();
  bufferB.destroy();
  bufferC.destroy();
  renderPipeline.destroy();
  vs.destroy();
  fs.destroy();
  device.destroy();
  void 0;
});

it('WEBGLRenderPipeline creates module-backed blocks without driver member reflection', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const vertexShader = device.createShader({stage: 'vertex', source: VS_THREE_UBOS});
  const fragmentShader = device.createShader({stage: 'fragment', source: FS_THREE_UBOS});
  const getActiveUniforms = gl.getActiveUniforms.bind(gl);

  gl.getActiveUniforms = (() => null) as typeof gl.getActiveUniforms;
  let renderPipeline: ReturnType<typeof device.createRenderPipeline>;
  try {
    renderPipeline = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      topology: 'triangle-list',
      _uniformBlockLayouts: ['BlockA', 'BlockB', 'BlockC'].map(name => ({
        name,
        uniformTypes: {[`value${name.at(-1)}`]: 'f32'}
      }))
    });
  } finally {
    gl.getActiveUniforms = getActiveUniforms;
  }

  expect(
    renderPipeline.shaderLayout.bindings.map(binding => ({
      name: binding.name,
      minBindingSize: binding.minBindingSize,
      uniforms: binding.type === 'uniform' ? binding.uniforms : undefined
    }))
  ).toEqual([
    {
      name: 'BlockA',
      minBindingSize: 16,
      uniforms: [{name: 'valueA', format: 'f32', arrayLength: 1, byteOffset: 0, byteStride: 0}]
    },
    {
      name: 'BlockB',
      minBindingSize: 16,
      uniforms: [{name: 'valueB', format: 'f32', arrayLength: 1, byteOffset: 0, byteStride: 0}]
    },
    {
      name: 'BlockC',
      minBindingSize: 16,
      uniforms: [{name: 'valueC', format: 'f32', arrayLength: 1, byteOffset: 0, byteStride: 0}]
    }
  ]);

  renderPipeline.destroy();
  vertexShader.destroy();
  fragmentShader.destroy();
  device.destroy();
  void 0;
});

it('WEBGLRenderPipeline initializes mixed sampler uniforms before validation', async () => {
  const device = await getWebGLTestDevice();

  const vs = device.createShader({stage: 'vertex', source: VS_MIXED_SAMPLERS});
  const fs = device.createShader({stage: 'fragment', source: FS_MIXED_SAMPLERS});
  const renderPipeline = device.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  const linkStatus = await waitForLinkStatus(renderPipeline);
  expect(linkStatus, 'render pipeline with sampler2D and samplerCube links successfully').toBe(
    'success'
  );

  renderPipeline.destroy();
  vs.destroy();
  fs.destroy();
  device.destroy();
  void 0;
});

it('WEBGLRenderPipeline uses indexCount for indexed draws', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const vs = device.createShader({stage: 'vertex', source: VS_INDEXED_DRAW});
  const fs = device.createShader({stage: 'fragment', source: FS_THREE_UBOS});
  const renderPipeline = device.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  const linkStatus = await waitForLinkStatus(renderPipeline);
  expect(linkStatus, 'indexed render pipeline linked successfully').toBe('success');
  if (linkStatus !== 'success') {
    renderPipeline.destroy();
    vs.destroy();
    fs.destroy();
    device.destroy();
    void 0;
    return;
  }

  const indexBuffer = device.createBuffer({
    usage: Buffer.INDEX,
    data: new Uint16Array([0, 1, 2])
  });
  const vertexArray = device.createVertexArray({
    shaderLayout: renderPipeline.shaderLayout,
    bufferLayout: renderPipeline.bufferLayout
  });
  vertexArray.setIndexBuffer(indexBuffer);
  const renderPass = new WEBGLRenderPass(device, {});
  const indexedDrawCounts: number[] = [];
  const indexedInstancedDrawCounts: number[] = [];
  const drawElements = gl.drawElements.bind(gl);
  const drawElementsInstanced = gl.drawElementsInstanced.bind(gl);
  gl.drawElements = ((mode, count, type, offset) => {
    indexedDrawCounts.push(count);
    drawElements(mode, count, type, offset);
  }) as typeof gl.drawElements;
  gl.drawElementsInstanced = ((mode, count, type, offset, instanceCount) => {
    indexedInstancedDrawCounts.push(count);
    drawElementsInstanced(mode, count, type, offset, instanceCount);
  }) as typeof gl.drawElementsInstanced;

  try {
    renderPipeline.draw({renderPass, vertexArray, vertexCount: 3, indexCount: 2});
    renderPipeline.draw({
      renderPass,
      vertexArray,
      vertexCount: 3,
      indexCount: 2,
      isInstanced: true,
      instanceCount: 1
    });
  } finally {
    gl.drawElements = drawElements;
    gl.drawElementsInstanced = drawElementsInstanced;
  }

  expect(indexedDrawCounts, 'non-instanced indexed draw uses indexCount').toEqual([2]);
  expect(indexedInstancedDrawCounts, 'instanced indexed draw uses indexCount').toEqual([2]);

  renderPass.end();
  vertexArray.destroy();
  indexBuffer.destroy();
  renderPipeline.destroy();
  vs.destroy();
  fs.destroy();
  device.destroy();
  void 0;
});
