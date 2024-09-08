// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureFormat} from './texture-formats';
import type {TextureFeature} from './texture-features';
import {decodeTextureFormat} from './decode-texture-format';

import {getTextureFormatDefinition} from './texture-format-table';

/**
 * Texture format capabilities.
 * @note Not directly usable. Can contain TextureFeature strings that need to be checked against a specific device.
 */
export type TextureFormatCapabilities = {
  format: TextureFormat;
  /** Can the format be created */
  create: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is renderable. */
  render: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is filterable. */
  filter: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is blendable. */
  blend: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is storeable. */
  store: TextureFeature | boolean;
};

export function getTextureFormatCapabilities(format: TextureFormat): TextureFormatCapabilities {
  const info = getTextureFormatDefinition(format);

  const formatCapabilities: Required<TextureFormatCapabilities> = {
    format,
    create: info.f ?? true,
    render: info.render ?? true,
    filter: info.filter ?? true,
    blend: info.blend ?? true,
    store: info.store ?? true
  };

  const formatInfo = decodeTextureFormat(format);
  const isDepthStencil = format.startsWith('depth') || format.startsWith('stencil');
  const isSigned = formatInfo?.signed;
  const isInteger = formatInfo?.integer;
  const isWebGLSpecific = formatInfo?.webgl;

  // signed formats are not renderable
  formatCapabilities.render &&= !isSigned;
  // signed and integer formats are not filterable
  formatCapabilities.filter &&= !isDepthStencil && !isSigned && !isInteger && !isWebGLSpecific;

  return formatCapabilities;
}
