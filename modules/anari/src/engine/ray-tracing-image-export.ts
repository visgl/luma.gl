// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {
  RayTracingSceneRenderer,
  type RayTracingSceneRenderOptions
} from './ray-tracing-scene-renderer';

export type RayTracingImageExportOptions = {
  width: number;
  height: number;
  /** Interior tile edge in pixels, excluding history/filter halos; defaults to 512. */
  tileSize?: number;
  /** Progressive frames per tile, from 1 to 256; defaults to one. */
  frames?: number;
  signal?: AbortSignal;
};

export type RayTracingImageTileRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Clipped render extent including history/filter halos. */
  renderX: number;
  renderY: number;
  renderWidth: number;
  renderHeight: number;
};

export type RayTracingImageTile = Pick<
  RayTracingImageTileRegion,
  'x' | 'y' | 'width' | 'height'
> & {
  /** Tightly packed RGBA8 rows, top to bottom. Each tile owns its CPU storage. */
  data: Uint8Array;
};

/** Lazily partitions an image into row-major interiors and clipped filter/history halos. */
export function* iterateRayTracingImageTiles(
  width: number,
  height: number,
  tileSize: number,
  halo = 0
): Generator<RayTracingImageTileRegion> {
  // Positive integer image/tile dimensions and a bounded history/filter radius protect allocations and uint32 pixel seeds.
  assert(
    [width, height, tileSize].every(value => Number.isInteger(value) && value > 0) &&
      width * height <= 0xffffffff &&
      Number.isInteger(halo) &&
      halo >= 0 &&
      halo <= 257
  );
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const tileWidth = Math.min(tileSize, width - x);
      const tileHeight = Math.min(tileSize, height - y);
      const renderX = Math.max(0, x - halo);
      const renderY = Math.max(0, y - halo);
      yield {
        x,
        y,
        width: tileWidth,
        height: tileHeight,
        renderX,
        renderY,
        renderWidth: Math.min(width, x + tileWidth + halo) - renderX,
        renderHeight: Math.min(height, y + tileHeight + halo) - renderY
      };
    }
  }
}

/**
 * Exports a fixed scene one RGBA8 tile at a time, submitting and reading its own commands.
 * Camera matrices describe the complete output image. Keep scene inputs unchanged while iterating.
 * Breaking/returning from iteration releases all export-owned GPU resources.
 */
export async function* exportRayTracingImage(
  device: Device,
  scene: Omit<
    RayTracingSceneRenderOptions,
    'id' | 'width' | 'height' | 'framebuffer' | 'imageRegion' | 'samplingFrameIndex'
  >,
  options: RayTracingImageExportOptions
): AsyncGenerator<RayTracingImageTile> {
  const tileSize = options.tileSize ?? 512;
  const frames = options.frames ?? 1;
  // History color clamping adds one neighbor dependency per progressive frame after the first.
  const halo = (scene.denoiseRadius ?? 0) + frames - 1;
  // Each padded render target must fit the device limit; frames share a deterministic sequence.
  assert(
    device.type === 'webgpu' &&
      tileSize + halo * 2 <= device.limits.maxTextureDimension2D &&
      Number.isInteger(frames) &&
      frames >= 1 &&
      frames <= 256
  );
  const renderer = new RayTracingSceneRenderer(device);
  try {
    for (const tile of iterateRayTracingImageTiles(options.width, options.height, tileSize, halo)) {
      options.signal?.throwIfAborted();
      const color = device.createTexture({
        width: tile.renderWidth,
        height: tile.renderHeight,
        format: 'rgba8unorm',
        usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
      });
      let framebuffer: Framebuffer | undefined;
      let buffer: Buffer | undefined;
      let data: Uint8Array;
      try {
        framebuffer = device.createFramebuffer({
          width: tile.renderWidth,
          height: tile.renderHeight,
          colorAttachments: [color],
          depthStencilAttachment: 'depth24plus'
        });
        for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
          options.signal?.throwIfAborted();
          renderer.render({
            ...scene,
            id: 'ray-image-export',
            framebuffer,
            width: tile.renderWidth,
            height: tile.renderHeight,
            imageRegion: {
              offset: [tile.renderX, tile.renderY],
              fullSize: [options.width, options.height]
            },
            samplingFrameIndex: frameIndex,
            progressive: true,
            resolutionScale: 1,
            adaptiveResolution: false,
            temporalReprojection: false,
            debugView: 'color'
          });
          device.submit();
        }
        const readOptions = {
          x: tile.x - tile.renderX,
          y: tile.y - tile.renderY,
          width: tile.width,
          height: tile.height
        };
        const layout = color.computeMemoryLayout(readOptions);
        buffer = device.createBuffer({
          byteLength: layout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        color.readBuffer(readOptions, buffer);
        const bytes = await buffer.readAsync();
        options.signal?.throwIfAborted();
        data = new Uint8Array(tile.width * tile.height * 4);
        for (let row = 0; row < tile.height; row++) {
          data.set(
            bytes.subarray(row * layout.bytesPerRow, row * layout.bytesPerRow + tile.width * 4),
            row * tile.width * 4
          );
        }
      } finally {
        buffer?.destroy();
        framebuffer?.destroy();
        color.destroy();
      }
      yield {x: tile.x, y: tile.y, width: tile.width, height: tile.height, data};
    }
  } finally {
    renderer.destroy();
  }
}
