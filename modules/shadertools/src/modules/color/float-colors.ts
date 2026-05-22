// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {ShaderModule} from '../../lib/shader-module/shader-module';

/** Props for semantic color normalization helpers. */
export type ColorsProps = {
  /**
   * When true, semantic colors are interpreted as 0-255 byte-style values and normalized in shader code.
   * When false, semantic colors are interpreted directly as floats.
   */
  useByteColors?: boolean;
};

/** Uniforms consumed by semantic color normalization helpers. */
export type ColorsUniforms = {
  /** Controls whether shader helpers normalize semantic colors from byte space. */
  useByteColors: boolean;
};

/** Backward-compatible props alias for shaders that import `floatColors`. */
export type FloatColorsProps = ColorsProps;
/** Backward-compatible uniform alias for shaders that import `floatColors`. */
export type FloatColorsUniforms = ColorsUniforms;

/** Packed storage color formats decoded by `storageColors`. */
export type StorageColorFormat = 'rgba8unorm' | 'rgba16float' | 'rgba32float';

/** Numeric WGSL tags written to `storageColors.format`. */
export const STORAGE_COLOR_FORMAT = {
  RGBA8UNORM: 0,
  RGBA16FLOAT: 1,
  RGBA32FLOAT: 2
} as const;

/** Numeric WGSL tag for one packed storage color format. */
export type StorageColorFormatValue =
  (typeof STORAGE_COLOR_FORMAT)[keyof typeof STORAGE_COLOR_FORMAT];

/** Bytes occupied by one tightly packed storage color row. */
export const STORAGE_COLOR_FORMAT_BYTE_LENGTHS: Record<StorageColorFormat, number> = {
  rgba8unorm: 4,
  rgba16float: 8,
  rgba32float: 16
};

/** Default byte stride for one tightly packed storage color row. */
export const STORAGE_COLOR_DEFAULT_BYTE_STRIDES: Record<StorageColorFormat, number> = {
  ...STORAGE_COLOR_FORMAT_BYTE_LENGTHS
};

/** Props for reading packed color rows from a read-only storage buffer. */
export type StorageColorsProps = {
  /** Storage buffer containing raw packed color words. */
  colorBuffer?: Binding;
  /** Per-row storage color representation. Defaults to `rgba8unorm`. */
  format?: StorageColorFormat | StorageColorFormatValue;
  /** Byte offset to the first color. Must be 4-byte aligned. Defaults to `0`. */
  byteOffset?: number;
  /** Bytes between color rows. Must be 4-byte aligned. Defaults to the packed format size. */
  byteStride?: number;
};

/** Uniforms consumed by the packed storage color reader. */
export type StorageColorsUniforms = {
  /** Numeric `STORAGE_COLOR_FORMAT` tag used by WGSL. */
  format: StorageColorFormatValue;
  /** Uint32 words between storage color rows. */
  wordStride: number;
  /** Uint32 word offset to the first storage color row. */
  wordOffset: number;
  /** Reserved field retaining a 16-byte uniform block. */
  _padding: number;
};

/** Bindings consumed by the packed storage color reader. */
export type StorageColorsBindings = {
  /** Raw packed storage color buffer exposed as `array<u32>`. */
  storageColorsBuffer?: Binding;
};

const STORAGE_COLOR_FORMAT_BY_NAME: Record<StorageColorFormat, StorageColorFormatValue> = {
  rgba8unorm: STORAGE_COLOR_FORMAT.RGBA8UNORM,
  rgba16float: STORAGE_COLOR_FORMAT.RGBA16FLOAT,
  rgba32float: STORAGE_COLOR_FORMAT.RGBA32FLOAT
};

const STORAGE_COLOR_FORMAT_NAME_BY_VALUE: Record<StorageColorFormatValue, StorageColorFormat> = {
  [STORAGE_COLOR_FORMAT.RGBA8UNORM]: 'rgba8unorm',
  [STORAGE_COLOR_FORMAT.RGBA16FLOAT]: 'rgba16float',
  [STORAGE_COLOR_FORMAT.RGBA32FLOAT]: 'rgba32float'
};

const COLORS_UNIFORM_TYPES = {
  useByteColors: 'f32'
} as const;

const COLORS_DEFAULT_UNIFORMS = {
  useByteColors: true
} as const;

const STORAGE_COLORS_UNIFORM_TYPES = {
  format: 'u32',
  wordStride: 'u32',
  wordOffset: 'u32',
  _padding: 'u32'
} as const;

const STORAGE_COLORS_DEFAULT_UNIFORMS = {
  format: STORAGE_COLOR_FORMAT.RGBA8UNORM,
  wordStride: STORAGE_COLOR_DEFAULT_BYTE_STRIDES.rgba8unorm / Uint32Array.BYTES_PER_ELEMENT,
  wordOffset: 0,
  _padding: 0
} as const satisfies StorageColorsUniforms;

