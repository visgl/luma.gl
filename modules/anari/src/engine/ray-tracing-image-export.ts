// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {fromHalfFloat} from '@luma.gl/shaders';
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

export type RayTracingRadianceTile = Omit<RayTracingImageTile, 'data'> & {
  /** Tightly packed little-endian RGBA16F rows, top to bottom. Alpha stores history confidence. */
  data: Uint8Array;
};

type ExportScene = Omit<
  RayTracingSceneRenderOptions,
  'id' | 'width' | 'height' | 'framebuffer' | 'imageRegion' | 'samplingFrameIndex'
>;

/**
 * Exports a fixed scene one RGBA8 tile at a time. Camera matrices describe the full image.
 * Keep scene inputs unchanged while iterating. Closing the iterator releases GPU resources.
 */
export function exportRayTracingImage(
  device: Device,
  scene: ExportScene,
  options: RayTracingImageExportOptions
): AsyncGenerator<RayTracingImageTile> {
  return exportTiles(device, scene, options, false);
}

/** Exports linear HDR history before display filtering, exposure, and tone mapping. */
export function exportRayTracingRadiance(
  device: Device,
  scene: ExportScene,
  options: RayTracingImageExportOptions
): AsyncGenerator<RayTracingRadianceTile> {
  return exportTiles(device, {...scene, denoiseRadius: 0, exposure: 1}, options, true);
}

async function* exportTiles(
  device: Device,
  scene: ExportScene,
  options: RayTracingImageExportOptions,
  linearRadiance: boolean
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
            rayBatchPhaseCount: undefined,
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
        const bytesPerPixel = linearRadiance ? 8 : 4;
        let bytes: Uint8Array;
        let bytesPerRow: number;
        let readOffset = 0;
        if (linearRadiance) {
          const radiance = await renderer.readRadiance('ray-image-export');
          // The rendered frame has a completed history texture.
          assert(radiance);
          bytes = radiance.data;
          bytesPerRow = radiance.width * bytesPerPixel;
          readOffset = readOptions.y * bytesPerRow + readOptions.x * bytesPerPixel;
        } else {
          const layout = color.computeMemoryLayout(readOptions);
          buffer = device.createBuffer({
            byteLength: layout.byteLength,
            usage: Buffer.COPY_DST | Buffer.MAP_READ
          });
          color.readBuffer(readOptions, buffer);
          bytes = await buffer.readAsync();
          bytesPerRow = layout.bytesPerRow;
        }
        options.signal?.throwIfAborted();
        const rowBytes = tile.width * bytesPerPixel;
        data = new Uint8Array(rowBytes * tile.height);
        for (let row = 0; row < tile.height; row++) {
          const offset = readOffset + row * bytesPerRow;
          data.set(bytes.subarray(offset, offset + rowBytes), row * rowBytes);
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

/** Encodes a complete row-major HDR tile stream as a little-endian RGB PFM file. */
export async function encodeRayTracingRadiancePFM(
  width: number,
  height: number,
  tiles: AsyncIterable<RayTracingRadianceTile> | Iterable<RayTracingRadianceTile>
): Promise<Uint8Array<ArrayBuffer>> {
  validateImageSize(width, height);
  const header = new TextEncoder().encode(`PF\n${width} ${height}\n-1.0\n`);
  const file = new Uint8Array(header.length + width * height * 12);
  file.set(header);
  const pixels = new DataView(file.buffer, header.length);
  for await (const tile of validateTiles(width, height, tiles, 8)) {
    const samples = new DataView(tile.data.buffer, tile.data.byteOffset, tile.data.byteLength);
    for (let row = 0; row < tile.height; row++) {
      // PFM stores the bottom row first.
      const outputRow = height - 1 - tile.y - row;
      for (let column = 0; column < tile.width; column++) {
        const source = (row * tile.width + column) * 8;
        const target = (outputRow * width + tile.x + column) * 12;
        for (let channel = 0; channel < 3; channel++) {
          const bits = samples.getUint16(source + channel * 2, true);
          pixels.setFloat32(target + channel * 4, fromHalfFloat(bits), true);
        }
      }
    }
  }
  return file;
}

/**
 * Encodes a complete row-major RGBA8 tile stream as a browser PNG.
 * Tiles should contain sRGB display color and opaque alpha. The CPU canvas holds the full image.
 */
export async function encodeRayTracingImagePNG(
  width: number,
  height: number,
  tiles: AsyncIterable<RayTracingImageTile> | Iterable<RayTracingImageTile>
): Promise<Blob> {
  validateImageSize(width, height);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  // Canvas 2D is required by the browser PNG encoder.
  assert(context);
  try {
    for await (const tile of validateTiles(width, height, tiles, 4)) {
      const pixels = new Uint8ClampedArray(tile.data);
      context.putImageData(new ImageData(pixels, tile.width, tile.height), tile.x, tile.y);
    }
    return await canvas.convertToBlob({type: 'image/png'});
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

function validateImageSize(width: number, height: number): void {
  // Match the limits of the tile iterator.
  assert(
    Number.isInteger(width) &&
      Number.isInteger(height) &&
      width > 0 &&
      height > 0 &&
      width * height <= 0xffffffff
  );
}

async function* validateTiles(
  width: number,
  height: number,
  tiles: AsyncIterable<RayTracingImageTile> | Iterable<RayTracingImageTile>,
  bytesPerPixel: number
): AsyncGenerator<RayTracingImageTile> {
  let expectedX = 0;
  let expectedY = 0;
  let bandHeight = 0;
  for await (const tile of tiles) {
    if (expectedX === 0) bandHeight = tile.height;
    // Accept contiguous tile bands covering the image exactly once.
    assert(
      tile.x === expectedX &&
        tile.y === expectedY &&
        tile.height === bandHeight &&
        Number.isInteger(tile.width) &&
        Number.isInteger(tile.height) &&
        tile.width > 0 &&
        tile.height > 0 &&
        tile.x + tile.width <= width &&
        tile.y + tile.height <= height &&
        tile.data.byteLength === tile.width * tile.height * bytesPerPixel
    );
    yield tile;
    expectedX += tile.width;
    if (expectedX === width) {
      expectedX = 0;
      expectedY += bandHeight;
    }
  }
  // Reject a prematurely terminated tile stream.
  assert(expectedX === 0 && expectedY === height);
}
