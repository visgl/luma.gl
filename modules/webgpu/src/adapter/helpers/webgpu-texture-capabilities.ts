// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  textureFormatDecoder,
  type DeviceFeatures,
  type DeviceTextureFormatCapabilities,
  type TextureFormat,
  type WebGPUDeviceFeatureLevel
} from '@luma.gl/core';

const CREATE = 1;
const RENDER = 2;
const FILTER = 4;
const BLEND = 8;
const STORE = 16;
const CAPABILITY_MASK = CREATE | RENDER | FILTER | BLEND | STORE;
const TIER_1_SHIFT = 5;
const CORE_SHIFT = 10;

/** Returns spec-derived texture usages for the active WebGPU feature set. */
export function getWebGPUTextureFormatCapabilities(
  format: TextureFormat,
  features: DeviceFeatures,
  featureLevel: WebGPUDeviceFeatureLevel
): DeviceTextureFormatCapabilities {
  const encodedCapabilities = textureFormatDecoder.getWebGPUCapabilities(format);
  let capabilities = encodedCapabilities & CAPABILITY_MASK;

  if (features.has('texture-formats-tier1')) {
    capabilities |= (encodedCapabilities >> TIER_1_SHIFT) & CAPABILITY_MASK;
  }
  if (featureLevel !== 'compatibility' || features.has('core-features-and-limits')) {
    capabilities |= (encodedCapabilities >> CORE_SHIFT) & CAPABILITY_MASK;
  }

  const staticCapabilities = textureFormatDecoder.getCapabilities(format);
  const requiredFeature =
    typeof staticCapabilities.create === 'string' && !staticCapabilities.create.endsWith('-webgl')
      ? staticCapabilities.create
      : null;
  if (requiredFeature && !features.has(requiredFeature)) {
    capabilities = 0;
  }

  if (format === 'bgra8unorm' && features.has('bgra8unorm-storage')) {
    capabilities |= STORE;
  }
  if (format === 'rg11b10ufloat' && features.has('rg11b10ufloat-renderable')) {
    capabilities |= RENDER | BLEND;
  }
  if (format === 'r32float' || format === 'rg32float' || format === 'rgba32float') {
    if (features.has('float32-filterable')) {
      capabilities |= FILTER;
    }
    if (features.has('float32-blendable')) {
      capabilities |= BLEND;
    }
  }

  const create = Boolean(capabilities & CREATE);
  return {
    format,
    create,
    render: create && Boolean(capabilities & RENDER),
    filter: create && Boolean(capabilities & FILTER),
    blend: create && Boolean(capabilities & BLEND),
    store: create && Boolean(capabilities & STORE)
  };
}
