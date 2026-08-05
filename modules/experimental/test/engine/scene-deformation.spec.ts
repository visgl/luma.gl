// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {SceneRenderer, type SceneSurface} from '@luma.gl/experimental';
import {getTestDevices} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('SceneRenderer draws existing skin palettes and updates morph targets on available backends', async testCase => {
  for (const device of await getTestDevices()) {
    const renderer = new SceneRenderer(device);
    const surface: SceneSurface = {
      id: `deformed-${device.type}`,
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
          NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
          JOINTS_0: {size: 4, value: new Uint16Array(12)},
          WEIGHTS_0: {
            size: 4,
            value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
          }
        }
      }),
      material: {id: `deformed-material-${device.type}`},
      transforms: [new Matrix4()],
      skin: {jointMatrices: Array.from(new Matrix4())},
      morphTargets: [{POSITION: new Float32Array([0.2, 0, 0, 0, 0.2, 0, 0, 0, 0])}],
      morphWeights: [0]
    };
    const options = {
      id: `deformed-frame-${device.type}`,
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
      width: 16,
      height: 16
    };

    try {
      testCase.equal(
        renderer.render(options).drawCount,
        1,
        `${device.type} draws existing skin data`
      );
      device.submit();
      surface.morphWeights = [0.75];
      testCase.equal(
        renderer.render(options).drawCount,
        1,
        `${device.type} updates morph geometry`
      );
      device.submit();
    } finally {
      renderer.destroy();
    }
  }
  testCase.end();
});
