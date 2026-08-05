// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry, type SceneRenderOptions, type SceneSurface} from '@luma.gl/engine';
import {DeferredSceneRenderer} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('DeferredSceneRenderer resolves generic instanced PBR surfaces on WebGPU', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const renderer = new DeferredSceneRenderer(device);
  const surface: SceneSurface = {
    id: 'deferred-surface',
    geometry: new Geometry({
      topology: 'triangle-list',
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
      }
    }),
    material: {
      id: 'deferred-material',
      uniforms: {
        baseColorFactor: [0.8, 0.4, 0.2, 1],
        metallicRoughnessValues: [0.7, 0.25]
      }
    },
    transforms: [new Matrix4().translate([-0.5, 0, 0]), new Matrix4().translate([0.5, 0, 0])]
  };
  const options: SceneRenderOptions = {
    id: 'deferred-frame',
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
      {type: 'ambient', color: [1, 1, 1], intensity: 0.2},
      {type: 'directional', direction: [0, 0, -1], intensity: 1},
      {type: 'point', position: [0, 0.5, 2], intensity: 8}
    ],
    width: 32,
    height: 32
  };

  try {
    const deferredStatistics = renderer.render(options);
    device.submit();
    testCase.equal(
      deferredStatistics.drawCount,
      1,
      'deferred capture preserves one instanced draw'
    );
    testCase.equal(deferredStatistics.instanceCount, 2, 'deferred capture preserves placements');

    surface.material.uniforms = {...surface.material.uniforms, transmissionFactor: 0.4};
    const forwardStatistics = renderer.render(options);
    device.submit();
    testCase.equal(
      forwardStatistics.drawCount,
      1,
      'advanced materials use shared forward fallback'
    );
    testCase.equal(forwardStatistics.instanceCount, 2, 'forward fallback preserves placements');
  } finally {
    renderer.destroy();
  }
  testCase.end();
});
