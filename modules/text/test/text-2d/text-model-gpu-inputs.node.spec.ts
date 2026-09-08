// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {
  TextAttributeModel,
  TextDictionaryModel,
  TextRowIndexedStorageModel,
  TextStorageModel,
  assertTextStorageGPUVectorInputs,
  TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA,
  TEXT_DICTIONARY_GPU_INPUT_SCHEMA,
  TEXT_STORAGE_GPU_INPUT_SCHEMA
} from '@luma.gl/text/experimental';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';

it('2D text models declare flat source-mappable GPU inputs', () => {
  expect(TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA, '').toEqual([
    {
      columnName: 'positions',
      kind: 'positions',
      required: true,
      formats: ['float32x2']
    },
    {
      columnName: 'texts',
      kind: 'text',
      required: true,
      formats: ['value-list<uint8>', 'sint8', 'sint16', 'sint32', 'uint8', 'uint16', 'uint32']
    },
    {
      columnName: 'colors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4', 'vertex-list<unorm8x4>']
    },
    {
      columnName: 'angles',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    },
    {
      columnName: 'sizes',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    },
    {
      columnName: 'pixelOffsets',
      kind: 'positions',
      required: false,
      formats: ['float32x2']
    },
    {
      columnName: 'clipRects',
      kind: 'positions',
      required: false,
      formats: ['float32x4']
    }
  ]);
  expect(TEXT_STORAGE_GPU_INPUT_SCHEMA, '').toEqual([
    {
      columnName: 'positions',
      kind: 'positions',
      required: true,
      formats: ['float32x2']
    },
    {
      columnName: 'texts',
      kind: 'text',
      required: true,
      formats: ['value-list<uint8>', 'sint8', 'sint16', 'sint32', 'uint8', 'uint16', 'uint32']
    },
    {
      columnName: 'colors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4']
    },
    {
      columnName: 'angles',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    },
    {
      columnName: 'sizes',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    },
    {
      columnName: 'pixelOffsets',
      kind: 'positions',
      required: false,
      formats: ['float32x2']
    },
    {
      columnName: 'textAnchors',
      kind: 'scalars',
      required: false,
      formats: ['uint8']
    },
    {
      columnName: 'alignmentBaselines',
      kind: 'scalars',
      required: false,
      formats: ['uint8']
    },
    {
      columnName: 'clipRects',
      kind: 'positions',
      required: false,
      formats: ['float32x4']
    }
  ]);
  expect(TEXT_DICTIONARY_GPU_INPUT_SCHEMA, '').toEqual([
    {
      columnName: 'positions',
      kind: 'positions',
      required: true,
      formats: ['float32x2']
    },
    {
      columnName: 'texts',
      kind: 'text',
      required: true,
      formats: ['sint8', 'sint16', 'sint32', 'uint8', 'uint16', 'uint32']
    },
    ...TEXT_STORAGE_GPU_INPUT_SCHEMA.slice(2)
  ]);
  expect(TextAttributeModel.gpuInputSchema, '').toBe(TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA);
  expect(TextStorageModel.gpuInputSchema, '').toBe(TEXT_STORAGE_GPU_INPUT_SCHEMA);
  expect(TextRowIndexedStorageModel.gpuInputSchema, '').toBe(TEXT_STORAGE_GPU_INPUT_SCHEMA);
  expect(TextDictionaryModel.gpuInputSchema, '').toBe(TEXT_DICTIONARY_GPU_INPUT_SCHEMA);
  void 0;
});

it('storage text prepared input validation uses GPUVector.format', () => {
  const device = new NullDevice({});
  const positions = makeGPUVector(device, 'positions', 'float32x2', new Float32Array([0, 0]));
  const texts = makeGPUVector(device, 'texts', 'value-list<uint8>', new Uint8Array([65]));
  const textDictionaries = makeGPUVector(device, 'texts', 'sint32', new Int32Array([0]));
  const invalidTexts = makeGPUVector(device, 'texts', 'float32', new Float32Array([65]));

  expect(
    () => assertTextStorageGPUVectorInputs({positions, texts}),
    'accepts value-list UTF-8 bytes'
  ).not.toThrow();
  expect(
    () => assertTextStorageGPUVectorInputs({positions, texts: textDictionaries}),
    'accepts dictionary row keys'
  ).not.toThrow();
  expect(
    () => assertTextStorageGPUVectorInputs({positions, texts: invalidTexts as never}),
    'rejects non-text GPU bytes even when adapter metadata could look similar'
  ).toThrow(
    /texts GPUVector\.format "float32" must be one of value-list<uint8>, sint8, sint16, sint32, uint8, uint16, uint32/
  );

  positions.destroy();
  texts.destroy();
  textDictionaries.destroy();
  invalidTexts.destroy();
  void 0;
});

function makeGPUVector(
  device: NullDevice,
  name: string,
  format: GPUVectorFormat,
  data: Float32Array | Int32Array | Uint8Array
): GPUVector {
  return new GPUVector({
    type: 'buffer',
    name,
    buffer: device.createBuffer({usage: Buffer.VERTEX | Buffer.STORAGE, data}),
    format,
    length: 1,
    ownsBuffer: true
  });
}
