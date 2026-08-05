// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry, SceneRenderer, type SceneSurface} from '@luma.gl/engine';
import {getTestDevices} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('SceneRenderer draws canonical instanced physical materials on available backends', async testCase => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([255, 128, 64, 255])
    });
    const renderer = new SceneRenderer(device);
    const surface: SceneSurface = {
      id: `physical-${device.type}`,
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
          NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
          TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
          COLOR_0: {size: 3, value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])}
        },
        indices: new Uint16Array([0, 1, 2])
      }),
      material: {
        id: `material-${device.type}`,
        doubleSided: true,
        uniforms: {
          baseColorFactor: [1, 1, 1, 1],
          metallicRoughnessValues: [0.7, 0.3],
          clearcoatFactor: 0.35,
          emissiveStrength: 2
        },
        bindings: {pbr_baseColorSampler: texture}
      },
      transforms: [new Matrix4().translate([-0.5, 0, 0]), new Matrix4().translate([0.5, 0, 0])]
    };
    const options = {
      id: `frame-${device.type}`,
      surfaces: [surface],
      camera: {
        viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]}),
        projectionMatrix: new Matrix4().perspective({
          fovy: Math.PI / 3,
          aspect: 1,
          near: 0.1,
          far: 100
        }),
        position: [0, 0, 4]
      },
      lights: [
        {type: 'ambient' as const, color: [1, 1, 1] as [number, number, number], intensity: 0.2},
        {
          type: 'directional' as const,
          direction: [0, 0, -1] as [number, number, number],
          intensity: 1
        }
      ],
      width: 32,
      height: 32
    };

    try {
      const statistics = renderer.render(options);
      device.submit();
      testCase.equal(statistics.drawCount, 1, `${device.type} executes one canonical PBR draw`);
      testCase.equal(statistics.instanceCount, 2, `${device.type} preserves both placements`);
      testCase.equal(statistics.triangleCount, 2, `${device.type} counts indexed instances`);

      surface.material.uniforms = {...surface.material.uniforms, clearcoatFactor: 0.8};
      testCase.equal(renderer.render(options).drawCount, 1, `${device.type} updates PBR uniforms`);
      device.submit();
    } finally {
      renderer.destroy();
      texture.destroy();
    }
  }
  testCase.end();
});