const COLORS_GLSL = buildGLSLColorModuleSource('colors');
const FLOAT_COLORS_GLSL = buildGLSLColorModuleSource('floatColors');
const COLORS_WGSL = buildWGSLColorModuleSource('colors');
const FLOAT_COLORS_WGSL = buildWGSLColorModuleSource('floatColors');

const STORAGE_COLORS_WGSL = /* wgsl */ `\
struct storageColorsUniforms {
  format: u32,
  wordStride: u32,
  wordOffset: u32,
  _padding: u32
};

@group(0) @binding(auto) var<uniform> storageColors : storageColorsUniforms;
@group(0) @binding(auto) var<storage, read> storageColorsBuffer : array<u32>;

const STORAGE_COLOR_FORMAT_RGBA8UNORM : u32 = ${STORAGE_COLOR_FORMAT.RGBA8UNORM}u;
const STORAGE_COLOR_FORMAT_RGBA16FLOAT : u32 = ${STORAGE_COLOR_FORMAT.RGBA16FLOAT}u;

fn storageColors_getWordIndex(rowIndex: u32) -> u32 {
  return storageColors.wordOffset + rowIndex * storageColors.wordStride;
}

fn storageColors_readRgba8UnormColor(wordIndex: u32) -> vec4<f32> {
  return unpack4x8unorm(storageColorsBuffer[wordIndex]);
}

fn storageColors_readRgba16FloatColor(wordIndex: u32) -> vec4<f32> {
  let redGreen = unpack2x16float(storageColorsBuffer[wordIndex]);
  let blueAlpha = unpack2x16float(storageColorsBuffer[wordIndex + 1u]);
  return vec4<f32>(redGreen.x, redGreen.y, blueAlpha.x, blueAlpha.y);
}

fn storageColors_readRgba32FloatColor(wordIndex: u32) -> vec4<f32> {
  return vec4<f32>(
    bitcast<f32>(storageColorsBuffer[wordIndex]),
    bitcast<f32>(storageColorsBuffer[wordIndex + 1u]),
    bitcast<f32>(storageColorsBuffer[wordIndex + 2u]),
    bitcast<f32>(storageColorsBuffer[wordIndex + 3u])
  );
}

fn storageColors_readColor(rowIndex: u32) -> vec4<f32> {
  let wordIndex = storageColors_getWordIndex(rowIndex);
  if (storageColors.format == STORAGE_COLOR_FORMAT_RGBA8UNORM) {
    return storageColors_readRgba8UnormColor(wordIndex);
  }
  if (storageColors.format == STORAGE_COLOR_FORMAT_RGBA16FLOAT) {
    return storageColors_readRgba16FloatColor(wordIndex);
  }
  return storageColors_readRgba32FloatColor(wordIndex);
}
`;

function buildGLSLColorModuleSource(primaryPrefix: string): string {
  return /* glsl */ `\
layout(std140) uniform ${primaryPrefix}Uniforms {
  float useByteColors;
} ${primaryPrefix};

vec3 ${primaryPrefix}_normalize(vec3 inputColor) {
  return ${primaryPrefix}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${primaryPrefix}_normalize(vec4 inputColor) {
  return ${primaryPrefix}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${primaryPrefix}_premultiplyAlpha(vec4 inputColor) {
  return vec4(inputColor.rgb * inputColor.a, inputColor.a);
}

vec4 ${primaryPrefix}_unpremultiplyAlpha(vec4 inputColor) {
  return inputColor.a > 0.0 ? vec4(inputColor.rgb / inputColor.a, inputColor.a) : vec4(0.0);
}

vec4 ${primaryPrefix}_premultiply_alpha(vec4 inputColor) {
  return ${primaryPrefix}_premultiplyAlpha(inputColor);
}

vec4 ${primaryPrefix}_unpremultiply_alpha(vec4 inputColor) {
  return ${primaryPrefix}_unpremultiplyAlpha(inputColor);
}
`;
}

