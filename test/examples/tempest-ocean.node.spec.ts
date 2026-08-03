// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {Matrix4, radians} from '@math.gl/core';
import {toHalfFloat} from '@luma.gl/shadertools';
import {
  getTempestOceanMinimumCameraHeight,
  getTempestOceanSunDirection,
  TEMPEST_OCEAN_CAMERA_PROPS,
  TEMPEST_OCEAN_FIELD_OF_VIEW_DEGREES
} from '../../examples/showcase/tempest-ocean/tempest-ocean-camera';
import {
  getTempestOceanTileOffset,
  makeTempestOceanGridPlan
} from '../../examples/showcase/tempest-ocean/tempest-ocean-grid';
import {
  TEMPEST_OCEAN_SKY_SHADER,
  TEMPEST_OCEAN_SURFACE_SHADER
} from '../../examples/showcase/tempest-ocean/tempest-ocean-shaders';
import {
  convertLinearDisplayP3ToSrgbBytes,
  packTempestOceanFloatRows
} from '../../examples/showcase/tempest-ocean/tempest-ocean-capture';
import {
  getTempestOceanSirenEnvelope,
  makeTempestOceanNoiseSamples,
  makeTempestOceanSirenCue
} from '../../examples/showcase/tempest-ocean/tempest-ocean-audio';

describe('Tempest Ocean draw plan', () => {
  test('keeps raster tessellation independent from the FFT field', () => {
    const plan = makeTempestOceanGridPlan(145, 3);
    expect(plan).toEqual({
      gridResolution: 145,
      cellCount: 20_736,
      vertexCount: 124_416,
      tileCount: 3,
      instanceCount: 9
    });
    expect(Object.isFrozen(plan)).toBe(true);
    expect(getTempestOceanTileOffset(0, 3, 360)).toEqual([-360, -360]);
    expect(getTempestOceanTileOffset(4, 3, 360)).toEqual([0, 0]);
    expect(getTempestOceanTileOffset(8, 3, 360)).toEqual([360, 360]);
  });

  test('validates bounded tessellation and centered odd tile counts', () => {
    expect(() => makeTempestOceanGridPlan(1, 3)).toThrow(/gridResolution/);
    expect(() => makeTempestOceanGridPlan(513, 3)).toThrow(/gridResolution/);
    expect(() => makeTempestOceanGridPlan(64, 2)).toThrow(/tileCount/);
    expect(() => getTempestOceanTileOffset(9, 3, 360)).toThrow(/instanceIndex/);
    expect(() => getTempestOceanTileOffset(0, 3, 0)).toThrow(/patchSize/);
  });
});

describe('Tempest Ocean presentation contract', () => {
  test('keeps the orbit safely above authored crests', () => {
    expect(getTempestOceanMinimumCameraHeight()).toBeGreaterThan(9.5);
    expect(TEMPEST_OCEAN_CAMERA_PROPS.minPitch).toBeGreaterThan(0);
    expect(TEMPEST_OCEAN_CAMERA_PROPS.maxPitch).toBeLessThan(Math.PI / 2);
  });

  test('camera-basis celestial key stays inside safe NDC bounds across the orbit', () => {
    const yawValues = [
      TEMPEST_OCEAN_CAMERA_PROPS.yaw - Math.PI,
      TEMPEST_OCEAN_CAMERA_PROPS.yaw,
      TEMPEST_OCEAN_CAMERA_PROPS.yaw + Math.PI
    ];
    const pitchValues = [
      TEMPEST_OCEAN_CAMERA_PROPS.minPitch,
      TEMPEST_OCEAN_CAMERA_PROPS.pitch,
      TEMPEST_OCEAN_CAMERA_PROPS.maxPitch
    ];
    const aspectValues = [4 / 3, 16 / 9, 21 / 9];

    for (const yaw of yawValues) {
      for (const pitch of pitchValues) {
        const cameraPosition = getCameraPosition(yaw, pitch);
        const sunDirection = getTempestOceanSunDirection(cameraPosition);
        expect(Math.hypot(...sunDirection)).toBeCloseTo(1);
        for (const aspect of aspectValues) {
          const [normalizedDeviceX, normalizedDeviceY] = projectDirectionToNdc(
            cameraPosition,
            sunDirection,
            aspect
          );
          expect(normalizedDeviceX).toBeGreaterThan(0.08);
          expect(normalizedDeviceX).toBeLessThan(0.2);
          expect(normalizedDeviceY).toBeGreaterThan(0.62);
          expect(normalizedDeviceY).toBeLessThan(0.72);
        }
      }
    }
  });

  test('consumes both reusable simulation outputs in the raster shader', () => {
    expect(TEMPEST_OCEAN_SURFACE_SHADER).toContain('oceanDisplacements');
    expect(TEMPEST_OCEAN_SURFACE_SHADER).toContain('oceanNormalFoam');
    expect(TEMPEST_OCEAN_SURFACE_SHADER).toContain('sampleOceanSurface');
    expect(TEMPEST_OCEAN_SURFACE_SHADER).toContain('mix(normalFoamBottom, normalFoamTop');
    expect(TEMPEST_OCEAN_SKY_SHADER).toContain('getTempestSkyColor');
  });
});

