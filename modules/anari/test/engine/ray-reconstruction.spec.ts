// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

/** Creates an orthographic camera with one world unit per fixture pixel. */
function makeCamera(horizontalPosition: number) {
  const position: [number, number, number] = [horizontalPosition, 0, 4];
  return {
    position,
    viewMatrix: new Matrix4().lookAt({
      eye: position,
      center: [horizontalPosition, 0, 0],
      up: [0, 1, 0]
    }),
    projectionMatrix: new Matrix4().ortho({
      left: -4,
      right: 4,
      bottom: -4,
      top: 4,
      near: 0.1,
      far: 20
    })
  };
}

it('discounts history at a partially disoccluded subpixel footprint', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, readRadiance, destroy} = await createMaterialFixture();
  try {
    options.camera = makeCamera(0);
    options.cameraProjection = 'orthographic';
    options.temporalReprojection = true;
    options.samplesPerPixel = 1;
    options.surfaces = [
      {...surface, material: {id: 'receiver', uniforms: {baseColorFactor: [1, 0, 0, 1]}}},
      {
        ...surface,
        id: 'occluder',
        geometry: new Geometry({
          topology: 'triangle-list',
          attributes: {
            POSITION: {size: 3, value: new Float32Array([-8, -8, 1, 0, -8, 1, 0, 8, 1])},
            NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
          }
        }),
        material: {id: 'occluder', uniforms: {emissiveFactor: [4, 1, 0]}}
      }
    ];
    /** Reads the central pixel’s retained sample count from the RGBA16F alpha channel. */
    const readConfidence = async () => {
      const radiance = (await readRadiance())!;
      return new DataView(radiance.data.buffer).getFloat16((4 * radiance.width + 4) * 8 + 6, true);
    };
    for (let frame = 0; frame < 8; frame++) {
      await readPixel();
    }
    expect(await readConfidence()).toBe(8);

    // The previous pixel on the left saw the occluder and accounts for 25% of the footprint.
    options.camera = makeCamera(-0.25);
    const [red, green] = await readPixel();
    expect(red).toBeGreaterThan(200);
    expect(green).toBeLessThan(5);
    expect(await readConfidence()).toBeCloseTo(7, 1);

    // The bright foreground neighbor must not widen the receiver's history clamp.
    options.lights = [{type: 'ambient', color: [1, 1, 1], intensity: 0.25}];
    const [dimmed] = await readPixel();
    expect(await readConfidence()).toBeCloseTo(8, 1);
    expect(dimmed).toBeGreaterThan(100);
    expect(dimmed).toBeLessThan(175);
  } finally {
    destroy();
  }
}, 180_000);

it('reduces guided spatial filtering as the retained sample count grows', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, readPixel, destroy} = await createMaterialFixture();
  try {
    options.camera = makeCamera(0);
    options.cameraProjection = 'orthographic';
    options.samplesPerPixel = 1;
    options.denoiseRadius = 1;
    options.surfaces = [
      {
        ...surface,
        geometry: new Geometry({
          topology: 'triangle-list',
          attributes: {
            ...geometry.attributes,
            TEXCOORD_0: {size: 2, value: new Float32Array([0, 0.5, 1, 0.5, 0.5, 0.5])}
          }
        })
      }
    ];

    const early = await readPixel();
    expect(early[0]).toBeGreaterThan(0);
    expect(early[2]).toBeLessThan(255);

    options.samplesPerPixel = 16;
    for (let frame = 0; frame < 4; frame++) {
      await readPixel();
    }
    const converged = await readPixel();
    options.denoiseRadius = 0;
    expect(await readPixel()).toEqual(converged);
    expect(converged).toEqual([0, 0, 255]);
  } finally {
    destroy();
  }
}, 180_000);

it('retains separate luminance moments and shows variance at a sampled texture edge', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, renderer, readPixel, readRadiance, destroy} =
    await createMaterialFixture();
  try {
    options.camera = makeCamera(-0.5);
    options.cameraProjection = 'orthographic';
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    options.varianceGuidance = true;
    options.debugView = 'variance';

    // A constant colored surface has zero variance even when it is bright.
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.surfaces = [
      {
        ...surface,
        geometry: new Geometry({
          topology: 'triangle-list',
          attributes: {
            ...geometry.attributes,
            TEXCOORD_0: {size: 2, value: new Float32Array([0, 0.5, 1, 0.5, 0.5, 0.5])}
          }
        })
      }
    ];
    const noisy = await readPixel();
    expect(noisy[0]).toBeGreaterThan(3);
    expect(noisy[1]).toBe(noisy[0]);
    expect(noisy[2]).toBe(noisy[0]);

    const previous = await readRadiance();
    expect(previous?.data.length).toBe(8 * 8 * 8);
    options.debugView = 'color';
    options.denoiseRadius = 1;
    const color = await readPixel();
    expect(color[0]).toBeGreaterThan(0);
    expect(color[2]).toBeGreaterThan(0);
    expect(await readRadiance()).not.toBeNull();

    renderer.destroyFrame(options.id);
    expect(await readRadiance()).toBeNull();
  } finally {
    destroy();
  }
}, 180_000);

it('restarts glossy PBR history on camera motion and accumulates at the stationary pose', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, readRadiance, destroy} = await createMaterialFixture();
  try {
    options.camera = makeCamera(0);
    options.cameraProjection = 'orthographic';
    options.temporalReprojection = true;
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.samplesPerPixel = 1;
    options.surfaces = [
      {
        ...surface,
        material: {
          id: 'glossy',
          uniforms: {metallicRoughnessValues: [1, 0.12]}
        }
      }
    ];
    /** Read retained confidence at the center of the reflective triangle. */
    const readConfidence = async () => {
      await readPixel();
      const radiance = (await readRadiance())!;
      return new DataView(radiance.data.buffer).getFloat16((4 * radiance.width + 4) * 8 + 6, true);
    };
    expect(await readConfidence()).toBe(1);
    expect(await readConfidence()).toBe(2);
    expect(await readConfidence()).toBe(3);

    options.camera = makeCamera(0.25);
    expect(await readConfidence()).toBe(1);
    expect(await readConfidence()).toBe(2);
  } finally {
    destroy();
  }
}, 180_000);
