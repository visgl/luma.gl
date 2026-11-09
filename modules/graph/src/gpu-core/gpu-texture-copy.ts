// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type CommandEncoder} from '@luma.gl/core';
import {getTextureBindingInfo, type GPUGraphTextureBinding} from './gpu-texture-plan';

/** Bit-preserving copies of selected mip/layer ranges; no sampling or format conversion. @internal */
export function encodeTextureCopy(
  encoder: CommandEncoder,
  input: GPUGraphTextureBinding,
  output: GPUGraphTextureBinding
): void {
  const source = getTextureBindingInfo(input);
  const destination = getTextureBindingInfo(output);
  validateTextureCopy(input, output);
  for (let mipLevel = 0; mipLevel < source.mipLevels; mipLevel++) {
    encoder.copyTextureToTexture({
      sourceTexture: source.texture,
      destinationTexture: destination.texture,
      mipLevel: source.baseMipLevel + mipLevel,
      destinationMipLevel: destination.baseMipLevel + mipLevel,
      origin: [0, 0, source.baseArrayLayer],
      destinationOrigin: [0, 0, destination.baseArrayLayer],
      width: Math.max(1, source.width >> mipLevel),
      height: Math.max(1, source.height >> mipLevel),
      depthOrArrayLayers:
        source.dimension === '3d' ? Math.max(1, source.depth >> mipLevel) : source.depth
    });
  }
}

/** Validate copy compatibility before encoding any commands. @internal */
export function validateTextureCopy(
  input: GPUGraphTextureBinding,
  output: GPUGraphTextureBinding
): void {
  const source = getTextureBindingInfo(input);
  const destination = getTextureBindingInfo(output);
  assert(
    source.texture !== destination.texture &&
      source.samples === 1 &&
      destination.samples === 1 &&
      source.format === destination.format &&
      source.width === destination.width &&
      source.height === destination.height &&
      source.depth === destination.depth &&
      source.mipLevels === destination.mipLevels &&
      source.dimension === destination.dimension
  );
}
