// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
export const TEXTURE_FORMAT_PIXEL_DECODERS = {
    'rgba4unorm-webgl': { decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA },
    'rgb565unorm-webgl': { decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA },
    'rgb5a1unorm-webgl': { decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA },
    rgb10a2unorm: { decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA },
    rgb10a2uint: { decodeRGBA: decodePackedRGBA, encodeRGBA: encodePackedRGBA },
    rgb9e5ufloat: { decodeRGBA: decodePackedRGBAFloat, encodeRGBA: encodePackedRGBAFloat },
    rg11b10ufloat: { decodeRGBA: decodePackedRGBAFloat, encodeRGBA: encodePackedRGBAFloat }
};
// Table of all supported packed formats
const FORMAT_CONFIG_TABLE = {
    'rgba4unorm-webgl': {
        kind: 'unorm',
        channels: [
            { shift: 12, mask: 0x0f },
            { shift: 8, mask: 0x0f },
            { shift: 4, mask: 0x0f },
            { shift: 0, mask: 0x0f }
        ]
    },
    'rgb565unorm-webgl': {
        kind: 'unorm',
        channels: [
            { shift: 11, mask: 0x1f },
            { shift: 5, mask: 0x3f },
            { shift: 0, mask: 0x1f },
            { mask: 0x00, defaultValue: 1 }
        ]
    },
    'rgb5a1unorm-webgl': {
        kind: 'unorm',
        channels: [
            { shift: 11, mask: 0x1f },
            { shift: 6, mask: 0x1f },
            { shift: 1, mask: 0x1f },
            { shift: 0, mask: 0x01 }
        ]
    },
    rgb10a2unorm: {
        kind: 'unorm',
        channels: [
            { shift: 22, mask: 0x3ff },
            { shift: 12, mask: 0x3ff },
            { shift: 2, mask: 0x3ff },
            { shift: 0, mask: 0x003 }
        ]
    },
    rgb10a2uint: {
        kind: 'uint',
        channels: [
            { shift: 22, mask: 0x3ff },
            { shift: 12, mask: 0x3ff },
            { shift: 2, mask: 0x3ff },
            { shift: 0, mask: 0x003 }
        ]
    },
    rgb9e5ufloat: {
        kind: 'float-shared-exponent',
        mantBits: 9,
        bias: (1 << (5 - 1)) - 1,
        channels: [
            { shift: 0, mask: 0x1ff },
            { shift: 9, mask: 0x1ff },
            { shift: 18, mask: 0x1ff },
            { shift: 27, mask: 0x1f }
        ]
    },
    rg11b10ufloat: {
        kind: 'float',
        channels: [
            { shift: 0, mantBits: 6, expBits: 5 },
            { shift: 11, mantBits: 6, expBits: 5 },
            { shift: 22, mantBits: 5, expBits: 5 }
        ]
    }
};
/** Decode RGBA for integer/unorm formats */
export function decodePackedRGBA(bits, format) {
    const cfg = FORMAT_CONFIG_TABLE[format];
    const out = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        const raw = extractRaw(bits, cfg.channels[i]);
        out[i] = cfg.kind === 'unorm' && cfg.channels[i].mask > 0 ? raw / cfg.channels[i].mask : raw;
    }
    return out;
}
/** Encode RGBA for integer/unorm formats */
export function encodePackedRGBA(rgba, format) {
    const cfg = FORMAT_CONFIG_TABLE[format];
    let bits = 0;
    for (let i = 0; i < 4; i++) {
        const ch = cfg.channels[i];
        const raw = ch.defaultValue !== undefined
            ? ch.defaultValue
            : Math.min(Math.max(cfg.kind === 'unorm' ? Math.round(rgba[i] * ch.mask) : Math.round(rgba[i]), 0), ch.mask);
        bits = insertRaw(bits, raw, ch);
    }
    return bits;
}
/** Decode float-packed formats into [r,g,b,a=1] */
export function decodePackedRGBAFloat(bits, format) {
    const cfg = FORMAT_CONFIG_TABLE[format];
    if (cfg.kind === 'float-shared-exponent') {
        const mR = extractShared(bits, cfg.channels[0]);
        const mG = extractShared(bits, cfg.channels[1]);
        const mB = extractShared(bits, cfg.channels[2]);
        const e = extractShared(bits, cfg.channels[3]);
        if (e === 0)
            return [0, 0, 0, 1];
        const factor = Math.pow(2, e - cfg.bias - cfg.mantBits);
        return [mR * factor, mG * factor, mB * factor, 1];
    }
    const rRaw = extractRaw(bits, cfg.channels[0]);
    const gRaw = extractRaw(bits, cfg.channels[1]);
    const bRaw = extractRaw(bits, cfg.channels[2]);
    return [
        decodeUF(rRaw, cfg.channels[0].mantBits, cfg.channels[0].expBits),
        decodeUF(gRaw, cfg.channels[1].mantBits, cfg.channels[1].expBits),
        decodeUF(bRaw, cfg.channels[2].mantBits, cfg.channels[2].expBits),
        1
    ];
}
/**
 * Encode float-packed formats from [r,g,b]
 * Note that alpha channel is ignored / not available
 */
