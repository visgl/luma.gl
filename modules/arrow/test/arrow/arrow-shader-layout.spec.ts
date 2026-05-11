// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ArrowColumnInfo} from '@luma.gl/arrow';
import {getArrowBufferLayout, getArrowVertexFormat} from '@luma.gl/arrow';
import type {AttributeShaderType, ShaderLayout, VertexFormat} from '@luma.gl/core';
import * as arrow from 'apache-arrow';

test('getArrowVertexFormat maps Arrow columns to f32 shader attributes', t => {
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
    t.equal(
      getArrowVertexFormat(
        makeColumnInfo(testCase.signedDataType, testCase.components),
        testCase.shaderType
      ),
      testCase.result,
      `${testCase.signedDataType}x${testCase.components} maps to ${testCase.result}`
    );
  }

  t.end();
});

test('getArrowVertexFormat maps Arrow columns to integer shader attributes', t => {
  t.equal(
    getArrowVertexFormat(makeColumnInfo('sint8', 1), 'i32'),
    'sint8',
    'sint8 scalar maps to i32'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('sint16', 2), 'vec2<i32>'),
    'sint16x2',
    'sint16x2 maps to vec2<i32>'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('sint32', 3), 'vec3<i32>'),
    'sint32x3',
    'sint32x3 maps to vec3<i32>'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('uint8', 1), 'u32'),
    'uint8',
    'uint8 scalar maps to u32'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('uint16', 2), 'vec2<u32>'),
    'uint16x2',
    'uint16x2 maps to vec2<u32>'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('uint32', 4), 'vec4<u32>'),
    'uint32x4',
    'uint32x4 maps to vec4<u32>'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('sint8', 3), 'vec3<i32>', {allowWebGLOnlyFormats: true}),
    'sint8x3-webgl',
    'allowWebGLOnlyFormats enables sint8x3-webgl'
  );

  t.end();
});

test('getArrowVertexFormat maps Arrow columns to f16 shader attributes', t => {
  t.equal(
    getArrowVertexFormat(makeColumnInfo('float16', 1), 'f16'),
    'float16',
    'float16 scalar maps to f16'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('float16', 2), 'vec2<f16>'),
    'float16x2',
    'float16x2 maps to vec2<f16>'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('float16', 4), 'vec4<f16>'),
    'float16x4',
    'float16x4 maps to vec4<f16>'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('uint8', 4), 'vec4<f16>'),
    'unorm8x4',
    'uint8x4 maps to normalized vec4<f16>'
  );
  t.equal(
    getArrowVertexFormat(makeColumnInfo('sint16', 2), 'vec2<f16>'),
    'snorm16x2',
    'sint16x2 maps to normalized vec2<f16>'
  );

  t.end();
});

test('getArrowVertexFormat rejects incompatible shader attribute mappings', t => {
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('uint32', 4), 'vec4<f32>'),
    /no normalized 32-bit integer vertex format/,
    'uint32 columns cannot be normalized for f32 shader attributes'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('float32', 2), 'vec2<i32>'),
    /cannot be used/,
    'float columns cannot map to integer shader attributes'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('uint16', 2), 'vec2<i32>'),
    /signedness does not match/,
    'unsigned columns cannot map to signed shader attributes'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('sint16', 2), 'vec2<u32>'),
    /signedness does not match/,
    'signed columns cannot map to unsigned shader attributes'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('float16', 3), 'vec3<f32>'),
    /portable WebGPU layouts/,
    'float16x3 is rejected for portable layouts'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('uint8', 3), 'vec3<u32>'),
    /portable WebGPU layouts/,
    'uint8x3 is rejected for portable layouts'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('uint8', 3), 'vec3<f32>'),
    /portable WebGPU layouts/,
    'normalized uint8x3 is rejected for portable layouts'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('float32', 4), 'vec4<f16>'),
    /cannot be used/,
    'float32 columns cannot map to f16 shader attributes'
  );
  t.throws(
    () => getArrowVertexFormat(makeColumnInfo('uint8', 4), 'vec3<u32>'),
    /expects 3/,
    'component mismatches are rejected'
  );

  t.end();
});

test('getArrowBufferLayout builds layouts from Arrow table columns', t => {
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

  t.deepEqual(
    getArrowBufferLayout(shaderLayout, {arrowTable}),
    [
      {name: 'positions', format: 'float32x3'},
      {name: 'colors', format: 'unorm8x4'},
      {name: 'pickingIds', format: 'uint32'}
    ],
    'same-name Arrow columns map to buffer layouts and missing columns are skipped'
  );

  t.deepEqual(
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
    [{name: 'instanceColors', format: 'unorm8x4'}],
    'explicit Arrow paths can feed differently named shader attributes'
  );

  t.end();
});

test('getArrowBufferLayout builds layouts from Arrow vectors', t => {
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

  t.deepEqual(
    getArrowBufferLayout(shaderLayout, {
      arrowVectors: {colors: colorsVector}
    }),
    [{name: 'colors', format: 'unorm8x4'}],
    'matching vector keys map to shader attributes and missing vectors are skipped'
  );

  t.deepEqual(
    getArrowBufferLayout(
      {
        attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
        bindings: []
      },
      {
        arrowVectors: {instanceColors: colorsVector}
      }
    ),
    [{name: 'instanceColors', format: 'unorm8x4'}],
    'vector keys can rename an Arrow vector to a shader attribute'
  );

  t.deepEqual(
    getArrowBufferLayout(shaderLayout, {
      arrowVectors: {colors: directColorsVector}
    }),
    [{name: 'colors', format: 'unorm8x4'}],
    'direct FixedSizeList vectors expose their child values for layout analysis'
  );

  t.end();
});

test('getArrowBufferLayout validates Arrow source options', t => {
  const arrowTable = makeShaderAttributeArrowTable();
  const colorsVector = arrowTable.getChild('colors')!;
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'colors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };

  t.throws(
    () => getArrowBufferLayout(shaderLayout, {}),
    /exactly one/,
    'object API requires a source'
  );
  t.throws(
    () => getArrowBufferLayout(shaderLayout, {arrowTable, arrowVectors: {colors: colorsVector}}),
    /exactly one/,
    'object API rejects multiple sources'
  );
  t.throws(
    () =>
      getArrowBufferLayout(shaderLayout, {
        arrowTable,
        arrowPaths: {colors: 'doesNotExist'}
      }),
    /doesNotExist/,
    'explicit missing table paths throw'
  );

  t.deepEqual(
    getArrowBufferLayout(arrowTable, shaderLayout),
    [{name: 'colors', format: 'unorm8x4'}],
    'legacy positional table overload remains supported'
  );

  t.deepEqual(
    getArrowBufferLayout(
      arrowTable,
      {
        attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
        bindings: []
      },
      {
        attributeNameToArrowPath: {instanceColors: 'colors'}
      }
    ),
    [{name: 'instanceColors', format: 'unorm8x4'}],
    'legacy attributeNameToArrowPath remains supported'
  );

  t.end();
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