describe('Tempest Ocean HDR screenshot packing', () => {
  test('removes WebGPU padding without changing top-down row order', () => {
    const sourceData = new Uint8Array(40);
    sourceData.set(
      Array.from({length: 16}, (_, index) => index + 1),
      0
    );
    sourceData.set(
      Array.from({length: 16}, (_, index) => index + 17),
      20
    );

    expect(packTempestOceanFloatRows(sourceData, 2, 2, 20)).toEqual(
      new Uint8Array(Array.from({length: 32}, (_, index) => index + 1))
    );
  });

  test('applies the sRGB transfer curve to Display-P3 color while keeping alpha linear', () => {
    const linearData = new Uint8Array(8);
    const linearDataView = new DataView(linearData.buffer);
    const values = [0, 1, 0.5, 0.5];
    for (let channelIndex = 0; channelIndex < values.length; channelIndex++) {
      linearDataView.setUint16(
        channelIndex * Uint16Array.BYTES_PER_ELEMENT,
        toHalfFloat(values[channelIndex]),
        true
      );
    }

    expect(convertLinearDisplayP3ToSrgbBytes(linearData)).toEqual(
      new Uint8Array([0, 255, 188, 128])
    );
  });
});

describe('Tempest Ocean procedural atmosphere', () => {
  test('builds deterministic seamless water noise', () => {
    const sampleCount = 4_096;
    const crossfadeSampleCount = 256;
    const randomSeed = 0x61ef291b;
    const loopSamples = makeTempestOceanNoiseSamples(sampleCount, crossfadeSampleCount, randomSeed);
    const duplicateLoopSamples = makeTempestOceanNoiseSamples(
      sampleCount,
      crossfadeSampleCount,
      randomSeed
    );

    expect(loopSamples).toEqual(duplicateLoopSamples);
    expect(loopSamples).toHaveLength(sampleCount);
    expect(Array.from(loopSamples).every(Number.isFinite)).toBe(true);
    expect(Math.abs(loopSamples[0]! - loopSamples[sampleCount - 1]!)).toBeLessThan(0.6);
  });

  test('keeps nonverbal siren calls rare, slow, and deterministic', () => {
    const firstCue = makeTempestOceanSirenCue(0);
    expect(makeTempestOceanSirenCue(0)).toEqual(firstCue);
    expect(firstCue.delaySeconds).toBeGreaterThanOrEqual(16);
    expect(firstCue.durationSeconds).toBeGreaterThan(6);
    expect(firstCue.middleFrequencyHertz).toBeGreaterThan(firstCue.startFrequencyHertz);
    expect(firstCue.endFrequencyHertz).toBeLessThan(firstCue.middleFrequencyHertz);

    for (let cueIndex = 1; cueIndex < 12; cueIndex++) {
      const cue = makeTempestOceanSirenCue(cueIndex);
      expect(cue.delaySeconds).toBeGreaterThanOrEqual(44);
      expect(cue.durationSeconds).toBeGreaterThan(6);
      expect(cue.durationSeconds).toBeLessThan(9);
      expect(cue.peakGain).toBeLessThan(0.04);
      expect(Math.abs(cue.startPan)).toBeLessThanOrEqual(0.8);
      expect(Math.abs(cue.endPan)).toBeLessThanOrEqual(0.8);
    }
  });

  test('shapes each call with silence at both ends and an audible center', () => {
    const durationSeconds = 7.5;
    expect(getTempestOceanSirenEnvelope(-1, durationSeconds)).toBe(0);
    expect(getTempestOceanSirenEnvelope(0, durationSeconds)).toBe(0);
    expect(getTempestOceanSirenEnvelope(durationSeconds / 2, durationSeconds)).toBeGreaterThan(0.7);
    expect(getTempestOceanSirenEnvelope(durationSeconds, durationSeconds)).toBe(0);
    expect(getTempestOceanSirenEnvelope(Number.NaN, durationSeconds)).toBe(0);
  });
});

function getCameraPosition(yaw: number, pitch: number): [number, number, number] {
  const horizontalDistance = TEMPEST_OCEAN_CAMERA_PROPS.distance * Math.cos(pitch);
  return [
    TEMPEST_OCEAN_CAMERA_PROPS.target[0] + horizontalDistance * Math.sin(yaw),
    TEMPEST_OCEAN_CAMERA_PROPS.target[1] + TEMPEST_OCEAN_CAMERA_PROPS.distance * Math.sin(pitch),
    TEMPEST_OCEAN_CAMERA_PROPS.target[2] + horizontalDistance * Math.cos(yaw)
  ];
}

function projectDirectionToNdc(
  cameraPosition: [number, number, number],
  direction: readonly [number, number, number],
  aspect: number
): number[] {
  const projectionMatrix = new Matrix4().perspective({
    fovy: radians(TEMPEST_OCEAN_FIELD_OF_VIEW_DEGREES),
    aspect,
    near: 0.1,
    far: 1_400
  });
  const viewMatrix = new Matrix4().lookAt({
    eye: cameraPosition,
    center: TEMPEST_OCEAN_CAMERA_PROPS.target,
    up: [0, 1, 0]
  });
  const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
  return viewProjectionMatrix.transformAsPoint([
    cameraPosition[0] + direction[0] * 1_000,
    cameraPosition[1] + direction[1] * 1_000,
    cameraPosition[2] + direction[2] * 1_000
  ]);
}