function buildWGSLColorModuleSource(primaryPrefix: string): string {
  return /* wgsl */ `\
struct ${primaryPrefix}Uniforms {
  useByteColors: f32
};

@group(0) @binding(auto) var<uniform> ${primaryPrefix} : ${primaryPrefix}Uniforms;

fn ${primaryPrefix}_normalize(inputColor: vec3<f32>) -> vec3<f32> {
  return select(inputColor, inputColor / 255.0, ${primaryPrefix}.useByteColors > 0.5);
}

fn ${primaryPrefix}_normalize4(inputColor: vec4<f32>) -> vec4<f32> {
  return select(inputColor, inputColor / 255.0, ${primaryPrefix}.useByteColors > 0.5);
}

fn ${primaryPrefix}_premultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(inputColor.rgb * inputColor.a, inputColor.a);
}

fn ${primaryPrefix}_unpremultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return select(
    vec4<f32>(0.0),
    vec4<f32>(inputColor.rgb / inputColor.a, inputColor.a),
    inputColor.a > 0.0
  );
}

fn ${primaryPrefix}_premultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${primaryPrefix}_premultiplyAlpha(inputColor);
}

fn ${primaryPrefix}_unpremultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${primaryPrefix}_unpremultiplyAlpha(inputColor);
}
`;
}

function getStorageColorsUniforms(props: StorageColorsProps = {}): StorageColorsUniforms {
  const format = resolveStorageColorFormat(props.format);
  const formatName = STORAGE_COLOR_FORMAT_NAME_BY_VALUE[format];
  const byteStride = props.byteStride ?? STORAGE_COLOR_DEFAULT_BYTE_STRIDES[formatName];
  const byteOffset = props.byteOffset ?? 0;
  const minimumByteStride = STORAGE_COLOR_FORMAT_BYTE_LENGTHS[formatName];

  validateStorageColorByteAlignment('byteStride', byteStride);
  validateStorageColorByteAlignment('byteOffset', byteOffset);
  if (byteStride < minimumByteStride) {
    throw new Error(
      `storageColors byteStride must be at least ${minimumByteStride} for ${formatName}`
    );
  }

  return {
    format,
    wordStride: byteStride / Uint32Array.BYTES_PER_ELEMENT,
    wordOffset: byteOffset / Uint32Array.BYTES_PER_ELEMENT,
    _padding: 0
  };
}

function resolveStorageColorFormat(
  format: StorageColorsProps['format'] = 'rgba8unorm'
): StorageColorFormatValue {
  if (typeof format === 'number') {
    if (format in STORAGE_COLOR_FORMAT_NAME_BY_VALUE) {
      return format as StorageColorFormatValue;
    }
  } else if (format in STORAGE_COLOR_FORMAT_BY_NAME) {
    return STORAGE_COLOR_FORMAT_BY_NAME[format];
  }

  throw new Error(
    `storageColors format must be one of ${Object.keys(STORAGE_COLOR_FORMAT_BY_NAME).join(', ')}`
  );
}

function validateStorageColorByteAlignment(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value % Uint32Array.BYTES_PER_ELEMENT !== 0) {
    throw new Error(`storageColors ${name} must be a non-negative 4-byte aligned integer`);
  }
}

/** Semantic color normalization helpers named `colors_*`. */
export const colors = {
  name: 'colors',
  props: {} as ColorsProps,
  uniforms: {} as ColorsUniforms,
  vs: COLORS_GLSL,
  fs: COLORS_GLSL,
  source: COLORS_WGSL,
  uniformTypes: COLORS_UNIFORM_TYPES,
  defaultUniforms: COLORS_DEFAULT_UNIFORMS
} as const satisfies ShaderModule<ColorsProps, ColorsUniforms>;

/** Legacy semantic color normalization helpers named `floatColors_*`. */
export const floatColors = {
  name: 'floatColors',
  props: {} as FloatColorsProps,
  uniforms: {} as FloatColorsUniforms,
  vs: FLOAT_COLORS_GLSL,
  fs: FLOAT_COLORS_GLSL,
  source: FLOAT_COLORS_WGSL,
  uniformTypes: COLORS_UNIFORM_TYPES,
  defaultUniforms: COLORS_DEFAULT_UNIFORMS
} as const satisfies ShaderModule<FloatColorsProps, FloatColorsUniforms>;

/**
 * WGSL reader for packed RGBA storage rows.
 *
 * Include {@link colors} separately when semantic color normalization helpers are also needed.
 */
export const storageColors = {
  name: 'storageColors',
  props: {} as StorageColorsProps,
  uniforms: {} as StorageColorsUniforms,
  bindings: {} as StorageColorsBindings,
  source: STORAGE_COLORS_WGSL,
  uniformTypes: STORAGE_COLORS_UNIFORM_TYPES,
  defaultUniforms: STORAGE_COLORS_DEFAULT_UNIFORMS,
  bindingLayout: [
    {name: 'storageColors', group: 0},
    {name: 'storageColorsBuffer', group: 0}
  ],
  getUniforms(props: StorageColorsProps = {}) {
    return {
      ...getStorageColorsUniforms(props),
      ...(props.colorBuffer ? {storageColorsBuffer: props.colorBuffer} : {})
    };
  }
} as const satisfies ShaderModule<StorageColorsProps, StorageColorsUniforms, StorageColorsBindings>;
