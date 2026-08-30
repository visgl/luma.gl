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
      expect(crowd.animationStats).toMatchObject({mode: 'cpu', morphGroupCount: 1});
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
      expect(crowd.animationStats.mode).toBe('cpu');
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
      expect(crowd.animationStats.mode).toBe('cpu');
      expect(crowd.primitiveGroups[0].skinJointMatrices).toBeInstanceOf(Texture);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });
});
