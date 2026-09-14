// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, validatePackedUint32View} from './graph-data-view-utils';

/** Words in `[inputByteOffset, descriptorWordOffset, outputByteOffset, outputByteLength,
 * descriptorCount, consumer0, consumer1, consumer2]`. */
export const GPU_LZ_BYTE_BATCH_JOB_WORDS = 8;
/** Number of output words expanded by one workgroup. */
export const GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE = 256;

/** Construction properties for runtime-described, independent LZ byte streams. */
export type GPULZByteBatchDecompressorProps = {
  id?: string;
  /** Packed compressed inputs, five-word LZ descriptors, and job records. */
  upload: GraphDataView<'uint32'>;
  /** Eight-word job records stored inside `upload`. */
  jobs: GraphDataView<'uint32'>;
  /** Word-aligned aggregate decompression output. */
  output: GraphDataView<'uint32'>;
  jobCount: number;
  outputByteLength: number;
  maximumOutputWordCount: number;
};

/** Immutable workload and dispatch statistics for an LZ byte batch. */
export type GPULZByteBatchDecompressorStats = Readonly<{
  jobCount: number;
  outputByteLength: number;
  maximumOutputWordCount: number;
  workgroupsPerJob: number;
  dispatchedWorkgroupCount: number;
}>;

/**
 * Expands many independent generic LZ byte streams with one compute dispatch.
 *
 * Use this operation when a format adapter has packed compressed payloads and the five-word
 * descriptors accepted by {@link GPULZByteDecompressor} into one upload. The first five words of
 * each runtime job select that page's input, descriptor list, aligned output range, byte length,
 * and descriptor count. Three trailing words are deliberately left to the consumer so a following
 * batched transform can reuse the same records without another metadata upload.
 *
 * Each invocation still owns one complete output word and performs the same deterministic
 * overlapping-copy resolution as the single-stream operation. Batching removes per-stream
 * pipelines, bindings, and dispatch commands; it does not concatenate streams or permit copies to
 * cross job boundaries.
 */
export class GPULZByteBatchDecompressor {
  readonly id: string;
  readonly props: Readonly<GPULZByteBatchDecompressorProps>;
  readonly stats: GPULZByteBatchDecompressorStats;

  constructor(props: GPULZByteBatchDecompressorProps) {
    this.id = props.id ?? 'gpu-lz-byte-batch-decompressor';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
    const workgroupsPerJob = Math.ceil(
      props.maximumOutputWordCount / GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE
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
      upload: this.props.upload,
      jobs: this.props.jobs,
      output: this.props.output
    })) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} ${name} belongs to a different GPUCommandGraph`);
      }
    }
    if (this.props.jobCount === 0) return;
    const dispatch = getDispatch(this.props, graph.device);
    addDecompressionPass(graph, this, dispatch);
  }
}

type BatchDispatch = Readonly<{x: number; y: number; z: number}>;

/** Returns the runtime-described batch resolver shader. @internal */
export function getGPULZByteBatchDecompressorShaderSource(
  decompressor: Pick<GPULZByteBatchDecompressor, 'props'>,
  dispatch: BatchDispatch
): string {
  const jobWordOffset = decompressor.props.jobs.byteOffset / Uint32Array.BYTES_PER_ELEMENT;
  return `const JOB_COUNT: u32 = ${decompressor.props.jobCount}u;
const JOB_WORD_OFFSET: u32 = ${jobWordOffset}u;
const DISPATCH_X: u32 = ${dispatch.x}u;

@group(0) @binding(0) var<storage, read> uploadWords: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputWords: array<u32>;

fn readUploadedByte(byteIndex: u32) -> u32 {
  let word = uploadWords[byteIndex / 4u];
  return (word >> ((byteIndex & 3u) * 8u)) & 255u;
}

fn findDescriptor(jobOffset: u32, outputByteIndex: u32) -> u32 {
  let descriptorWordOffset = uploadWords[jobOffset + 1u];
  let descriptorCount = uploadWords[jobOffset + 4u];
  var lowerDescriptorIndex = 0u;
  var upperDescriptorIndex = descriptorCount;
  while (lowerDescriptorIndex < upperDescriptorIndex) {
    let middleDescriptorIndex = lowerDescriptorIndex +
      (upperDescriptorIndex - lowerDescriptorIndex) / 2u;
    let descriptorOutputOffset =
      uploadWords[descriptorWordOffset + middleDescriptorIndex * 5u];
    if (descriptorOutputOffset <= outputByteIndex) {
      lowerDescriptorIndex = middleDescriptorIndex + 1u;
    } else {
      upperDescriptorIndex = middleDescriptorIndex;
    }
  }
  return lowerDescriptorIndex - 1u;
}

