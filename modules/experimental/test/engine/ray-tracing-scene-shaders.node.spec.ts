// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {
  getRayTracingScenePresentationShader,
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
    expect(reflection.uniforms[0].size).toBe(272);
    expect(reflection.uniforms[0].members?.map(({name, offset}) => ({name, offset}))).toEqual([
      {name: 'inverseViewProjection', offset: 0},
      {name: 'cameraPosition', offset: 64},
      {name: 'background', offset: 80},
      {name: 'dimensions', offset: 96},
      {name: 'settings', offset: 112},
      {name: 'fog', offset: 128},
      {name: 'acceleration', offset: 144},
      {name: 'displayPhase', offset: 160},
      {name: 'temporal', offset: 176},
      {name: 'previousViewProjection', offset: 192},
      {name: 'previousCameraPosition', offset: 256}
    ]);
    expect(reflection.storage.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'primitives', binding: 1},
      {name: 'primitiveMinima', binding: 2},
      {name: 'primitiveMaxima', binding: 3},
      {name: 'blasNodes', binding: 4}
    ]);
    expect(reflection.storage[0].format?.size).toBe(272);
    expect(reflection.storage.find(({name}) => name === 'blasNodes')?.format?.size).toBe(32);
    expect(reflection.uniforms.length + reflection.storage.length).toBe(5);
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('@workgroup_size(128)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('length(firstRow)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('length(secondRow)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('length(thirdRow)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('let rootNode = blasNodes[u32(primitive.blas.x)]');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('dot(abs(firstRow), localExtent)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('dot(abs(secondRow), localExtent)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('dot(abs(thirdRow), localExtent)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain('select(sphereExtent, meshExtent, usesMeshBounds)');
    expect(RAY_TRACING_BOUNDS_SHADER).toContain(
      'primitiveMaxima[componentIndex + axis] = -INVALID_BOUND'
    );
  });

  test('uses the WebGPU core storage-buffer budget exactly', () => {
    const reflection = new WgslReflect(RAY_TRACING_SCENE_SHADER);
    const storageBuffers = reflection.storage.filter(
      ({name}) => name !== 'outputImage' && name !== 'outputMetadata'
    );

    expect(reflection.entry.compute.map(entry => entry.name)).toEqual(['main']);
    expect(reflection.uniforms.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'uniforms', binding: 0}
    ]);
    expect(reflection.uniforms[0].size).toBe(272);
    expect(storageBuffers.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'primitives', binding: 1},
      {name: 'triangles', binding: 2},
      {name: 'lights', binding: 3},
      {name: 'nodeMinima', binding: 4},
      {name: 'nodeMaxima', binding: 5},
      {name: 'leafPrimitiveIds', binding: 6},
      {name: 'blasNodes', binding: 7},
      {name: 'blasTriangleIds', binding: 8}
    ]);
    expect(storageBuffers).toHaveLength(8);
    expect(storageBuffers[0].format?.size).toBe(272);
    expect(storageBuffers.find(({name}) => name === 'blasNodes')?.format?.size).toBe(32);
    expect(reflection.storage.find(({name}) => name === 'outputImage')?.binding).toBe(11);
    expect(reflection.storage.find(({name}) => name === 'outputMetadata')?.binding).toBe(12);
    expect(reflection.textures.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'historyImage', binding: 9},
      {name: 'historyMetadata', binding: 10}
    ]);
    expect(
      reflection.uniforms.length + reflection.storage.length + reflection.textures.length
    ).toBe(13);
    expect(RAY_TRACING_SCENE_SHADER).toContain('@workgroup_size(8, 8, 1)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(6) var<storage, read> leafPrimitiveIds');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(7) var<storage, read> blasNodes');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(8) var<storage, read> blasTriangleIds');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(9) var historyImage');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(10) var historyMetadata');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(11) var outputImage');
    expect(RAY_TRACING_SCENE_SHADER).toContain('@binding(12) var outputMetadata');
    expect(RAY_TRACING_SCENE_SHADER).toContain('acceleration: vec4<u32>');
    expect(RAY_TRACING_SCENE_SHADER).toContain('blas: vec4<f32>');
    expect(RAY_TRACING_SCENE_SHADER).toContain('previousTransform: mat4x4<f32>');
  });

  test('traverses implicit BVH children and terminates shadow rays on the first hit', () => {
    expect(RAY_TRACING_SCENE_SHADER).toContain('let leftNode = nodeIndex * 2u + 1u');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let leafIndex = nodeIndex - uniforms.acceleration.x'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain('let primitiveIndex = leafPrimitiveIds[leafIndex]');
    expect(RAY_TRACING_SCENE_SHADER).toContain('primitiveIndex < uniforms.dimensions.z');
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

  test('traverses packed per-mesh BLAS nodes near-first for closest and shadow hits', () => {
    expect(RAY_TRACING_SCENE_SHADER).toContain('struct RayBlasNode');
    expect(RAY_TRACING_SCENE_SHADER).toContain('const BLAS_STACK_CAPACITY = 32u');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn intersectBlasNodeBounds');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let packedNodeStart = u32(primitive.blas.x)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let triangleIdStart = u32(primitive.blas.y)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let internalNodeCount = u32(primitive.blas.z)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let leafCapacity = u32(primitive.blas.w)');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let localTriangleIndex = blasTriangleIds[triangleIdStart + leafIndex]'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain('localTriangleIndex < triangleCount');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let triangleIndex = triangleStart + localTriangleIndex'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let nearerBlasDistance = min(leftBlasDistance, rightBlasDistance)'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let fartherBlasDistance = max(leftBlasDistance, rightBlasDistance)'
    );
    expect(RAY_TRACING_SCENE_SHADER).not.toContain(
      'for (var triangleIndex = triangleStart; triangleIndex < triangleEnd; triangleIndex++)'
    );
  });

  test('traces rotating sparse phases and bounds shadow-light sampling', () => {
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let phaseOffset = (uniforms.displayPhase.z + invocation.y) % phaseCount'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain('invocation.x * phaseCount + phaseOffset');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let requestedShadowSamples');
    expect(RAY_TRACING_SCENE_SHADER).toContain('requestedShadowSamples == 0u');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let rotatingLightOffset = uniforms.acceleration.w');
    expect(RAY_TRACING_SCENE_SHADER).toContain('rotatingLightIndex >= shadowSampleCount');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let lightSampleWeight');
  });

  test('uses a stable guide ray and low-discrepancy radiance samples', () => {
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn makeCameraRayAtOffset');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn makeRadianceSampleOffset');
    expect(RAY_TRACING_SCENE_SHADER).toContain('lowDiscrepancyOffset');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn makeGuideCameraRay');
    expect(RAY_TRACING_SCENE_SHADER).toContain('vec2<f32>(0.5)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let guideRay = makeGuideCameraRay(pixel)');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++)'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let historicalSample = getHistoricalRaySample(pixel, guideRay, guideHit, color)'
    );
  });

  test('reprojects bilinear per-instance radiance and rejects invalid history', () => {
    expect(RAY_TRACING_SCENE_SHADER).toContain('primitive.previousTransform * localHitPosition');
    expect(RAY_TRACING_SCENE_SHADER).toContain('uniforms.previousViewProjection');
    expect(RAY_TRACING_SCENE_SHADER).toContain('uniforms.previousCameraPosition.xyz');
    expect(RAY_TRACING_SCENE_SHADER).toContain('MINIMUM_HISTORY_NORMAL_ALIGNMENT');
    expect(RAY_TRACING_SCENE_SHADER).toContain('MAXIMUM_HISTORY_RELATIVE_DEPTH_DIFFERENCE');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn signNotZero');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn encodeRayNormal');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn decodeRayNormal');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn encodeRayPrimitiveIdentifier');
    expect(RAY_TRACING_SCENE_SHADER).toContain('expectedPrimitiveIdentifier');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'expectedPrimitiveIdentifier == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'historicalMetadata.a == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain('let topLeftWeight');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let topRightWeight');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let bottomLeftWeight');
    expect(RAY_TRACING_SCENE_SHADER).toContain('let bottomRightWeight');
    expect(RAY_TRACING_SCENE_SHADER).toContain('historicalColor / totalWeight');
    expect(RAY_TRACING_SCENE_SHADER).toContain('clampHistoricalRayColor');
    expect(RAY_TRACING_SCENE_SHADER).toContain('historicalColor.a');
    expect(RAY_TRACING_SCENE_SHADER).toContain('vec4<f32>(color, totalSampleCount)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('textureStore(outputMetadata');
  });

  test('manually reconstructs full-resolution HDR and SDR presentation without a sampler', () => {
    for (const highDynamicRange of [false, true]) {
      const presentationShader = getRayTracingScenePresentationShader(highDynamicRange);
      const reflection = new WgslReflect(presentationShader);

      expect(reflection.entry.vertex.map(({name}) => name)).toEqual(['vertexMain']);
      expect(reflection.entry.fragment.map(({name}) => name)).toEqual(['fragmentMain']);
      expect(reflection.textures.map(({name, binding}) => ({name, binding}))).toEqual([
        {name: 'image', binding: 0}
      ]);
      expect(reflection.uniforms).toHaveLength(0);
      expect(presentationShader).toContain('textureDimensions(image)');
      expect(presentationShader).toContain('let topLeft = textureLoad');
      expect(presentationShader).toContain('let topRight = textureLoad');
      expect(presentationShader).toContain('let bottomLeft = textureLoad');
      expect(presentationShader).toContain('let bottomRight = textureLoad');
      expect(presentationShader).toContain('vec4<f32>(radiance, 1.0)');
      expect(presentationShader).not.toContain('@binding(1)');
    }
  });
});
