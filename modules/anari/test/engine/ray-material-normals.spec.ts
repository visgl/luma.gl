// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import type {RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray triangle normal maps, coat normals, and primary mip footprints use the retained UV charts', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, renderer, replacement, mipMap, readPixel, destroy} =
    await createMaterialFixture();
  try {
    const mappedSurface = {
      ...surface,
      id: 'normal-mapped',
      geometry: new Geometry({
        id: 'normal-mapped-geometry',
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
          TEXCOORD_1: {size: 2, value: new Float32Array([1, 0, 0, 0, 0.5, 1])}
        }
      }),
      material: {
        id: 'normal-mapped-material',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          normalScale: 0,
          normalUVSet: 0,
          normalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
        },
        bindings: {pbr_normalSampler: replacement}
      }
    };
    replacement.writeData(new Uint8Array([255, 128, 200, 255, 255, 128, 200, 255]));
    const minifiedSurface = {
      ...mappedSurface,
      material: {
        ...mappedSurface.material,
        uniforms: {
          ...mappedSurface.material.uniforms,
          baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
        },
        bindings: {pbr_baseColorSampler: mipMap}
      }
    };
    options.surfaces = [minifiedSurface];
    expect(await readPixel()).toEqual([0, 255, 0]);
    minifiedSurface.material.uniforms.baseColorUVTransform = [64, 0, 0, 0, 64, 0, 0, 0, 1];
    expect(await readPixel()).toEqual([0, 0, 255]);
    minifiedSurface.geometry = geometry;
    expect(await readPixel()).toEqual([255, 0, 0]);
    const mappedCoat = {
      ...surface,
      id: 'mapped-coat',
      geometry: mappedSurface.geometry,
      material: {
        id: 'mapped-coat-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          specularIntensityFactor: 0,
          clearcoatFactor: 1,
          clearcoatRoughnessFactor: 0.5,
          clearcoatNormalUVSet: 0,
          clearcoatNormalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
        },
        bindings: {pbr_clearcoatNormalSampler: replacement}
      }
    };
    options.surfaces = [mappedCoat];
    options.samplingFrameIndex = 0;
    options.lights = [
      {type: 'directional', direction: [-1, 0, -0.4], color: [1, 1, 1], intensity: 4}
    ];
    const tiltedCoat = (await readPixel())[0];
    mappedCoat.material.uniforms.clearcoatNormalUVSet = 1;
    const mirroredCoat = (await readPixel())[0];
    expect(tiltedCoat).toBeGreaterThan(mirroredCoat + 3);
    mappedCoat.material.uniforms.clearcoatNormalUVTransform = [-1, 0, 0, 0, 1, 0, 1, 0, 1];
    expect((await readPixel())[0]).toBe(tiltedCoat);
    options.surfaces = [{...mappedCoat, material: {...mappedCoat.material, bindings: {}}}];
    expect((await readPixel())[0]).toBeLessThan(tiltedCoat);
    options.samplingFrameIndex = undefined;
    options.surfaces = [mappedSurface];
    options.lights = [
      {type: 'directional', direction: [-1, 0, -0.4], color: [1, 1, 1], intensity: 1}
    ];
    const unmapped = (await readPixel())[0];
    mappedSurface.material.uniforms.normalScale = 1;
    expect((await readPixel())[0]).toBeGreaterThan(unmapped + 20);
    const pick = await renderer.pick(options.id, 4, 4);
    expect(pick?.normal).toEqual([0, 0, 1]);
    mappedSurface.material.uniforms.normalUVSet = 1;
    expect((await readPixel())[0]).toBeLessThan(unmapped);
    mappedSurface.material.uniforms.normalUVTransform = [-1, 0, 0, 0, 1, 0, 1, 0, 1];
    expect((await readPixel())[0]).toBeGreaterThan(unmapped + 20);
    const smoothSurface = {
      ...mappedSurface,
      id: 'smooth-normal-mapped',
      geometry: new Geometry({
        id: 'smooth-normal-mapped-geometry',
        topology: 'triangle-list',
        attributes: {
          ...mappedSurface.geometry.attributes,
          NORMAL: {size: 3, value: new Float32Array([-0.8, 0, 0.6, -0.8, 0, 0.6, -0.8, 0, 0.6])}
        }
      })
    };
    options.surfaces = [smoothSurface];
    expect((await readPixel())[0]).toBeGreaterThan(20);
    const sideEmitter = {
      ...surface,
      id: 'side-emitter',
      transforms: [
        new Matrix4()
          .translate([2, 0, 2])
          .rotateY(-Math.PI / 2)
          .scale([0.4, 0.6, 0.6])
      ],
      material: {
        id: 'side-emitter-material',
        uniforms: {baseColorFactor: [0, 0, 0, 1], emissiveFactor: [2, 0, 0]}
      }
    } satisfies RayTracingSceneRenderOptions['surfaces'][number];
    const coatOnlyReceiver = {
      ...mappedCoat,
      material: {
        ...mappedCoat.material,
        uniforms: {...mappedCoat.material.uniforms, normalUVSet: 1},
        bindings: {pbr_clearcoatNormalSampler: replacement, pbr_normalSampler: replacement}
      }
    };
    options.surfaces = [
      coatOnlyReceiver,
      {
        ...sideEmitter,
        material: {
          ...sideEmitter.material,
          uniforms: {...sideEmitter.material.uniforms, emissiveFactor: [20, 0, 0]}
        }
      }
    ];
    options.lights = [];
    options.transportMode = 'pbr';
    options.emitterSampling = true;
    options.samplesPerPixel = 16;
    options.samplingFrameIndex = 0;
    const coatEmitter = (await readPixel())[0];
    expect(coatEmitter).toBeGreaterThan(3);
    coatOnlyReceiver.material.uniforms.clearcoatFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.transportMode = 'diffuse';
    options.samplingFrameIndex = undefined;
    options.surfaces = [mappedSurface, sideEmitter];
    options.lights = [];
    options.emitterSampling = true;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const mappedEmitter = (await readPixel())[0];
    mappedSurface.material.uniforms.normalScale = 0;
    expect(mappedEmitter).toBeGreaterThan((await readPixel())[0] + 5);

    options.emitterSampling = false;
    options.maxBounces = 1;
    const unmappedBounce = (await readPixel())[0];
    mappedSurface.material.uniforms.normalScale = 1;
    expect((await readPixel())[0]).toBeGreaterThan(unmappedBounce + 5);

    const mappedGlass = {
      ...mappedSurface,
      material: {
        ...mappedSurface.material,
        uniforms: {...mappedSurface.material.uniforms, transmissionFactor: 1, ior: 1.5}
      }
    };
    options.surfaces = [mappedGlass];
    options.transportMode = 'pbr';
    options.background = [0.8, 0.2, 0.05, 1];
    const mappedRefraction = await readPixel();
    expect(mappedRefraction[0]).toBeGreaterThan(50);
    mappedGlass.material.uniforms.normalScale = 0;
    expect(await readPixel()).toEqual(mappedRefraction);
    options.background = [0, 0, 0, 1];
    options.maxBounces = 0;
    options.samplesPerPixel = 1;
    replacement.writeData(new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]));
    options.lights = [{type: 'ambient', color: [1, 1, 1], intensity: 1}];
  } finally {
    destroy();
  }
}, 540_000);
