// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileSlang, transpileSlangWGSL} from '@luma.gl/slang';
import {getSlangShaderLayout, getSlangBindingNames} from '@luma.gl/slang/luma';
import {ATOMIC_SHADER, BYTE_ADDRESS_SHADER, FULLSCREEN_VERTEX} from './compute-textures-fixtures';

it.each([
  'wgsl',
  'glsl'
] as const)('slang#reflects atomic and raw integer buffer layouts for %s', target => {
  const atomic = transpileSlang(ATOMIC_SHADER, {target});
  expect(atomic.reflection.workgroupSize).toEqual([64, 1, 1]);
  expect(atomic.reflection.workgroupStorageSize).toBe(target === 'wgsl' ? 16 : 4);
  expect(atomic.reflection.bindings[0]).toMatchObject({
    access: 'read_write',
    elementStride: 4,
    layout: {type: 'uint', size: 4},
    visibility: 4
  });
  const bytes = transpileSlang(BYTE_ADDRESS_SHADER, {target});
  expect(getSlangShaderLayout(bytes).bindings[0]).toMatchObject({
    type: 'storage',
    minBindingSize: 4
  });
});
it.each([
  ['groupshared float total; InterlockedAdd(total, 1.0);', /Atomics require/],
  ['uint total; InterlockedAdd(total, 1u);', /Atomics require/],
  [
    'groupshared uint total; uint2 previous; InterlockedAdd(total, 1u, previous);',
    /output must match/
  ],
  ['if (identifier == 0u) { GroupMemoryBarrierWithGroupSync(); }', /unconditional/],
  ['if (identifier == 0u) { return; } GroupMemoryBarrierWithGroupSync();', /Early returns/],
  ['for (uint index=0u; index<4u; index++) { GroupMemoryBarrierWithGroupSync(); }', /unconditional/]
])('slang#diagnoses unsafe or unsupported compute source: %s', (body, message) => {
  const global = body.startsWith('groupshared') ? body.slice(0, body.indexOf(';') + 1) : '';
  const source = `${global} [shader("compute")] [numthreads(4,1,1)] void main(uint identifier : SV_GroupIndex) { ${body.slice(global.length)} }`;
  expect(() => transpileSlang(source, {target: 'wgsl', sourceName: 'compute.slang'})).toThrow(
    message
  );
});
it('slang#checks synchronization through helper calls', () => {
  expect(() =>
    transpileSlang(
      'void synchronize() { AllMemoryBarrierWithGroupSync(); } [shader("compute")] [numthreads(4,1,1)] void main(uint identifier : SV_GroupIndex) { if (identifier == 0u) { synchronize(); } }',
      {target: 'wgsl'}
    )
  ).toThrow(/unconditional/);
  expect(() =>
    transpileSlang(
      'RWByteAddressBuffer bytes; [shader("compute")] [numthreads(1,1,1)] void main() { bytes.Store(2u,1u); }',
      {target: 'wgsl'}
    )
  ).toThrow(/aligned/);
  expect(() =>
    transpileSlang(
      'ByteAddressBuffer bytes; [shader("compute")] [numthreads(1,1,1)] void main() { bytes.Store(0u,1u); }',
      {target: 'wgsl'}
    )
  ).toThrow(/RWByteAddressBuffer/);
});
it('slang#retains shared resources in unified compute and render programs', () => {
  const result = transpileSlangWGSL(ATOMIC_SHADER + FULLSCREEN_VERTEX);
  expect(result.code.match(/var<workgroup> _slang_total/g)).toHaveLength(1);
  expect(result.entryPoints.vertexMain.reflection.bindings[0].visibility).toBe(0);
});
it('slang#reflects fixed texture and sampler arrays as contiguous bindings', () => {
  const source =
    'Texture2D<float4> images[2] : register(t4); SamplerState samplers[2] : register(s8); [shader("fragment")] float4 main() : SV_Target { return images[1].SampleLevel(samplers[0],float2(0.5),0); }';
  const result = transpileSlang(source, {target: 'wgsl'});
  expect(
    result.reflection.bindings.map(binding => [binding.name, binding.binding, binding.visibility])
  ).toEqual([
    ['images[0]', 4, 0],
    ['images[1]', 5, 2],
    ['samplers[0]', 8, 2],
    ['samplers[1]', 9, 0]
  ]);
  expect(result.reflection.bindings[1].resourceArray).toEqual({
    name: 'images',
    index: 1,
    length: 2
  });
  expect(Object.keys(getSlangBindingNames(result))).toEqual(['images[1]', 'samplers[0]']);
  expect(() =>
    transpileSlang(source.replace('register(s8)', 'register(s5)'), {target: 'wgsl'})
  ).toThrow(/Duplicate resource binding/);
});
it('slang#supports multiple application-managed GLSL sampler bindings without changing the WebGL target', () => {
  const source =
    'Texture2D<float4> image; SamplerState nearestSampler; SamplerState linearSampler; [shader("fragment")] float4 main() : SV_Target { return image.Sample(nearestSampler,float2(0.5)) + image.Sample(linearSampler,float2(0.5)); }';
  const result = transpileSlang(source, {target: 'glsl'});
  expect(result.code).toContain('#version 300 es');
  expect(result.reflection.bindings.map(binding => binding.sampler)).toEqual([
    'nearestSampler',
    'linearSampler'
  ]);
  expect(result.reflection.bindings[1].name).toBe('image#linearSampler');
  expect(result.code).not.toContain('layout(binding');
  expect(transpileSlang(source, {target: 'glsl', glslVersion: '450'}).code).toContain(
    'layout(binding = 3)'
  );
});
it.each([
  ['Texture2DMS<float4> image;', 'return image.Load(int2(0),0);'],
  [
    'TextureCubeArray<float4> image; SamplerState state;',
    'return image.SampleLevel(state,float4(1,0,0,1),0);'
  ],
  ['Texture1D<float4> image; SamplerState state;', 'return image.SampleLevel(state,0.5,0);']
])('slang#diagnoses WebGL-incompatible resources: %s', (declaration, body) => {
  const source = `${declaration} [shader("fragment")] float4 main() : SV_Target { ${body} }`;
  expect(() => transpileSlang(source, {target: 'glsl'})).toThrow(/unavailable in WebGL 2/);
  expect(() => transpileSlang(source, {target: 'wgsl'})).not.toThrow();
});
it('slang#reflects multisampled texture layout for pipeline creation', () => {
  const result = transpileSlang(
    'Texture2DMS<float4> image; [shader("fragment")] float4 main() : SV_Target { uint width; uint height; uint samples; image.GetDimensions(width,height,samples); return image.Load(int2(0),int(samples)-1); }',
    {target: 'wgsl'}
  );
  expect(getSlangShaderLayout(result).bindings[0]).toMatchObject({
    type: 'texture',
    multisampled: true,
    viewDimension: '2d'
  });
});

