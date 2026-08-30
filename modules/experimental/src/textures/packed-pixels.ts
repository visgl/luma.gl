// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type TextureFormatPacked, type DecodeRGBA, EncodeRGBA} from './rgba-decoder';

export const TEXTURE_FORMAT_PIXEL_DECODERS: Record<
  TextureFormatPacked,
  {decodeRGBA?: DecodeRGBA; encodeRGBA?: EncodeRGBA}
> = {
  'rgba4unorm-webgl': {decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA},
  'rgb565unorm-webgl': {decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA},
  'rgb5a1unorm-webgl': {decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA},
  rgb10a2unorm: {decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA},
  rgb10a2uint: {decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA},
  rgb9e5ufloat: {decodeRGBA: decodePackedRGBAFloat, encodeRGBA: encodePackedRGBAFloat},
  rg11b10ufloat: {decodeRGBA: decodePackedRGBAFloat, encodeRGBA: encodePackedRGBAFloat}
};

// Per‐channel bitfield config for integer/unorm formats and defaultValues
interface ChannelConfig {
  shift?: number;
  mask: number;
  defaultValue?: number;
}

// Shared‐exponent float config (rgb9e5ufloat)
interface SharedExpChannelConfig extends ChannelConfig {
  // mask = mantissa mask for mant channels, mask = exponent mask for EXP channel
}

// IEEE‐style float config (rg11b10ufloat)
interface PerFloatChannelConfig {
  shift: number;
  mantBits: number;
  expBits: number;
}

// Unified format config covering all packed types
type FormatConfig =
  | {kind: 'unorm'; channels: ChannelConfig[]}
  | {kind: 'uint'; channels: ChannelConfig[]}
  | {
      kind: 'float-shared-exponent';
      mantBits: number;
      bias: number;
      channels: SharedExpChannelConfig[];
    }
  | {kind: 'float'; channels: PerFloatChannelConfig[]};

type FloatFormatConfig = Extract<FormatConfig, {kind: 'float-shared-exponent' | 'float'}>;

// Table of all supported packed formats
const FORMAT_CONFIG_TABLE: Record<
  | 'rgba4unorm-webgl'
  | 'rgb565unorm-webgl'
  | 'rgb5a1unorm-webgl'
  | 'rgb10a2unorm'
  | 'rgb10a2uint'
  | 'rgb9e5ufloat'
  | 'rg11b10ufloat',
  FormatConfig
> = {
  'rgba4unorm-webgl': {
    kind: 'unorm',
    channels: [
      {shift: 12, mask: 0x0f},
      {shift: 8, mask: 0x0f},
      {shift: 4, mask: 0x0f},
      {shift: 0, mask: 0x0f}
    ]
  },
  'rgb565unorm-webgl': {
    kind: 'unorm',
    channels: [
      {shift: 11, mask: 0x1f},
      {shift: 5, mask: 0x3f},
      {shift: 0, mask: 0x1f},
      {mask: 0x00, defaultValue: 1}
    ]
  },
  'rgb5a1unorm-webgl': {
    kind: 'unorm',
    channels: [
      {shift: 11, mask: 0x1f},
      {shift: 6, mask: 0x1f},
      {shift: 1, mask: 0x1f},
      {shift: 0, mask: 0x01}
    ]
  },
  rgb10a2unorm: {
    kind: 'unorm',
    channels: [
      {shift: 22, mask: 0x3ff},
      {shift: 12, mask: 0x3ff},
      {shift: 2, mask: 0x3ff},
      {shift: 0, mask: 0x003}
    ]
  },
  rgb10a2uint: {
    kind: 'uint',
    channels: [
      {shift: 22, mask: 0x3ff},
      {shift: 12, mask: 0x3ff},
      {shift: 2, mask: 0x3ff},
      {shift: 0, mask: 0x003}
    ]
  },
  rgb9e5ufloat: {
    kind: 'float-shared-exponent',
    mantBits: 9,
    bias: (1 << (5 - 1)) - 1,
    channels: [
      {shift: 0, mask: 0x1ff},
      {shift: 9, mask: 0x1ff},
      {shift: 18, mask: 0x1ff},
      {shift: 27, mask: 0x1f}
    ]
  },
  rg11b10ufloat: {
    kind: 'float',
    channels: [
      {shift: 0, mantBits: 6, expBits: 5},
      {shift: 11, mantBits: 6, expBits: 5},
      {shift: 22, mantBits: 5, expBits: 5}
    ]
  }
};

