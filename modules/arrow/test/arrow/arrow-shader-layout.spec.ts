// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {ArrowColumnInfo} from '@luma.gl/arrow';
import {getArrowBufferLayout, getArrowVertexFormat, makeArrowMatrix3x3Vector} from '@luma.gl/arrow';
import type {AttributeShaderType, ShaderLayout, VertexFormat} from '@luma.gl/core';
import * as arrow from 'apache-arrow';

it('getArrowVertexFormat maps Arrow columns to f32 shader attributes', () => {
  const testCases: {
    signedDataType: ArrowColumnInfo['signedDataType'];
    components: 1 | 2 | 3 | 4;
    shaderType: AttributeShaderType;
    result: VertexFormat;
  }[] = [
    {signedDataType: 'float32', components: 1, shaderType: 'f32', result: 'float32'},
    {signedDataType: 'float32', components: 2, shaderType: 'vec2<f32>', result: 'float32x2'},
    {signedDataType: 'float32', components: 3, shaderType: 'vec3<f32>', result: 'float32x3'},
    {signedDataType: 'float32', components: 4, shaderType: 'vec4<f32>', result: 'float32x4'},
    {signedDataType: 'float16', components: 1, shaderType: 'f32', result: 'float16'},
    {signedDataType: 'float16', components: 2, shaderType: 'vec2<f32>', result: 'float16x2'},
    {signedDataType: 'float16', components: 4, shaderType: 'vec4<f32>', result: 'float16x4'},
    {signedDataType: 'sint16', components: 4, shaderType: 'vec4<f32>', result: 'snorm16x4'},
    {signedDataType: 'uint16', components: 4, shaderType: 'vec4<f32>', result: 'unorm16x4'},
    {signedDataType: 'sint8', components: 4, shaderType: 'vec4<f32>', result: 'snorm8x4'},
    {signedDataType: 'uint8', components: 4, shaderType: 'vec4<f32>', result: 'unorm8x4'}
  ];

  for (const testCase of testCases) {
    expect(
      getArrowVertexFormat(
        makeColumnInfo(testCase.signedDataType, testCase.components),
        testCase.shaderType
      ),
      `${testCase.signedDataType}x${testCase.components} maps to ${testCase.result}`
    ).toBe(testCase.result);
  }

  void 0;
});

it('getArrowVertexFormat maps Arrow columns to integer shader attributes', () => {
  expect(getArrowVertexFormat(makeColumnInfo('sint8', 1), 'i32'), 'sint8 scalar maps to i32').toBe(
    'sint8'
  );
  expect(
    getArrowVertexFormat(makeColumnInfo('sint16', 2), 'vec2<i32>'),
    'sint16x2 maps to vec2<i32>'
  ).toBe('sint16x2');
  expect(
    getArrowVertexFormat(makeColumnInfo('sint32', 3), 'vec3<i32>'),
    'sint32x3 maps to vec3<i32>'
  ).toBe('sint32x3');
  expect(getArrowVertexFormat(makeColumnInfo('uint8', 1), 'u32'), 'uint8 scalar maps to u32').toBe(
    'uint8'
  );
  expect(
    getArrowVertexFormat(makeColumnInfo('uint16', 2), 'vec2<u32>'),
    'uint16x2 maps to vec2<u32>'
  ).toBe('uint16x2');
  expect(
    getArrowVertexFormat(makeColumnInfo('uint32', 4), 'vec4<u32>'),
    'uint32x4 maps to vec4<u32>'
  ).toBe('uint32x4');
  expect(
    getArrowVertexFormat(makeColumnInfo('sint8', 3), 'vec3<i32>', {allowWebGLOnlyFormats: true}),
    'allowWebGLOnlyFormats enables sint8x3-webgl'
  ).toBe('sint8x3-webgl');

  void 0;
});

