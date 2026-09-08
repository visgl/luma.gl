// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {
  GPU_SPLAT_FEATURE_SHADER,
  GPU_SPLAT_FEATURE_SHADER_LAYOUT,
  GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_INVALID_DEPTH_KEY,
  GPU_SPLAT_PROJECTION_SHADER,
  GPU_SPLAT_PROJECTION_SHADER_LAYOUT,
  GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
  GPU_SPLAT_RENDER_SHADER,
  GPU_SPLAT_RENDER_SHADER_LAYOUT
} from '../src/gpu-splat-graph-shaders';

it('GPU Gaussian shaders preserve the shared projected-record and uniform layouts', () => {
  const projection = new WgslReflect(GPU_SPLAT_PROJECTION_SHADER);
  const render = new WgslReflect(GPU_SPLAT_RENDER_SHADER);

  for (const [name, shader] of [
    ['projection', projection],
    ['render', render]
  ] as const) {
    const projectedRecord = shader.structs.find(struct => struct.name === 'ProjectedSplat');
    expect(Boolean(projectedRecord), `${name}: projected record is reflected`).toBe(true);
    expect(projectedRecord?.size, `${name}: stride is 48`).toBe(
      GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH
    );
    expect(
      projectedRecord?.members.map(member => ({name: member.name, offset: member.offset})),
      `${name}: projected record retains center, anisotropic axes, and Float32 HDR color`
    ).toEqual([
      {name: 'clipCenter', offset: 0},
      {name: 'axis0', offset: 16},
      {name: 'axis1', offset: 24},
      {name: 'color', offset: 32}
    ]);

    const graphUniforms = shader.uniforms.find(uniform => uniform.name === 'graphUniforms');
    expect(graphUniforms?.size, `${name}: uniforms are 128`).toBe(
      GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH
    );
    expect(
      graphUniforms?.members?.map(member => ({name: member.name, offset: member.offset})),
      `${name}: camera, styling, and preserved source-batch offsets are stable`
    ).toEqual([
      {name: 'modelViewProjectionMatrix', offset: 0},
      {name: 'viewportSize', offset: 64},
      {name: 'radiusScale', offset: 72},
      {name: 'alphaScale', offset: 76},
      {name: 'alphaCutoff', offset: 80},
      {name: 'screenSizeCutoffPixels', offset: 84},
      {name: 'gaussianSupportRadius', offset: 88},
      {name: 'kernel2DSize', offset: 92},
      {name: 'maxScreenSpaceSplatSize', offset: 96},
      {name: 'exposure', offset: 100},
      {name: 'toneMapping', offset: 104},
      {name: 'batchOffset', offset: 108},
      {name: 'rowCount', offset: 112},
      {name: 'isFloatColor', offset: 116}
    ]);
  }

  void 0;
});

it('GPU Gaussian projection stays within guaranteed WebGPU storage binding limits', () => {
  const projection = new WgslReflect(GPU_SPLAT_PROJECTION_SHADER);
  expect(projection.storage.length, 'projection consumes exactly eight storage buffers').toBe(8);
  expect(
    projection.storage.map(resource => ({name: resource.name, location: resource.binding})),
    'source columns and renderer-owned derived outputs match declared binding order'
  ).toEqual(
    GPU_SPLAT_PROJECTION_SHADER_LAYOUT.bindings
      .filter(binding => binding.type !== 'uniform')
      .map(binding => ({name: binding.name, location: binding.location}))
  );
  expect(projection.uniforms[0]?.binding, 'per-batch camera uniforms use binding eight').toBe(8);
  expect(
    projection.storage.find(resource => resource.name === 'projectedRecords')?.stride,
    'camera-projected records have a tightly packed 48-byte storage stride'
  ).toBe(GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH);

  const render = new WgslReflect(GPU_SPLAT_RENDER_SHADER);
  expect(
    [
      ...render.uniforms.map(resource => ({name: resource.name, location: resource.binding})),
      ...render.storage.map(resource => ({name: resource.name, location: resource.binding}))
    ],
    'one draw consumes only camera uniforms, projected records, and globally sorted IDs'
  ).toEqual(
    GPU_SPLAT_RENDER_SHADER_LAYOUT.bindings.map(binding => ({
      name: binding.name,
      location: binding.location
    }))
  );
  void 0;
});

