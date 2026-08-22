// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  DeviceFeatures,
  DeviceTextureFormatCapabilities,
  TextureFormat,
  WebGPUDeviceFeatureLevel
} from '@luma.gl/core';

const TIER_1_FORMATS = new Set<TextureFormat>([
  'r16unorm',
  'r16snorm',
  'rg16unorm',
  'rg16snorm',
  'rgba16unorm',
  'rgba16snorm'
]);

const RENDERABLE_FORMATS = new Set<TextureFormat>([
  'r8unorm',
  'r8uint',
  'r8sint',
  'rg8unorm',
  'rg8uint',
  'rg8sint',
  'rgba8unorm',
  'rgba8unorm-srgb',
  'rgba8uint',
  'rgba8sint',
  'bgra8unorm',
  'bgra8unorm-srgb',
  'r16unorm',
  'r16snorm',
  'r16uint',
  'r16sint',
  'r16float',
  'rg16unorm',
  'rg16snorm',
  'rg16uint',
  'rg16sint',
  'rg16float',
  'rgba16unorm',
  'rgba16snorm',
  'rgba16uint',
  'rgba16sint',
  'rgba16float',
  'r32uint',
  'r32sint',
  'r32float',
  'rg32uint',
  'rg32sint',
  'rg32float',
  'rgba32uint',
  'rgba32sint',
  'rgba32float',
  'rgb10a2uint',
  'rgb10a2unorm',
  'stencil8',
  'depth16unorm',
  'depth24plus',
  'depth24plus-stencil8',
  'depth32float',
  'depth32float-stencil8'
]);

const TIER_1_RENDERABLE_FORMATS = new Set<TextureFormat>(['r8snorm', 'rg8snorm', 'rgba8snorm']);

const FILTERABLE_FORMATS = new Set<TextureFormat>([
  'r8unorm',
  'r8snorm',
  'rg8unorm',
  'rg8snorm',
  'rgba8unorm',
  'rgba8unorm-srgb',
  'rgba8snorm',
  'bgra8unorm',
  'bgra8unorm-srgb',
  'r16float',
  'rg16float',
  'rgba16float',
  'rgb9e5ufloat',
  'rgb10a2unorm',
  'rg11b10ufloat'
]);

const BLENDABLE_FORMATS = new Set<TextureFormat>([
  'r8unorm',
  'rg8unorm',
  'rgba8unorm',
  'rgba8unorm-srgb',
  'bgra8unorm',
  'bgra8unorm-srgb',
  'r16unorm',
  'r16snorm',
  'r16float',
  'rg16unorm',
  'rg16snorm',
  'rg16float',
  'rgba16unorm',
  'rgba16snorm',
  'rgba16float',
  'rgb10a2unorm'
]);

const TIER_1_BLENDABLE_FORMATS = new Set<TextureFormat>(['r8snorm', 'rg8snorm', 'rgba8snorm']);

const STORAGE_FORMATS = new Set<TextureFormat>([
  'rgba8unorm',
  'rgba8snorm',
  'rgba8uint',
  'rgba8sint',
  'rgba16unorm',
  'rgba16snorm',
  'rgba16uint',
  'rgba16sint',
  'rgba16float',
  'r32uint',
  'r32sint',
  'r32float',
  'rgba32uint',
  'rgba32sint',
  'rgba32float'
]);

const TIER_1_STORAGE_FORMATS = new Set<TextureFormat>([
  'r8unorm',
  'r8snorm',
  'r8uint',
  'r8sint',
  'rg8unorm',
  'rg8snorm',
  'rg8uint',
  'rg8sint',
  'r16unorm',
  'r16snorm',
  'r16uint',
  'r16sint',
  'r16float',
  'rg16unorm',
  'rg16snorm',
  'rg16uint',
  'rg16sint',
  'rg16float',
  'rgb10a2uint',
  'rgb10a2unorm',
  'rg11b10ufloat'
]);

const CORE_STORAGE_FORMATS = new Set<TextureFormat>(['rg32uint', 'rg32sint', 'rg32float']);

/** Returns spec-derived texture usages for the active WebGPU feature set. */
export function getWebGPUTextureFormatCapabilities(
  format: TextureFormat,
  features: DeviceFeatures,
  featureLevel: WebGPUDeviceFeatureLevel
): DeviceTextureFormatCapabilities {
  const tier1 = features.has('texture-formats-tier1');
  const core = featureLevel !== 'compatibility' || features.has('core-features-and-limits');
  const create = isWebGPUTextureFormatSupported(format, features, tier1, core);
  const render =
    create &&
    (RENDERABLE_FORMATS.has(format) ||
      (tier1 && TIER_1_RENDERABLE_FORMATS.has(format)) ||
      (format === 'rg11b10ufloat' && features.has('rg11b10ufloat-renderable')));
  const filter =
    create &&
    (FILTERABLE_FORMATS.has(format) ||
      (isFloat32Format(format) && features.has('float32-filterable')) ||
      isCompressedFormat(format));
  const blend =
    render &&
    (BLENDABLE_FORMATS.has(format) ||
      (tier1 && TIER_1_BLENDABLE_FORMATS.has(format)) ||
      (isFloat32Format(format) && features.has('float32-blendable')) ||
      (format === 'rg11b10ufloat' && features.has('rg11b10ufloat-renderable')));
  const store =
    create &&
    (STORAGE_FORMATS.has(format) ||
      (tier1 && TIER_1_STORAGE_FORMATS.has(format)) ||
      (core && CORE_STORAGE_FORMATS.has(format)) ||
      (format === 'bgra8unorm' && features.has('bgra8unorm-storage')));

  return {format, create, render, filter, blend, store};
}

function isWebGPUTextureFormatSupported(
  format: TextureFormat,
  features: DeviceFeatures,
  tier1: boolean,
  core: boolean
): boolean {
  if (format.includes('webgl')) {
    return false;
  }
  if (TIER_1_FORMATS.has(format) && !tier1) {
    return false;
  }
  if (format === 'bgra8unorm-srgb' && !core) {
    return false;
  }
  if (format === 'depth32float-stencil8') {
    return features.has('depth32float-stencil8');
  }
  if (format.startsWith('bc')) {
    return features.has('texture-compression-bc');
  }
  if (format.startsWith('etc2') || format.startsWith('eac')) {
    return features.has('texture-compression-etc2');
  }
  if (format.startsWith('astc')) {
    return features.has('texture-compression-astc');
  }
  return true;
}

function isFloat32Format(format: TextureFormat): boolean {
  return format === 'r32float' || format === 'rg32float' || format === 'rgba32float';
}

function isCompressedFormat(format: TextureFormat): boolean {
  return (
    format.startsWith('bc') ||
    format.startsWith('etc2') ||
    format.startsWith('eac') ||
    format.startsWith('astc')
  );
}