it('getArrowVertexFormat maps Arrow columns to f16 shader attributes', () => {
  expect(
    getArrowVertexFormat(makeColumnInfo('float16', 1), 'f16'),
    'float16 scalar maps to f16'
  ).toBe('float16');
  expect(
    getArrowVertexFormat(makeColumnInfo('float16', 2), 'vec2<f16>'),
    'float16x2 maps to vec2<f16>'
  ).toBe('float16x2');
  expect(
    getArrowVertexFormat(makeColumnInfo('float16', 4), 'vec4<f16>'),
    'float16x4 maps to vec4<f16>'
  ).toBe('float16x4');
  expect(
    getArrowVertexFormat(makeColumnInfo('uint8', 4), 'vec4<f16>'),
    'uint8x4 maps to normalized vec4<f16>'
  ).toBe('unorm8x4');
  expect(
    getArrowVertexFormat(makeColumnInfo('sint16', 2), 'vec2<f16>'),
    'sint16x2 maps to normalized vec2<f16>'
  ).toBe('snorm16x2');

  void 0;
});

it('getArrowVertexFormat rejects incompatible shader attribute mappings', () => {
  expect(
    () => getArrowVertexFormat(makeColumnInfo('uint32', 4), 'vec4<f32>'),
    'uint32 columns cannot be normalized for f32 shader attributes'
  ).toThrow(/no normalized 32-bit integer vertex format/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('float32', 2), 'vec2<i32>'),
    'float columns cannot map to integer shader attributes'
  ).toThrow(/cannot be used/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('uint16', 2), 'vec2<i32>'),
    'unsigned columns cannot map to signed shader attributes'
  ).toThrow(/signedness does not match/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('sint16', 2), 'vec2<u32>'),
    'signed columns cannot map to unsigned shader attributes'
  ).toThrow(/signedness does not match/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('float16', 3), 'vec3<f32>'),
    'float16x3 is rejected for portable layouts'
  ).toThrow(/portable WebGPU layouts/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('uint8', 3), 'vec3<u32>'),
    'uint8x3 is rejected for portable layouts'
  ).toThrow(/portable WebGPU layouts/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('uint8', 3), 'vec3<f32>'),
    'normalized uint8x3 is rejected for portable layouts'
  ).toThrow(/portable WebGPU layouts/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('float32', 4), 'vec4<f16>'),
    'float32 columns cannot map to f16 shader attributes'
  ).toThrow(/cannot be used/);
  expect(
    () => getArrowVertexFormat(makeColumnInfo('uint8', 4), 'vec3<u32>'),
    'component mismatches are rejected'
  ).toThrow(/expects 3/);

  void 0;
});

it('getArrowBufferLayout builds layouts from Arrow table columns', () => {
  const arrowTable = makeShaderAttributeArrowTable();
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec3<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'},
      {name: 'pickingIds', location: 2, type: 'u32'},
      {name: 'missing', location: 3, type: 'vec2<f32>'}
    ],
    bindings: []
  };

  expect(
    getArrowBufferLayout(shaderLayout, {arrowTable}),
    'same-name Arrow columns map to buffer layouts and missing columns are skipped'
  ).toEqual([
    {name: 'positions', format: 'float32x3'},
    {name: 'colors', format: 'unorm8x4'},
    {name: 'pickingIds', format: 'uint32'}
  ]);

  expect(
    getArrowBufferLayout(
      {
        attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
        bindings: []
      },
      {
        arrowTable,
        arrowPaths: {instanceColors: 'colors'}
      }
    ),
    'explicit Arrow paths can feed differently named shader attributes'
  ).toEqual([{name: 'instanceColors', format: 'unorm8x4'}]);

  void 0;
});

it('getArrowBufferLayout expands one matrix Arrow column into interleaved vector attributes', () => {
  const arrowTable = new arrow.Table({
    instanceModelMatrix: makeArrowMatrix3x3Vector(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), {
      order: 'row-major'
    })
  });
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'instanceModelMatrixCol0', location: 0, type: 'vec3<f32>', stepMode: 'instance'},
      {name: 'instanceModelMatrixCol1', location: 1, type: 'vec3<f32>', stepMode: 'instance'},
      {name: 'instanceModelMatrixCol2', location: 2, type: 'vec3<f32>', stepMode: 'instance'}
    ],
    bindings: []
  };

  expect(
    getArrowBufferLayout(shaderLayout, {
      arrowTable,
      arrowPaths: {
        instanceModelMatrixCol0: 'instanceModelMatrix',
        instanceModelMatrixCol1: 'instanceModelMatrix',
        instanceModelMatrixCol2: 'instanceModelMatrix'
      }
    }),
    'derives one padded interleaved buffer layout from matrix metadata'
  ).toEqual([
    {
      name: 'instanceModelMatrix',
      byteStride: 48,
      stepMode: 'instance',
      attributes: [
        {attribute: 'instanceModelMatrixCol0', format: 'float32x3', byteOffset: 0},
        {attribute: 'instanceModelMatrixCol1', format: 'float32x3', byteOffset: 16},
        {attribute: 'instanceModelMatrixCol2', format: 'float32x3', byteOffset: 32}
      ]
    }
  ]);

  void 0;
});

