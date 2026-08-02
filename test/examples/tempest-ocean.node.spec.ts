// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {Matrix4, radians} from '@math.gl/core';
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