/** Decode RGBA for integer/unorm formats */
export function decodePackedRGBA(
  bits: number,
  format:
    | 'rgba4unorm-webgl'
    | 'rgb565unorm-webgl'
    | 'rgb5a1unorm-webgl'
    | 'rgb10a2unorm'
    | 'rgb10a2uint'
): [number, number, number, number] {
  const cfg = FORMAT_CONFIG_TABLE[format] as {kind: 'unorm' | 'uint'; channels: ChannelConfig[]};
  const out: [number, number, number, number] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const raw = extractRaw(bits, cfg.channels[i]);
    out[i] = cfg.kind === 'unorm' && cfg.channels[i].mask > 0 ? raw / cfg.channels[i].mask : raw;
  }
  return out;
}

/** Encode RGBA for integer/unorm formats */
export function encodePackedRGBA(
  rgba: [number, number, number, number],
  format:
    | 'rgba4unorm-webgl'
    | 'rgb565unorm-webgl'
    | 'rgb5a1unorm-webgl'
    | 'rgb10a2unorm'
    | 'rgb10a2uint'
): number {
  const cfg = FORMAT_CONFIG_TABLE[format] as {kind: 'unorm' | 'uint'; channels: ChannelConfig[]};
  let bits = 0;
  for (let i = 0; i < 4; i++) {
    const ch = cfg.channels[i];
    const raw =
      ch.defaultValue !== undefined
        ? ch.defaultValue
        : Math.min(
            Math.max(cfg.kind === 'unorm' ? Math.round(rgba[i] * ch.mask) : Math.round(rgba[i]), 0),
            ch.mask
          );
    bits = insertRaw(bits, raw, ch);
  }
  return bits;
}

/** Decode float-packed formats into [r,g,b,a=1] */
export function decodePackedRGBAFloat(
  bits: number,
  format: 'rgb9e5ufloat' | 'rg11b10ufloat'
): [number, number, number, number] {
  const formatConfig = getFloatFormatConfig(format);
  if (formatConfig.kind === 'float-shared-exponent') {
    const redMantissa = extractShared(bits, formatConfig.channels[0]);
    const greenMantissa = extractShared(bits, formatConfig.channels[1]);
    const blueMantissa = extractShared(bits, formatConfig.channels[2]);
    const exponent = extractShared(bits, formatConfig.channels[3]);
    const factor = Math.pow(2, exponent - formatConfig.bias - formatConfig.mantBits);
    return [redMantissa * factor, greenMantissa * factor, blueMantissa * factor, 1];
  }
  const redRaw = extractRaw(bits, makeChannelConfig(formatConfig.channels[0]));
  const greenRaw = extractRaw(bits, makeChannelConfig(formatConfig.channels[1]));
  const blueRaw = extractRaw(bits, makeChannelConfig(formatConfig.channels[2]));
  return [
    decodeUnsignedFloat(
      redRaw,
      formatConfig.channels[0].mantBits,
      formatConfig.channels[0].expBits
    ),
    decodeUnsignedFloat(
      greenRaw,
      formatConfig.channels[1].mantBits,
      formatConfig.channels[1].expBits
    ),
    decodeUnsignedFloat(
      blueRaw,
      formatConfig.channels[2].mantBits,
      formatConfig.channels[2].expBits
    ),
    1
  ];
}

/**
 * Encode float-packed formats from [r,g,b]
 * Note that alpha channel is ignored / not available
 */
export function encodePackedRGBAFloat(
  rgba: [number, number, number, number],
  format: 'rgb9e5ufloat' | 'rg11b10ufloat'
): number {
  const formatConfig = getFloatFormatConfig(format);
  let bits = 0;
  if (formatConfig.kind === 'float-shared-exponent') {
    const maximumFiniteValue = 65408;
    const channels = rgba
      .slice(0, 3)
      .map(value =>
        Number.isFinite(value) && value > 0 ? Math.min(value, maximumFiniteValue) : 0
      );
    const maximumChannel = Math.max(...channels);
    if (maximumChannel === 0) {
      return 0;
    }

    const maximumExponent = (1 << 5) - 1;
    let exponent = Math.min(
      Math.max(Math.floor(Math.log2(maximumChannel)) + formatConfig.bias + 1, 0),
      maximumExponent
    );
    let denominator = Math.pow(2, exponent - formatConfig.bias - formatConfig.mantBits);
    if (Math.round(maximumChannel / denominator) === 1 << formatConfig.mantBits) {
      exponent = Math.min(exponent + 1, maximumExponent);
      denominator *= 2;
    }

    const maximumMantissa = (1 << formatConfig.mantBits) - 1;
    for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
      const mantissa = Math.min(Math.round(channels[channelIndex] / denominator), maximumMantissa);
      bits = insertRaw(bits, mantissa, formatConfig.channels[channelIndex]);
    }
    bits = insertRaw(bits, exponent, formatConfig.channels[3]);
  } else {
    for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
      const channelConfig = formatConfig.channels[channelIndex];
      const encodedValue = encodeUnsignedFloat(
        rgba[channelIndex],
        channelConfig.mantBits,
        channelConfig.expBits
      );
      bits = insertRaw(bits, encodedValue, makeChannelConfig(channelConfig));
    }
  }
  return bits;
}

