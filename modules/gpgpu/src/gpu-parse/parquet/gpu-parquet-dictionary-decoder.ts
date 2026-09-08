// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  type GPUBoundedDispatchLayout,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

export const GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE = 256;

export type GPUParquetDictionaryDecoderProps = {
  id?: string;
  dictionary: GraphDataView<'uint32'>;
  indices: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  valueCount: number;
  dictionaryValueCount: number;
  byteWidth: number;
};

export type GPUParquetDictionaryDecoderStats = {
  valueCount: number;
  dictionaryValueCount: number;
  byteWidth: number;
  dictionaryByteLength: number;
  outputByteLength: number;
  outputWordCount: number;
  workgroupCount: number;
};

/** Expands decoded indices into arbitrary fixed-width physical dictionary bytes. */
export class GPUParquetDictionaryDecoder {
  readonly id: string;
  readonly dictionary: GraphDataView<'uint32'>;
  readonly indices: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly stats: GPUParquetDictionaryDecoderStats;

  constructor(props: GPUParquetDictionaryDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-dictionary';
    this.dictionary = props.dictionary;
    this.indices = props.indices;
    this.output = props.output;
    this.stats = makeGPUParquetDictionaryDecoderStats(
      props.valueCount,
      props.dictionaryValueCount,
      props.byteWidth
    );
    validatePackedUint32View(this.dictionary, `${this.id} dictionary`);
    validatePackedUint32View(this.indices, `${this.id} indices`);
    validatePackedUint32View(this.output, `${this.id} output`);
    if (this.dictionary.length < Math.ceil(this.stats.dictionaryByteLength / 4)) {
      throw new Error(`${this.id} dictionary is shorter than dictionaryValueCount * byteWidth`);
    }
    if (this.indices.length < this.stats.valueCount) {
      throw new Error(`${this.id} indices is shorter than valueCount`);
    }
    if (this.output.length < this.stats.outputWordCount) {
      throw new Error(`${this.id} output is shorter than valueCount * byteWidth`);
    }
    if (
      this.output.buffer === this.dictionary.buffer ||
      this.output.buffer === this.indices.buffer
    ) {
      throw new Error(`${this.id} output must use a separate buffer`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateOwnership(graph, this.dictionary, `${this.id} dictionary`);
    validateOwnership(graph, this.indices, `${this.id} indices`);
    validateOwnership(graph, this.output, `${this.id} output`);
    if (this.stats.outputWordCount === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUParquetDictionaryDecoder',
      this.stats.outputWordCount,
      GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addDecodePass(graph, this, dispatchLayout);
  }
}

export function makeGPUParquetDictionaryDecoderStats(
  valueCount: number,
  dictionaryValueCount: number,
  byteWidth: number
): GPUParquetDictionaryDecoderStats {
  validateDimension('valueCount', valueCount, true);
  validateDimension('dictionaryValueCount', dictionaryValueCount, true);
  validateDimension('byteWidth', byteWidth, false);
  const dictionaryByteLength = dictionaryValueCount * byteWidth;
  const outputByteLength = valueCount * byteWidth;
  if (
    !Number.isSafeInteger(dictionaryByteLength) ||
    dictionaryByteLength > 0xffffffff ||
    !Number.isSafeInteger(outputByteLength) ||
    outputByteLength > 0xffffffff
  ) {
    throw new Error('GPU Parquet dictionary byte lengths must fit in a uint32 index range');
  }
  const outputWordCount = Math.ceil(outputByteLength / 4);
  return Object.freeze({
    valueCount,
    dictionaryValueCount,
    byteWidth,
    dictionaryByteLength,
    outputByteLength,
    outputWordCount,
    workgroupCount: Math.ceil(outputWordCount / GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE)
  });
}

export function getGPUParquetDictionaryShaderSource(
  decoder: GPUParquetDictionaryDecoder,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  const {stats} = decoder;
  return `const DICTIONARY_VALUE_COUNT: u32 = ${stats.dictionaryValueCount}u;
const BYTE_WIDTH: u32 = ${stats.byteWidth}u;
const OUTPUT_BYTE_LENGTH: u32 = ${stats.outputByteLength}u;
const OUTPUT_WORD_COUNT: u32 = ${stats.outputWordCount}u;
const DICTIONARY_OFFSET: u32 = ${getViewElementOffset(decoder.dictionary)}u;
const INDEX_OFFSET: u32 = ${getViewElementOffset(decoder.indices)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(decoder.output)}u;

@group(0) @binding(0) var<storage, read> dictionaryWords: array<u32>;
@group(0) @binding(1) var<storage, read> dictionaryIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputWords: array<u32>;

fn readDictionaryByte(dictionaryByteIndex: u32) -> u32 {
  let dictionaryWord = dictionaryWords[DICTIONARY_OFFSET + dictionaryByteIndex / 4u];
  return (dictionaryWord >> ((dictionaryByteIndex & 3u) * 8u)) & 255u;
}

@compute @workgroup_size(${GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE)}
  let outputWordIndex = index;
  if (outputWordIndex >= OUTPUT_WORD_COUNT) { return; }
  let outputByteBase = outputWordIndex * 4u;
  var outputWord = 0u;
  for (var byteLane = 0u; byteLane < 4u; byteLane++) {
    let outputByteIndex = outputByteBase + byteLane;
    if (outputByteIndex < OUTPUT_BYTE_LENGTH) {
      let valueIndex = outputByteIndex / BYTE_WIDTH;
      let byteIndexWithinValue = outputByteIndex - valueIndex * BYTE_WIDTH;
      let dictionaryIndex = dictionaryIndices[INDEX_OFFSET + valueIndex];
      if (dictionaryIndex < DICTIONARY_VALUE_COUNT) {
        let dictionaryByteIndex = dictionaryIndex * BYTE_WIDTH + byteIndexWithinValue;
        outputWord |= readDictionaryByte(dictionaryByteIndex) << (byteLane * 8u);
      }
    }
  }
  outputWords[OUTPUT_OFFSET + outputWordIndex] = outputWord;
}`;
}

function addDecodePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decoder: GPUParquetDictionaryDecoder,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUParquetDictionaryShaderSource(decoder, dispatchLayout);
  graph.addComputePass({
    id: decoder.id,
    workload: {
      operation: 'GPUParquetDictionaryDecoder',
      commandCount: 1,
      maximumWorkgroupCount: decoder.stats.workgroupCount,
      maximumInvocationCount: decoder.stats.workgroupCount * GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE,
      readByteLength:
        decoder.stats.dictionaryByteLength +
        decoder.stats.valueCount * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: decoder.stats.outputByteLength
    },
    resources: [
      {buffer: decoder.dictionary, usage: 'storage-read'},
      {buffer: decoder.indices, usage: 'storage-read'},
      {buffer: decoder.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: decoder.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'dictionaryWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'dictionaryIndices', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputWords', type: 'storage', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            dictionaryWords: getViewBinding(decoder.dictionary, getBuffer),
            dictionaryIndices: getViewBinding(decoder.indices, getBuffer),
            outputWords: getViewBinding(decoder.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateDimension(name: string, value: number, allowZero: boolean): void {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > 0xffffffff) {
    throw new Error(
      `GPU Parquet ${name} must be a ${allowZero ? 'non-negative' : 'positive'} uint32`
    );
  }
}

function validateOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView,
  name: string
): void {
  if (view.buffer.graph !== graph) {
    throw new Error(`${name} belongs to a different GPUCommandGraph`);
  }
}

function validateDevice(device: Device, id: string): void {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_DICTIONARY_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
