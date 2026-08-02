// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  advanceVolumetricFireForgeFixedStep,
  makeObstacleVolumeData,
  VOLUMETRIC_FIRE_FORGE_BOXES,
  VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS,
  VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS,
  VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME,
  VOLUMETRIC_FIRE_FORGE_PRESETS,
  VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS
} from '../../examples/experimental/volumetric-fire-forge/volumetric-fire-forge-scene';

describe('Volumetric Fire Forge scene data', () => {
  test('keeps one finite box description inside the simulation volume', () => {
    const {minimum, maximum} = VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS;
    const identifiers = new Set<string>();

    expect(VOLUMETRIC_FIRE_FORGE_BOXES.length).toBeGreaterThanOrEqual(8);
    for (const box of VOLUMETRIC_FIRE_FORGE_BOXES) {
      expect(identifiers.has(box.id)).toBe(false);
      identifiers.add(box.id);
      expect([...box.center, ...box.halfSize, ...box.color, ...box.emissiveColor]).toSatisfy(
        values => values.every(Number.isFinite)
      );
      expect(box.halfSize.every(value => value > 0)).toBe(true);
      expect(box.metallic).toBeGreaterThanOrEqual(0);
      expect(box.metallic).toBeLessThanOrEqual(1);
      expect(box.roughness).toBeGreaterThanOrEqual(0);
      expect(box.roughness).toBeLessThanOrEqual(1);

      for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
        expect(box.center[componentIndex] - box.halfSize[componentIndex]).toBeGreaterThanOrEqual(
          minimum[componentIndex]
        );
        expect(box.center[componentIndex] + box.halfSize[componentIndex]).toBeLessThanOrEqual(
          maximum[componentIndex]
        );
      }
    }
  });

  test('voxelizes forge boxes deterministically in x-major texture order', () => {
    const dimensions = [48, 48, 40] as const;
    const firstObstacleData = makeObstacleVolumeData(dimensions);
    const secondObstacleData = makeObstacleVolumeData(dimensions);

    expect(firstObstacleData).toEqual(secondObstacleData);
    expect(firstObstacleData).toBeInstanceOf(Uint8Array);
    expect(firstObstacleData).toHaveLength(dimensions[0] * dimensions[1] * dimensions[2]);
    expect(new Set(firstObstacleData)).toEqual(new Set([0, 255]));
    expect(firstObstacleData.filter(value => value === 255).length).toBeGreaterThan(1_000);

    const {minimum, maximum} = VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS;
    for (const box of VOLUMETRIC_FIRE_FORGE_BOXES) {
      const voxelCoordinates = box.center.map((coordinate, componentIndex) =>
        Math.min(
          dimensions[componentIndex] - 1,
          Math.max(
            0,
            Math.floor(
              ((coordinate - minimum[componentIndex]) /
                (maximum[componentIndex] - minimum[componentIndex])) *
                dimensions[componentIndex]
            )
          )
        )
      );
      const voxelIndex =
        voxelCoordinates[0] +
        dimensions[0] * (voxelCoordinates[1] + dimensions[1] * voxelCoordinates[2]);
      expect(firstObstacleData[voxelIndex], box.id).toBe(255);
    }

    const openTopCenterIndex =
      Math.floor(dimensions[0] / 2) +
      dimensions[0] *
        (Math.floor(dimensions[1] * 0.85) + dimensions[1] * Math.floor(dimensions[2] / 2));
    expect(firstObstacleData[openTopCenterIndex]).toBe(0);
    expect(() => makeObstacleVolumeData([0, 8, 8])).toThrow(/positive integers/);
    expect(() => makeObstacleVolumeData([8, 3.5, 8])).toThrow(/positive integers/);
  });

  test('defines bounded four-source presets with distinct authored behavior', () => {
    expect(VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS).toHaveLength(4);
    expect(VOLUMETRIC_FIRE_FORGE_PRESETS.map(preset => preset.id)).toEqual([
      'foundry',
      'blast',
      'smolder'
    ]);

    for (const preset of VOLUMETRIC_FIRE_FORGE_PRESETS) {
      expect(preset.emitters.length).toBeGreaterThan(0);
      expect(preset.emitters.length).toBeLessThanOrEqual(4);
      expect(Object.values(preset.simulation).every(Number.isFinite)).toBe(true);
      for (const emitter of preset.emitters) {
        expect(
          emitter.position.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
        ).toBe(true);
        expect(emitter.radius).toBeGreaterThan(0);
        expect(emitter.rate).toBeGreaterThan(0);
        expect(emitter.temperature).toBeGreaterThan(0);
        expect(emitter.fuel).toBeGreaterThan(0);
        expect(emitter.velocity?.every(Number.isFinite)).toBe(true);
      }
    }

    expect(VOLUMETRIC_FIRE_FORGE_PRESETS[1].emitters).not.toEqual(
      VOLUMETRIC_FIRE_FORGE_PRESETS[0].emitters
    );
    expect(VOLUMETRIC_FIRE_FORGE_PRESETS[2].emitters).not.toEqual(
      VOLUMETRIC_FIRE_FORGE_PRESETS[0].emitters
    );
  });

  test('accumulates fixed steps and drops backlog beyond three steps', () => {
    const halfStep = VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS / 2;
    const firstResult = advanceVolumetricFireForgeFixedStep(0, halfStep);
    expect(firstResult.stepCount).toBe(0);
    expect(firstResult.accumulatorSeconds).toBeCloseTo(halfStep);
    expect(firstResult.droppedSeconds).toBe(0);

    const secondResult = advanceVolumetricFireForgeFixedStep(
      firstResult.accumulatorSeconds,
      halfStep
    );
    expect(secondResult.stepCount).toBe(1);
    expect(secondResult.accumulatorSeconds).toBeCloseTo(0);
    expect(secondResult.droppedSeconds).toBe(0);

    const stalledFrameSeconds = 0.25;
    const clampedResult = advanceVolumetricFireForgeFixedStep(0, stalledFrameSeconds);
    expect(clampedResult.stepCount).toBe(VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME);
    expect(clampedResult.accumulatorSeconds).toBeCloseTo(0);
    expect(clampedResult.droppedSeconds).toBeCloseTo(
      stalledFrameSeconds -
        VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS * VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME
    );

    expect(advanceVolumetricFireForgeFixedStep(Number.NaN, -1)).toEqual({
      stepCount: 0,
      accumulatorSeconds: 0,
      droppedSeconds: 0
    });
  });
});
