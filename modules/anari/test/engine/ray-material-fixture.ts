// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {RayTracingSceneRenderer, type RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core/matrix';

/** Creates isolated material state and GPU resources for a pixel regression. */
export async function createMaterialFixture() {
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)}
  });
  const renderer = new RayTracingSceneRenderer(device);
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-4, -4, 0, 4, -4, 0, 0, 4, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
      TEXCOORD_0: {size: 2, value: new Float32Array([0.25, 0.5, 0.25, 0.5, 0.25, 0.5])},
      TEXCOORD_1: {size: 2, value: new Float32Array([0.75, 0.5, 0.75, 0.5, 0.75, 0.5])}
    }
  });
  const map = device.createTexture({
    id: 'same-label',
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
    sampler: {minFilter: 'nearest', magFilter: 'nearest'}
  });
  const replacement = device.createTexture({
    id: map.id,
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]),
    sampler: map.sampler
  });
  const color = device.createTexture({
    width: 8,
    height: 8,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 8,
    height: 8,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const surface = {
    id: 'triangle',
    geometry,
    material: {
      id: 'material',
      uniforms: {
        baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
        baseColorUVSet: 0,
        baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
      },
      bindings: {pbr_baseColorSampler: map}
    },
    transforms: [new Matrix4()]
  };
  const options: RayTracingSceneRenderOptions = {
    id: 'pixels',
    surfaces: [surface],
    camera: {
      position: [0, 0, 4],
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 1,
        near: 0.1,
        far: 20
      })
    },
    width: 8,
    height: 8,
    framebuffer,
    exposure: 1,
    toneMapMode: 0,
    outputColorSpace: 'linear',
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 1}],
    progressive: true,
    temporalReprojection: false,
    adaptiveResolution: false,
    resolutionScale: 1
  };
  /** Statistics from the most recent fixture render. */
  let statistics: ReturnType<RayTracingSceneRenderer['render']> | undefined;
  /** Render once and average the RGB channels of adjacent pixels on the center row. */
  async function readMeanColor(pixelCount: 1 | 4): Promise<number[]> {
    statistics = renderer.render(options);
    device.submit();
    const layout = color.computeMemoryLayout({width: pixelCount, height: 1});
    const buffer = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      color.readBuffer(
        {x: 4 - Math.floor(pixelCount / 2), y: 4, width: pixelCount, height: 1},
        buffer
      );
      const bytes = await buffer.readAsync();
      const pixels = new Uint8Array(bytes.buffer, bytes.byteOffset, pixelCount * 4);
      const mean = [0, 0, 0];
      for (let pixel = 0; pixel < pixelCount; pixel++) {
        for (let channel = 0; channel < 3; channel++) {
          mean[channel] += pixels[4 * pixel + channel] / pixelCount;
        }
      }
      return mean;
    } finally {
      buffer.destroy();
    }
  }
  let mipMap: Texture | undefined;
  function destroy(): void {
    renderer.destroy();
    framebuffer.destroy();
    color.destroy();
    map.destroy();
    mipMap?.destroy();
    replacement.destroy();
    device.destroy();
  }
  return {
    options,
    surface,
    geometry,
    renderer,
    replacement,
    map,
    /** Retrieves statistics from the same submission as the pixel readback. */
    getStatistics: () => statistics,
    readPixel: () => readMeanColor(1),
    readMeanColor,
    readRadiance: () => renderer.readRadiance(options.id),
    destroy,
    get mipMap(): Texture {
      mipMap ??= createMipMap(device);
      return mipMap;
    }
  };
}

function createMipMap(device: Device): Texture {
  const mipMap = device.createTexture({
    width: 32,
    height: 32,
    mipLevels: 6,
    format: 'rgba8unorm',
    sampler: {minFilter: 'nearest', magFilter: 'nearest', mipmapFilter: 'nearest'}
  });
  for (let level = 0; level < 6; level++) {
    const size = 32 >> level;
    const texels = new Uint8Array(size * size * 4);
    for (let offset = 0; offset < texels.length; offset += 4) {
      texels.set(
        level === 0 ? [255, 0, 0, 255] : level === 5 ? [0, 0, 255, 255] : [0, 255, 0, 255],
        offset
      );
    }
    mipMap.writeData(texels, {mipLevel: level, width: size, height: size});
  }
  return mipMap;
}
