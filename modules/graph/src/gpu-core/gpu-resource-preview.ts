// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import type {GPUCommandGraphResourceSummary} from './gpu-command-graph-types';

/** Bounded, tightly packed current allocation contents, not a historical node snapshot. */
export type GPUResourcePreview = {
  data: Uint8Array;
  width?: number;
  height?: number;
  format?: string;
};

/** Explicit diagnostic readback. Call only after submitting the graph's command buffer. */
export async function readGPUResourcePreview(
  resource: Buffer | Texture,
  summary: GPUCommandGraphResourceSummary
): Promise<GPUResourcePreview> {
  if (resource.destroyed) throw new Error('Resource has been destroyed.');
  if (resource instanceof Buffer) {
    if (!(resource.usage & Buffer.COPY_SRC)) throw new Error('Preview requires COPY_SRC usage.');
    const byteOffset = summary.byteOffset ?? 0;
    const byteLength = Math.min(256, summary.byteLength ?? resource.byteLength - byteOffset);
    if (byteOffset < 0 || byteLength < 0 || byteOffset + byteLength > resource.byteLength)
      throw new Error('Preview range is outside the buffer.');
    return {
      data: byteLength ? await resource.readAsync(byteOffset, byteLength) : new Uint8Array(),
      format: summary.format
    };
  }
  const formatInfo = resource.device.getTextureFormatInfo(resource.format);
  // Packed-format byte sizes are not yet reliable in the shared format metadata.
  if (formatInfo.packed) throw new Error('Packed texture previews are not supported.');
  if (resource.device.type !== 'webgpu') throw new Error('Texture previews require WebGPU.');
  if (!((resource.props.usage ?? 0) & Texture.COPY_SRC))
    throw new Error('Preview requires COPY_SRC usage.');
  if (
    resource.samples !== 1 ||
    formatInfo.compressed ||
    resource.format.startsWith('depth') ||
    resource.format.startsWith('stencil')
  )
    throw new Error('Preview requires a single-sample, uncompressed color texture.');
  const mipLevel = summary.baseMipLevel ?? 0;
  const width = Math.min(32, summary.width ?? Math.max(1, resource.width >> mipLevel));
  const height = Math.min(32, summary.height ?? Math.max(1, resource.height >> mipLevel));
  const layout = resource.computeMemoryLayout({width, height, depthOrArrayLayers: 1});
  const staging = resource.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.MAP_READ | Buffer.COPY_DST
  });
  const encoder = resource.device.createCommandEncoder();
  try {
    encoder.copyTextureToBuffer({
      sourceTexture: resource,
      destinationBuffer: staging,
      mipLevel,
      origin: [0, 0, summary.baseArrayLayer ?? 0],
      width,
      height,
      depthOrArrayLayers: 1,
      bytesPerRow: layout.bytesPerRow
    });
    resource.device.submit(encoder.finish());
    const padded = await staging.readAsync();
    const rowByteLength = width * formatInfo.bytesPerPixel;
    const data = new Uint8Array(rowByteLength * height);
    for (let row = 0; row < height; row++)
      data.set(
        padded.subarray(row * layout.bytesPerRow, row * layout.bytesPerRow + rowByteLength),
        row * rowByteLength
      );
    return {data, width, height, format: resource.format};
  } finally {
    staging.destroy();
    encoder.destroy();
  }
}
