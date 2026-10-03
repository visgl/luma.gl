// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileSlang, transpileSlangWGSL} from '@luma.gl/slang';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {COMPUTE_SHADER, MATRIX_SHADER, MATH_SHADER, RENDER_SHADER} from './fixtures';

it('slang#GLSL shaders compile and link on WebGL 2', async () => {
  const device = await getWebGLTestDevice();
  const context = device.handle;
  const shaders: WebGLShader[] = [];
  const program = context.createProgram()!;
  try {
    for (const [entryPoint, stage] of [
      ['vertexMain', context.VERTEX_SHADER],
      ['fragmentMain', context.FRAGMENT_SHADER]
    ] as const) {
      const result = transpileSlang(RENDER_SHADER, {target: 'glsl', entryPoint});
      const shader = context.createShader(stage)!;
      shaders.push(shader);
      context.shaderSource(shader, result.code);
      context.compileShader(shader);
      expect(
        context.getShaderParameter(shader, context.COMPILE_STATUS),
        context.getShaderInfoLog(shader) || result.code
      ).toBe(true);
      context.attachShader(program, shader);
    }
    context.linkProgram(program);
    expect(
      context.getProgramParameter(program, context.LINK_STATUS),
      context.getProgramInfoLog(program) || ''
    ).toBe(true);
  } finally {
    context.deleteProgram(program);
    shaders.forEach(shader => context.deleteShader(shader));
  }
});

it('slang#WGSL render shaders pass WebGPU validation', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device, 'WebGPU is required for compiler validation').not.toBeNull();
  for (const entryPoint of ['vertexMain', 'fragmentMain']) {
    const result = transpileSlang(RENDER_SHADER, {target: 'wgsl', entryPoint});
    const module = device!.handle.createShaderModule({code: result.code});
    const information = await module.getCompilationInfo();
    expect(
      information.messages.filter(message => message.type === 'error'),
      result.code
    ).toEqual([]);
  }
});

for (const [source, expected] of [
  [COMPUTE_SHADER, [4, 5, 6, 7]],
  [MATRIX_SHADER, [14, 32, 9, 12, 15]],
  [MATH_SHADER, [1, 0.5, 3, 2.5, 255]]
] as const) {
  it(`slang#WGSL compute executes ${expected.length} expected values`, async () => {
    const device = await getWebGPUTestDevice('core');
    expect(device, 'WebGPU is required for execution validation').not.toBeNull();
    const handle = device!.handle;
    const result = transpileSlang(source, {target: 'wgsl'});
    const module = handle.createShaderModule({code: result.code});
    const information = await module.getCompilationInfo();
    expect(
      information.messages.filter(message => message.type === 'error'),
      result.code
    ).toEqual([]);
    const pipeline = await handle.createComputePipelineAsync({
      layout: 'auto',
      compute: {module, entryPoint: result.entryPoint}
    });
    const storage = handle.createBuffer({
      size: expected.length * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const readback = handle.createBuffer({
      size: expected.length * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    try {
      const bindings = handle.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{binding: 0, resource: {buffer: storage}}]
      });
      const encoder = handle.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindings);
      pass.dispatchWorkgroups(1);
      pass.end();
      encoder.copyBufferToBuffer(storage, 0, readback, 0, expected.length * 4);
      handle.queue.submit([encoder.finish()]);
      await readback.mapAsync(GPUMapMode.READ);
      expect(Array.from(new Float32Array(readback.getMappedRange()))).toEqual(expected);
      readback.unmap();
    } finally {
      storage.destroy();
      readback.destroy();
    }
  });
}

it('slang#unified WGSL render source validates both entries in one shader module', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const result = transpileSlangWGSL(RENDER_SHADER);
  const module = device!.handle.createShaderModule({code: result.code});
  const information = await module.getCompilationInfo();
  expect(
    information.messages.filter(message => message.type === 'error'),
    result.code
  ).toEqual([]);
  await device!.handle.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
      module,
      entryPoint: result.entryPoints.vertexMain.entryPoint,
      buffers: [
        {
          arrayStride: 12,
          attributes: [
            {
              shaderLocation: result.entryPoints.vertexMain.reflection.inputs[0].location!,
              offset: 0,
              format: 'float32x3'
            }
          ]
        }
      ]
    },
    fragment: {
      module,
      entryPoint: result.entryPoints.fragmentMain.entryPoint,
      targets: [{format: 'rgba8unorm'}]
    }
  });
});
