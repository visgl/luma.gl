// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileSlang} from '@luma.gl/slang';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  ATOMIC_SHADER,
  ATOMIC_RESULTS,
  BYTE_ADDRESS_SHADER,
  BYTE_ADDRESS_RESULTS,
  FULLSCREEN_VERTEX
} from './compute-textures-fixtures';

async function createCompute(source: string) {
  const device = (await getWebGPUTestDevice('core'))!;
  expect(device).not.toBeNull();
  const handle = device.handle;
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
  return {handle, result, pipeline};
}
async function readCompute(
  source: string,
  length: number,
  createResources?: (handle: GPUDevice) => {entries: GPUBindGroupEntry[]; destroy(): void},
  floatingPoint = false
) {
  const {handle, result, pipeline} = await createCompute(source);
  const output = handle.createBuffer({
    size: length * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const readback = handle.createBuffer({
    size: length * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });
  const resources = createResources?.(handle);
  try {
    const binding = result.reflection.bindings.find(binding => binding.kind === 'storage')!.binding;
    const group = handle.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{binding, resource: {buffer: output}}, ...(resources?.entries || [])]
    });
    const encoder = handle.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(1);
    pass.end();
    encoder.copyBufferToBuffer(output, 0, readback, 0, length * 4);
    handle.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const values = Array.from(
      floatingPoint
        ? new Float32Array(readback.getMappedRange())
        : new Uint32Array(readback.getMappedRange())
    );
    readback.unmap();
    return values;
  } finally {
    resources?.destroy();
    output.destroy();
    readback.destroy();
  }
}

