// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  getVolumetricFireForgeSoundEnvelope,
  makeVolumetricFireForgeSoundProfile
} from '../../examples/experimental/volumetric-fire-forge/volumetric-fire-forge-audio';
import {
  advanceVolumetricFireForgeFlareSchedule,
  getVolumetricFireForgeFlareEnvelope,
  makeVolumetricFireForgeFlaredEmitters,
  makeVolumetricFireForgeFlareSchedule,
  selectNearestVolumetricFireForgeBurner,
  VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS,
  VOLUMETRIC_FIRE_FORGE_FLARE_DECAY_SECONDS
} from '../../examples/experimental/volumetric-fire-forge/volumetric-fire-forge-flares';
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

    const highDynamicRangeBurners = VOLUMETRIC_FIRE_FORGE_BOXES.filter(box => box.emissiveTopOnly);
    expect(highDynamicRangeBurners).toHaveLength(4);
    expect(highDynamicRangeBurners.every(box => Math.max(...box.emissiveColor) > 1)).toBe(true);

    const masonryBoxes = VOLUMETRIC_FIRE_FORGE_BOXES.filter(
      box => box.surfaceTreatment === 'refractory-masonry'
    );
    expect(masonryBoxes.map(box => box.id)).toEqual([
      'rear-refractory-wall',
      'left-forge-cheek',
      'right-forge-cheek'
    ]);
    expect(
      VOLUMETRIC_FIRE_FORGE_BOXES.filter(
        box => box.id === 'hearth-floor' || box.id.includes('burner')
      ).every(box => box.surfaceTreatment === undefined)
    ).toBe(true);
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

describe('Volumetric Fire Forge flares', () => {
  test('schedules repeatable irregular single-burner flares without immediate repeats', () => {
    const firstSchedule = makeVolumetricFireForgeFlareSchedule(4);
    const repeatedSchedule = makeVolumetricFireForgeFlareSchedule(4);
    expect(firstSchedule).toEqual(repeatedSchedule);

    const intervals: number[] = [firstSchedule.nextFlareTimeSeconds];
    let schedule = firstSchedule;
    for (let sequence = 0; sequence < 16; sequence++) {
      const previousBurnerIndex = schedule.nextBurnerIndex;
      const previousTimeSeconds = schedule.nextFlareTimeSeconds;
      schedule = advanceVolumetricFireForgeFlareSchedule(schedule, 4);
      intervals.push(schedule.nextFlareTimeSeconds - previousTimeSeconds);
      expect(schedule.nextBurnerIndex).not.toBe(previousBurnerIndex);
      expect(schedule.nextIntensity).toBeGreaterThanOrEqual(0.82);
      expect(schedule.nextIntensity).toBeLessThanOrEqual(1.16);
    }
    expect(new Set(intervals.map(interval => interval.toFixed(3))).size).toBeGreaterThan(10);
    expect(() => makeVolumetricFireForgeFlareSchedule(0)).toThrow(/at least one burner/);
  });

  test('uses a fast attack, a longer natural decay, and then reaches zero', () => {
    expect(getVolumetricFireForgeFlareEnvelope(-1)).toBe(0);
    expect(getVolumetricFireForgeFlareEnvelope(0)).toBe(0);
    expect(
      getVolumetricFireForgeFlareEnvelope(VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS / 2)
    ).toBeCloseTo(0.5);
    expect(
      getVolumetricFireForgeFlareEnvelope(VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS)
    ).toBeCloseTo(1);
    expect(
      getVolumetricFireForgeFlareEnvelope(
        VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS + VOLUMETRIC_FIRE_FORGE_FLARE_DECAY_SECONDS * 0.5
      )
    ).toBeGreaterThan(0.1);
    expect(
      getVolumetricFireForgeFlareEnvelope(
        VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS + VOLUMETRIC_FIRE_FORGE_FLARE_DECAY_SECONDS
      )
    ).toBe(0);
  });

  test('boosts only the selected solver source', () => {
    const flaredEmitters = makeVolumetricFireForgeFlaredEmitters(
      VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS,
      [0, 1.2, 0, 0]
    );
    expect(flaredEmitters[0]).toBe(VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS[0]);
    expect(flaredEmitters[2]).toBe(VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS[2]);
    expect(flaredEmitters[1].fuel).toBeGreaterThan(VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS[1].fuel);
    expect(flaredEmitters[1].temperature).toBeGreaterThan(
      VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS[1].temperature
    );
    expect(flaredEmitters[1].velocity?.[1]).toBeGreaterThan(
      VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS[1].velocity[1]
    );
  });

  test('selects the nearest visible projected burner and rejects empty space', () => {
    const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const burnerWorldPositions = [
      [-0.5, 0, 0] as const,
      [0.5, 0, 0] as const,
      [0, 0, 2] as const,
      [0, 0, -0.2] as const
    ];
    expect(
      selectNearestVolumetricFireForgeBurner({
        pointerX: 51,
        pointerY: 50,
        viewportWidth: 200,
        viewportHeight: 100,
        viewProjectionMatrix: identityMatrix,
        burnerWorldPositions,
        maximumDistancePixels: 20
      })?.burnerIndex
    ).toBe(0);
    expect(
      selectNearestVolumetricFireForgeBurner({
        pointerX: 149,
        pointerY: 50,
        viewportWidth: 200,
        viewportHeight: 100,
        viewProjectionMatrix: identityMatrix,
        burnerWorldPositions,
        maximumDistancePixels: 20
      })?.burnerIndex
    ).toBe(1);
    expect(
      selectNearestVolumetricFireForgeBurner({
        pointerX: 100,
        pointerY: 90,
        viewportWidth: 200,
        viewportHeight: 100,
        viewProjectionMatrix: identityMatrix,
        burnerWorldPositions,
        maximumDistancePixels: 20
      })
    ).toBeNull();
    expect(
      selectNearestVolumetricFireForgeBurner({
        pointerX: 100,
        pointerY: 50,
        viewportWidth: 200,
        viewportHeight: 100,
        viewProjectionMatrix: identityMatrix,
        burnerWorldPositions,
        maximumDistancePixels: 20
      })
    ).toBeNull();
  });
});

