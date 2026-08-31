// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  DeferredSceneRenderer,
  type SceneRenderOptions,
  type SceneSurface
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('DeferredSceneRenderer resolves generic instanced PBR surfaces within WebGPU core limits', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const supportsRawValidationErrorScopes =
    device.info.gpu !== 'software' && device.info.gpuType !== 'cpu' && !device.info.fallback;
  if (!supportsRawValidationErrorScopes) {
    void 0;
  }

  expect(
    device.limits.maxColorAttachmentBytesPerSample,
    'the deferred renderer uses the default 32-byte WebGPU core attachment limit'
  ).toBe(32);
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
    if (supportsRawValidationErrorScopes) {
      device.handle.pushErrorScope('validation');
    }
    const deferredStatistics = renderer.render(options);
    expect(
      Boolean(renderer.getLastDepthTexture(options.id)),
      'compatible deferred frames expose their sampleable G-buffer depth'
    ).toBe(true);
    device.submit();
    if (supportsRawValidationErrorScopes) {
      const deferredValidationError = await device.handle.popErrorScope();
      expect(
        deferredValidationError,
        'compact HDR deferred capture and submission avoid WebGPU validation errors'
      ).toBe(null);
    }
    expect(deferredStatistics.drawCount, 'deferred capture preserves one instanced draw').toBe(1);
    expect(deferredStatistics.instanceCount, 'deferred capture preserves placements').toBe(2);

    const offscreenStatistics = renderer.render({
      ...options,
      id: 'deferred-offscreen-frame',
      framebuffer: offscreenFramebuffer
    });
    device.submit();
    expect(offscreenStatistics.drawCount, 'deferred resolve honors caller framebuffer').toBe(1);

    if (device.info.gpu !== 'software' && device.info.gpuType !== 'cpu' && !device.info.fallback) {
      const layout = offscreenTexture.computeMemoryLayout({width: 1, height: 1});
      const readback = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        offscreenTexture.readBuffer({x: 16, y: 16, width: 1, height: 1}, readback);
        const pixel = await readback.readAsync(0, layout.byteLength);
        expect(
          Boolean(pixel[0] > 0 || pixel[1] > 0 || pixel[2] > 0),
          'deferred lighting writes visible color into the supplied offscreen target'
        ).toBe(true);
      } finally {
        readback.destroy();
      }
    } else {
      void 0;
    }

    surface.material.uniforms = {...surface.material.uniforms, transmissionFactor: 0.4};
    const forwardStatistics = renderer.render(options);
    expect(
      renderer.getLastDepthTexture(options.id),
      'forward fallback does not expose stale deferred depth'
    ).toBe(null);
    device.submit();
    expect(forwardStatistics.drawCount, 'advanced materials use shared forward fallback').toBe(1);
    expect(forwardStatistics.instanceCount, 'forward fallback preserves placements').toBe(2);
  } finally {
    renderer.destroy();
    offscreenFramebuffer.destroy();
    offscreenTexture.destroy();
  }
  void 0;
});
