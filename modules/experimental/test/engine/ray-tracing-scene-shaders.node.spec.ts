// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {
  RAY_TRACING_BOUNDS_SHADER,
  RAY_TRACING_SCENE_SHADER
} from '../../src/engine/ray-tracing-scene-shaders';

describe('graph-accelerated ray tracing shaders', () => {
  test('publishes affine world-space bounds through one bounded compute pass', () => {
    const reflection = new WgslReflect(RAY_TRACING_BOUNDS_SHADER);

    expect(reflection.entry.compute.map(entry => entry.name)).toEqual(['main']);
    expect(reflection.uniforms.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'uniforms', binding: 0}
    ]);
    expect(reflection.uniforms[0].size).toBe(160);
    expect(reflection.storage.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'primitives', binding: 1},
      {name: 'primitiveMinima', binding: 2},
      {name: 'primitiveMaxima', binding: 3}
    ]);
    expect(reflection.uniforms.length + reflection.storage.length).toBe(4);
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('@workgroup_size(128)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('length(firstRow)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('length(secondRow)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('length(thirdRow)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain(
      'primitiveMaxima[componentIndex + axis] = -INVALID_BOUND'
    );
  });

  test('keeps ray traversal below the WebGPU core storage-binding limit', () => {
    const reflection = new WgslReflect(RAY_TRACING_SCENE_SHADER);
    const storageBuffers = reflection.storage.filter(({name}) => name !== 'outputImage');

    expect(reflection.entry.compute.map(entry => entry.name)).toEqual(['main']);
    expect(reflection.uniforms.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'uniforms', binding: 0}
    ]);
    expect(reflection.uniforms[0].size).toBe(160);
    expect(storageBuffers.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'primitives', binding: 1},
      {name: 'triangles', binding: 2},
      {name: 'lights', binding: 3},
      {name: 'nodeMinima', binding: 4},
      {name: 'nodeMaxima', binding: 5}
    ]);
    expect(storageBuffers).toHaveLength(5);
    expect(reflection.storage.find(({name}) => name === 'outputImage')?.binding).toBe(7);
    expect(
      reflection.uniforms.length + reflection.storage.length + reflection.textures.length
    ).toBe(8);
    expect(RAY_TRACING_SCENE_SHADER).toContain('@workgroup_size(8, 8, 1)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(6) var historyImage');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(7) var outputImage');
    expect(RAY_TRACING_SCENE_SHADER).toContain('acceleration: vec4<u32>');
  });

  test('traverses implicit BVH children and terminates shadow rays on the first hit', () => {
    expect(RAY_TRACING_SCENE_SHADER).toContain('let leftNode = nodeIndex * 2u + 1u');
    expect(RAY_TRACING_SCENE_SHADER).toContain('nodeIndex - uniforms.acceleration.x');
    expect(RAY_TRACING_SCENE_SHADER).toContain('abs(direction) < 0.0000001');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let nearerDistance = min(leftDistance, rightDistance)'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'fn intersectsScene(ray: Ray, maximumDistance: f32) -> bool'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain('if (intersectsScene(shadowRay, shadowDistance))');
    expect(RAY_TRACING_SCENE_SHADER).not.toContain(
      'for (var primitiveIndex = 0u; primitiveIndex < uniforms.dimensions.z; primitiveIndex++)'
    );
  });
});
