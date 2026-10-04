// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileSlang, transpileSlangWGSL, packSlangUniforms} from '@luma.gl/slang';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import reference from './reference.json';
import {
  OUTPUT_RENDER_SHADER,
  MATRIX_SHADER,
  LANGUAGE_SHADER,
  LANGUAGE_VALUES,
  UNIFORM_SHADER,
  UNIFORM_VALUES,
  UNIFORM_RESULTS,
  UNIFORM_DECLARATIONS
} from './fixtures';

async function runCompute(
  source: string,
  expected: readonly number[],
  uniformValues?: typeof UNIFORM_VALUES,
  native?: {code: string; entryPoint: string}
): Promise<void> {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const handle = device!.handle;
  const result = transpileSlang(source, {target: 'wgsl'});
  const module = handle.createShaderModule({code: native?.code ?? result.code});
  expect(
    (await module.getCompilationInfo()).messages.filter(message => message.type === 'error'),
    result.code
  ).toEqual([]);
  const pipeline = await handle.createComputePipelineAsync({
    layout: 'auto',
    compute: {module, entryPoint: native?.entryPoint ?? result.entryPoint}
  });
  const storage = handle.createBuffer({
    size: expected.length * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const readback = handle.createBuffer({
    size: expected.length * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });
  let uniform: GPUBuffer | undefined;
  try {
    const entries: GPUBindGroupEntry[] = [
      {binding: uniformValues ? 1 : 0, resource: {buffer: storage}}
    ];
    if (uniformValues) {
      const bytes = packSlangUniforms(result.reflection.bindings[0].layout!, uniformValues);
      uniform = handle.createBuffer({
        size: bytes.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      handle.queue.writeBuffer(uniform, 0, bytes);
      entries.push({binding: 0, resource: {buffer: uniform}});
    }
    const bindings = handle.createBindGroup({layout: pipeline.getBindGroupLayout(0), entries});
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
    uniform?.destroy();
    storage.destroy();
    readback.destroy();
  }
}

it('slang#WGSL executes conditional side effects, output parameters, overloads, and loop continuations', async () => {
  await runCompute(LANGUAGE_SHADER, LANGUAGE_VALUES);
});
it('slang#WGSL reads packed nested uniforms, arrays, bools, and matrices', async () => {
  await runCompute(UNIFORM_SHADER, UNIFORM_RESULTS, UNIFORM_VALUES);
});
it('slang#WebGL reads the same packed nested uniform bytes', async () => {
  const device = await getWebGLTestDevice();
  const context = device.handle;
  const source =
    UNIFORM_DECLARATIONS +
    `[shader("vertex")] float4 vertexMain(uint identifier : SV_VertexID) : SV_Position {
    float2 position = float2(-1,-1); if (identifier == 1u) { position = float2(3,-1); } if (identifier == 2u) { position = float2(-1,3); } return float4(position,0,1);
  }
  [shader("fragment")] float4 fragmentMain() : SV_Target {
    float2 projected = mul(settings.transform, float2(1,2));
    return float4((settings.bias + settings.inner.scale) / 10.0, settings.weights[2] / 10.0, projected.x / 10.0, 1);
  }`;
  const shaders: WebGLShader[] = [];
  const program = context.createProgram()!;
  const uniformBuffer = context.createBuffer()!;
  const texture = context.createTexture()!;
  const framebuffer = context.createFramebuffer()!;
  try {
    for (const [entryPoint, stage] of [
      ['vertexMain', context.VERTEX_SHADER],
      ['fragmentMain', context.FRAGMENT_SHADER]
    ] as const) {
      const result = transpileSlang(source, {target: 'glsl', entryPoint});
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
    context.useProgram(program);
    const result = transpileSlang(source, {target: 'glsl', entryPoint: 'fragmentMain'});
    const bytes = packSlangUniforms(result.reflection.bindings[0].layout!, UNIFORM_VALUES);
    context.bindBuffer(context.UNIFORM_BUFFER, uniformBuffer);
    context.bufferData(context.UNIFORM_BUFFER, bytes, context.STATIC_DRAW);
    context.uniformBlockBinding(
      program,
      context.getUniformBlockIndex(program, result.reflection.bindings[0].blockName!),
      0
    );
    context.bindBufferBase(context.UNIFORM_BUFFER, 0, uniformBuffer);
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA8,
      1,
      1,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      null
    );
    context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
    context.framebufferTexture2D(
      context.FRAMEBUFFER,
      context.COLOR_ATTACHMENT0,
      context.TEXTURE_2D,
      texture,
      0
    );
    context.viewport(0, 0, 1, 1);
    context.disable(context.DEPTH_TEST);
    context.disable(context.BLEND);
    context.drawArrays(context.TRIANGLES, 0, 3);
    const pixels = new Uint8Array(4);
    context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixels);
    for (const [index, expected] of [77, 179, 128, 255].entries())
      expect(Math.abs(pixels[index] - expected)).toBeLessThanOrEqual(1);
  } finally {
    context.bindFramebuffer(context.FRAMEBUFFER, null);
    context.bindBufferBase(context.UNIFORM_BUFFER, 0, null);
    context.useProgram(null);
    context.deleteBuffer(uniformBuffer);
    context.deleteTexture(texture);
    context.deleteFramebuffer(framebuffer);
    context.deleteProgram(program);
    shaders.forEach(shader => context.deleteShader(shader));
  }
});

it.each([
  ['TextureCube<float4>', 'float3', 'Sample', 'SamplerState'],
  ['Texture2DArray<float4>', 'float3', 'SampleLevel', 'SamplerState'],
  ['Texture3D<float2>', 'float3', 'SampleLevel', 'SamplerState'],
  ['Texture2D<float>', 'float2', 'SampleCmp', 'SamplerComparisonState']
])('slang#validates %s sampling on WebGL and WebGPU', async (type, coordinates, method, sampler) => {
  const source = `${type} image; ${sampler} imageSampler; [shader("fragment")] float4 main(${coordinates} coordinates : TEXCOORD0) : SV_Target { return float4(image.${method}(imageSampler,coordinates${method === 'Sample' ? '' : ',0.0'})${type.includes('float2>') ? ',0.0,1.0' : ''}); }`;
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const wgsl = transpileSlang(source, {target: 'wgsl'});
  const module = device!.handle.createShaderModule({code: wgsl.code});
  expect(
    (await module.getCompilationInfo()).messages.filter(message => message.type === 'error'),
    wgsl.code
  ).toEqual([]);
  const webgl = await getWebGLTestDevice();
  const context = webgl.handle;
  const glsl = transpileSlang(source, {target: 'glsl'});
  const shader = context.createShader(context.FRAGMENT_SHADER)!;
  try {
    context.shaderSource(shader, glsl.code);
    context.compileShader(shader);
    expect(
      context.getShaderParameter(shader, context.COMPILE_STATUS),
      context.getShaderInfoLog(shader) || glsl.code
    ).toBe(true);
  } finally {
    context.deleteShader(shader);
  }
});

it('slang#storage texture writes execute on WebGPU', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const handle = device!.handle;
  const source =
    '[format("rgba8")] WTexture2D<float4> outputImage; [shader("compute")] [numthreads(1,1,1)] void main() { outputImage[int2(0,0)] = float4(1,0.5,0,1); }';
  const result = transpileSlang(source, {target: 'wgsl'});
  const module = handle.createShaderModule({code: result.code});
  expect(
    (await module.getCompilationInfo()).messages.filter(message => message.type === 'error'),
    result.code
  ).toEqual([]);
  const pipeline = await handle.createComputePipelineAsync({
    layout: 'auto',
    compute: {module, entryPoint: result.entryPoint}
  });
  const texture = handle.createTexture({
    size: [1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC
  });
  const readback = handle.createBuffer({
    size: 256,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });
  try {
    const bindings = handle.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{binding: 0, resource: texture.createView()}]
    });
    const encoder = handle.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindings);
    pass.dispatchWorkgroups(1);
    pass.end();
    encoder.copyTextureToBuffer({texture}, {buffer: readback, bytesPerRow: 256}, [1, 1]);
    handle.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    expect(Array.from(new Uint8Array(readback.getMappedRange()).slice(0, 4))).toEqual([
      255, 128, 0, 255
    ]);
    readback.unmap();
  } finally {
    texture.destroy();
    readback.destroy();
  }
});