it('slang#omits inactive declarations only when the application requests it', () => {
  const source =
    'Texture2D<float4> unusedImage; RWStructuredBuffer<uint> result; [shader("compute")] [numthreads(1,1,1)] void main() { result[0]=1u; }';
  const shader = transpileSlang(source, {target: 'wgsl', omitUnusedResources: true});
  expect(shader.code).not.toContain('var _slang_unusedImage');
  expect(shader.reflection.bindings[0].visibility).toBe(0);
  expect(transpileSlang(source, {target: 'wgsl'}).code).toContain('var _slang_unusedImage');
});
it('slang#keeps combined texture names stable across independently compiled stages', () => {
  const source =
    'Texture2D<float4> image; SamplerState firstSampler; SamplerState secondSampler; [shader("vertex")] float4 vertexMain() : SV_Position { return image.SampleLevel(firstSampler,float2(0.5),0); } [shader("fragment")] float4 fragmentMain() : SV_Target { return image.SampleLevel(secondSampler,float2(0.5),0); }';
  const vertex = transpileSlang(source, {target: 'glsl', entryPoint: 'vertexMain'});
  const fragment = transpileSlang(source, {target: 'glsl', entryPoint: 'fragmentMain'});
  expect(vertex.reflection.bindings[0].sampler).toBe('firstSampler');
  expect(fragment.reflection.bindings[0].sampler).toBe('secondSampler');
  expect(vertex.reflection.bindings[0].shaderName).not.toBe(
    fragment.reflection.bindings[0].shaderName
  );
  expect(() => getSlangShaderLayout([vertex, fragment])).not.toThrow();
});
it('slang#diagnoses implicit derivatives in dynamic resource selection', () => {
  expect(() =>
    transpileSlang(
      'Texture2D<float4> images[2]; SamplerState state; [shader("fragment")] float4 main(uint index : TEXCOORD0) : SV_Target { return images[index].Sample(state,float2(0.5)); }',
      {target: 'wgsl'}
    )
  ).toThrow(/explicit levels or gradients/);
});

it('slang#rejects oversized resource arrays before reserving their bindings', () => {
  expect(() =>
    transpileSlang(
      'Texture2D<float4> images[1000000000] : register(t0); [shader("fragment")] float4 main() : SV_Target { return float4(1); }',
      {target: 'wgsl'}
    )
  ).toThrow(/sixteen bindings/);
});