export function encodePackedRGBAFloat(rgba, format) {
    const cfg = FORMAT_CONFIG_TABLE[format];
    let bits = 0;
    if (cfg.kind === 'float-shared-exponent') {
        const [r, g, b] = rgba;
        const maxV = Math.max(r, g, b);
        const eRaw = maxV <= 0 ? 0 : Math.min(Math.max(Math.floor(Math.log2(maxV)) + cfg.bias, 1), (1 << 5) - 1);
        bits = insertRaw(bits, encodeUF(r, cfg.mantBits, 5, cfg.bias), cfg.channels[0]);
        bits = insertRaw(bits, encodeUF(g, cfg.mantBits, 5, cfg.bias), cfg.channels[1]);
        bits = insertRaw(bits, encodeUF(b, cfg.mantBits, 5, cfg.bias), cfg.channels[2]);
        bits = insertRaw(bits, eRaw, cfg.channels[3]);
    }
    else {
        const [r, g, b] = rgba;
        bits = insertRaw(bits, Math.round(r), cfg.channels[0]);
        bits = insertRaw(bits, Math.round(g), cfg.channels[1]);
        bits = insertRaw(bits, Math.round(b), cfg.channels[2]);
    }
    return bits;
}
/** Extract raw bits or defaultValue for integer/unorm channels */
function extractRaw(bits, cfg) {
    if (cfg.defaultValue !== undefined)
        return cfg.defaultValue;
    const shift = cfg.shift || 0;
    return (bits >>> shift) & cfg.mask;
}
/** Extract raw bits for shared-exponent fields */
function extractShared(bits, cfg) {
    return (bits >>> (cfg.shift || 0)) & cfg.mask;
}
/** Insert raw channel bits into a packed word */
function insertRaw(bits, value, cfg) {
    const shift = cfg.shift || 0;
    const mask = cfg.mask;
    const cleared = bits & ~(mask << shift);
    const packed = ((value & mask) << shift) >>> 0;
    return (cleared | packed) >>> 0;
}
/** Decode unsigned float from mantissa+exponent bits */
function decodeUF(raw, mantBits, expBits) {
    const expMask = (1 << expBits) - 1;
    const bias = (1 << (expBits - 1)) - 1;
    const eRaw = raw >>> mantBits;
    const mRaw = raw & ((1 << mantBits) - 1);
    if (eRaw === 0)
        return mRaw * Math.pow(2, 1 - bias - mantBits);
    if (eRaw === expMask)
        return mRaw === 0 ? Infinity : NaN;
    return (1 + mRaw / (1 << mantBits)) * Math.pow(2, eRaw - bias);
}
/** Encode a float value into mantissa+exponent raw bits */
function encodeUF(value, mantBits, expBits, bias) {
    if (value <= 0)
        return 0;
    const expRaw = Math.min(Math.max(Math.floor(Math.log2(value)) + bias, 1), (1 << expBits) - 1);
    const factor = Math.pow(2, mantBits - (expRaw - bias));
    const mantRaw = Math.round(value * factor);
    return ((expRaw << mantBits) | (mantRaw & ((1 << mantBits) - 1))) >>> 0;
}