it.each([
  ['language', LANGUAGE_SHADER, LANGUAGE_VALUES],
  ['matrix', MATRIX_SHADER, [14, 32, 9, 12, 15]]
] as const)('slang#matches official Slang numeric GPU results for %s', async (name, source, expected) => {
  await runCompute(source, expected);
  await runCompute(source, expected, undefined, reference.fixtures[name]);
});
it('slang#matches official Slang nested numeric uniform layout and GPU results', async () => {
  await runCompute(UNIFORM_SHADER, UNIFORM_RESULTS, UNIFORM_VALUES, reference.fixtures.uniforms);
});

it('slang#entry-point output parameters and shared helpers validate as a unified render pipeline', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const result = transpileSlangWGSL(OUTPUT_RENDER_SHADER);
  const module = device!.handle.createShaderModule({code: result.code});
  expect(
    (await module.getCompilationInfo()).messages.filter(message => message.type === 'error'),
    result.code
  ).toEqual([]);
  await device!.handle.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {module, entryPoint: result.entryPoints.vertexMain.entryPoint},
    fragment: {
      module,
      entryPoint: result.entryPoints.fragmentMain.entryPoint,
      targets: [{format: 'rgba8unorm'}]
    }
  });
  const webgl = await getWebGLTestDevice();
  const context = webgl.handle;
  const program = context.createProgram()!;
  const shaders: WebGLShader[] = [];
  try {
    for (const [entryPoint, stage] of [
      ['vertexMain', context.VERTEX_SHADER],
      ['fragmentMain', context.FRAGMENT_SHADER]
    ] as const) {
      const shader = context.createShader(stage)!;
      shaders.push(shader);
      const result = transpileSlang(OUTPUT_RENDER_SHADER, {target: 'glsl', entryPoint});
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

it.each([
  'cube',
  'array',
  'depth'
] as const)('slang#%s texture sampling produces matching pixels on WebGL and WebGPU', async kind => {
  const declaration =
    kind === 'cube'
      ? 'TextureCube<float4> image; SamplerState imageSampler;'
      : kind === 'array'
        ? 'Texture2DArray<float4> image; SamplerState imageSampler;'
        : 'Texture2D<float> image; SamplerComparisonState imageSampler;';
  const sample =
    kind === 'cube'
      ? 'image.Sample(imageSampler,float3(1,0,0))'
      : kind === 'array'
        ? 'image.SampleLevel(imageSampler,float3(0.5,0.5,1),0)'
        : 'float4(image.SampleCmp(imageSampler,float2(0.5,0.5),0.5))';
  const source =
    declaration +
    `[shader("vertex")] float4 vertexMain(uint identifier : SV_VertexID) : SV_Position {
    float2 point = float2(-1,-1); if (identifier == 1u) { point = float2(3,-1); } if (identifier == 2u) { point = float2(-1,3); } return float4(point,0,1);
  } [shader("fragment")] float4 fragmentMain() : SV_Target { return ${sample}; }`;
  const expected =
    kind === 'cube' ? [255, 0, 0, 255] : kind === 'array' ? [0, 255, 0, 255] : [255, 255, 255, 255];
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const handle = device!.handle;
  const result = transpileSlangWGSL(source);
  const module = handle.createShaderModule({code: result.code});
  const pipeline = await handle.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {module, entryPoint: result.entryPoints.vertexMain.entryPoint},
    fragment: {
      module,
      entryPoint: result.entryPoints.fragmentMain.entryPoint,
      targets: [{format: 'rgba8unorm'}]
    }
  });
  const sampled = handle.createTexture({
    size: [1, 1, kind === 'cube' ? 6 : kind === 'array' ? 2 : 1],
    format: kind === 'depth' ? 'depth32float' : 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      (kind === 'depth' ? GPUTextureUsage.RENDER_ATTACHMENT : GPUTextureUsage.COPY_DST)
  });
  const output = handle.createTexture({
    size: [1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
  });
  const readback = handle.createBuffer({
    size: 256,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });
  try {
    if (kind === 'depth') {
      const encoder = handle.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [],
        depthStencilAttachment: {
          view: sampled.createView(),
          depthClearValue: 0.75,
          depthLoadOp: 'clear',
          depthStoreOp: 'store'
        }
      });
      pass.end();
      handle.queue.submit([encoder.finish()]);
    } else {
      const layers = kind === 'cube' ? 6 : 2;
      for (let layer = 0; layer < layers; layer++)
        handle.queue.writeTexture(
          {texture: sampled, origin: [0, 0, layer]},
          new Uint8Array(layer === 1 ? [0, 255, 0, 255] : [255, 0, 0, 255]),
          {bytesPerRow: 4},
          [1, 1]
        );
    }
    const reflection = result.entryPoints.fragmentMain.reflection.bindings;
    const sampler = handle.createSampler(kind === 'depth' ? {compare: 'less-equal'} : {});
    const bindings = handle.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: reflection.find(binding => binding.kind === 'texture')!.binding,
          resource: sampled.createView({
            dimension: kind === 'cube' ? 'cube' : kind === 'array' ? '2d-array' : '2d'
          })
        },
        {
          binding: reflection.find(binding => binding.kind === 'sampler')!.binding,
          resource: sampler
        }
      ]
    });
    const encoder = handle.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {view: output.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 0]}
      ]
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindings);
    pass.draw(3);
    pass.end();
    encoder.copyTextureToBuffer({texture: output}, {buffer: readback, bytesPerRow: 256}, [1, 1]);
    handle.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    expect(Array.from(new Uint8Array(readback.getMappedRange()).slice(0, 4))).toEqual(expected);
    readback.unmap();
  } finally {
    sampled.destroy();
    output.destroy();
    readback.destroy();
  }

  const webgl = await getWebGLTestDevice();
  const context = webgl.handle;
  const program = context.createProgram()!;
  const shaders: WebGLShader[] = [];
  const sampledTexture = context.createTexture()!;
  const colorTexture = context.createTexture()!;
  const framebuffer = context.createFramebuffer()!;
  const target =
    kind === 'cube'
      ? context.TEXTURE_CUBE_MAP
      : kind === 'array'
        ? context.TEXTURE_2D_ARRAY
        : context.TEXTURE_2D;
  try {
    for (const [entryPoint, stage] of [
      ['vertexMain', context.VERTEX_SHADER],
      ['fragmentMain', context.FRAGMENT_SHADER]
    ] as const) {
      const result = transpileSlang(source, {target: 'glsl', entryPoint});
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
    context.useProgram(program);
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(target, sampledTexture);
    context.texParameteri(target, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(target, context.TEXTURE_MAG_FILTER, context.NEAREST);
    if (kind === 'cube') {
      for (let face = 0; face < 6; face++)
        context.texImage2D(
          context.TEXTURE_CUBE_MAP_POSITIVE_X + face,
          0,
          context.RGBA8,
          1,
          1,
          0,
          context.RGBA,
          context.UNSIGNED_BYTE,
          new Uint8Array([255, 0, 0, 255])
        );
    } else if (kind === 'array')
      context.texImage3D(
        target,
        0,
        context.RGBA8,
        1,
        1,
        2,
        0,
        context.RGBA,
        context.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
      );
    else {
      context.texImage2D(
        target,
        0,
        context.DEPTH_COMPONENT32F,
        1,
        1,
        0,
        context.DEPTH_COMPONENT,
        context.FLOAT,
        new Float32Array([0.75])
      );
      context.texParameteri(target, context.TEXTURE_COMPARE_MODE, context.COMPARE_REF_TO_TEXTURE);
      context.texParameteri(target, context.TEXTURE_COMPARE_FUNC, context.LEQUAL);
    }
    const textureBinding = transpileSlang(source, {
      target: 'glsl',
      entryPoint: 'fragmentMain'
    }).reflection.bindings.find(binding => binding.kind === 'texture')!;
    context.uniform1i(context.getUniformLocation(program, textureBinding.shaderName), 0);
    context.activeTexture(context.TEXTURE1);
    context.bindTexture(context.TEXTURE_2D, colorTexture);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA8,
      1,
      1,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      null
    );
    context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
    context.framebufferTexture2D(
      context.FRAMEBUFFER,
      context.COLOR_ATTACHMENT0,
      context.TEXTURE_2D,
      colorTexture,
      0
    );
    context.viewport(0, 0, 1, 1);
    context.disable(context.DEPTH_TEST);
    context.disable(context.BLEND);
    context.drawArrays(context.TRIANGLES, 0, 3);
    const pixels = new Uint8Array(4);
    context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixels);
    expect(Array.from(pixels)).toEqual(expected);
  } finally {
    context.bindFramebuffer(context.FRAMEBUFFER, null);
    context.useProgram(null);
    context.activeTexture(context.TEXTURE0);
    context.deleteTexture(sampledTexture);
    context.deleteTexture(colorTexture);
    context.deleteFramebuffer(framebuffer);
    context.deleteProgram(program);
    shaders.forEach(shader => context.deleteShader(shader));
  }
});

