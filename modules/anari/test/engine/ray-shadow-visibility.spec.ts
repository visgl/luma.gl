// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('uses triangle alpha mips consistently for color and picking when enabled', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const fixture = await createMaterialFixture();
  const {options, surface, geometry, renderer, readPixel, destroy} = fixture;
  try {
    const texture = fixture.mipMap;
    texture.writeData(new Uint8Array(32 * 32 * 4), {width: 32, height: 32});
    const triangle = new Geometry({
      topology: 'triangle-list',
      attributes: {
        ...geometry.attributes,
        TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])}
      }
    });
    options.background = [0, 0, 0, 1];
    options.surfaces = [
      {
        ...surface,
        geometry: triangle,
        material: {
          id: 'cutout',
          alphaMode: 'MASK',
          uniforms: {baseColorFactor: [1, 1, 1, 1], alphaCutoff: 0.5},
          bindings: {pbr_baseColorSampler: texture}
        }
      }
    ];
    expect(await readPixel()).toEqual([0, 0, 0]);
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();
    options.filteredCutouts = true;
    expect((await readPixel()).some(channel => channel > 0)).toBe(true);
    expect(await renderer.pick(options.id, 4, 4)).not.toBeNull();
  } finally {
    destroy();
  }
}, 180_000);

it('tints an analytic shadow through a thin layer and retains opaque blocking', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.transportMode = 'pbr';
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.lights = [
      {type: 'directional', direction: [-1, 0, -1], color: [1, 1, 1], intensity: 2}
    ];
    const receiver = {
      ...surface,
      material: {
        id: 'receiver',
        uniforms: {baseColorFactor: [1, 1, 1, 1] as [number, number, number, number]}
      }
    };
    const sheet = {
      ...surface,
      id: 'sheet',
      transforms: [new Matrix4().translate([1.5, 0, 1.5]).scale([0.22, 0.22, 0.22])],
      material: {
        id: 'thin-sheet',
        uniforms: {
          diffuseTransmissionFactor: 0.5,
          diffuseTransmissionColorFactor: [1, 0, 0] as [number, number, number]
        }
      }
    };
    options.surfaces = [receiver];
    const [unoccluded] = await readPixel();
    expect(unoccluded).toBeGreaterThan(30);
    options.surfaces = [receiver, sheet];
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.transmissiveShadows = true;
    const [red, green, blue] = await readPixel();
    expect(red).toBeGreaterThan(unoccluded * 0.35);
    expect(red).toBeLessThan(unoccluded * 0.55);
    expect([green, blue]).toEqual([0, 0]);
    options.surfaces.push({
      ...sheet,
      id: 'second-sheet',
      transforms: [new Matrix4().translate([2, 0, 2]).scale([0.22, 0.22, 0.22])]
    });
    const [stackedRed] = await readPixel();
    expect(stackedRed / unoccluded).toBeCloseTo((red / unoccluded) ** 2, 1);
    sheet.material.uniforms.diffuseTransmissionFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
}, 180_000);

it('filters cutouts on analytic shadow rays while keeping the camera receiver visible', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, mipMap, readPixel, destroy} = await createMaterialFixture();
  try {
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.lights = [
      {type: 'directional', direction: [-1, 0, -1], color: [1, 1, 1], intensity: 2}
    ];
    options.surfaces = [{...surface, material: {id: 'white-receiver', uniforms: {}}}];
    const lit = await readPixel();
    expect(lit[0]).toBeGreaterThan(30);
    mipMap.writeData(new Uint8Array(32 * 32 * 4), {width: 32, height: 32});
    options.surfaces.push({
      ...surface,
      id: 'shadow-cutout',
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 4, 0, 2, 4])}
        }
      }),
      transforms: [new Matrix4().translate([1.5, 0, 1.5]).scale([0.22, 0.22, 0.22])],
      material: {
        id: 'shadow-mask',
        alphaMode: 'MASK',
        uniforms: {alphaCutoff: 0.5},
        bindings: {pbr_baseColorSampler: mipMap}
      }
    });
    expect(await readPixel()).toEqual(lit);
    options.filteredCutouts = true;
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.shadows = false;
    expect(await readPixel()).toEqual(lit);
  } finally {
    destroy();
  }
}, 180_000);

it('attenuates index-matched analytic spheres over the traversed light segment', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.transportMode = 'pbr';
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.cameraProjection = 'orthographic';
    options.camera = {
      ...options.camera,
      projectionMatrix: new Matrix4().ortho({
        left: -0.45,
        right: 0.35,
        bottom: -0.35,
        top: 0.45,
        near: 0.1,
        far: 20
      })
    };
    options.lights = [{type: 'directional', direction: [-1, 0, -1], intensity: 2}];
    const receiver = {...surface, material: {id: 'receiver', uniforms: {}}};
    const sphere = {
      ...surface,
      id: 'shadow-sphere',
      transforms: [new Matrix4().translate([1.2, 0, 1.2])],
      material: {
        id: 'absorbing',
        uniforms: {
          transmissionFactor: 1,
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          ior: 1,
          attenuationDistance: 0.8,
          attenuationColor: [0.25, 0.5, 1] as [number, number, number]
        }
      }
    };
    options.primitives = {[sphere.id]: {type: 'sphere', radius: 0.4}};
    options.surfaces = [receiver];
    const unoccluded = await readPixel();
    expect(unoccluded[0]).toBeGreaterThan(50);

    options.surfaces = [receiver, sphere];
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.transmissiveShadows = true;
    const throughSphere = await readPixel();
    expect(throughSphere[0] / unoccluded[0]).toBeCloseTo(0.25, 1);
    expect(throughSphere[1] / unoccluded[1]).toBeCloseTo(0.5, 1);
    expect(throughSphere[2]).toBe(unoccluded[2]);

    sphere.material.uniforms.transmissionFactor = 0.5;
    const fractional = await readPixel();
    expect(fractional[2] / unoccluded[2]).toBeCloseTo(0.25, 1);
    sphere.material.uniforms.transmissionFactor = 1;

    options.lights = [{type: 'point', position: [1.2, 0, 1.2], intensity: 2}];
    options.surfaces = [receiver];
    const pointUnoccluded = await readPixel();
    expect(pointUnoccluded[0]).toBeGreaterThan(30);
    options.surfaces = [receiver, sphere];
    const insideSphere = await readPixel();
    expect(insideSphere[0] / pointUnoccluded[0]).toBeCloseTo(0.5, 1);
    expect(insideSphere[1] / pointUnoccluded[1]).toBeCloseTo(Math.sqrt(0.5), 1);
    expect(insideSphere[2]).toBe(pointUnoccluded[2]);

    sphere.material.uniforms.ior = 1.5;
    expect(await readPixel()).toEqual([0, 0, 0]);
    sphere.transforms = [new Matrix4().translate([1.8, 0, 1.8])];
    expect(await readPixel()).toEqual(pointUnoccluded);
  } finally {
    destroy();
  }
}, 180_000);
