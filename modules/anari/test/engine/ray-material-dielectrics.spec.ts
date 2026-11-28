// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core/matrix';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray dielectrics refract and absorb light and sample remaining material maps', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, replacement, readPixel, destroy} =
    await createMaterialFixture();
  try {
    const glass = {
      id: 'glass',
      geometry,
      material: {
        id: 'glass-material',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          transmissionFactor: 1,
          ior: 1.5
        }
      },
      transforms: [new Matrix4()]
    };
    const emitter = {
      id: 'emitter',
      geometry,
      material: {
        id: 'emitter-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          emissiveFactor: [0.8, 0, 0] as [number, number, number]
        }
      },
      transforms: [new Matrix4().translate([0, 0, -2])]
    };
    options.surfaces = [glass, emitter];
    options.primitives = {glass: {type: 'sphere', radius: 1}};
    options.transportMode = 'pbr';
    options.maxBounces = 0;
    expect(await readPixel()).toEqual([255, 255, 255]);
    options.lights = [];
    options.maxBounces = 2;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const transmitted = await readPixel();
    expect(transmitted[0]).toBeGreaterThan(100);
    expect(transmitted[1]).toBeLessThan(4);
    expect(transmitted[2]).toBeLessThan(4);
    options.surfaces = [glass];
    options.background = [0.8, 0.2, 0.05, 1];
    options.samplingFrameIndex = 0;
    const backdrop = await readPixel();
    expect(backdrop[0]).toBeGreaterThan(100);
    expect(backdrop[1]).toBeGreaterThan(20);
    const absorbingGlass = {
      ...glass,
      material: {
        ...glass.material,
        uniforms: {
          ...glass.material.uniforms,
          attenuationColor: [1, 0.25, 0] as [number, number, number],
          attenuationDistance: 2
        }
      }
    };
    options.surfaces = [absorbingGlass];
    const tintedBackdrop = await readPixel();
    expect(tintedBackdrop[0]).toBe(backdrop[0]);
    expect(tintedBackdrop[1]).toBeLessThan(backdrop[1] / 2);
    expect(tintedBackdrop[2]).toBeLessThan(backdrop[2]);
    absorbingGlass.material.uniforms.attenuationDistance = 1;
    const denserBackdrop = await readPixel();
    expect(denserBackdrop[1]).toBeLessThan(tintedBackdrop[1]);
    absorbingGlass.material.uniforms.attenuationDistance = Number.POSITIVE_INFINITY;
    expect(await readPixel()).toEqual(backdrop);
    // This seed transmits at entry, reflects once inside the sphere, then exits.
    options.samplingSeed = 81;
    options.samplesPerPixel = 1;
    options.maxBounces = 2;
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.maxBounces = 3;
    const clearReflectedPath = await readPixel();
    expect(clearReflectedPath[1]).toBeGreaterThan(40);
    absorbingGlass.material.uniforms.attenuationDistance = 2;
    const absorbedReflectedPath = await readPixel();
    expect(absorbedReflectedPath[0]).toBe(clearReflectedPath[0]);
    expect(absorbedReflectedPath[1]).toBeGreaterThan(0);
    expect(absorbedReflectedPath[1]).toBeLessThan(tintedBackdrop[1] / 2);

    // Model a shell split across two mesh primitives with opposite winding.
    const exitSurface = {
      ...absorbingGlass,
      id: 'glass-exit',
      transforms: [new Matrix4().translate([0, 0, -2]).rotateY(Math.PI)]
    };
    options.primitives = {};
    options.surfaces = [absorbingGlass, exitSurface];
    options.samplingSeed = 17;
    options.samplesPerPixel = 16;
    options.maxBounces = 2;
    const splitBackdrop = await readPixel();
    expect(splitBackdrop[0]).toBeGreaterThan(100);
    expect(splitBackdrop[1]).toBeLessThan(backdrop[1] / 2);
    options.primitives = {glass: {type: 'sphere', radius: 1}};
    options.samplingFrameIndex = undefined;
    options.background = [0, 0, 0, 1];
    options.surfaces = [glass, emitter];
    options.surfaces[0].material.bindings = {pbr_transmissionSampler: replacement};
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.surfaces = [emitter];
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [0, 0, 0, 1],
      emissiveFactor: [1, 1, 1]
    };
    options.surfaces[0].material.bindings = {pbr_emissiveSampler: replacement};
    expect(await readPixel()).toEqual([0, 255, 0]);
    options.surfaces = [surface];
    options.primitives = {};
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 1}];
    options.maxBounces = 0;
    options.surfaces[0].material.bindings = {};
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0, 1]
    };
    const scalarMaterial = await readPixel();
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [1, 1]
    };
    options.surfaces[0].material.bindings = {pbr_metallicRoughnessSampler: replacement};
    expect(await readPixel()).toEqual(scalarMaterial);
    // In nested, index-matched shells the outer absorber must resume after exit
    // from the inner one. The inner segment uses only the inner medium.
    const outer = {
      ...glass,
      id: 'outer-volume',
      material: {
        id: 'outer',
        uniforms: {
          transmissionFactor: 1,
          ior: 1,
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          attenuationColor: [0.25, 1, 1] as [number, number, number],
          attenuationDistance: 1
        }
      }
    };
    const inner = {
      ...outer,
      id: 'inner-volume',
      material: {
        id: 'inner',
        uniforms: {
          ...outer.material.uniforms,
          attenuationColor: [1, 0.25, 1] as [number, number, number]
        }
      }
    };
    options.surfaces = [outer, inner];
    options.primitives = {
      'outer-volume': {type: 'sphere', radius: 1},
      'inner-volume': {type: 'sphere', radius: 0.5}
    };
    options.background = [1, 1, 1, 1];
    options.lights = [];
    options.maxBounces = 4;
    const camera = options.camera;
    options.cameraProjection = 'orthographic';
    options.camera = {
      ...camera,
      projectionMatrix: new Matrix4().ortho({
        left: -1,
        right: 1,
        bottom: -1,
        top: 1,
        near: 0.1,
        far: 20
      })
    };
    const [outerAbsorption, innerAbsorption, unabsorbed] = await readPixel();
    expect(outerAbsorption).toBeGreaterThan(45);
    expect(outerAbsorption).toBeLessThan(90);
    expect(innerAbsorption).toBeGreaterThan(45);
    expect(innerAbsorption).toBeLessThan(105);
    expect(unabsorbed).toBe(255);
    options.camera = camera;
    options.cameraProjection = 'perspective';

    // A diffuse receiver inside glass must not turn a camera backdrop into a light.
    options.surfaces = [surface, glass];
    options.surfaces[0].material.bindings = {};
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0, 1]
    };
    options.surfaces[1].material.bindings = {};
    options.primitives = {glass: {type: 'sphere', radius: 6}};
    options.lights = [];
    options.background = [0.8, 0.2, 0.05, 1];
    options.maxBounces = 3;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
  // Software WebGPU CI compiles several complete traversal/material pipelines here.
}, 540_000);
