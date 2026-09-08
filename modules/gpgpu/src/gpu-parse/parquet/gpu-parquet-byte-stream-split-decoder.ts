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

/** Number of output words decoded by one WebGPU workgroup. */
export const GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE = 256;

/** Construction properties for one Parquet `BYTE_STREAM_SPLIT` decoder. */
export type GPUParquetByteStreamSplitDecoderProps = {
  /** Prefix for the generated command-graph node ID. */
  id?: string;
  /** Encoded bytes packed into uint32 words. The final word may contain padding. */
  input: GraphDataView<'uint32'>;
  /** Decoded physical bytes packed into uint32 words. The final word may contain padding. */
  output: GraphDataView<'uint32'>;
  /** Number of encoded physical values. */
  valueCount: number;
  /** Physical bytes per value. */
  byteWidth: number;
};

/** Immutable byte and dispatch statistics for one decoder. */
export type GPUParquetByteStreamSplitStats = {
  valueCount: number;
  byteWidth: number;
  byteLength: number;
  wordCount: number;
  workgroupCount: number;
  workgroupSize: number;
};

/**
 * Decodes a Parquet `BYTE_STREAM_SPLIT` payload into value-major physical bytes.
 *
 * Each invocation reconstructs one packed output word. The operation preserves bit patterns and is
 * therefore equally useful for integer, floating-point, 64-bit, and fixed-length physical values.
 */
export class GPUParquetByteStreamSplitDecoder {
  readonly id: string;
  readonly input: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly valueCount: number;
  readonly byteWidth: number;
  readonly stats: GPUParquetByteStreamSplitStats;

  constructor(props: GPUParquetByteStreamSplitDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-byte-stream-split';
    this.input = props.input;
    this.output = props.output;
    this.valueCount = props.valueCount;
    this.byteWidth = props.byteWidth;
    this.stats = makeGPUParquetByteStreamSplitStats(props.valueCount, props.byteWidth);

    validatePackedUint32View(this.input, `${this.id} input`);
    validatePackedUint32View(this.output, `${this.id} output`);
    if (this.input.length < this.stats.wordCount) {
      throw new Error(`${this.id} input is shorter than the encoded byte payload`);
    }
    if (this.output.length < this.stats.wordCount) {
      throw new Error(`${this.id} output is shorter than the decoded byte payload`);
    }
    if (this.input.buffer === this.output.buffer) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
  }

  /** Adds one decode node without compiling, submitting, or reading data back. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateGraphOwnership(graph, this.input, `${this.id} input`);
    validateGraphOwnership(graph, this.output, `${this.id} output`);
    if (this.stats.wordCount === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUParquetByteStreamSplitDecoder',
      this.stats.wordCount,
      GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addDecodePass(graph, this, dispatchLayout);
  }
}

/** Builds the device-independent work plan for one byte-stream-split payload. */
export function makeGPUParquetByteStreamSplitStats(
  valueCount: number,
  byteWidth: number
): GPUParquetByteStreamSplitStats {
  validateDimension('valueCount', valueCount, true);
  validateDimension('byteWidth', byteWidth, false);
  const byteLength = valueCount * byteWidth;
  if (!Number.isSafeInteger(byteLength) || byteLength > 0xffffffff) {
    throw new Error('GPU Parquet byte length must fit in a uint32 index range');
  }
  const wordCount = Math.ceil(byteLength / Uint32Array.BYTES_PER_ELEMENT);
  return Object.freeze({
    valueCount,
    byteWidth,
    byteLength,
    wordCount,
    workgroupCount: Math.ceil(wordCount / GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE),
    workgroupSize: GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE
  });
}

/** Returns the byte-addressed WGSL used by one decoder node. @internal */
export function getGPUParquetByteStreamSplitShaderSource(
  decoder: Pick<GPUParquetByteStreamSplitDecoder, 'input' | 'output' | 'stats'>,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  return `const VALUE_COUNT: u32 = ${decoder.stats.valueCount}u;
const BYTE_WIDTH: u32 = ${decoder.stats.byteWidth}u;
const BYTE_LENGTH: u32 = ${decoder.stats.byteLength}u;
const WORD_COUNT: u32 = ${decoder.stats.wordCount}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(decoder.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(decoder.output)}u;

@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputWords: array<u32>;

fn readEncodedByte(encodedByteIndex: u32) -> u32 {
  let encodedWord = inputWords[INPUT_OFFSET + encodedByteIndex / 4u];
  let encodedByteShift = (encodedByteIndex & 3u) * 8u;
  return (encodedWord >> encodedByteShift) & 255u;
}

@compute @workgroup_size(${GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE)}
  let outputWordIndex = index;
  if (outputWordIndex >= WORD_COUNT) { return; }
  let decodedByteBase = outputWordIndex * 4u;
  var decodedWord = 0u;
  for (var byteLane = 0u; byteLane < 4u; byteLane++) {
    let decodedByteIndex = decodedByteBase + byteLane;
    if (decodedByteIndex < BYTE_LENGTH) {
      let valueIndex = decodedByteIndex / BYTE_WIDTH;
      let byteIndexWithinValue = decodedByteIndex - valueIndex * BYTE_WIDTH;
      let encodedByteIndex = byteIndexWithinValue * VALUE_COUNT + valueIndex;
      decodedWord |= readEncodedByte(encodedByteIndex) << (byteLane * 8u);
    }
  }
  outputWords[OUTPUT_OFFSET + outputWordIndex] = decodedWord;
}`;
}

function addDecodePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decoder: GPUParquetByteStreamSplitDecoder,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUParquetByteStreamSplitShaderSource(decoder, dispatchLayout);
  graph.addComputePass({
    id: decoder.id,
    workload: {
      operation: 'GPUParquetByteStreamSplitDecoder',
      commandCount: 1,
      maximumWorkgroupCount: decoder.stats.workgroupCount,
      maximumInvocationCount:
        decoder.stats.workgroupCount * GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE,
      readByteLength: decoder.stats.byteLength,
      writeByteLength: decoder.stats.byteLength
    },
    resources: [
      {buffer: decoder.input, usage: 'storage-read'},
      {buffer: decoder.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: decoder.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'outputWords', type: 'storage', group: 0, location: 1}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputWords: getViewBinding(decoder.input, getBuffer),
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

function validateGraphOwnership<Parameters>(
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
    device.limits.maxComputeInvocationsPerWorkgroup <
      GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