describe('Volumetric Fire Forge sound', () => {
  test('keeps the whoomph low, modest, spatial, and distance attenuated', () => {
    const nearProfile = makeVolumetricFireForgeSoundProfile({
      intensity: 1.2,
      distance: 3,
      pan: 2
    });
    const farProfile = makeVolumetricFireForgeSoundProfile({
      intensity: 1.2,
      distance: 24,
      pan: -2
    });
    expect(nearProfile.peakGain).toBeGreaterThan(farProfile.peakGain);
    expect(nearProfile.peakGain).toBeLessThan(0.25);
    expect(nearProfile.lowPassFrequencyHertz).toBeLessThan(220);
    expect(nearProfile.subFrequencyHertz).toBeLessThan(55);
    expect(nearProfile.tailSeconds).toBeGreaterThan(2);
    expect(nearProfile.pan).toBe(1);
    expect(farProfile.pan).toBe(-1);
  });

  test('uses a soft sound attack and rolling two-second tail', () => {
    const tailSeconds = 2.1;
    expect(getVolumetricFireForgeSoundEnvelope(0, tailSeconds)).toBe(0);
    expect(getVolumetricFireForgeSoundEnvelope(0.0275, tailSeconds)).toBeCloseTo(0.5);
    expect(getVolumetricFireForgeSoundEnvelope(0.055, tailSeconds)).toBeCloseTo(1);
    expect(getVolumetricFireForgeSoundEnvelope(0.8, tailSeconds)).toBeGreaterThan(0.05);
    expect(getVolumetricFireForgeSoundEnvelope(tailSeconds, tailSeconds)).toBe(0);
  });
});
