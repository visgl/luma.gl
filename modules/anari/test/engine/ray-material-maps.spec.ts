// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray maps preserve UV selection, replacement, and specular and clearcoat transport', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, replacement, map, readPixel, destroy} = await createMaterialFixture();
  try {
    expect(await readPixel()).toEqual([255, 0, 0]);
    surface.material.uniforms.baseColorUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 255]);
    surface.material.uniforms.baseColorUVSet = 0;
    surface.material.uniforms.baseColorUVTransform = [1, 0, 0, 0, 1, 0, 0.5, 0, 1];
    expect(await readPixel()).toEqual([0, 0, 255]);
    surface.material.bindings.pbr_baseColorSampler = replacement;
    expect(await readPixel()).toEqual([0, 255, 0]);
    const specularSurface = {
      ...surface,
      material: {
        id: 'specular-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          metallicRoughnessValues: [0, 0.5] as [number, number],
          specularColorFactor: [1, 0, 0] as [number, number, number],
          specularIntensityFactor: 1,
          specularColorUVSet: 0,
          specularIntensityUVSet: 0
        },
        bindings: {} as Record<string, Texture>
      }
    };
    options.surfaces = [specularSurface];
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 4}];
    options.samplingFrameIndex = 0;
    const redReflection = await readPixel();
    expect(redReflection[0]).toBeGreaterThan(20);
    expect(redReflection.slice(1)).toEqual([0, 0]);
    specularSurface.material.uniforms.specularIntensityFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    specularSurface.material.uniforms.specularIntensityFactor = 1;
    specularSurface.material.uniforms.specularColorFactor = [1, 1, 1];
    specularSurface.material.bindings.pbr_specularColorSampler = map;
    expect(await readPixel()).toEqual(redReflection);
    specularSurface.material.uniforms.specularColorUVSet = 1;
    const blueReflection = await readPixel();
    expect(blueReflection[2]).toBeGreaterThan(20);
    expect(blueReflection.slice(0, 2)).toEqual([0, 0]);
    replacement.writeData(new Uint8Array([255, 255, 255, 0, 0, 0, 0, 255]));
    specularSurface.material.bindings.pbr_specularIntensitySampler = replacement;
    expect(await readPixel()).toEqual([0, 0, 0]);
    specularSurface.material.uniforms.specularIntensityUVSet = 1;
    expect(await readPixel()).toEqual(blueReflection);
    const reflectionEmitter = {
      ...surface,
      id: 'specular-emitter',
      transforms: [new Matrix4().translate([0, 0, 5])],
      material: {
        id: 'specular-emitter-material',
        uniforms: {emissiveFactor: [12, 12, 12]}
      }
    } satisfies RayTracingSceneRenderOptions['surfaces'][number];
    options.surfaces = [specularSurface, reflectionEmitter];
    options.lights = [];
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const reflectedBlue = await readPixel();
    expect(reflectedBlue[2]).toBeGreaterThan(8);
    expect(reflectedBlue.slice(0, 2)).toEqual([0, 0]);
    specularSurface.material.uniforms.specularColorUVSet = 0;
    const reflectedRed = await readPixel();
    expect(reflectedRed[0]).toBe(reflectedBlue[2]);
    expect(reflectedRed.slice(1)).toEqual([0, 0]);
    specularSurface.material.uniforms.specularIntensityUVSet = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    const coatedSurface = {
      ...specularSurface,
      material: {
        id: 'clearcoat-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          specularIntensityFactor: 0,
          metallicRoughnessValues: [0, 0.5] as [number, number],
          clearcoatFactor: 1,
          clearcoatRoughnessFactor: 1,
          clearcoatUVSet: 0,
          clearcoatRoughnessUVSet: 0
        },
        bindings: {
          pbr_clearcoatSampler: map,
          pbr_clearcoatRoughnessSampler: replacement
        }
      }
    };
    // Red enables the coat. Green sets its roughness independently of the other channels.
    replacement.writeData(new Uint8Array([255, 128, 255, 0, 255, 255, 255, 0]));
    options.surfaces = [coatedSurface, reflectionEmitter];
    const coatedBounce = await readPixel();
    expect(coatedBounce[0]).toBeGreaterThan(8);
    expect(coatedBounce[1]).toBe(coatedBounce[0]);
    coatedSurface.material.uniforms.clearcoatUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 0]);
    coatedSurface.material.uniforms.clearcoatUVSet = 0;
    options.maxBounces = 0;
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 4}];
    options.surfaces = [coatedSurface];
    const glossyCoat = await readPixel();
    expect(glossyCoat[0]).toBeGreaterThan(20);
    coatedSurface.material.uniforms.clearcoatRoughnessUVSet = 1;
    expect((await readPixel())[0]).toBeLessThan(glossyCoat[0] / 2);
    coatedSurface.material.uniforms.clearcoatFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
}, 360_000);
