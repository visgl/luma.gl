// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  const cfg = FORMAT_CONFIG_TABLE[format] as any;
  if (cfg.kind === 'float-shared-exponent') {
    const mR = extractShared(bits, cfg.channels[0] as SharedExpChannelConfig);
    const mG = extractShared(bits, cfg.channels[1] as SharedExpChannelConfig);
    const mB = extractShared(bits, cfg.channels[2] as SharedExpChannelConfig);
    const e = extractShared(bits, cfg.channels[3] as SharedExpChannelConfig);
    if (e === 0) return [0, 0, 0, 1];
    const factor = Math.pow(2, e - cfg.bias - cfg.mantBits);
    return [mR * factor, mG * factor, mB * factor, 1];
  }
  const rRaw = extractRaw(bits, cfg.channels[0] as ChannelConfig);
  const gRaw = extractRaw(bits, cfg.channels[1] as ChannelConfig);
  const bRaw = extractRaw(bits, cfg.channels[2] as ChannelConfig);
  return [
    decodeUF(
      rRaw,
      (cfg.channels[0] as PerFloatChannelConfig).mantBits,
      (cfg.channels[0] as PerFloatChannelConfig).expBits
    ),
    decodeUF(
      gRaw,
      (cfg.channels[1] as PerFloatChannelConfig).mantBits,
      (cfg.channels[1] as PerFloatChannelConfig).expBits
    ),
    decodeUF(
      bRaw,
      (cfg.channels[2] as PerFloatChannelConfig).mantBits,
      (cfg.channels[2] as PerFloatChannelConfig).expBits
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
  const cfg = FORMAT_CONFIG_TABLE[format];
  let bits = 0;
  if (cfg.kind === 'float-shared-exponent') {
    const [r, g, b] = rgba;
    const maxV = Math.max(r, g, b);
    const eRaw =
      maxV <= 0 ? 0 : Math.min(Math.max(Math.floor(Math.log2(maxV)) + cfg.bias, 1), (1 << 5) - 1);
    bits = insertRaw(
      bits,
      encodeUF(r, cfg.mantBits, 5, cfg.bias),
      cfg.channels[0] as ChannelConfig
    );
    bits = insertRaw(
      bits,
      encodeUF(g, cfg.mantBits, 5, cfg.bias),
      cfg.channels[1] as ChannelConfig
    );
    bits = insertRaw(
      bits,
      encodeUF(b, cfg.mantBits, 5, cfg.bias),
      cfg.channels[2] as ChannelConfig
    );
    bits = insertRaw(bits, eRaw, cfg.channels[3] as ChannelConfig);
  } else {
    const [r, g, b] = rgba;
    bits = insertRaw(bits, Math.round(r), cfg.channels[0] as ChannelConfig);
    bits = insertRaw(bits, Math.round(g), cfg.channels[1] as ChannelConfig);
    bits = insertRaw(bits, Math.round(b), cfg.channels[2] as ChannelConfig);
  }
  return bits;
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
function decodeUF(raw: number, mantBits: number, expBits: number): number {
  const expMask = (1 << expBits) - 1;
  const bias = (1 << (expBits - 1)) - 1;
  const eRaw = raw >>> mantBits;
  const mRaw = raw & ((1 << mantBits) - 1);
  if (eRaw === 0) return mRaw * Math.pow(2, 1 - bias - mantBits);
  if (eRaw === expMask) return mRaw === 0 ? Infinity : NaN;
  return (1 + mRaw / (1 << mantBits)) * Math.pow(2, eRaw - bias);
}

/** Encode a float value into mantissa+exponent raw bits */
function encodeUF(value: number, mantBits: number, expBits: number, bias: number): number {
  if (value <= 0) return 0;
  const expRaw = Math.min(Math.max(Math.floor(Math.log2(value)) + bias, 1), (1 << expBits) - 1);
  const factor = Math.pow(2, mantBits - (expRaw - bias));
  const mantRaw = Math.round(value * factor);
  return ((expRaw << mantBits) | (mantRaw & ((1 << mantBits) - 1))) >>> 0;
}
