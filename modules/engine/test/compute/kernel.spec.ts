// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {
  Buffer,
  PipelineFactory,
  ShaderFactory,
  type ComputePass,
  type ComputePipeline,
  type Device,
  type RenderPass,
  type RenderPipeline,
  type Shader,
  type VertexArray
} from '@luma.gl/core';
import {Kernel, RenderKernel} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const source = /* WGSL */ `
@group(0) @binding(0) var<storage, read_write> data: array<i32>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  data[id.x] = 2 * data[id.x];
}`;

it('Kernel dispatches with per-dispatch bindings', async () => {
  const device = await getWebGPUTestDevice();
  if (!device || isSoftwareBackedDevice(device)) return;

  const kernel = new Kernel(device, {
    id: 'double-kernel',
    source,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
    }
  });
  const buffer = device.createBuffer({
    data: new Int32Array([2]),
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });

  const pass = device.beginComputePass({});
  kernel.dispatch(pass, {bindings: {data: buffer}, x: 1});
  pass.end();
  device.submit();

  expect(new Int32Array(await buffer.readAsync())[0]).toBe(4);
  kernel.destroy();
  buffer.destroy();
});

it('Kernel.createAsync prepares a compute pipeline', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const kernel = await Kernel.createAsync(device, {source});
  expect(kernel.pipeline).toBeDefined();
  kernel.destroy();
});

