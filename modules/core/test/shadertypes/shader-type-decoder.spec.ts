// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  type AttributeShaderType,
  type AttributeShaderTypeInfo,
  shaderTypeDecoder
} from '@luma.gl/core';

// biome-ignore format: preserve layout
const TEST_CASES: {format: AttributeShaderType | string, result: AttributeShaderTypeInfo}[] = [
  {format: 'f32', result: {primitiveType: 'f32', components: 1, byteLength: 1 * 4, integer: false, signed: true}},
  {format: 'vec2<f32>', result: {primitiveType: 'f32', components: 2, byteLength: 2 * 4, integer: false, signed: true}},
  {format: 'vec3<f32>', result: {primitiveType: 'f32', components: 3, byteLength: 3 * 4, integer: false, signed: true}},
  {format: 'vec4<f32>', result: {primitiveType: 'f32', components: 4, byteLength: 4 * 4, integer: false, signed: true}},
  {format: 'vec3f', result: {primitiveType: 'f32', components: 3, byteLength: 3 * 4, integer: false, signed: true}},
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

const PRIMITIVE_TYPES = ['f16', 'f32', 'i32', 'u32'] as const;
const VECTOR_SIZES = [2, 3, 4] as const;
const MATRIX_DIMENSIONS = [2, 3, 4] as const;
const TYPE_ALIAS_SUFFIXES = {
  h: 'f16',
  f: 'f32',
  i: 'i32',
  u: 'u32'
} as const;

test('shadertypes#shaderTypeDecoder.getAttributeShaderTypeInfo', t => {
  for (const tc of TEST_CASES) {
    const decoded = shaderTypeDecoder.getAttributeShaderTypeInfo(tc.format);
    t.deepEqual(
      decoded,
      tc.result,
      `shaderTypeDecoder.getAttributeShaderTypeInfo('${tc.format}') => ${JSON.stringify(decoded.dataType)}`
    );
  }

  for (const [suffix, primitiveType] of Object.entries(TYPE_ALIAS_SUFFIXES)) {
    for (const components of VECTOR_SIZES) {
      const alias = `vec${components}${suffix}` as any;
      const expandedType = `vec${components}<${primitiveType}>` as AttributeShaderType;
      t.equal(
        shaderTypeDecoder.resolveAttributeShaderTypeAlias(alias),
        expandedType,
        `${alias} resolves to ${expandedType}`
      );
      t.deepEqual(
        shaderTypeDecoder.getAttributeShaderTypeInfo(alias),
        shaderTypeDecoder.getAttributeShaderTypeInfo(expandedType),
        `${alias} has the same metadata as ${expandedType}`
      );
    }
  }

  t.throws(
    () => shaderTypeDecoder.getAttributeShaderTypeInfo('mat2x2<f32>' as any),
    /Unsupported attribute shader type/,
    'matrix types are rejected as attributes'
  );
  t.end();
});

test('shadertypes#shaderTypeDecoder parses every variable shader type', t => {
  for (const primitiveType of PRIMITIVE_TYPES) {
    t.deepEqual(
      shaderTypeDecoder.getVariableShaderTypeInfo(primitiveType),
      {type: primitiveType, components: 1},
      `${primitiveType} metadata matches`
    );

    for (const components of VECTOR_SIZES) {
      const vectorType = `vec${components}<${primitiveType}>` as any;
      t.deepEqual(
        shaderTypeDecoder.getVariableShaderTypeInfo(vectorType),
        {type: primitiveType, components},
        `${vectorType} metadata matches`
      );
    }

    for (const columns of MATRIX_DIMENSIONS) {
      for (const rows of MATRIX_DIMENSIONS) {
        const matrixType = `mat${columns}x${rows}<${primitiveType}>` as any;
        t.deepEqual(
          shaderTypeDecoder.getVariableShaderTypeInfo(matrixType),
          {type: primitiveType, components: columns * rows},
          `${matrixType} metadata matches`
        );
      }
    }
  }

  for (const [suffix, primitiveType] of Object.entries(TYPE_ALIAS_SUFFIXES)) {
    for (const components of VECTOR_SIZES) {
      const alias = `vec${components}${suffix}` as any;
      const expandedType = `vec${components}<${primitiveType}>`;
      t.equal(
        shaderTypeDecoder.resolveVariableShaderTypeAlias(alias),
        expandedType,
        `${alias} resolves to ${expandedType}`
      );
    }
    for (const columns of MATRIX_DIMENSIONS) {
      for (const rows of MATRIX_DIMENSIONS) {
        const alias = `mat${columns}x${rows}${suffix}` as any;
        const expandedType = `mat${columns}x${rows}<${primitiveType}>`;
        t.equal(
          shaderTypeDecoder.resolveVariableShaderTypeAlias(alias),
          expandedType,
          `${alias} resolves to ${expandedType}`
        );
      }
    }
  }

  for (const invalidType of ['vec5<f32>', 'mat2x5<f32>', 'vec2<f64>', ' vec2<f32>']) {
    t.throws(
      () => shaderTypeDecoder.getVariableShaderTypeInfo(invalidType as any),
      /Unsupported variable shader type/,
      `${invalidType} is rejected`
    );
  }
  t.end();
});
