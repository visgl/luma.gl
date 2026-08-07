// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {
  getRayTracingScenePresentationShader,
  RAY_TRACING_BOUNDS_SHADER,
  RAY_TRACING_HISTORY_CARRY_SHADER,
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

  test('carries only untouched sparse-phase history through CORE-compatible texture bindings', () => {
    const reflection = new WgslReflect(RAY_TRACING_HISTORY_CARRY_SHADER);

    expect(reflection.entry.compute.map(entry => entry.name)).toEqual(['main']);
    expect(reflection.uniforms.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'uniforms', binding: 0}
    ]);
    expect(reflection.uniforms[0].size).toBe(272);
    expect(reflection.textures.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'historyImage', binding: 1},
      {name: 'historyMetadata', binding: 2}
    ]);
    expect(reflection.storage.map(({name, binding}) => ({name, binding}))).toEqual([
      {name: 'outputImage', binding: 3},
      {name: 'outputMetadata', binding: 4}
    ]);
    expect(RAY_TRACING_HISTORY_CARRY_SHADER).toContain('@workgroup_size(8, 8, 1)');
    expect(RAY_TRACING_HISTORY_CARRY_SHADER).toContain('phaseCount <= 1u');
    expect(RAY_TRACING_HISTORY_CARRY_SHADER).toContain(
      '(uniforms.displayPhase.z + invocation.y) % phaseCount'
    );
    expect(RAY_TRACING_HISTORY_CARRY_SHADER).toContain(
      'blockIndex * phaseCount + laneIndex + select(0u, 1u, laneIndex >= selectedPhase)'
    );
    expect(RAY_TRACING_HISTORY_CARRY_SHADER).toContain(
      'textureStore(outputImage, pixel, textureLoad(historyImage, pixel, 0))'
    );
    expect(RAY_TRACING_HISTORY_CARRY_SHADER).toContain(
      'textureStore(outputMetadata, pixel, textureLoad(historyMetadata, pixel, 0))'
    );
  });

  test('compacts every untouched phase for odd widths and row-varying selected pixels', () => {
    for (const width of [1, 2, 3, 5, 7, 8, 9, 15, 17, 31]) {
      for (const phaseCount of [2, 3, 4, 5]) {
        const compactWidth = Math.ceil((width * (phaseCount - 1)) / phaseCount);
        for (let phaseIndex = 0; phaseIndex < phaseCount; phaseIndex++) {
          for (let row = 0; row < 8; row++) {
            const selectedPhase = (phaseIndex + row) % phaseCount;
            const actualPixels = Array.from({length: compactWidth}, (_, invocation) => {
              const blockIndex = Math.floor(invocation / (phaseCount - 1));
              const laneIndex = invocation % (phaseCount - 1);
              return blockIndex * phaseCount + laneIndex + Number(laneIndex >= selectedPhase);
            }).filter(pixel => pixel < width);
            const expectedPixels = Array.from({length: width}, (_, pixel) => pixel).filter(
              pixel => pixel % phaseCount !== selectedPhase
            );

            expect(actualPixels).toEqual(expectedPixels);
          }
        }
      }
    }
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

  test('caches guarded inverse ray directions and pending BVH child-entry distances', () => {
    expect(RAY_TRACING_SCENE_SHADER).toContain('struct PendingRayNode');
    expect(RAY_TRACING_SCENE_SHADER).toContain('entryDistance: f32');
    expect(RAY_TRACING_SCENE_SHADER).toContain('fn makeInverseRayDirection');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let parallelAxes = abs(direction) < vec3<f32>(0.0000001)'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'let safeDirection = select(direction, vec3<f32>(1.0), parallelAxes)'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain('vec3<f32>(1.0) / safeDirection');
    expect(RAY_TRACING_SCENE_SHADER).toContain('(minimum - origin) * inverseDirection[axis]');
    expect(RAY_TRACING_SCENE_SHADER).toContain('(maximum - origin) * inverseDirection[axis]');
    expect(RAY_TRACING_SCENE_SHADER).not.toContain('(minimum - origin) / direction');
    expect(RAY_TRACING_SCENE_SHADER).not.toContain('(maximum - origin) / direction');
    expect(
      RAY_TRACING_SCENE_SHADER.match(
        /let inverseDirection = makeInverseRayDirection\(ray\.direction\);/g
      )
    ).toHaveLength(2);
    expect(
      RAY_TRACING_SCENE_SHADER.match(
        /let inverseLocalDirection = makeInverseRayDirection\(localDirection\);/g
      )
    ).toHaveLength(2);
    expect(
      RAY_TRACING_SCENE_SHADER.match(
        /var pendingNodes: array<PendingRayNode, BVH_STACK_CAPACITY>;/g
      )
    ).toHaveLength(2);
    expect(
      RAY_TRACING_SCENE_SHADER.match(
        /var pendingBlasNodes: array<PendingRayNode, BLAS_STACK_CAPACITY>;/g
      )
    ).toHaveLength(2);
    expect(RAY_TRACING_SCENE_SHADER).toContain('PendingRayNode(fartherNode, fartherDistance)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('PendingRayNode(nearerNode, nearerDistance)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('PendingRayNode(fartherNode, fartherBlasDistance)');
    expect(RAY_TRACING_SCENE_SHADER).toContain('PendingRayNode(nearerNode, nearerBlasDistance)');
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'if (pendingNode.entryDistance >= closestHit.distance)'
    );
    expect(RAY_TRACING_SCENE_SHADER).toContain(
      'if (pendingBlasNode.entryDistance >= closestHit.distance)'
    );
    expect(RAY_TRACING_SCENE_SHADER.match(/if \(pendingNode\.entryDistance >= /g)).toHaveLength(2);
    expect(RAY_TRACING_SCENE_SHADER.match(/if \(pendingBlasNode\.entryDistance >= /g)).toHaveLength(
      2
    );
    expect(
      RAY_TRACING_SCENE_SHADER.match(/pendingNodes\[0\] = PendingRayNode\(0u, rootDistance\);/g)
    ).toHaveLength(2);
    expect(
      RAY_TRACING_SCENE_SHADER.match(
        /pendingBlasNodes\[0\] = PendingRayNode\(0u, rootBlasDistance\);/g
      )
    ).toHaveLength(2);
  });

  test('preserves slab intersections for zero, parallel, reversed, and clipped ray directions', () => {
    const infinity = 1e20;
    const epsilon = 0.0005;
    const minimumDirectionMagnitude = 0.0000001;
    const minimum = [-1, -1, -1];
    const maximum = [1, 1, 1];

    function getEntryDistance(
      origin: number[],
      direction: number[],
      minimumBounds: number[],
      maximumBounds: number[],
      maximumDistance: number,
      useCachedInverse: boolean
    ): number {
      const inverseDirection = direction.map(component =>
        Math.abs(component) < minimumDirectionMagnitude ? 1 : 1 / component
      );
      expect(inverseDirection.every(Number.isFinite)).toBe(true);

      let nearestDistance = 0;
      let farthestDistance = maximumDistance;
      for (let axis = 0; axis < 3; axis++) {
        if (minimumBounds[axis] > maximumBounds[axis]) {
          return infinity;
        }
        if (Math.abs(direction[axis]) < minimumDirectionMagnitude) {
          if (origin[axis] < minimumBounds[axis] || origin[axis] > maximumBounds[axis]) {
            return infinity;
          }
          continue;
        }

        const firstDistance = useCachedInverse
          ? (minimumBounds[axis] - origin[axis]) * inverseDirection[axis]
          : (minimumBounds[axis] - origin[axis]) / direction[axis];
        const secondDistance = useCachedInverse
          ? (maximumBounds[axis] - origin[axis]) * inverseDirection[axis]
          : (maximumBounds[axis] - origin[axis]) / direction[axis];
        nearestDistance = Math.max(nearestDistance, Math.min(firstDistance, secondDistance));
        farthestDistance = Math.min(farthestDistance, Math.max(firstDistance, secondDistance));
        if (nearestDistance > farthestDistance) {
          return infinity;
        }
      }

      return farthestDistance <= epsilon || nearestDistance >= maximumDistance
        ? infinity
        : nearestDistance;
    }

    const rays = [
      {origin: [0, 0, -2], direction: [0, -0, 1], maximumDistance: 10},
      {origin: [1, -1, -2], direction: [0, 0, 1], maximumDistance: 10},
      {origin: [1.01, 0, -2], direction: [0, 0, 1], maximumDistance: 10},
      {origin: [1.01, 0, -2], direction: [0.00000001, 0, 1], maximumDistance: 10},
      {origin: [0, 0, -2], direction: [0.0000001, -0.0000001, 1], maximumDistance: 10},
      {origin: [0, 0, 2], direction: [-0, 0.00000001, -1], maximumDistance: 10},
      {origin: [0, 0, -2], direction: [0, 0, 1], maximumDistance: 0.5},
      {origin: [0, 0, 1], direction: [0, 0, 1], maximumDistance: 10},
      {origin: [0, 0, 0], direction: [0, 0, 1], maximumDistance: 0.0001}
    ];

    for (const ray of rays) {
      const originalDistance = getEntryDistance(
        ray.origin,
        ray.direction,
        minimum,
        maximum,
        ray.maximumDistance,
        false
      );
      const cachedDistance = getEntryDistance(
        ray.origin,
        ray.direction,
        minimum,
        maximum,
        ray.maximumDistance,
        true
      );

      expect(cachedDistance).toBeCloseTo(originalDistance, 10);
    }

    expect(getEntryDistance([0, 0, -2], [0, 0, 1], [2, -1, -1], maximum, 10, true)).toBe(infinity);
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

    expect(RAY_TRACING_SCENE_SHADER).not.toContain('fn intersectsBounds(');
    expect(RAY_TRACING_SCENE_SHADER).not.toContain('intersectsBounds(');
    expect(
      RAY_TRACING_SCENE_SHADER.match(/intersectSphere\(localRay, sphereRadius, /g)
    ).toHaveLength(2);

    for (const functionName of ['intersectPrimitive', 'intersectsPrimitive']) {
      const functionStart = RAY_TRACING_SCENE_SHADER.indexOf(`fn ${functionName}(`);
      const functionEnd = RAY_TRACING_SCENE_SHADER.indexOf('\nfn ', functionStart + 1);
      const functionSource = RAY_TRACING_SCENE_SHADER.slice(functionStart, functionEnd);
      const sphereBranch = functionSource.indexOf('if (sphereRadius > 0.0)');
      const sphereIntersection = functionSource.indexOf('intersectSphere(localRay, sphereRadius, ');
      const meshBounds = functionSource.indexOf('let rootBlasDistance =');

      expect(sphereBranch).toBeGreaterThan(0);
      expect(sphereIntersection).toBeGreaterThan(sphereBranch);
      expect(meshBounds).toBeGreaterThan(sphereIntersection);
      expect(functionSource.match(/intersectSphere\(localRay, sphereRadius, /g)).toHaveLength(1);
    }
  });

  test('preserves analytic sphere hits without repeating the same bounding-sphere quadratic', () => {
    const epsilon = 0.0005;
    const infinity = 1e20;

    function intersectSphere(
      origin: readonly number[],
      direction: readonly number[],
      radius: number,
      maximumDistance: number
    ): number {
      const directionLength = direction.reduce((sum, component) => sum + component ** 2, 0);
      const halfProjection = origin.reduce(
        (sum, component, index) => sum + component * direction[index],
        0
      );
      const originLength = origin.reduce((sum, component) => sum + component ** 2, 0);
      const discriminant = halfProjection ** 2 - directionLength * (originLength - radius ** 2);
      if (discriminant < 0) {
        return infinity;
      }

      const root = Math.sqrt(discriminant);
      const firstDistance = (-halfProjection - root) / directionLength;
      const secondDistance = (-halfProjection + root) / directionLength;
      const distance = firstDistance > epsilon ? firstDistance : secondDistance;
      return distance > epsilon && distance < maximumDistance ? distance : infinity;
    }

    function intersectsCoarseBounds(
      origin: readonly number[],
      direction: readonly number[],
      radius: number,
      maximumDistance: number
    ): boolean {
      const directionLength = direction.reduce((sum, component) => sum + component ** 2, 0);
      const halfProjection = origin.reduce(
        (sum, component, index) => sum + component * direction[index],
        0
      );
      const originLength = origin.reduce((sum, component) => sum + component ** 2, 0);
      const discriminant = halfProjection ** 2 - directionLength * (originLength - radius ** 2);
      if (discriminant < 0) {
        return false;
      }

      const root = Math.sqrt(discriminant);
      return (
        (-halfProjection + root) / directionLength > epsilon &&
        (-halfProjection - root) / directionLength < maximumDistance
      );
    }

    const rays = [
      {origin: [0, 0, -3], direction: [0, 0, 1], radius: 1, maximumDistance: 10},
      {origin: [0, 0, 0], direction: [0, 0, 2], radius: 1, maximumDistance: 10},
      {origin: [1, 0, -3], direction: [0, 0, 1], radius: 1, maximumDistance: 10},
      {origin: [1.001, 0, -3], direction: [0, 0, 1], radius: 1, maximumDistance: 10},
      {origin: [0, 0, -3], direction: [0, 0, -1], radius: 1, maximumDistance: 10},
      {origin: [0, 0, -3], direction: [0, 0, 1], radius: 1, maximumDistance: 1.5},
      {origin: [0, 0, 1], direction: [0, 0, 1], radius: 1, maximumDistance: 10},
      {origin: [0.25, -0.1, 2], direction: [0.1, 0.05, -2], radius: 0.75, maximumDistance: 5}
    ];

    for (const ray of rays) {
      const directDistance = intersectSphere(
        ray.origin,
        ray.direction,
        ray.radius,
        ray.maximumDistance
      );
      const guardedDistance = intersectsCoarseBounds(
        ray.origin,
        ray.direction,
        ray.radius,
        ray.maximumDistance
      )
        ? intersectSphere(ray.origin, ray.direction, ray.radius, ray.maximumDistance)
        : infinity;

      expect(directDistance).toBe(guardedDistance);
    }
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

  test('uses CPU-counted direct lights and hoists invariant shading outside the light loop', () => {
    const functionStart = RAY_TRACING_SCENE_SHADER.indexOf('fn evaluateDirectLighting(');
    const functionEnd = RAY_TRACING_SCENE_SHADER.indexOf('\nfn ', functionStart + 1);
    const functionSource = RAY_TRACING_SCENE_SHADER.slice(functionStart, functionEnd);
    const loopStart = functionSource.indexOf(
      'for (var lightIndex = 0u; lightIndex < uniforms.dimensions.w; lightIndex++)'
    );

    expect(functionSource).toContain('let directLightCount = u32(max(uniforms.temporal.y, 0.0))');
    expect(functionSource).not.toContain('var directLightCount = 0u');
    expect(
      functionSource.match(
        /for \(var lightIndex = 0u; lightIndex < uniforms\.dimensions\.w; lightIndex\+\+\)/g
      )
    ).toHaveLength(1);
    for (const invariant of [
      'let dielectricReflectance = vec3<f32>(0.04)',
      'let reflectance = mix(dielectricReflectance, baseColor, metallic)',
      'let grazingReflectance = vec3<f32>(clamp(maximumReflectance * 25.0, 0.0, 1.0))',
      'let alphaRoughness = roughness * roughness',
      'let alphaRoughnessSquared = alphaRoughness * alphaRoughness',
      'let diffuse = baseColor * (vec3<f32>(1.0) - dielectricReflectance)',
      'let normalView = clamp(abs(dot(normal, viewDirection)), 0.001, 1.0)',
      'let lightSampleWeight = f32(directLightCount) / f32(max(shadowSampleCount, 1u))'
    ]) {
      const invariantIndex = functionSource.indexOf(invariant);
      expect(invariantIndex).toBeGreaterThan(0);
      expect(invariantIndex).toBeLessThan(loopStart);
    }

    const pointLightBranch = functionSource.indexOf('if (lightType >= 2u)');
    const directionalNormalization = functionSource.indexOf(
      'lightDirection = normalize(-light.directionType.xyz)'
    );
    expect(functionSource).toContain('var lightDirection = vec3<f32>(0.0)');
    expect(pointLightBranch).toBeGreaterThan(loopStart);
    expect(directionalNormalization).toBeGreaterThan(pointLightBranch);
    expect(functionSource.match(/normalize\(-light\.directionType\.xyz\)/g)).toHaveLength(1);
  });

  test('matches canonical energy-balanced GGX, Smith visibility, and Schlick Fresnel', () => {
    const functionStart = RAY_TRACING_SCENE_SHADER.indexOf('fn evaluateDirectLighting(');
    const functionEnd = RAY_TRACING_SCENE_SHADER.indexOf('\nfn ', functionStart + 1);
    const functionSource = RAY_TRACING_SCENE_SHADER.slice(functionStart, functionEnd);

    expect(functionSource).toContain('let roughness = clamp(primitive.properties.x, 0.04, 1.0)');
    expect(functionSource).toContain('let metallic = clamp(primitive.emissive.w, 0.0, 1.0)');
    expect(functionSource).toContain(
      'let maximumReflectance = max(reflectance.r, max(reflectance.g, reflectance.b))'
    );
    expect(functionSource).toContain('grazingReflectance - reflectance');
    expect(functionSource).toContain('pow(clamp(1.0 - viewHalf, 0.0, 1.0), 5.0)');
    expect(functionSource).toContain(
      '(normalHalf * alphaRoughnessSquared - normalHalf) * normalHalf + 1.0'
    );
    expect(functionSource).toContain(
      'alphaRoughnessSquared /\n      (PI * distributionDenominator * distributionDenominator)'
    );
    expect(functionSource).toContain('let lightVisibility = 2.0 * normalLight');
    expect(functionSource).toContain('let viewVisibility = 2.0 * normalView');
    expect(functionSource).toContain('let geometricOcclusion = lightVisibility * viewVisibility');
    expect(functionSource).toContain(
      'let diffuseContribution = (vec3<f32>(1.0) - fresnel) * diffuse'
    );
    expect(functionSource).toContain(
      'let specular = fresnel * geometricOcclusion * distribution /'
    );
    expect(functionSource).toContain('(4.0 * normalLight * normalView)');
    expect(functionSource).toContain('result += baseColor * lightColor');
    expect(functionSource).not.toContain('specularPower');
    expect(functionSource).not.toContain('pow(normalHalf,');
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

    const functionStart = RAY_TRACING_SCENE_SHADER.indexOf('fn makeCameraRayAtOffset(');
    const functionEnd = RAY_TRACING_SCENE_SHADER.indexOf('\nfn ', functionStart + 1);
    const cameraRaySource = RAY_TRACING_SCENE_SHADER.slice(functionStart, functionEnd);
    const orthographicBranch = cameraRaySource.indexOf('if (uniforms.cameraPosition.w > 0.5)');
    const farPoint = cameraRaySource.indexOf('let farPoint =');
    const nearPoint = cameraRaySource.indexOf('let nearPoint =');

    expect(cameraRaySource).toContain('var origin = uniforms.cameraPosition.xyz');
    expect(farPoint).toBeGreaterThan(0);
    expect(orthographicBranch).toBeGreaterThan(farPoint);
    expect(nearPoint).toBeGreaterThan(orthographicBranch);
    expect(cameraRaySource).not.toContain('let nearPosition =');
  });

  test('reuses the centered guide hit only for explicitly non-temporal single samples', () => {
    const mainStart = RAY_TRACING_SCENE_SHADER.indexOf('@compute @workgroup_size(8, 8, 1)');
    const mainSource = RAY_TRACING_SCENE_SHADER.slice(mainStart);
    const guideHitIndex = mainSource.indexOf(
      'let guideHit = intersectScene(guideRay, RAY_INFINITY)'
    );
    const stableGuardIndex = mainSource.indexOf('let useStableGuideSample = sampleCount == 1u');
    const loopIndex = mainSource.indexOf(
      'for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++)'
    );
    const reusedRayIndex = mainSource.indexOf('var ray = guideRay');
    const reusedHitIndex = mainSource.indexOf('var hit = guideHit');
    const jitterGuardIndex = mainSource.indexOf('if (!useStableGuideSample)');
    const jitteredRayIndex = mainSource.indexOf('ray = makeCameraRay(pixel, sampleIndex)');
    const tracedHitIndex = mainSource.indexOf('hit = intersectScene(ray, RAY_INFINITY)');

    expect(guideHitIndex).toBeGreaterThan(0);
    expect(stableGuardIndex).toBeGreaterThan(guideHitIndex);
    expect(mainSource).toContain('uniforms.previousCameraPosition.w < 0.5');
    expect(mainSource).toContain('uniforms.temporal.w < 0.5');
    expect(loopIndex).toBeGreaterThan(stableGuardIndex);
    expect(reusedRayIndex).toBeGreaterThan(loopIndex);
    expect(reusedHitIndex).toBeGreaterThan(reusedRayIndex);
    expect(jitterGuardIndex).toBeGreaterThan(reusedHitIndex);
    expect(jitteredRayIndex).toBeGreaterThan(jitterGuardIndex);
    expect(tracedHitIndex).toBeGreaterThan(jitteredRayIndex);
    expect(mainSource.match(/intersectScene\(/g)).toHaveLength(2);

    for (const [sampleCount, progressive, temporalReprojection, reusesGuide] of [
      [1, false, false, true],
      [1, true, false, false],
      [1, false, true, false],
      [1, true, true, false],
      [2, false, false, false],
      [16, false, false, false]
    ] as const) {
      expect(sampleCount === 1 && !progressive && !temporalReprojection).toBe(reusesGuide);
    }
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

  test('avoids loading bilinear temporal taps whose weights cannot affect the result', () => {
    for (const tapName of ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']) {
      const weightGuard = `if (${tapName}Weight > 0.0)`;
      const sampleLoad = `let ${tapName}Sample = loadHistoricalRaySample(`;
      const guardIndex = RAY_TRACING_SCENE_SHADER.indexOf(weightGuard);
      const sampleIndex = RAY_TRACING_SCENE_SHADER.indexOf(sampleLoad);

      expect(guardIndex).toBeGreaterThan(0);
      expect(sampleIndex).toBeGreaterThan(guardIndex);
    }

    const cases = [
      {fraction: [0, 0], expectedLoads: 1},
      {fraction: [0.25, 0], expectedLoads: 2},
      {fraction: [0, 0.75], expectedLoads: 2},
      {fraction: [0.25, 0.75], expectedLoads: 4}
    ];
    const samples = [
      {color: [0.2, 0.4, 0.6], count: 2},
      {color: [0.3, 0.5, 0.7], count: 5},
      {color: [0.4, 0.6, 0.8], count: 9},
      {color: [0.5, 0.7, 0.9], count: 12}
    ];

    for (const {fraction, expectedLoads} of cases) {
      const weights = [
        (1 - fraction[0]) * (1 - fraction[1]),
        fraction[0] * (1 - fraction[1]),
        (1 - fraction[0]) * fraction[1],
        fraction[0] * fraction[1]
      ];
      const originalColor = [0, 0, 0];
      const optimizedColor = [0, 0, 0];
      let originalCount = 0;
      let optimizedCount = 0;
      let optimizedLoads = 0;

      for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
        const sample = samples[sampleIndex];
        const weight = weights[sampleIndex];
        for (let colorIndex = 0; colorIndex < 3; colorIndex++) {
          originalColor[colorIndex] += sample.color[colorIndex] * weight;
        }
        originalCount += sample.count * weight;

        if (weight > 0) {
          optimizedLoads++;
          for (let colorIndex = 0; colorIndex < 3; colorIndex++) {
            optimizedColor[colorIndex] += sample.color[colorIndex] * weight;
          }
          optimizedCount += sample.count * weight;
        }
      }

      expect(optimizedLoads).toBe(expectedLoads);
      expect(optimizedColor).toEqual(originalColor);
      expect(optimizedCount).toBe(originalCount);
    }
  });

  test('manually reconstructs every canonical tone map and output encoding without new bindings', () => {
    for (const toneMapMode of [0, 1, 2, 3]) {
      for (const outputEncoding of [0, 1]) {
        const presentationShader = getRayTracingScenePresentationShader({
          toneMapMode,
          outputEncoding
        });
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
        expect(presentationShader).toContain(`if (${toneMapMode} == 1)`);
        expect(presentationShader).toContain(`if (${outputEncoding} == 0)`);
        expect(presentationShader).toContain('vec4<f32>(color, 1.0)');
        expect(presentationShader).not.toContain('@binding(1)');
      }
    }
  });

  test('uses the exact canonical Khronos Neutral, ACES, and linear-to-sRGB equations', () => {
    const presentationShader = getRayTracingScenePresentationShader({
      toneMapMode: 2,
      outputEncoding: 1
    });

    expect(presentationShader).toContain('fn toneMapRayTracingKhronosPBRNeutral(');
    expect(presentationShader).toContain('let startCompression = 0.76');
    expect(presentationShader).toContain('darkestChannel - 6.25 * darkestChannel * darkestChannel');
    expect(presentationShader).toContain('let compressedPeak = 1.0 - compressionRange');
    expect(presentationShader).toContain('0.15 * (peak - compressedPeak) + 1.0');
    expect(presentationShader).toContain('color /= vec3<f32>(1.0) + color');
    expect(presentationShader).toContain(
      '(color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14)'
    );
    expect(presentationShader).toContain('fn encodeRayTracingLinearSRGB(');
    expect(presentationShader).toContain('positiveColor * 12.92');
    expect(presentationShader).toContain(
      '1.055 * pow(positiveColor, vec3<f32>(1.0 / 2.4)) - 0.055'
    );
    expect(presentationShader).toContain('positiveColor > vec3<f32>(0.0031308)');
    expect(presentationShader).not.toContain('exp(-radiance)');
    expect(presentationShader).not.toContain('1.0 / 2.2');
  });

  test('keeps the prior boolean presentation shortcut compatible during graph migration', () => {
    for (const [highDynamicRange, toneMapMode, outputEncoding] of [
      [true, 0, 0],
      [false, 2, 1]
    ] as const) {
      expect(getRayTracingScenePresentationShader(highDynamicRange)).toEqual(
        getRayTracingScenePresentationShader({toneMapMode, outputEncoding})
      );
    }
  });
});