function getFloatFormatConfig(format: 'rgb9e5ufloat' | 'rg11b10ufloat'): FloatFormatConfig {
  // These keys are constrained to the two float entries in FORMAT_CONFIG_TABLE.
  return FORMAT_CONFIG_TABLE[format] as FloatFormatConfig;
}

function makeChannelConfig(channelConfig: PerFloatChannelConfig): ChannelConfig {
  return {
    shift: channelConfig.shift,
    mask: (1 << (channelConfig.mantBits + channelConfig.expBits)) - 1
  };
}

/** Extract raw bits or defaultValue for integer/unorm channels */
function extractRaw(bits: number, cfg: ChannelConfig): number {
  if (cfg.defaultValue !== undefined) return cfg.defaultValue;
  const shift = cfg.shift || 0;
  return (bits >>> shift) & cfg.mask;
}

/** Extract raw bits for shared-exponent fields */
function extractShared(bits: number, cfg: SharedExpChannelConfig): number {
  return (bits >>> (cfg.shift || 0)) & cfg.mask;
}

/** Insert raw channel bits into a packed word */
function insertRaw(bits: number, value: number, cfg: ChannelConfig): number {
  const shift = cfg.shift || 0;
  const mask = cfg.mask;
  const cleared = bits & ~(mask << shift);
  const packed = ((value & mask) << shift) >>> 0;
  return (cleared | packed) >>> 0;
}

/** Decode unsigned float from mantissa+exponent bits */
function decodeUnsignedFloat(
  raw: number,
  mantissaBitCount: number,
  exponentBitCount: number
): number {
  const exponentMask = (1 << exponentBitCount) - 1;
  const exponentBias = (1 << (exponentBitCount - 1)) - 1;
  const exponent = raw >>> mantissaBitCount;
  const mantissa = raw & ((1 << mantissaBitCount) - 1);
  if (exponent === 0) {
    return mantissa * Math.pow(2, 1 - exponentBias - mantissaBitCount);
  }
  if (exponent === exponentMask) {
    return mantissa === 0 ? Infinity : NaN;
  }
  return (1 + mantissa / (1 << mantissaBitCount)) * Math.pow(2, exponent - exponentBias);
}

/** Encode a float value into mantissa+exponent raw bits */
function encodeUnsignedFloat(
  value: number,
  mantissaBitCount: number,
  exponentBitCount: number
): number {
  const exponentMask = (1 << exponentBitCount) - 1;
  const mantissaMask = (1 << mantissaBitCount) - 1;
  const exponentBias = (1 << (exponentBitCount - 1)) - 1;
  if (Number.isNaN(value)) {
    return (exponentMask << mantissaBitCount) | 1;
  }
  if (value === Infinity) {
    return exponentMask << mantissaBitCount;
  }
  if (value <= 0) {
    return 0;
  }

  const minimumNormalValue = Math.pow(2, 1 - exponentBias);
  if (value < minimumNormalValue) {
    return Math.min(
      Math.round(value / Math.pow(2, 1 - exponentBias - mantissaBitCount)),
      mantissaMask
    );
  }

  const unbiasedExponent = Math.floor(Math.log2(value));
  let exponent = unbiasedExponent + exponentBias;
  let mantissa = Math.round((value / Math.pow(2, unbiasedExponent) - 1) * (1 << mantissaBitCount));
  if (mantissa > mantissaMask) {
    exponent++;
    mantissa = 0;
  }
  if (exponent >= exponentMask) {
    return exponentMask << mantissaBitCount;
  }
  return ((exponent << mantissaBitCount) | mantissa) >>> 0;
}