const AGGREGATE_SHADER = `
static const float constants[2] = {6,7};
RWStructuredBuffer<float> output;
[shader("compute")] [numthreads(1,1,1)] void main() {
  float values[3] = {1};
  float2x2 matrix = {1,2,3,4};
  bool4 flags = bool4(float4(0,2,0,-1));
  float4 converted = float4(!flags);
  uint index = 1u;
  output[0] = values[0]; output[1] = values[1]; output[2] = matrix[1].x;
  output[3] = converted.x; output[4] = converted.y;
  output[5] = float((int)true); output[6] = constants[index];
}`;
it('slang#executes partial aggregate initialization, boolean casts, and indexed constant arrays', async () => {
  await runCompute(AGGREGATE_SHADER, [1, 0, 3, 1, 0, 1, 7]);
});
it('slang#GLSL validates explicit boolean vector conversions and negation', async () => {
  const source =
    '[shader("fragment")] float4 main() : SV_Target { bool4 flags = bool4(float4(0,2,0,-1)); return float4(!flags); }';
  const device = await getWebGLTestDevice();
  const context = device.handle;
  const result = transpileSlang(source, {target: 'glsl'});
  const shader = context.createShader(context.FRAGMENT_SHADER)!;
  try {
    context.shaderSource(shader, result.code);
    context.compileShader(shader);
    expect(
      context.getShaderParameter(shader, context.COMPILE_STATUS),
      context.getShaderInfoLog(shader) || result.code
    ).toBe(true);
  } finally {
    context.deleteShader(shader);
  }
});

it('slang#preserves earlier operand and input argument values before later output calls', async () => {
  const source = `RWStructuredBuffer<float> output;
  float change(inout float value) { value = 5; return 7; }
  float combine(float left, float right) { return left * 10 + right; }
  [shader("compute")] [numthreads(1,1,1)] void main() {
    float value = 2; output[0] = value + change(value);
    value = 2; output[1] = combine(value,change(value));
    value = 2; float2 pair = float2(value,change(value)); output[2] = pair.x;
    value = 2; output[3] = lerp(value,change(value),0.5);
  }`;
  await runCompute(source, [9, 27, 2, 4.5]);
});