it('getArrowBufferLayout builds layouts from Arrow vectors', () => {
  const arrowTable = makeShaderAttributeArrowTable();
  const colorsVector = arrowTable.getChild('colors')!;
  const directColorsVector = arrow.makeVector(
    makeFixedSizeListData(new arrow.Uint8(), 4, new Uint8Array([255, 0, 0, 255]))
  );
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'colors', location: 0, type: 'vec4<f32>'},
      {name: 'missing', location: 1, type: 'vec2<f32>'}
    ],
    bindings: []
  };

  expect(
    getArrowBufferLayout(shaderLayout, {
      arrowVectors: {colors: colorsVector}
    }),
    'matching vector keys map to shader attributes and missing vectors are skipped'
  ).toEqual([{name: 'colors', format: 'unorm8x4'}]);

  expect(
    getArrowBufferLayout(
      {
        attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
        bindings: []
      },
      {
        arrowVectors: {instanceColors: colorsVector}
      }
    ),
    'vector keys can rename an Arrow vector to a shader attribute'
  ).toEqual([{name: 'instanceColors', format: 'unorm8x4'}]);

  expect(
    getArrowBufferLayout(shaderLayout, {
      arrowVectors: {colors: directColorsVector}
    }),
    'direct FixedSizeList vectors expose their child values for layout analysis'
  ).toEqual([{name: 'colors', format: 'unorm8x4'}]);

  void 0;
});

it('getArrowBufferLayout validates Arrow source options', () => {
  const arrowTable = makeShaderAttributeArrowTable();
  const colorsVector = arrowTable.getChild('colors')!;
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'colors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };

  expect(() => getArrowBufferLayout(shaderLayout, {}), 'object API requires a source').toThrow(
    /exactly one/
  );
  expect(
    () => getArrowBufferLayout(shaderLayout, {arrowTable, arrowVectors: {colors: colorsVector}}),
    'object API rejects multiple sources'
  ).toThrow(/exactly one/);
  expect(
    () =>
      getArrowBufferLayout(shaderLayout, {
        arrowTable,
        arrowPaths: {colors: 'doesNotExist'}
      }),
    'explicit missing table paths throw'
  ).toThrow(/doesNotExist/);

  void 0;
});

function makeColumnInfo(
  signedDataType: ArrowColumnInfo['signedDataType'],
  components: 1 | 2 | 3 | 4
): ArrowColumnInfo {
  return {
    signedDataType,
    components,
    stepMode: 'instance',
    values: [],
    offsets: []
  };
}

function makeShaderAttributeArrowTable(): arrow.Table {
  const positionsData = makeFixedSizeListData(
    new arrow.Float32(),
    3,
    new Float32Array([0, 0, 0, 1, 1, 1])
  );
  const colorsData = makeFixedSizeListData(
    new arrow.Uint8(),
    4,
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
  );
  const pickingIdsData = arrow.makeData({
    type: new arrow.Uint32(),
    length: 2,
    nullCount: 0,
    nullBitmap: null,
    data: new Uint32Array([1, 2])
  });

  const schema = new arrow.Schema([
    new arrow.Field('positions', positionsData.type),
    new arrow.Field('colors', colorsData.type),
    new arrow.Field('pickingIds', pickingIdsData.type)
  ]);

  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: 2,
    nullCount: 0,
    nullBitmap: null,
    children: [positionsData, colorsData, pickingIdsData]
  });

  return new arrow.Table([new arrow.RecordBatch(schema, structData)]);
}

function makeFixedSizeListData<T extends arrow.DataType>(
  childType: T,
  listSize: 2 | 3 | 4,
  values: T['TArray']
): arrow.Data<arrow.FixedSizeList<T>> {
  const childData = arrow.makeData({
    type: childType,
    length: values.length,
    nullCount: 0,
    nullBitmap: null,
    data: values
  });
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('value', childType));
  return arrow.makeData({
    type: listType,
    length: values.length / listSize,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  });
}
