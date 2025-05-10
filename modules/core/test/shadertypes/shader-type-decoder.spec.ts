// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  type AttributeShaderType,
  type AttributeShaderTypeInfo,
  shaderTypeDecoder
} from '@luma.gl/core';

// prettier-ignore
const TEST_CASES: {format: AttributeShaderType, result: AttributeShaderTypeInfo}[] = [
  {format: 'f32', result: {primitiveType: 'f32', components: 1, byteLength: 1 * 4, integer: false, signed: true}},
  {format: 'vec2<f32>', result: {primitiveType: 'f32', components: 2, byteLength: 2 * 4, integer: false, signed: true}},
  {format: 'vec3<f32>', result: {primitiveType: 'f32', components: 3, byteLength: 3 * 4, integer: false, signed: true}},
  {format: 'vec4<f32>', result: {primitiveType: 'f32', components: 4, byteLength: 4 * 4, integer: false, signed: true}},
  {format: 'i32', result: {primitiveType: 'i32', components: 1, byteLength: 1 * 4, integer: true, signed: true}},
  {format: 'vec2<i32>', result: {primitiveType: 'i32', components: 2, byteLength: 2 * 4, integer: true, signed: true}},
  {format: 'vec3<i32>', result: {primitiveType: 'i32', components: 3, byteLength: 3 * 4, integer: true, signed: true}},
  {format: 'vec4<i32>', result: {primitiveType: 'i32', components: 4, byteLength: 4 * 4, integer: true, signed: true}},
  {format: 'u32', result: {primitiveType: 'u32', components: 1, byteLength: 1 * 4, integer: true, signed: false}},
  {format: 'vec2<u32>', result: {primitiveType: 'u32', components: 2, byteLength: 2 * 4, integer: true, signed: false}},
  {format: 'vec3<u32>', result: {primitiveType: 'u32', components: 3, byteLength: 3 * 4, integer: true, signed: false}},
  {format: 'vec4<u32>', result: {primitiveType: 'u32', components: 4, byteLength: 4 * 4, integer: true, signed: false}},
  {format: 'f16', result: {primitiveType: 'f16', components: 1, byteLength: 1 * 2, integer: false, signed: true}},
  {format: 'vec2<f16>', result: {primitiveType: 'f16', components: 2, byteLength: 2 * 2, integer: false, signed: true}},
  {format: 'vec3<f16>', result: {primitiveType: 'f16', components: 3, byteLength: 3 * 2, integer: false, signed: true}},
  {format: 'vec4<f16>', result: {primitiveType: 'f16', components: 4, byteLength: 4 * 2, integer: false, signed: true}},
  // {format: 'bool-webgl', result: {primitiveType: 'bool-webgl', components: 1, byteLength: 1 * 4, integer: true, signed: false}}
];

test('shadertypes#shaderTypeDecoder.getAttributeShaderTypeInfo', t => {
  for (const tc of TEST_CASES) {
    const decoded = shaderTypeDecoder.getAttributeShaderTypeInfo(tc.format);
    t.deepEqual(
      decoded,
      tc.result,
      `shaderTypeDecoder.getAttributeShaderTypeInfo('${tc.format}') => ${JSON.stringify(decoded.dataType)}`
    );
  }
  t.end();
});
