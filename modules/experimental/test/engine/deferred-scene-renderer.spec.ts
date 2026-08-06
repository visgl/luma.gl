// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  DeferredSceneRenderer,
  type SceneRenderOptions,
  type SceneSurface
} from '@luma.gl/experimental';
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
  const offscreenTexture = device.createTexture({
    id: 'deferred-offscreen-color',
    width: 32,
    height: 32,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const offscreenFramebuffer = device.createFramebuffer({
    id: 'deferred-offscreen-framebuffer',
    width: 32,
    height: 32,
    colorAttachments: [offscreenTexture]
  });

  try {
    const deferredStatistics = renderer.render(options);
    device.submit();
    testCase.equal(
      deferredStatistics.drawCount,
      1,
      'deferred capture preserves one instanced draw'
    );
    testCase.equal(deferredStatistics.instanceCount, 2, 'deferred capture preserves placements');

    const offscreenStatistics = renderer.render({
      ...options,
      id: 'deferred-offscreen-frame',
      framebuffer: offscreenFramebuffer
    });
    device.submit();
    testCase.equal(offscreenStatistics.drawCount, 1, 'deferred resolve honors caller framebuffer');

    if (device.info.gpu !== 'software' && device.info.gpuType !== 'cpu' && !device.info.fallback) {
      const layout = offscreenTexture.computeMemoryLayout({width: 1, height: 1});
      const readback = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        offscreenTexture.readBuffer({x: 16, y: 16, width: 1, height: 1}, readback);
        const pixel = await readback.readAsync(0, layout.byteLength);
        testCase.ok(
          pixel[0] > 0 || pixel[1] > 0 || pixel[2] > 0,
          'deferred lighting writes visible color into the supplied offscreen target'
        );
      } finally {
        readback.destroy();
      }
    } else {
      testCase.comment(
        'software WebGPU resolves the offscreen target without unsupported MAP_READ'
      );
    }

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
    offscreenFramebuffer.destroy();
    offscreenTexture.destroy();
  }
  testCase.end();
});
