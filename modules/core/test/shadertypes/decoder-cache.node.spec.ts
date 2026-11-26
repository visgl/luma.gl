// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  dataTypeDecoder,
  textureFormatDecoder,
  vertexFormatDecoder,
  shaderTypeDecoder,
  getAttributeShaderTypeInfo,
  getVariableShaderTypeInfo
} from '@luma.gl/core';
import {getTextureFormatInfo} from '../../src/shadertypes/texture-types/texture-format-decoder';
import {getDataTypeInfo} from '../../src/shadertypes/data-types/decode-data-types';
import {TextureFormatDecoder} from '../../src/shadertypes/texture-types/texture-format-decoder';
import {VertexFormatDecoder} from '../../src/shadertypes/vertex-types/vertex-format-decoder';
import {getTextureFormatDefinition} from '../../src/shadertypes/texture-types/texture-format-table';
import type {NormalizedDataType, TextureFormat, VertexFormat} from '@luma.gl/core';

it.each<TextureFormat>([
  'r8unorm',
  'rgba32float',
  'rgba8unorm-srgb',
  'rgb10a2unorm',
  'depth24plus-stencil8',
  'bc1-rgba-unorm',
  'astc-5x4-unorm',
  'rgb8unorm-webgl'
])('shares immutable texture metadata for %s', format => {
  const info = textureFormatDecoder.getInfo(format);
  expect(getTextureFormatInfo(format)).toBe(info);
  expect(new TextureFormatDecoder().getInfo(format)).toBe(info);
  expect(Object.isFrozen(info)).toBe(true);
  expect(Object.isFrozen(info.bitsPerChannel)).toBe(true);
  expect(Reflect.set(info, 'bytesPerPixel', 999)).toBe(false);
  expect(Reflect.set(info.bitsPerChannel, '0', 999)).toBe(false);
  expect(getTextureFormatInfo(format).bytesPerPixel).not.toBe(999);
  const tableBits = getTextureFormatDefinition(format).bitsPerChannel;
  if (tableBits) {
    expect(info.bitsPerChannel).not.toBe(tableBits);
  }
});

it.each<VertexFormat>([
  'float32x3',
  'unorm8x4-bgra',
  'unorm10-10-10-2',
  'uint16x3-webgl'
])('shares immutable vertex metadata for %s', format => {
  const info = vertexFormatDecoder.getVertexFormatInfo(format);
  expect(new VertexFormatDecoder().getVertexFormatInfo(format)).toBe(info);
  expect(Object.isFrozen(info)).toBe(true);
  expect(Reflect.set(info, 'components', 99)).toBe(false);
});

it.each<NormalizedDataType>([
  'float16',
  'float32',
  'uint8',
  'sint16',
  'unorm8',
  'snorm16'
])('shares immutable scalar metadata for %s', type => {
  const info = dataTypeDecoder.getDataTypeInfo(type);
  expect(getDataTypeInfo(type)).toBe(info);
  expect(Object.isFrozen(info)).toBe(true);
  expect(Reflect.set(info, 'byteLength', 99)).toBe(false);
});

it('shares shader metadata through aliases and wrappers', () => {
  const attribute = getAttributeShaderTypeInfo('vec3f');
  expect(getAttributeShaderTypeInfo('vec3<f32>')).toBe(attribute);
  expect(shaderTypeDecoder.getAttributeShaderTypeInfo('vec3f')).toBe(attribute);
  expect(attribute).toEqual({
    primitiveType: 'f32',
    components: 3,
    byteLength: 12,
    integer: false,
    signed: true
  });
  const variable = getVariableShaderTypeInfo('mat4x4f');
  expect(getVariableShaderTypeInfo('mat4x4<f32>')).toBe(variable);
  expect(shaderTypeDecoder.getVariableShaderTypeInfo('mat4x4f')).toBe(variable);
  for (const info of [attribute, variable]) {
    expect(Object.isFrozen(info)).toBe(true);
    expect(Reflect.set(info, 'components', 99)).toBe(false);
  }
});

it('preserves invalid-input behavior without caching fallback scalar metadata', () => {
  const invalid = 'not-a-type' as NormalizedDataType;
  expect(getDataTypeInfo(invalid)).toEqual(getDataTypeInfo(invalid));
  expect(getDataTypeInfo(invalid)).not.toBe(getDataTypeInfo(invalid));
  for (let attempt = 0; attempt < 2; attempt++) {
    expect(() => vertexFormatDecoder.getVertexFormatInfo('float32x5' as VertexFormat)).toThrow(
      'Unsupported vertex format'
    );
    expect(() => getAttributeShaderTypeInfo('invalid' as 'f32')).toThrow(
      'Unsupported attribute shader type'
    );
  }
});

it('keeps texture capabilities and layouts caller-owned', () => {
  const capabilities = textureFormatDecoder.getCapabilities('rgba8unorm');
  capabilities.render = false;
  expect(textureFormatDecoder.getCapabilities('rgba8unorm').render).toBe(true);
  const options = {format: 'rgba8unorm' as const, width: 2, height: 2, depth: 1, byteAlignment: 1};
  const layout = textureFormatDecoder.computeMemoryLayout(options);
  layout.bytesPerRow = 999;
  expect(textureFormatDecoder.computeMemoryLayout(options).bytesPerRow).toBe(8);
});
