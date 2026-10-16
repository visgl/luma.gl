// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';

import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {Texture} from '@luma.gl/core';
import {AnimationAction} from '@luma.gl/engine';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test, vi} from 'vitest';
import {planGLTFCrowdGPUAnimation} from '../../src/gltf/gltf-gpu-animation';

async function loadFixture(
  name: 'SimpleSkin.gltf' | 'AnimatedMorphCube.glb' | 'SimpleSkinLOD.gltf'
): Promise<GLTFPostprocessed> {
  const path =
    name === 'SimpleSkinLOD.gltf'
      ? new URL('../data/SimpleSkinLOD.gltf', import.meta.url)
      : new URL(`../../../../examples/showcase/scene/public/gltf/${name}`, import.meta.url);
  return postProcessGLTF(
    await parse(await readFile(path), GLTFLoader, {gltf: {loadImages: false}})
  );
}

describe('GPU-resident independently animated glTF crowds', () => {
  test('keeps actor morph targets on immutable GPU data with independent packed weights', async () => {
    const source = await loadFixture('AnimatedMorphCube.glb');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 3});

    try {
      const group = crowd.primitiveGroups[0];
      const geometry = group.model._gpuGeometry.attributes['geometry'];
      const initialGeometry = Array.from(await geometry.readAsync());
      const [first, second] = crowd.addActors([{phase: 0.1}, {phase: 0.6}]);

      expect(group.morphTargetCount).toBe(2);
      expect(group.morphTargetData).toBeInstanceOf(Texture);
      expect(group.morphWeights).toBeInstanceOf(Float32Array);
      expect(Array.from(group.morphWeights!.subarray(0, 2))).toEqual(
        (first.getNode(group.nodeIndex)?.userData['morphWeights'] as number[]).map(Math.fround)
      );
      expect(Array.from(group.morphWeights!.subarray(4, 6))).toEqual(
        (second.getNode(group.nodeIndex)?.userData['morphWeights'] as number[]).map(Math.fround)
      );
      expect(Array.from(group.morphWeights!.subarray(0, 2))).not.toEqual(
        Array.from(group.morphWeights!.subarray(4, 6))
      );
      expect(Array.from(await geometry.readAsync())).toEqual(initialGeometry);
      expect(crowd.animationStats).toMatchObject({
        mode: 'cpu',
        morphGroupCount: 1,
        estimatedByteLength: 0
      });
      expect(crowd.animationStats.fallbackReason).toBeUndefined();
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('bakes skeletal clips once and advances actor clocks without CPU track or skin evaluation', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 3,
      gpuAnimation: {sampleRate: 12}
    });

    try {
      const group = crowd.primitiveGroups[0];
      const [first, second] = crowd.addActors([{phase: 0.1}, {phase: 0.6, speed: 2}]);
      const firstAnimator = vi.spyOn(first.animator, 'update');
      const firstSkin = vi.spyOn(first, 'updateSkinMatrices');
      const secondAnimator = vi.spyOn(second.animator, 'update');
      const initialTime = second.time;

      expect(crowd.gpuAnimationEnabled).toBe(true);
      expect(crowd.animationStats).toMatchObject({
        mode: 'gpu',
        sampleRate: 12,
        clipCount: 1,
        morphGroupCount: 0
      });
      expect(crowd.animationStats.frameCount).toBeGreaterThan(1);
      expect(group.animationFrames).toBeInstanceOf(Texture);
      expect(group.skinJointMatrices).toBeUndefined();
      expect(Array.from(group.animationParameters!.subarray(0, 3))).not.toEqual(
        Array.from(group.animationParameters!.subarray(4, 7))
      );

      crowd.update(0.1);

      expect(second.time).toBeGreaterThan(initialTime);
      expect(firstAnimator).not.toHaveBeenCalled();
      expect(secondAnimator).not.toHaveBeenCalled();
      expect(firstSkin).not.toHaveBeenCalled();
      expect(group.model.instanceCount).toBe(2);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('bakes the actual final clip pose without repeat-loop wrapping', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const device = new NullDevice({});
    const sampledTimes: Array<{requested: number; resolved: number; duration: number}> = [];
    const originalSetTime = AnimationAction.prototype.setTime;
    const setTimeSpy = vi.spyOn(AnimationAction.prototype, 'setTime').mockImplementation(function (
      time: number
    ) {
      const result = originalSetTime.call(this, time);
      sampledTimes.push({requested: time, resolved: this.time, duration: this.clip.duration});
      return result;
    });
    let crowd: ReturnType<typeof createGLTFAnimatedCrowd> | undefined;

    try {
      crowd = createGLTFAnimatedCrowd(device, source, {
        capacity: 1,
        gpuAnimation: {sampleRate: 12}
      });

      expect(
        sampledTimes.some(
          sample =>
            sample.duration > 0 &&
            sample.requested === sample.duration &&
            sample.resolved === sample.duration
        )
      ).toBe(true);
    } finally {
      crowd?.destroy();
      setTimeSpy.mockRestore();
      device.destroy();
    }
  });

  test('samples independent animated morph weights from baked GPU clip frames', async () => {
    const source = await loadFixture('AnimatedMorphCube.glb');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 2,
      gpuAnimation: {sampleRate: 20}
    });

    try {
      const group = crowd.primitiveGroups[0];
      const [first, second] = crowd.addActors([{phase: 0.15}, {phase: 0.65}]);
      const firstAnimator = vi.spyOn(first.animator, 'update');
      const secondAnimator = vi.spyOn(second.animator, 'update');

      expect(group.morphTargetCount).toBe(2);
      expect(group.morphTargetData).toBeInstanceOf(Texture);
      expect(group.animationFrames).toBeInstanceOf(Texture);
      expect(group.morphWeights).toBeUndefined();
      expect(Array.from(group.animationParameters!.subarray(0, 3))).not.toEqual(
        Array.from(group.animationParameters!.subarray(4, 7))
      );
      expect(crowd.animationStats).toMatchObject({mode: 'gpu', morphGroupCount: 1});

      crowd.update(0.1);

      expect(firstAnimator).not.toHaveBeenCalled();
      expect(secondAnimator).not.toHaveBeenCalled();
      expect(group.model.instanceCount).toBe(2);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('preserves screen-space LOD and deterministic vertex budgets without CPU skin palettes', async () => {
    const source = await loadFixture('SimpleSkinLOD.gltf');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 3,
      gpuAnimation: {sampleRate: 10},
      lod: {enabled: true, hysteresis: 0, vertexBudget: 24}
    });

    try {
      crowd.addActors([
        {phase: 0.1, transform: new Matrix4().translate([0, 0, -1.5])},
        {phase: 0.5, transform: new Matrix4().translate([0, 0, -4])},
        {phase: 0.8, transform: new Matrix4().translate([0, 0, -12])}
      ]);
      crowd.update(0.1, {
        viewMatrix: new Matrix4(),
        projectionMatrix: new Matrix4().perspective({
          fovy: Math.PI / 2,
          aspect: 1,
          near: 0.1,
          far: 500
        })
      });

      expect(crowd.lodStats).toMatchObject({
        visibleActors: 3,
        vertices: 24,
        vertexBudget: 24,
        budgetSatisfied: true
      });
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([0, 1, 2]);
      expect(crowd.primitiveGroups.every(group => group.animationFrames instanceof Texture)).toBe(
        true
      );
      expect(crowd.primitiveGroups.every(group => group.skinJointMatrices === undefined)).toBe(
        true
      );
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('retains CPU playback when requested baked data exceeds its explicit frame budget', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 2,
      gpuAnimation: {sampleRate: 30, maxFrames: 1}
    });

    try {
      expect(crowd.gpuAnimationEnabled).toBe(false);
      expect(crowd.animationStats).toMatchObject({mode: 'cpu', fallbackReason: 'frame-budget'});
      expect(crowd.primitiveGroups[0].skinJointMatrices).toBeInstanceOf(Texture);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('retains CPU playback when the WebGL animation atlas exceeds texture limits', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const device = new NullDevice({});
    device.limits.maxTextureDimension2D = 16;
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 2,
      gpuAnimation: {sampleRate: 120}
    });

    try {
      expect(crowd.gpuAnimationEnabled).toBe(false);
      expect(crowd.animationStats).toMatchObject({mode: 'cpu', fallbackReason: 'texture-limit'});
      expect(crowd.primitiveGroups[0].skinJointMatrices).toBeInstanceOf(Texture);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('rejects an over-budget bake before atlas allocation and keeps CPU animation working', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const plan = planGLTFCrowdGPUAnimation(source, {sampleRate: 12});
    const device = new NullDevice({});
    const createTexture = vi.spyOn(device, 'createTexture');
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 2,
      gpuAnimation: {sampleRate: 12, maxBytes: plan.estimatedByteLength - 1}
    });

    try {
      expect(crowd.animationStats).toMatchObject({
        mode: 'cpu',
        fallbackReason: 'byte-budget',
        estimatedByteLength: plan.estimatedByteLength
      });
      expect(
        createTexture.mock.calls.some(([props]) => props.id?.endsWith('-crowd-animation-frames'))
      ).toBe(false);
      expect(crowd.primitiveGroups[0].animationFrames).toBeUndefined();
      const actor = crowd.addActor({phase: 0.1});
      const updateSkin = vi.spyOn(actor, 'updateSkinMatrices');
      const initialTime = actor.time;
      crowd.update(0.1);
      expect(actor.time).toBeGreaterThan(initialTime);
      expect(updateSkin).toHaveBeenCalled();
    } finally {
      crowd.destroy();
      createTexture.mockRestore();
      device.destroy();
    }
  });

  test('accepts a bake at the byte budget and reports its atlas size', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const plan = planGLTFCrowdGPUAnimation(source, {sampleRate: 12});
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {
      gpuAnimation: {sampleRate: 12, maxBytes: plan.estimatedByteLength}
    });
    try {
      const atlas = crowd.primitiveGroups[0].animationFrames;
      expect(atlas).toBeInstanceOf(Texture);
      if (atlas instanceof Texture) {
        expect(plan.estimatedByteLength).toBe(atlas.width * atlas.height * 16);
      }
      expect(crowd.animationStats).toMatchObject({
        mode: 'gpu',
        estimatedByteLength: plan.estimatedByteLength
      });
      expect(crowd.animationStats.fallbackReason).toBeUndefined();
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('budgets every primitive, morph column, and independently posed mesh reference', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const original = planGLTFCrowdGPUAnimation(source, {sampleRate: 12});
    const mesh = source.meshes[0];
    const primitive = mesh.primitives[0];
    const expandedMesh = {...mesh, primitives: [primitive, {...primitive, targets: [{}, {}]}]};
    const meshNode = source.nodes.find(node => node.mesh)!;
    const expandedSource = {
      ...source,
      meshes: [expandedMesh],
      nodes: [
        {...meshNode, mesh: expandedMesh},
        {...meshNode, mesh: expandedMesh}
      ]
    };
    const expanded = planGLTFCrowdGPUAnimation(expandedSource, {sampleRate: 12});
    const extraMorphBytes = original.layout!.frameCount * 2 * 16;
    expect(expanded.estimatedByteLength).toBe(
      (original.estimatedByteLength * 2 + extraMorphBytes) * 2
    );
    expect(
      planGLTFCrowdGPUAnimation(expandedSource, {
        sampleRate: 12,
        maxBytes: expanded.estimatedByteLength - 1
      }).fallbackReason
    ).toBe('byte-budget');
  });

  test('enforces the default byte budget across all primitives', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const mesh = source.meshes[0];
    const expandedMesh = {...mesh, primitives: new Array(200).fill(mesh.primitives[0])};
    const expandedSource = {...source, meshes: [expandedMesh]};
    const plan = planGLTFCrowdGPUAnimation(expandedSource, {sampleRate: 1000});
    expect(plan.estimatedByteLength).toBeGreaterThan(64 * 1024 * 1024);
    expect(plan.fallbackReason).toBe('byte-budget');
    expect(
      planGLTFCrowdGPUAnimation(expandedSource, {
        sampleRate: 1000,
        maxBytes: plan.estimatedByteLength
      }).layout
    ).not.toBeNull();
  });

  test('applies the frame budget to the combined clip set', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const plan = planGLTFCrowdGPUAnimation(source, {sampleRate: 12});
    const expandedSource = {...source, animations: [...source.animations!, ...source.animations!]};
    expect(
      planGLTFCrowdGPUAnimation(expandedSource, {
        sampleRate: 12,
        maxFrames: plan.layout!.frameCount
      }).fallbackReason
    ).toBe('frame-budget');
  });

  test.each([
    'maxBufferSize',
    'maxStorageBufferBindingSize'
  ] as const)('checks WebGPU %s before baking', async limit => {
    const source = await loadFixture('SimpleSkin.gltf');
    const plan = planGLTFCrowdGPUAnimation(source, {sampleRate: 12});
    const device = new NullDevice({});
    try {
      const limits = device.limits;
      limits.maxBufferSize = plan.estimatedByteLength;
      limits.maxStorageBufferBindingSize = plan.estimatedByteLength;
      const target = {type: 'webgpu' as const, limits};
      expect(planGLTFCrowdGPUAnimation(source, {sampleRate: 12}, target).layout).not.toBeNull();
      limits[limit]--;
      expect(planGLTFCrowdGPUAnimation(source, {sampleRate: 12}, target).fallbackReason).toBe(
        'buffer-limit'
      );
    } finally {
      device.destroy();
    }
  });

  test.each([
    {sampleRate: Number.NaN},
    {sampleRate: 0},
    {sampleRate: Number.POSITIVE_INFINITY},
    {maxFrames: -1},
    {maxFrames: 0},
    {maxFrames: 1.5},
    {maxBytes: 0},
    {maxBytes: -1},
    {maxBytes: Number.POSITIVE_INFINITY},
    {maxBytes: 1.5}
  ])('reports invalid bake options %j', async options => {
    const source = await loadFixture('SimpleSkin.gltf');
    expect(planGLTFCrowdGPUAnimation(source, options).fallbackReason).toBe('invalid-options');
  });

  test('distinguishes disabled baking, absent clips, and malformed sample times', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    expect(planGLTFCrowdGPUAnimation(source, {enabled: false}).fallbackReason).toBe('disabled');
    expect(planGLTFCrowdGPUAnimation({...source, animations: []}, {}).fallbackReason).toBe(
      'no-animations'
    );
    const input = source.animations![0].samplers[0].input;
    source.accessors[input].value![0] = Number.NaN;
    expect(planGLTFCrowdGPUAnimation(source, {}).fallbackReason).toBe('invalid-animation');
  });
});