it('slang#WebGPU atomics match a CPU reduction and all integer operations', async () => {
  const expected = [...ATOMIC_RESULTS];
  expected[0] = Array.from({length: 64}, (_, index) => index + 1).reduce(
    (sum, value) => sum + value,
    0
  );
  expect(await readCompute(ATOMIC_SHADER, expected.length)).toEqual(expected);
});
it('slang#WebGPU byte-address loads, stores, strong compare/exchange and bitcasts match raw bytes', async () => {
  expect(await readCompute(BYTE_ADDRESS_SHADER, BYTE_ADDRESS_RESULTS.length)).toEqual(
    BYTE_ADDRESS_RESULTS
  );
});
it.each([
  ['1D', 'int', '0'],
  ['2DArray', 'int3', '0,0,1'],
  ['3D', 'int3', '0,0,1']
])('slang#WebGPU writes and queries %s storage textures', async (dimension, coordinateType, coordinate) => {
  const source = `[format("r32ui")] WTexture${dimension}<uint> image; [shader("compute")] [numthreads(1,1,1)] void main() { image[${coordinateType}(${coordinate})] = 37u; }`;
  const {handle, pipeline} = await createCompute(source);
  const texture = handle.createTexture({
    size: dimension === '1D' ? [2] : [1, 1, 2],
    dimension: dimension === '1D' ? '1d' : dimension === '3D' ? '3d' : '2d',
    format: 'r32uint',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC
  });
  const readback = handle.createBuffer({
    size: 256,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });
  try {
    const group = handle.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: texture.createView({
            dimension: dimension === '2DArray' ? '2d-array' : dimension === '3D' ? '3d' : '1d'
          })
        }
      ]
    });
    const encoder = handle.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(1);
    pass.end();
    encoder.copyTextureToBuffer(
      {texture, origin: dimension === '1D' ? [0] : [0, 0, 1]},
      {buffer: readback, bytesPerRow: 256},
      [1, 1, 1]
    );
    handle.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    expect(new Uint32Array(readback.getMappedRange())[0]).toBe(37);
    readback.unmap();
  } finally {
    texture.destroy();
    readback.destroy();
  }
});
it('slang#WebGPU resource arrays, gradients, gathers and mip queries return expected texels', async () => {
  const source = `Texture2D<float4> images[2]; SamplerState states[2]; RWStructuredBuffer<float> results;
  [shader("compute")] [numthreads(1,1,1)] void main() {
    float4 first = images[0].SampleGrad(states[0],float2(0.5),float2(0),float2(0));
    uint selected = 1u; float4 second = images[selected].SampleLevel(states[1],float2(0.5),0);
    float4 gathered = images[0].GatherRed(states[0],float2(0.5));
    uint width; uint height; uint levels; images[1].GetDimensions(0u,width,height,levels);
    results[0]=first.x; results[1]=second.y; results[2]=gathered.x; results[3]=gathered.y; results[4]=gathered.z; results[5]=gathered.w;
    results[6]=float(width); results[7]=float(height); results[8]=float(levels);
  }`;
  const values = await readCompute(
    source,
    9,
    handle => {
      const textures = [
        [255, 0, 0, 255],
        [0, 255, 0, 255]
      ].map(color => {
        const texture = handle.createTexture({
          size: [2, 2],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        handle.queue.writeTexture(
          {texture},
          new Uint8Array([...color, ...color, ...color, ...color]),
          {bytesPerRow: 8},
          [2, 2]
        );
        return texture;
      });
      const sampler = handle.createSampler();
      return {
        entries: [
          {binding: 0, resource: textures[0].createView()},
          {binding: 1, resource: textures[1].createView()},
          {binding: 2, resource: sampler},
          {binding: 3, resource: sampler}
        ],
        destroy: () => textures.forEach(texture => texture.destroy())
      };
    },
    true
  );
  expect(values).toEqual([1, 1, 1, 1, 1, 1, 2, 2, 1]);
});
it('slang#WebGPU multisampled loads and queries read a render attachment', async () => {
  const source = `Texture2DMS<float4> image; RWStructuredBuffer<uint> results;
  [shader("compute")] [numthreads(1,1,1)] void main() { uint width; uint height; uint samples; image.GetDimensions(width,height,samples); float4 color=image.Load(int2(0),int(samples)-1); results[0]=width; results[1]=height; results[2]=samples; results[3]=uint(color.y*255.0); }`;
  const values = await readCompute(source, 4, handle => {
    const texture = handle.createTexture({
      size: [2, 2],
      sampleCount: 4,
      format: 'rgba8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    const encoder = handle.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {view: texture.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 1, 0, 1]}
      ]
    });
    pass.end();
    handle.queue.submit([encoder.finish()]);
    return {
      entries: [{binding: 0, resource: texture.createView()}],
      destroy: () => texture.destroy()
    };
  });
  expect(values).toEqual([2, 2, 4, 255]);
});
it.each([
  ['Texture1D<float4> image; SamplerState state;', 'return image.SampleLevel(state,0.5,0);'],
  [
    'TextureCubeArray<float4> image; SamplerState state;',
    'return image.SampleLevel(state,float4(1,0,0,0),0);'
  ],
  [
    'TextureCubeArray<float> image; SamplerComparisonState state;',
    'return float4(image.GatherCmp(state,float4(1,0,0,0),0.5));'
  ],
  [
    'Texture2DArray<float4> image; SamplerState state;',
    'uint width; uint height; uint layers; image.GetDimensions(width,height,layers); return image.SampleGrad(state,float3(0.5,0.5,0),float2(0),float2(0));'
  ]
])('slang#validates expanded WGSL texture signatures: %s', async (declaration, body) => {
  const handle = (await getWebGPUTestDevice('core'))!.handle;
  const result = transpileSlang(
    `${declaration} [shader("fragment")] float4 main() : SV_Target { ${body} }`,
    {target: 'wgsl'}
  );
  const module = handle.createShaderModule({code: result.code});
  expect(
    (await module.getCompilationInfo()).messages.filter(message => message.type === 'error'),
    result.code
  ).toEqual([]);
});
it('slang#WebGL ES 300 executes explicit gradients and distinct sampler states on the same image', async () => {
  const source = `Texture2D<float4> image; SamplerState clampState; SamplerState repeatState; ${FULLSCREEN_VERTEX}
  [shader("fragment")] float4 fragmentMain() : SV_Target { uint width; uint height; image.GetDimensions(width,height); float4 first=image.SampleGrad(clampState,float2(1.25,0.5),float2(0),float2(0)); float4 second=image.SampleGrad(repeatState,float2(1.25,0.5),float2(0),float2(0)); return float4(first.r,second.g,float(width)/2.0,1); }`;
  const context = (await getWebGLTestDevice()).handle;
  const program = context.createProgram()!;
  const shaders: WebGLShader[] = [];
  const image = context.createTexture()!;
  const output = context.createTexture()!;
  const framebuffer = context.createFramebuffer()!;
  const samplers = [context.createSampler()!, context.createSampler()!];
  try {
    for (const [entryPoint, stage] of [
      ['vertexMain', context.VERTEX_SHADER],
      ['fragmentMain', context.FRAGMENT_SHADER]
    ] as const) {
      const shader = context.createShader(stage)!;
      shaders.push(shader);
      const compiled = transpileSlang(source, {target: 'glsl', entryPoint});
      context.shaderSource(shader, compiled.code);
      context.compileShader(shader);
      expect(
        context.getShaderParameter(shader, context.COMPILE_STATUS),
        context.getShaderInfoLog(shader) || compiled.code
      ).toBe(true);
      context.attachShader(program, shader);
    }
    context.linkProgram(program);
    expect(
      context.getProgramParameter(program, context.LINK_STATUS),
      context.getProgramInfoLog(program) || ''
    ).toBe(true);
    context.useProgram(program);
    context.bindTexture(context.TEXTURE_2D, image);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA8,
      2,
      1,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      new Uint8Array([0, 255, 0, 255, 255, 0, 0, 255])
    );
    const reflection = transpileSlang(source, {
      target: 'glsl',
      entryPoint: 'fragmentMain'
    }).reflection;
    reflection.bindings.forEach((binding, index) => {
      context.activeTexture(context.TEXTURE0 + index);
      context.bindTexture(context.TEXTURE_2D, image);
      context.uniform1i(context.getUniformLocation(program, binding.shaderName), index);
      context.samplerParameteri(samplers[index], context.TEXTURE_MIN_FILTER, context.NEAREST);
      context.samplerParameteri(samplers[index], context.TEXTURE_MAG_FILTER, context.NEAREST);
      context.samplerParameteri(
        samplers[index],
        context.TEXTURE_WRAP_S,
        index === 0 ? context.CLAMP_TO_EDGE : context.REPEAT
      );
      context.bindSampler(index, samplers[index]);
    });
    context.activeTexture(context.TEXTURE0 + 2);
    context.bindTexture(context.TEXTURE_2D, output);
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
      output,
      0
    );
    context.viewport(0, 0, 1, 1);
    context.disable(context.DEPTH_TEST);
    context.disable(context.BLEND);
    context.drawArrays(context.TRIANGLES, 0, 3);
    const pixels = new Uint8Array(4);
    context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixels);
    expect(Array.from(pixels)).toEqual([255, 255, 255, 255]);
  } finally {
    context.bindFramebuffer(context.FRAMEBUFFER, null);
    context.useProgram(null);
    samplers.forEach((sampler, index) => {
      context.bindSampler(index, null);
      context.deleteSampler(sampler);
    });
    context.activeTexture(context.TEXTURE0);
    context.deleteTexture(image);
    context.deleteTexture(output);
    context.deleteFramebuffer(framebuffer);
    context.deleteProgram(program);
    shaders.forEach(shader => context.deleteShader(shader));
  }
});

it('slang#WebGPU signed atomics operate on groupshared arrays', async () => {
  const source =
    'RWStructuredBuffer<int> results; groupshared int counters[4]; [shader("compute")] [numthreads(4,1,1)] void main(uint identifier : SV_GroupIndex) { counters[identifier]=-int(identifier)-1; GroupMemoryBarrierWithGroupSync(); int previous; InterlockedAdd(counters[0],-int(identifier)-1,previous); GroupMemoryBarrierWithGroupSync(); results[identifier]=counters[identifier]; }';
  expect(await readCompute(source, 4)).toEqual([-11, -2, -3, -4].map(value => value >>> 0));
});
it('slang#WebGPU validates all synchronized memory scopes', async () => {
  await createCompute(
    'RWStructuredBuffer<uint> results; [shader("compute")] [numthreads(1,1,1)] void main() { results[0]=1u; DeviceMemoryBarrierWithGroupSync(); AllMemoryBarrierWithGroupSync(); results[0]+=1u; }'
  );
});