it('GPU Gaussian enhancement evaluates harmonics and semantic filters within WebGPU limits', () => {
  const feature = new WgslReflect(GPU_SPLAT_FEATURE_SHADER);
  expect(feature.storage.length, 'directional radiance and semantics need only seven buffers').toBe(
    7
  );
  expect(
    feature.storage.map(resource => ({name: resource.name, location: resource.binding})),
    'borrows separate source-owned coefficient and semantic buffers without packing source rows'
  ).toEqual(
    GPU_SPLAT_FEATURE_SHADER_LAYOUT.bindings
      .filter(binding => binding.type !== 'uniform')
      .map(binding => ({name: binding.name, location: binding.location}))
  );
  const featureUniforms = feature.uniforms.find(uniform => uniform.name === 'featureUniforms');
  expect(
    featureUniforms?.size,
    'keeps optional view-dependent feature controls in one compact 48-byte uniform'
  ).toBe(GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH);
  expect(
    featureUniforms?.members?.map(member => ({name: member.name, offset: member.offset})),
    'retains source-local coefficient strides and complete semantic-selection metadata'
  ).toEqual([
    {name: 'cameraPosition', offset: 0},
    {name: 'sphericalHarmonicsDegree', offset: 12},
    {name: 'sphericalHarmonicsStride', offset: 16},
    {name: 'hasSemanticIds', offset: 20},
    {name: 'includeCount', offset: 24},
    {name: 'excludeCount', offset: 28},
    {name: 'hasIncludeSelection', offset: 32},
    {name: 'includeUnlabeled', offset: 36},
    {name: 'semanticFilterActive', offset: 40},
    {name: 'padding', offset: 44}
  ]);
  expect(
    GPU_SPLAT_FEATURE_SHADER,
    'removes filtered rows from the existing GPU-owned indirect draw count'
  ).toMatch(/atomicSub\(&drawCommands\[1u\],\s*1u\)/);
  expect(
    GPU_SPLAT_FEATURE_SHADER,
    'moves rejected semantic rows behind globally sorted visible Gaussian projections'
  ).toMatch(/depthKeys\[projectedRowIndex\]\s*=\s*INVALID_FEATURE_DEPTH_KEY/);
  expect(
    GPU_SPLAT_FEATURE_SHADER,
    'evaluates every Khronos/GraphDECO spherical-harmonic basis through degree three'
  ).toMatch(/case 14u:[\s\S]*?-0\.5900435899266435/);
  void 0;
});

it('GPU Gaussian projection publishes stable 16-bit back-to-front visibility keys', () => {
  const maximumValidDepthKey = GPU_SPLAT_INVALID_DEPTH_KEY - 1;
  const getDepthKey = (clipDepth: number): number => {
    const normalizedDepth = Math.min(Math.max(clipDepth * 0.5 + 0.5, 0), 1);
    return maximumValidDepthKey - Math.round(normalizedDepth * maximumValidDepthKey);
  };

  expect(GPU_SPLAT_INVALID_DEPTH_KEY, 'culled rows use the final 16-bit sentinel').toBe(0xffff);
  expect(getDepthKey(1), 'farthest visible rows sort first').toBe(0);
  expect(getDepthKey(-1), 'nearest visible rows sort last').toBe(maximumValidDepthKey);
  expect(
    Boolean(getDepthKey(0.75) < getDepthKey(-0.75)),
    'ascending keys retain back-to-front blending'
  ).toBe(true);
  expect(
    Boolean(getDepthKey(-1) < GPU_SPLAT_INVALID_DEPTH_KEY),
    'visible rows never collide with the culled sentinel'
  ).toBe(true);
  expect(
    GPU_SPLAT_PROJECTION_SHADER,
    'projection writes descending depth as an ascending 16-bit key'
  ).toMatch(/depthKeys\[projectedRowIndex\]\s*=\s*MAXIMUM_VALID_DEPTH_KEY\s*-\s*quantizedDepth/);
  expect(
    GPU_SPLAT_PROJECTION_SHADER,
    'visible rows increment the indirect draw instance-count word'
  ).toMatch(/atomicAdd\(&drawCommands\[1u\],\s*1u\)/);
  void 0;
});

it('GPU Gaussian shaders preserve rotated anisotropic HDR source data', () => {
  expect(
    GPU_SPLAT_PROJECTION_SHADER,
    'Float32 source radiance is decoded without normalization or clamping'
  ).toMatch(/graphUniforms\.isFloatColor\s*!=\s*0u[\s\S]*?bitcast<f32>\(colors\[colorIndex\]\)/);
  expect(GPU_SPLAT_PROJECTION_SHADER, 'packed RGBA8 source colors retain normalized alpha').toMatch(
    /packedColor\s*>>\s*24u[\s\S]*?\/\s*255\.0/
  );
  expect(
    GPU_SPLAT_PROJECTION_SHADER,
    'anisotropic covariance preserves source quaternion rotation'
  ).toMatch(/getProjectedRotation\(rotations\[batchRowIndex\]\)/);
  expect(
    GPU_SPLAT_PROJECTION_SHADER,
    'conservative screen culling retains the complete oriented Gaussian support'
  ).toMatch(/let screenExtent\s*=\s*abs\(axis0\)\s*\+\s*abs\(axis1\)/);
  expect(
    GPU_SPLAT_RENDER_SHADER,
    'projected rendering retains optional Reinhard HDR display mapping'
  ).toMatch(/linearColor\s*\/\s*\(vec3<f32>\(1\.0\)\s*\+\s*linearColor\)/);
  expect(
    new WgslReflect(GPU_SPLAT_RENDER_SHADER).entry.vertex.map(entry => entry.name),
    'projected render shader exposes one instanced vertex entry point'
  ).toEqual(['vertexMain']);
  expect(
    new WgslReflect(GPU_SPLAT_RENDER_SHADER).entry.fragment.map(entry => entry.name),
    'projected render shader exposes one Gaussian fragment entry point'
  ).toEqual(['fragmentMain']);
  void 0;
});
