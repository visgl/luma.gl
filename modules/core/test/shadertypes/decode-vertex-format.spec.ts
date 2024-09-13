// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getVertexFormatInfo, VertexFormat} from '@luma.gl/core';

// prettier-ignore
const TEST_CASES: {format: VertexFormat, result: any}[] = [
  {format: 'float32', result: {type: 'float32', components: 1, byteLength: 4, integer: false, signed: false, normalized: false}},
  {format: 'uint32', result: {type: 'uint32', components: 1, byteLength: 4, integer: true, signed: false, normalized: false}},
  {format: 'sint32', result: {type: 'sint32', components: 1, byteLength: 4, integer: true, signed: true, normalized: false}},

  {format: 'uint8x2', result: {type: 'uint8', components: 2, byteLength: 2, integer: true, signed: false, normalized: false}},
  {format: 'sint8x2', result: {type: 'sint8', components: 2, byteLength: 2, integer: true, signed: true, normalized: false}},
  {format: 'unorm8x2', result: {type: 'unorm8', components: 2, byteLength: 2, integer: false, signed: false, normalized: true}},
  {format: 'snorm8x2', result: {type: 'snorm8', components: 2, byteLength: 2, integer: false, signed: true, normalized: true}},
  {format: 'uint16x2', result: {type: 'uint16', components: 2, byteLength: 4, integer: true, signed: false, normalized: false}},
  {format: 'sint16x2', result: {type: 'sint16', components: 2, byteLength: 4, integer: true, signed: true, normalized: false}},
  {format: 'unorm16x2', result: {type: 'unorm16', components: 2, byteLength: 4, integer: false, signed: false, normalized: true}},
  {format: 'snorm16x2', result: {type: 'snorm16', components: 2, byteLength: 4, integer: false, signed: true, normalized: true}},
  {format: 'float16x2', result: {type: 'float16', components: 2, byteLength: 4, integer: false, signed: false, normalized: false}},
  {format: 'float32x2', result: {type: 'float32', components: 2, byteLength: 8, integer: false, signed: false, normalized: false}},
  {format: 'uint32x2', result: {type: 'uint32', components: 2, byteLength: 8, integer: true, signed: false, normalized: false}},
  {format: 'sint32x2', result: {type: 'sint32', components: 2, byteLength: 8, integer: true, signed: true, normalized: false}},
];

test('shadertypes#getVertexFormatInfo', t => {
  for (const tc of TEST_CASES) {
    const decoded = getVertexFormatInfo(tc.format);
    t.deepEqual(
      decoded,
      tc.result,
      `getVertexFormatInfo('${tc.format}') => ${JSON.stringify(decoded.type)}`
    );
  }
  t.end();
});

// test default vertex format deduction
/*
const TEST_CASES: {format: AttributeShaderType, result: AttributeShaderTypeInfo}[] = [
  {format: 'f32', result: {primitiveType: 'f32', components: 1, byteLength: 1 * 4, integer: false, signed: true, defaultVertexFormat: 'float32'}},
  {format: 'vec2<f32>', result: {primitiveType: 'f32', components: 2, byteLength: 2 * 4, integer: false, signed: true, defaultVertexFormat: 'float32x2'}},
  {format: 'vec3<f32>', result: {primitiveType: 'f32', components: 3, byteLength: 3 * 4, integer: false, signed: true, defaultVertexFormat: 'float32x3'}},
  {format: 'vec4<f32>', result: {primitiveType: 'f32', components: 4, byteLength: 4 * 4, integer: false, signed: true, defaultVertexFormat: 'float32x4'}},
  {format: 'i32', result: {primitiveType: 'i32', components: 1, byteLength: 1 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32'}},
  {format: 'vec2<i32>', result: {primitiveType: 'i32', components: 2, byteLength: 2 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32x2'}},
  {format: 'vec3<i32>', result: {primitiveType: 'i32', components: 3, byteLength: 3 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32x3'}},
  {format: 'vec4<i32>', result: {primitiveType: 'i32', components: 4, byteLength: 4 * 4, integer: true, signed: true, defaultVertexFormat: 'sint32x4'}},
  {format: 'u32', result: {primitiveType: 'u32', components: 1, byteLength: 1 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32'}},
  {format: 'vec2<u32>', result: {primitiveType: 'u32', components: 2, byteLength: 2 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32x2'}},
  {format: 'vec3<u32>', result: {primitiveType: 'u32', components: 3, byteLength: 3 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32x3'}},
  {format: 'vec4<u32>', result: {primitiveType: 'u32', components: 4, byteLength: 4 * 4, integer: true, signed: false, defaultVertexFormat: 'uint32x4'}},
  {format: 'f16', result: {primitiveType: 'f16', components: 1, byteLength: 1 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x2'}},
  {format: 'vec2<f16>', result: {primitiveType: 'f16', components: 2, byteLength: 2 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x2'}},
  {format: 'vec3<f16>', result: {primitiveType: 'f16', components: 3, byteLength: 3 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x4'}},
  {format: 'vec4<f16>', result: {primitiveType: 'f16', components: 4, byteLength: 4 * 2, integer: false, signed: true, defaultVertexFormat: 'float16x4'}},
  // {format: 'bool-webgl', result: {primitiveType: 'bool-webgl', components: 1, byteLength: 1 * 4, integer: true, signed: false}}
];
*/
