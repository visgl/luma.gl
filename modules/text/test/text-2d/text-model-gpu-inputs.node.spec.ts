// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer} from '@luma.gl/core';
import {
  AttributeTextModel,
  DictionaryTextModel,
  RowIndexedStorageTextModel,
  StorageTextModel,
  assertStorageTextGPUVectorInputs,
  ATTRIBUTE_TEXT_GPU_INPUT_SCHEMA,
  DICTIONARY_TEXT_GPU_INPUT_SCHEMA,
  STORAGE_TEXT_GPU_INPUT_SCHEMA
} from '@luma.gl/text';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';

test('2D text models declare flat source-mappable GPU inputs', t => {
  t.deepEqual(ATTRIBUTE_TEXT_GPU_INPUT_SCHEMA, [
    {
      name: 'positions',
      kind: 'positions',
      required: true,
      formats: ['float32x2'],
      source: 'source-mappable'
    },
    {
      name: 'texts',
      kind: 'text',
      required: true,
      formats: ['value-list<uint8>', 'sint8', 'sint16', 'sint32', 'uint8', 'uint16', 'uint32'],
      source: 'source-mappable'
    },
    {
      name: 'colors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4', 'vertex-list<unorm8x4>'],
      source: 'source-mappable'
    },
    {
      name: 'angles',
      kind: 'scalars',
      required: false,
      formats: ['float32'],
      source: 'source-mappable'
    },
    {
      name: 'sizes',
      kind: 'scalars',
      required: false,
      formats: ['float32'],
      source: 'source-mappable'
    },
    {
      name: 'pixelOffsets',
      kind: 'positions',
      required: false,
      formats: ['float32x2'],
      source: 'source-mappable'
    },
    {
      name: 'clipRects',
      kind: 'positions',
      required: false,
      formats: ['sint16x4'],
      source: 'source-mappable'
    }
  ]);
  t.deepEqual(STORAGE_TEXT_GPU_INPUT_SCHEMA, [
    {
      name: 'positions',
      kind: 'positions',
      required: true,
      formats: ['float32x2'],
      source: 'source-mappable'
    },
    {
      name: 'texts',
      kind: 'text',
      required: true,
      formats: ['value-list<uint8>', 'sint8', 'sint16', 'sint32', 'uint8', 'uint16', 'uint32'],
      source: 'source-mappable'
    },
    {
      name: 'colors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4'],
      source: 'source-mappable'
    },
    {
      name: 'angles',
      kind: 'scalars',
      required: false,
      formats: ['float32'],
      source: 'source-mappable'
    },
    {
      name: 'sizes',
      kind: 'scalars',
      required: false,
      formats: ['float32'],
      source: 'source-mappable'
    },
    {
      name: 'pixelOffsets',
      kind: 'positions',
      required: false,
      formats: ['float32x2'],
      source: 'source-mappable'
    },
    {
      name: 'textAnchors',
      kind: 'scalars',
      required: false,
      formats: ['uint8'],
      source: 'source-mappable'
    },
    {
      name: 'alignmentBaselines',
      kind: 'scalars',
      required: false,
      formats: ['uint8'],
      source: 'source-mappable'
    },
    {
      name: 'clipRects',
      kind: 'positions',
      required: false,
      formats: ['sint16x4'],
      source: 'source-mappable'
    }
  ]);
  t.deepEqual(DICTIONARY_TEXT_GPU_INPUT_SCHEMA, [
    {
      name: 'positions',
      kind: 'positions',
      required: true,
      formats: ['float32x2'],
      source: 'source-mappable'
    },
    {
      name: 'texts',
      kind: 'text',
      required: true,
      formats: ['sint8', 'sint16', 'sint32', 'uint8', 'uint16', 'uint32'],
      source: 'source-mappable'
    },
    ...STORAGE_TEXT_GPU_INPUT_SCHEMA.slice(2)
  ]);
  t.equal(AttributeTextModel.gpuInputSchema, ATTRIBUTE_TEXT_GPU_INPUT_SCHEMA);
  t.equal(StorageTextModel.gpuInputSchema, STORAGE_TEXT_GPU_INPUT_SCHEMA);
  t.equal(RowIndexedStorageTextModel.gpuInputSchema, STORAGE_TEXT_GPU_INPUT_SCHEMA);
  t.equal(DictionaryTextModel.gpuInputSchema, DICTIONARY_TEXT_GPU_INPUT_SCHEMA);
  t.end();
});

test('storage text prepared input validation uses GPUVector.format', t => {
  const device = new NullDevice({});
  const positions = makeGPUVector(device, 'positions', 'float32x2', new Float32Array([0, 0]));
  const texts = makeGPUVector(device, 'texts', 'value-list<uint8>', new Uint8Array([65]));
  const dictionaryTexts = makeGPUVector(device, 'texts', 'sint32', new Int32Array([0]));
  const invalidTexts = makeGPUVector(device, 'texts', 'float32', new Float32Array([65]));

  t.doesNotThrow(
    () => assertStorageTextGPUVectorInputs({positions, texts}),
    'accepts value-list UTF-8 bytes'
  );
  t.doesNotThrow(
    () => assertStorageTextGPUVectorInputs({positions, texts: dictionaryTexts}),
    'accepts dictionary row keys'
  );
  t.throws(
    () => assertStorageTextGPUVectorInputs({positions, texts: invalidTexts as never}),
    /texts GPUVector\.format "float32" must be one of value-list<uint8>, sint8, sint16, sint32, uint8, uint16, uint32/,
    'rejects non-text GPU bytes even when adapter metadata could look similar'
  );

  positions.destroy();
  texts.destroy();
  dictionaryTexts.destroy();
  invalidTexts.destroy();
  t.end();
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
