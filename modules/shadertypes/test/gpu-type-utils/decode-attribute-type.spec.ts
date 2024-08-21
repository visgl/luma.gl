// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  decodeShaderAttributeType,
  ShaderAttributeType,
  ShaderAttributeTypeInfo
} from '@luma.gl/shadertypes';

// prettier-ignore
const TEST_CASES: {format: ShaderAttributeType, result: ShaderAttributeTypeInfo}[] = [
  {format: 'f32', result: {dataType: 'f32', components: 1, byteLength: 1 * 4, integer: false, signed: true, defaultVertexFormat: 'float32'}},
  {format: 'vec2<f32>', result: {dataType: 'f32', components: 2, byteLength: 2 * 4, integer: false, signed: true, defaultVertexFormat: 'float32x2'}},
  {format: 'vec3<f32>', result: {dataType: 'f32', components: 3, byteLength: 3 * 4, integer: false, signed: true, defaultVertexFormat: 'float32x3'}},
  {format: 'vec4<f32>', result: {dataType: 'f32', components: 4, byteLength: 4 * 4, integer: false, signed: true, defaultVertexFormat: 'float32x4'}},
  {format: 'i32', result: {dataType: 'i32', components: 1, byteLength: 1 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32'}},
  {format: 'vec2<i32>', result: {dataType: 'i32', components: 2, byteLength: 2 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32x2'}},
  {format: 'vec3<i32>', result: {dataType: 'i32', components: 3, byteLength: 3 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32x3'}},
  {format: 'vec4<i32>', result: {dataType: 'i32', components: 4, byteLength: 4 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32x4'}},
  {format: 'u32', result: {dataType: 'u32', components: 1, byteLength: 1 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32'}},
  {format: 'vec2<u32>', result: {dataType: 'u32', components: 2, byteLength: 2 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32x2'}},
  {format: 'vec3<u32>', result: {dataType: 'u32', components: 3, byteLength: 3 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32x3'}},
  {format: 'vec4<u32>', result: {dataType: 'u32', components: 4, byteLength: 4 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32x4'}},
  {format: 'f16', result: {dataType: 'f16', components: 1, byteLength: 1 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x2'}},
  {format: 'vec2<f16>', result: {dataType: 'f16', components: 2, byteLength: 2 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x2'}},
  {format: 'vec3<f16>', result: {dataType: 'f16', components: 3, byteLength: 3 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x4'}},
  {format: 'vec4<f16>', result: {dataType: 'f16', components: 4, byteLength: 4 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x4'}},
  // {format: 'bool-webgl', result: {dataType: 'bool-webgl', components: 1, byteLength: 1 * 4, integer: true, signed: false}}
];

test('api#decodeShaderAttributeType', t => {
  for (const tc of TEST_CASES) {
    const decoded = decodeShaderAttributeType(tc.format);
    t.deepEqual(
      decoded,
      tc.result,
      `decodeShaderAttributeType('${tc.format}') => ${JSON.stringify(decoded.dataType)}`
    );
  }
  t.end();
});
