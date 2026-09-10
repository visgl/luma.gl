// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPU_LZ_BYTE_BATCH_JOB_WORDS,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

/** Number of final output words restored by one workgroup. */
export const GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE = 256;

/** Construction properties for runtime-described Parquet byte-stream-split pages. */
export type GPUParquetByteStreamSplitBatchDecoderProps = {
  id?: string;
  /** Page-major encoded byte streams in word-aligned ranges. */
  input: GraphDataView<'uint32'>;
  /** Eight-word job records whose trailing words contain value count and byte width. */
  jobs: GraphDataView<'uint32'>;
  /** Page-major final physical values using the same aligned ranges as `input`. */
  output: GraphDataView<'uint32'>;
  jobCount: number;
  outputByteLength: number;
  maximumOutputWordCount: number;
};

/** Immutable workload and dispatch statistics for one byte-stream-split batch. */
export type GPUParquetByteStreamSplitBatchStats = Readonly<{
  jobCount: number;
  outputByteLength: number;
  maximumOutputWordCount: number;
  workgroupsPerJob: number;
  dispatchedWorkgroupCount: number;
}>;

/**
 * Restores many page-major Parquet `BYTE_STREAM_SPLIT` payloads with one compute dispatch.
 *
 * Use this after {@link GPULZByteBatchDecompressor} when its shared eight-word jobs reserve words
 * five and six for `valueCount` and `byteWidth`. It can also consume any caller-created aggregate
 * with that record layout. Each job remains independent and preserves its own word-aligned range;
 * no page concatenation or CPU readback is introduced.
 *
 * This operation reduces command encoding and binding overhead. It deliberately remains separate
 * from decompression because sequential LZ output has much better descriptor locality than
 * resolving the four distant byte planes required by a fused byte-stream-split output word.
 */
export class GPUParquetByteStreamSplitBatchDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetByteStreamSplitBatchDecoderProps>;
  readonly stats: GPUParquetByteStreamSplitBatchStats;

  constructor(props: GPUParquetByteStreamSplitBatchDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-byte-stream-split-batch';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
    const workgroupsPerJob = Math.ceil(
      props.maximumOutputWordCount / GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE
    );
    this.stats = Object.freeze({
      jobCount: props.jobCount,
      outputByteLength: props.outputByteLength,
      maximumOutputWordCount: props.maximumOutputWordCount,
      workgroupsPerJob,
      dispatchedWorkgroupCount: workgroupsPerJob * props.jobCount
    });
  }

  /** Adds one batch node without compiling, submitting, or reading data back. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const [name, view] of Object.entries({
      input: this.props.input,
      jobs: this.props.jobs,
      output: this.props.output
    })) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} ${name} belongs to a different GPUCommandGraph`);
      }
    }
    if (this.props.jobCount === 0) return;
    const dispatch = getDispatch(this.props, graph.device);
    addDecodePass(graph, this, dispatch);
  }
}

type BatchDispatch = Readonly<{x: number; y: number; z: number}>;

/** Returns the runtime-described batch byte restoration shader. @internal */
export function getGPUParquetByteStreamSplitBatchShaderSource(
  decoder: Pick<GPUParquetByteStreamSplitBatchDecoder, 'props'>,
  dispatch: BatchDispatch
): string {
  return `const JOB_COUNT: u32 = ${decoder.props.jobCount}u;
const JOB_WORD_OFFSET: u32 = ${getViewElementOffset(decoder.props.jobs)}u;
const DISPATCH_X: u32 = ${dispatch.x}u;

@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read> jobs: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputWords: array<u32>;

fn readEncodedByte(byteIndex: u32) -> u32 {
  let word = inputWords[byteIndex / 4u];
  return (word >> ((byteIndex & 3u) * 8u)) & 255u;
}

@compute @workgroup_size(${GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  let jobIndex = workgroupId.y;
  if (jobIndex >= JOB_COUNT) { return; }
  let jobOffset = JOB_WORD_OFFSET + jobIndex * ${GPU_LZ_BYTE_BATCH_JOB_WORDS}u;
  let outputByteOffset = jobs[jobOffset + 2u];
  let outputByteLength = jobs[jobOffset + 3u];
  let valueCount = jobs[jobOffset + 5u];
  let byteWidth = jobs[jobOffset + 6u];
  let outputWordIndex =
    ((workgroupId.z * DISPATCH_X + workgroupId.x) *
      ${GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE}u) + localInvocationIndex;
  let outputWordCount = (outputByteLength + 3u) / 4u;
  if (outputWordIndex >= outputWordCount) { return; }

  let decodedByteBase = outputWordIndex * 4u;
  var decodedWord = 0u;
  for (var byteLane = 0u; byteLane < 4u; byteLane++) {
    let decodedByteIndex = decodedByteBase + byteLane;
    if (decodedByteIndex < outputByteLength) {
      let valueIndex = decodedByteIndex / byteWidth;
      let byteIndexWithinValue = decodedByteIndex - valueIndex * byteWidth;
      let encodedByteIndex = byteIndexWithinValue * valueCount + valueIndex;
      decodedWord |= readEncodedByte(outputByteOffset + encodedByteIndex) << (byteLane * 8u);
    }
  }
  outputWords[(outputByteOffset / 4u) + outputWordIndex] = decodedWord;
}`;
}

function addDecodePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decoder: GPUParquetByteStreamSplitBatchDecoder,
  dispatch: BatchDispatch
): void {
  const source = getGPUParquetByteStreamSplitBatchShaderSource(decoder, dispatch);
  graph.addComputePass({
    id: decoder.id,
    workload: {
      operation: 'GPUParquetByteStreamSplitBatchDecoder',
      commandCount: 1,
      maximumWorkgroupCount: decoder.stats.dispatchedWorkgroupCount,
      maximumInvocationCount:
        decoder.stats.dispatchedWorkgroupCount * GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE,
      readByteLength: decoder.props.outputByteLength,
      writeByteLength: decoder.props.outputByteLength
    },
    resources: [
      {buffer: decoder.props.input, usage: 'storage-read'},
      {buffer: decoder.props.jobs, usage: 'storage-read'},
      {buffer: decoder.props.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: decoder.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'jobs', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputWords', type: 'storage', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputWords: getViewBinding(decoder.props.input, getBuffer),
            jobs: getViewBinding(decoder.props.jobs, getBuffer),
            outputWords: getViewBinding(decoder.props.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatch.x, dispatch.y, dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getDispatch(
  props: Readonly<GPUParquetByteStreamSplitBatchDecoderProps>,
  device: Device
): BatchDispatch {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup <
      GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE
  ) {
    throw new Error(`${props.id} requires WebGPU with 256-invocation compute workgroups`);
  }
  const maximumDimension = device.limits.maxComputeWorkgroupsPerDimension;
  const workgroupsPerJob = Math.ceil(
    props.maximumOutputWordCount / GPU_PARQUET_BYTE_STREAM_SPLIT_BATCH_WORKGROUP_SIZE
  );
  const x = Math.min(workgroupsPerJob, maximumDimension);
  const z = Math.ceil(workgroupsPerJob / maximumDimension);
  if (props.jobCount > maximumDimension || z > maximumDimension) {
    throw new Error(`${props.id} batch exceeds WebGPU dispatch dimensions`);
  }
  return Object.freeze({x, y: props.jobCount, z});
}

function validateConfiguration(props: Readonly<GPUParquetByteStreamSplitBatchDecoderProps>): void {
  validatePackedUint32View(props.input, `${props.id} input`);
  validatePackedUint32View(props.jobs, `${props.id} jobs`);
  validatePackedUint32View(props.output, `${props.id} output`);
  for (const [name, value] of Object.entries({
    jobCount: props.jobCount,
    outputByteLength: props.outputByteLength,
    maximumOutputWordCount: props.maximumOutputWordCount
  })) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error(`${props.id} ${name} must be a non-negative uint32`);
    }
  }
  if (props.jobCount > 0 && props.maximumOutputWordCount === 0) {
    throw new Error(`${props.id} non-empty jobs require output words`);
  }
  if (props.input.buffer === props.output.buffer) {
    throw new Error(`${props.id} input and output must use separate buffers`);
  }
  if (props.jobs.length < props.jobCount * GPU_LZ_BYTE_BATCH_JOB_WORDS) {
    throw new Error(`${props.id} jobs view is shorter than jobCount`);
  }
  if (props.input.length * Uint32Array.BYTES_PER_ELEMENT < props.outputByteLength) {
    throw new Error(`${props.id} input is shorter than outputByteLength`);
  }
  if (props.output.length * Uint32Array.BYTES_PER_ELEMENT < props.outputByteLength) {
    throw new Error(`${props.id} output is shorter than outputByteLength`);
  }
}