fn resolveLiteralByte(jobOffset: u32, outputByteIndex: u32, initialDescriptorIndex: u32) -> u32 {
  let inputByteOffset = uploadWords[jobOffset];
  let descriptorWordOffset = uploadWords[jobOffset + 1u];
  let descriptorCount = uploadWords[jobOffset + 4u];
  var sourceOutputByteIndex = outputByteIndex;
  var sourceDescriptorIndex = initialDescriptorIndex;
  for (var depth = 0u; depth < descriptorCount; depth++) {
    let descriptorIndex = descriptorWordOffset + sourceDescriptorIndex * 5u;
    let descriptorOutputOffset = uploadWords[descriptorIndex];
    let literalSourceOffset = uploadWords[descriptorIndex + 2u];
    let literalPeriod = uploadWords[descriptorIndex + 3u];
    let matchOffset = uploadWords[descriptorIndex + 4u];
    var relativeByteIndex = sourceOutputByteIndex - descriptorOutputOffset;
    if (matchOffset == 0u) {
      if (literalPeriod != 0u) {
        relativeByteIndex %= literalPeriod;
      }
      return readUploadedByte(inputByteOffset + literalSourceOffset + relativeByteIndex);
    }
    sourceOutputByteIndex = descriptorOutputOffset - matchOffset + relativeByteIndex % matchOffset;
    sourceDescriptorIndex = findDescriptor(jobOffset, sourceOutputByteIndex);
  }
  return 0u;
}

@compute @workgroup_size(${GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  let jobIndex = workgroupId.y;
  if (jobIndex >= JOB_COUNT) { return; }
  let jobOffset = JOB_WORD_OFFSET + jobIndex * ${GPU_LZ_BYTE_BATCH_JOB_WORDS}u;
  let outputByteOffset = uploadWords[jobOffset + 2u];
  let outputByteLength = uploadWords[jobOffset + 3u];
  let outputWordIndex =
    ((workgroupId.z * DISPATCH_X + workgroupId.x) * ${GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE}u) +
    localInvocationIndex;
  let outputWordCount = (outputByteLength + 3u) / 4u;
  if (outputWordIndex >= outputWordCount) { return; }

  var outputWord = 0u;
  let outputByteBase = outputWordIndex * 4u;
  var descriptorIndex = findDescriptor(jobOffset, outputByteBase);
  for (var byteLane = 0u; byteLane < 4u; byteLane++) {
    let outputByteIndex = outputByteBase + byteLane;
    if (outputByteIndex < outputByteLength) {
      let descriptorWordOffset = uploadWords[jobOffset + 1u];
      let descriptorCount = uploadWords[jobOffset + 4u];
      if (descriptorIndex + 1u < descriptorCount &&
          uploadWords[descriptorWordOffset + (descriptorIndex + 1u) * 5u] <= outputByteIndex) {
        descriptorIndex += 1u;
      }
      outputWord |= resolveLiteralByte(jobOffset, outputByteIndex, descriptorIndex) <<
        (byteLane * 8u);
    }
  }
  outputWords[(outputByteOffset / 4u) + outputWordIndex] = outputWord;
}`;
}

function addDecompressionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decompressor: GPULZByteBatchDecompressor,
  dispatch: BatchDispatch
): void {
  const source = getGPULZByteBatchDecompressorShaderSource(decompressor, dispatch);
  graph.addComputePass({
    id: decompressor.id,
    workload: {
      operation: 'GPULZByteBatchDecompressor',
      commandCount: 1,
      maximumWorkgroupCount: decompressor.stats.dispatchedWorkgroupCount,
      maximumInvocationCount:
        decompressor.stats.dispatchedWorkgroupCount * GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE,
      readByteLength: decompressor.props.upload.length * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: decompressor.props.outputByteLength
    },
    resources: [
      {buffer: decompressor.props.upload, usage: 'storage-read'},
      {buffer: decompressor.props.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: decompressor.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'uploadWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'outputWords', type: 'storage', group: 0, location: 1}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            uploadWords: getViewBinding(decompressor.props.upload, getBuffer),
            outputWords: getViewBinding(decompressor.props.output, getBuffer)
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
  props: Readonly<GPULZByteBatchDecompressorProps>,
  device: Device
): BatchDispatch {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE
  ) {
    throw new Error(`${props.id} requires WebGPU with 256-invocation compute workgroups`);
  }
  const maximumDimension = device.limits.maxComputeWorkgroupsPerDimension;
  const workgroupsPerJob = Math.ceil(
    props.maximumOutputWordCount / GPU_LZ_BYTE_BATCH_WORKGROUP_SIZE
  );
  const x = Math.min(workgroupsPerJob, maximumDimension);
  const z = Math.ceil(workgroupsPerJob / maximumDimension);
  if (props.jobCount > maximumDimension || z > maximumDimension) {
    throw new Error(`${props.id} batch exceeds WebGPU dispatch dimensions`);
  }
  return Object.freeze({x, y: props.jobCount, z});
}

function validateConfiguration(props: Readonly<GPULZByteBatchDecompressorProps>): void {
  validatePackedUint32View(props.upload, `${props.id} upload`);
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
  if (props.upload.byteOffset !== 0) {
    throw new Error(`${props.id} upload must begin at byte offset zero`);
  }
  if (props.jobs.buffer !== props.upload.buffer) {
    throw new Error(`${props.id} jobs must be stored inside upload`);
  }
  if (props.output.buffer === props.upload.buffer) {
    throw new Error(`${props.id} output must use a separate buffer`);
  }
  if (props.jobs.length < props.jobCount * GPU_LZ_BYTE_BATCH_JOB_WORDS) {
    throw new Error(`${props.id} jobs view is shorter than jobCount`);
  }
  if (props.output.length * Uint32Array.BYTES_PER_ELEMENT < props.outputByteLength) {
    throw new Error(`${props.id} output is shorter than outputByteLength`);
  }
}
