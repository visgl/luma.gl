// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';
import {
  GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_INVALID_DEPTH_KEY,
  GPU_SPLAT_PROJECTION_SHADER,
  GPU_SPLAT_PROJECTION_SHADER_LAYOUT,
  GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
  GPU_SPLAT_RENDER_SHADER,
  GPU_SPLAT_RENDER_SHADER_LAYOUT
} from '../src/gpu-splat-graph-shaders';

test('GPU Gaussian shaders preserve the shared projected-record and uniform layouts', t => {
  const projection = new WgslReflect(GPU_SPLAT_PROJECTION_SHADER);
  const render = new WgslReflect(GPU_SPLAT_RENDER_SHADER);

  for (const [name, shader] of [
    ['projection', projection],
    ['render', render]
  ] as const) {
    const projectedRecord = shader.structs.find(struct => struct.name === 'ProjectedSplat');
    t.ok(projectedRecord, `${name}: projected record is reflected`);
    t.equal(projectedRecord?.size, GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH, `${name}: stride is 48`);
    t.deepEqual(
      projectedRecord?.members.map(member => ({name: member.name, offset: member.offset})),
      [
        {name: 'clipCenter', offset: 0},
        {name: 'axis0', offset: 16},
        {name: 'axis1', offset: 24},
        {name: 'color', offset: 32}
      ],
      `${name}: projected record retains center, anisotropic axes, and Float32 HDR color`
    );

    const graphUniforms = shader.uniforms.find(uniform => uniform.name === 'graphUniforms');
    t.equal(graphUniforms?.size, GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH, `${name}: uniforms are 128`);
    t.deepEqual(
      graphUniforms?.members?.map(member => ({name: member.name, offset: member.offset})),
      [
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
      ],
      `${name}: camera, styling, and preserved source-batch offsets are stable`
    );
  }

  t.end();
});

test('GPU Gaussian projection stays within guaranteed WebGPU storage binding limits', t => {
  const projection = new WgslReflect(GPU_SPLAT_PROJECTION_SHADER);
  t.equal(projection.storage.length, 8, 'projection consumes exactly eight storage buffers');
  t.deepEqual(
    projection.storage.map(resource => ({name: resource.name, location: resource.binding})),
    GPU_SPLAT_PROJECTION_SHADER_LAYOUT.bindings
      .filter(binding => binding.type !== 'uniform')
      .map(binding => ({name: binding.name, location: binding.location})),
    'source columns and renderer-owned derived outputs match declared binding order'
  );
  t.equal(projection.uniforms[0]?.binding, 8, 'per-batch camera uniforms use binding eight');
  t.equal(
    projection.storage.find(resource => resource.name === 'projectedRecords')?.stride,
    GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
    'camera-projected records have a tightly packed 48-byte storage stride'
  );

  const render = new WgslReflect(GPU_SPLAT_RENDER_SHADER);
  t.deepEqual(
    [
      ...render.uniforms.map(resource => ({name: resource.name, location: resource.binding})),
      ...render.storage.map(resource => ({name: resource.name, location: resource.binding}))
    ],
    GPU_SPLAT_RENDER_SHADER_LAYOUT.bindings.map(binding => ({
      name: binding.name,
      location: binding.location
    })),
    'one draw consumes only camera uniforms, projected records, and globally sorted IDs'
  );
  t.end();
});

test('GPU Gaussian projection publishes stable 16-bit back-to-front visibility keys', t => {
  const maximumValidDepthKey = GPU_SPLAT_INVALID_DEPTH_KEY - 1;
  const getDepthKey = (clipDepth: number): number => {
    const normalizedDepth = Math.min(Math.max(clipDepth * 0.5 + 0.5, 0), 1);
    return maximumValidDepthKey - Math.round(normalizedDepth * maximumValidDepthKey);
  };

  t.equal(GPU_SPLAT_INVALID_DEPTH_KEY, 0xffff, 'culled rows use the final 16-bit sentinel');
  t.equal(getDepthKey(1), 0, 'farthest visible rows sort first');
  t.equal(getDepthKey(-1), maximumValidDepthKey, 'nearest visible rows sort last');
  t.ok(getDepthKey(0.75) < getDepthKey(-0.75), 'ascending keys retain back-to-front blending');
  t.ok(
    getDepthKey(-1) < GPU_SPLAT_INVALID_DEPTH_KEY,
    'visible rows never collide with the culled sentinel'
  );
  t.match(
    GPU_SPLAT_PROJECTION_SHADER,
    /depthKeys\[projectedRowIndex\]\s*=\s*MAXIMUM_VALID_DEPTH_KEY\s*-\s*quantizedDepth/,
    'projection writes descending depth as an ascending 16-bit key'
  );
  t.match(
    GPU_SPLAT_PROJECTION_SHADER,
    /atomicAdd\(&drawCommands\[1u\],\s*1u\)/,
    'visible rows increment the indirect draw instance-count word'
  );
  t.end();
});

test('GPU Gaussian shaders preserve rotated anisotropic HDR source data', t => {
  t.match(
    GPU_SPLAT_PROJECTION_SHADER,
    /graphUniforms\.isFloatColor\s*!=\s*0u[\s\S]*?bitcast<f32>\(colors\[colorIndex\]\)/,
    'Float32 source radiance is decoded without normalization or clamping'
  );
  t.match(
    GPU_SPLAT_PROJECTION_SHADER,
    /packedColor\s*>>\s*24u[\s\S]*?\/\s*255\.0/,
    'packed RGBA8 source colors retain normalized alpha'
  );
  t.match(
    GPU_SPLAT_PROJECTION_SHADER,
    /getProjectedRotation\(rotations\[batchRowIndex\]\)/,
    'anisotropic covariance preserves source quaternion rotation'
  );
  t.match(
    GPU_SPLAT_PROJECTION_SHADER,
    /let screenExtent\s*=\s*abs\(axis0\)\s*\+\s*abs\(axis1\)/,
    'conservative screen culling retains the complete oriented Gaussian support'
  );
  t.match(
    GPU_SPLAT_RENDER_SHADER,
    /linearColor\s*\/\s*\(vec3<f32>\(1\.0\)\s*\+\s*linearColor\)/,
    'projected rendering retains optional Reinhard HDR display mapping'
  );
  t.deepEqual(
    new WgslReflect(GPU_SPLAT_RENDER_SHADER).entry.vertex.map(entry => entry.name),
    ['vertexMain'],
    'projected render shader exposes one instanced vertex entry point'
  );
  t.deepEqual(
    new WgslReflect(GPU_SPLAT_RENDER_SHADER).entry.fragment.map(entry => entry.name),
    ['fragmentMain'],
    'projected render shader exposes one Gaussian fragment entry point'
  );
  t.end();
});