it('Kernel dispatchIndirect consumes GPU dispatch dimensions', async () => {
  const device = await getWebGPUTestDevice();
  if (!device || isSoftwareBackedDevice(device)) return;

  const kernel = new Kernel(device, {
    source,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
    }
  });
  const buffer = device.createBuffer({
    data: new Int32Array([1, 2, 3, 4]),
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const indirectBuffer = device.createBuffer({
    data: new Uint32Array([4, 1, 1]),
    usage: Buffer.INDIRECT
  });

  const pass = device.beginComputePass({});
  kernel.dispatchIndirect(pass, {
    bindings: {data: buffer},
    indirectBuffer
  });
  pass.end();
  device.submit();

  const bytes = await buffer.readAsync();
  expect(Array.from(new Int32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([2, 4, 6, 8]);
  kernel.destroy();
  buffer.destroy();
  indirectBuffer.destroy();
});

it('Kernel rejects non-WebGPU devices', () => {
  const device = {type: 'webgl'} as Device;

  expect(() => new Kernel(device, {source})).toThrow('Kernel is only supported in WebGPU');
});

it('Kernel forwards pipeline props, records dispatches, and releases resources once', () => {
  const device = {type: 'webgpu'} as Device;
  const shader = {stage: 'compute', source} as Shader;
  const pipeline = {setBindings: vi.fn()} as unknown as ComputePipeline;
  const createShader = vi.fn(() => shader);
  const releaseShader = vi.fn();
  const createComputePipeline = vi.fn(() => pipeline);
  const releasePipeline = vi.fn();
  const shaderFactory = {
    createShader,
    release: releaseShader
  } as unknown as ShaderFactory;
  const pipelineFactory = {
    createComputePipeline,
    release: releasePipeline
  } as unknown as PipelineFactory;
  const setPipeline = vi.fn();
  const setBindings = vi.fn();
  const dispatch = vi.fn();
  const dispatchIndirect = vi.fn();
  const computePass = {
    setPipeline,
    setBindings,
    dispatch,
    dispatchIndirect
  } as unknown as ComputePass;
  const dataBuffer = {} as Buffer;
  const indirectBuffer = {} as Buffer;

  const kernel = new Kernel(device, {
    id: 'mock-kernel',
    source,
    shaderLayout: {bindings: []},
    debugShaders: 'always',
    shaderFactory,
    pipelineFactory
  });

  expect(createShader).toHaveBeenCalledWith({
    id: 'mock-kernel-compute',
    stage: 'compute',
    source,
    debugShaders: 'always'
  });
  expect(createComputePipeline).toHaveBeenCalledWith({
    id: 'mock-kernel',
    shaderLayout: {bindings: []},
    shader
  });

  kernel.dispatch(computePass, {bindings: {data: dataBuffer}, x: 2, y: 3, z: 4});
  expect(pipeline.setBindings).toHaveBeenLastCalledWith({data: dataBuffer});
  expect(setPipeline).toHaveBeenLastCalledWith(pipeline);
  expect(setBindings).toHaveBeenLastCalledWith({});
  expect(dispatch).toHaveBeenLastCalledWith(2, 3, 4);

  kernel.dispatchIndirect(computePass, {indirectBuffer});
  expect(pipeline.setBindings).toHaveBeenLastCalledWith({});
  expect(dispatchIndirect).toHaveBeenLastCalledWith(indirectBuffer, 0);

  kernel.dispatchIndirect(computePass, {indirectBuffer, indirectOffset: 12});
  expect(dispatchIndirect).toHaveBeenLastCalledWith(indirectBuffer, 12);

  kernel.destroy();
  kernel.destroy();
  expect(releasePipeline).toHaveBeenCalledTimes(1);
  expect(releasePipeline).toHaveBeenCalledWith(pipeline);
  expect(releaseShader).toHaveBeenCalledTimes(1);
  expect(releaseShader).toHaveBeenCalledWith(shader);
});

it('Kernel.createAsync releases its shader when pipeline creation fails', async () => {
  const device = {type: 'webgpu'} as Device;
  const shader = {stage: 'compute', source} as Shader;
  const pipelineError = new Error('pipeline compilation failed');
  const releaseShader = vi.fn();
  const shaderFactory = {
    createShader: vi.fn(() => shader),
    release: releaseShader
  } as unknown as ShaderFactory;
  const pipelineFactory = {
    createComputePipelineAsync: vi.fn(() => Promise.reject(pipelineError)),
    release: vi.fn()
  } as unknown as PipelineFactory;

  await expect(Kernel.createAsync(device, {source, shaderFactory, pipelineFactory})).rejects.toBe(
    pipelineError
  );
  expect(PipelineFactory.getAsyncCompilation(device)).toBeUndefined();
  expect(releaseShader).toHaveBeenCalledOnce();
});

it('Kernel.createAsync joins an existing compilation scope', async () => {
  const device = {type: 'webgpu'} as Device;
  const shader = {stage: 'compute', source} as Shader;
  const pipeline = {setBindings: vi.fn()} as unknown as ComputePipeline;
  const shaderFactory = {
    createShader: vi.fn(() => shader),
    release: vi.fn()
  } as unknown as ShaderFactory;
  const pipelineFactory = {
    createComputePipelineAsync: vi.fn(() => Promise.resolve(pipeline)),
    release: vi.fn()
  } as unknown as PipelineFactory;
  const compilation = PipelineFactory.beginAsyncCompilation(device);

  try {
    const kernel = await Kernel.createAsync(device, {source, shaderFactory, pipelineFactory});
    expect(kernel.pipeline).toBe(pipeline);
    expect(compilation).toHaveLength(1);
    await Promise.all(compilation);
    kernel.destroy();
  } finally {
    PipelineFactory.endAsyncCompilation(device, compilation);
  }
});

const vertexSource = /* WGSL */ `
@vertex fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let x = f32(i32(vertexIndex) - 1);
  let y = f32(i32(vertexIndex & 1u) * 2 - 1);
  return vec4f(x, y, 0.0, 1.0);
}`;

const fragmentSource = /* WGSL */ `
@fragment fn main() -> @location(0) vec4f {
  return vec4f(1.0);
}`;

it('RenderKernel rejects non-WebGPU devices', () => {
  const device = {type: 'webgl'} as Device;

  expect(() => new RenderKernel(device, {vertexSource})).toThrow(
    'RenderKernel is only supported in WebGPU'
  );
});

it('RenderKernel records direct and indirect draws and releases resources once', () => {
  const device = {type: 'webgpu'} as Device;
  const vertexShader = {stage: 'vertex', source: vertexSource} as Shader;
  const fragmentShader = {stage: 'fragment', source: fragmentSource} as Shader;
  const pipeline = {} as RenderPipeline;
  const createShader = vi
    .fn()
    .mockReturnValueOnce(vertexShader)
    .mockReturnValueOnce(fragmentShader);
  const releaseShader = vi.fn();
  const createRenderPipeline = vi.fn(() => pipeline);
  const releasePipeline = vi.fn();
  const shaderFactory = {
    createShader,
    release: releaseShader
  } as unknown as ShaderFactory;
  const pipelineFactory = {
    createRenderPipeline,
    release: releasePipeline
  } as unknown as PipelineFactory;
  const setPipeline = vi.fn();
  const setBindings = vi.fn();
  const setVertexArray = vi.fn();
  const draw = vi.fn(() => true);
  const drawIndirect = vi.fn();
  const drawIndexedIndirect = vi.fn();
  const renderPass = {
    setPipeline,
    setBindings,
    setVertexArray,
    draw,
    drawIndirect,
    drawIndexedIndirect
  } as unknown as RenderPass;
  const vertexArray = {} as VertexArray;
  const uniformBuffer = {} as Buffer;
  const indirectBuffer = {} as Buffer;

  const kernel = new RenderKernel(device, {
    id: 'mock-render-kernel',
    vertexSource,
    fragmentSource,
    topology: 'triangle-list',
    debugShaders: 'warnings',
    shaderFactory,
    pipelineFactory
  });

  expect(createShader).toHaveBeenNthCalledWith(1, {
    id: 'mock-render-kernel-vertex',
    stage: 'vertex',
    source: vertexSource,
    debugShaders: 'warnings'
  });
  expect(createShader).toHaveBeenNthCalledWith(2, {
    id: 'mock-render-kernel-fragment',
    stage: 'fragment',
    source: fragmentSource,
    debugShaders: 'warnings'
  });
  expect(createRenderPipeline).toHaveBeenCalledWith({
    id: 'mock-render-kernel',
    topology: 'triangle-list',
    vs: vertexShader,
    fs: fragmentShader
  });

  expect(
    kernel.draw(renderPass, {
      bindings: {uniforms: uniformBuffer},
      vertexArray,
      vertexCount: 3,
      instanceCount: 2
    })
  ).toBe(true);
  expect(setPipeline).toHaveBeenLastCalledWith(pipeline);
  expect(setBindings).toHaveBeenLastCalledWith({uniforms: uniformBuffer});
  expect(setVertexArray).toHaveBeenLastCalledWith(vertexArray);
  expect(draw).toHaveBeenLastCalledWith({vertexCount: 3, instanceCount: 2});

  kernel.drawIndirect(renderPass, {vertexArray, indirectBuffer});
  expect(drawIndirect).toHaveBeenLastCalledWith(indirectBuffer, 0);

  kernel.drawIndexedIndirect(renderPass, {vertexArray, indirectBuffer, indirectOffset: 20});
  expect(drawIndexedIndirect).toHaveBeenLastCalledWith(indirectBuffer, 20);

  kernel.destroy();
  kernel.destroy();
  expect(releasePipeline).toHaveBeenCalledTimes(1);
  expect(releasePipeline).toHaveBeenCalledWith(pipeline);
  expect(releaseShader.mock.calls).toEqual([[vertexShader], [fragmentShader]]);
});

it('RenderKernel.createAsync supports vertex-only pipelines', async () => {
  const device = {type: 'webgpu'} as Device;
  const vertexShader = {stage: 'vertex', source: vertexSource} as Shader;
  const pipeline = {} as RenderPipeline;
  const releaseShader = vi.fn();
  const shaderFactory = {
    createShader: vi.fn(() => vertexShader),
    release: releaseShader
  } as unknown as ShaderFactory;
  const createRenderPipelineAsync = vi.fn(() => Promise.resolve(pipeline));
  const releasePipeline = vi.fn();
  const pipelineFactory = {
    createRenderPipelineAsync,
    release: releasePipeline
  } as unknown as PipelineFactory;

  const kernel = await RenderKernel.createAsync(device, {
    vertexSource,
    shaderFactory,
    pipelineFactory
  });

  expect(kernel.pipeline).toBe(pipeline);
  expect(kernel.fragmentShader).toBeNull();
  expect(createRenderPipelineAsync).toHaveBeenCalledWith({vs: vertexShader, fs: null});
  expect(PipelineFactory.getAsyncCompilation(device)).toBeUndefined();

  kernel.destroy();
  expect(releasePipeline).toHaveBeenCalledWith(pipeline);
  expect(releaseShader).toHaveBeenCalledWith(vertexShader);
});

it('RenderKernel.createAsync cleans up failures inside an existing compilation scope', async () => {
  const device = {type: 'webgpu'} as Device;
  const vertexShader = {stage: 'vertex', source: vertexSource} as Shader;
  const pipelineError = new Error('render pipeline compilation failed');
  const releaseShader = vi.fn();
  const shaderFactory = {
    createShader: vi.fn(() => vertexShader),
    release: releaseShader
  } as unknown as ShaderFactory;
  const pipelineFactory = {
    createRenderPipelineAsync: vi.fn(() => Promise.reject(pipelineError)),
    release: vi.fn()
  } as unknown as PipelineFactory;
  const compilation = PipelineFactory.beginAsyncCompilation(device);

  try {
    await expect(
      RenderKernel.createAsync(device, {vertexSource, shaderFactory, pipelineFactory})
    ).rejects.toBe(pipelineError);
    expect(compilation).toHaveLength(1);
    await Promise.allSettled(compilation);
    expect(releaseShader).toHaveBeenCalledWith(vertexShader);
  } finally {
    PipelineFactory.endAsyncCompilation(device, compilation);
  }
});

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
