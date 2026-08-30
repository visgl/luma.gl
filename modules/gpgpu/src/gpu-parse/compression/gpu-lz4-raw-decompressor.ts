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
import {LZ4_RAW_SEQUENCE_DESCRIPTOR_WORDS} from './lz4-raw-plan';

export const GPU_LZ4_RAW_WORKGROUP_SIZE = 256;

export type GPULZ4RawDecompressorProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  sequenceDescriptors: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  compressedByteLength: number;
  outputByteLength: number;
  sequenceCount: number;
};

/** Resolves every LZ4_RAW output byte back to a literal source without inter-invocation races. */
export class GPULZ4RawDecompressor {
  readonly id: string;
  readonly input: GraphDataView<'uint32'>;
  readonly sequenceDescriptors: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly compressedByteLength: number;
  readonly outputByteLength: number;
  readonly sequenceCount: number;

  constructor(props: GPULZ4RawDecompressorProps) {
    this.id = props.id ?? 'gpu-lz4-raw';
    this.input = props.input;
    this.sequenceDescriptors = props.sequenceDescriptors;
    this.output = props.output;
    this.compressedByteLength = props.compressedByteLength;
    this.outputByteLength = props.outputByteLength;
    this.sequenceCount = props.sequenceCount;
    validateConfiguration(this);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateOwnership(graph, this.input, `${this.id} input`);
    validateOwnership(graph, this.sequenceDescriptors, `${this.id} sequenceDescriptors`);
    validateOwnership(graph, this.output, `${this.id} output`);
    if (this.outputByteLength === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    const outputWordCount = Math.ceil(this.outputByteLength / 4);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPULZ4RawDecompressor',
      outputWordCount,
      GPU_LZ4_RAW_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addDecompressionPass(graph, this, dispatchLayout);
  }
}

export function getGPULZ4RawShaderSource(
  decompressor: GPULZ4RawDecompressor,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  const outputWordCount = Math.ceil(decompressor.outputByteLength / 4);
  return `const OUTPUT_BYTE_LENGTH: u32 = ${decompressor.outputByteLength}u;
const OUTPUT_WORD_COUNT: u32 = ${outputWordCount}u;
const SEQUENCE_COUNT: u32 = ${decompressor.sequenceCount}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(decompressor.input)}u;
const DESCRIPTOR_OFFSET: u32 = ${getViewElementOffset(decompressor.sequenceDescriptors)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(decompressor.output)}u;

@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read> descriptors: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputWords: array<u32>;

fn readCompressedByte(compressedByteIndex: u32) -> u32 {
  let inputWord = inputWords[INPUT_OFFSET + compressedByteIndex / 4u];
  return (inputWord >> ((compressedByteIndex & 3u) * 8u)) & 255u;
}

fn findSequence(outputByteIndex: u32) -> u32 {
  var lowerSequenceIndex = 0u;
  var upperSequenceIndex = SEQUENCE_COUNT;
  while (lowerSequenceIndex < upperSequenceIndex) {
    let middleSequenceIndex = lowerSequenceIndex +
      (upperSequenceIndex - lowerSequenceIndex) / 2u;
    let sequenceOutputOffset = descriptors[DESCRIPTOR_OFFSET + middleSequenceIndex * 5u];
    if (sequenceOutputOffset <= outputByteIndex) {
      lowerSequenceIndex = middleSequenceIndex + 1u;
    } else {
      upperSequenceIndex = middleSequenceIndex;
    }
  }
  return lowerSequenceIndex - 1u;
}

fn resolveLiteralByte(outputByteIndex: u32) -> u32 {
  var sourceOutputByteIndex = outputByteIndex;
  for (var depth = 0u; depth < SEQUENCE_COUNT; depth++) {
    let sequenceIndex = findSequence(sourceOutputByteIndex);
    let descriptorIndex = DESCRIPTOR_OFFSET + sequenceIndex * 5u;
    let sequenceOutputOffset = descriptors[descriptorIndex];
    let literalLength = descriptors[descriptorIndex + 1u];
    let literalSourceOffset = descriptors[descriptorIndex + 3u];
    let matchOffset = descriptors[descriptorIndex + 4u];
    let relativeByteIndex = sourceOutputByteIndex - sequenceOutputOffset;
    if (relativeByteIndex < literalLength) {
      return readCompressedByte(literalSourceOffset + relativeByteIndex);
    }
    let matchByteIndex = relativeByteIndex - literalLength;
    let matchOutputOffset = sequenceOutputOffset + literalLength;
    sourceOutputByteIndex = matchOutputOffset - matchOffset + matchByteIndex % matchOffset;
  }
  return 0u;
}

@compute @workgroup_size(${GPU_LZ4_RAW_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_LZ4_RAW_WORKGROUP_SIZE)}
  let outputWordIndex = index;
  if (outputWordIndex >= OUTPUT_WORD_COUNT) { return; }
  let outputByteBase = outputWordIndex * 4u;
  var outputWord = 0u;
  for (var byteLane = 0u; byteLane < 4u; byteLane++) {
    let outputByteIndex = outputByteBase + byteLane;
    if (outputByteIndex < OUTPUT_BYTE_LENGTH) {
      outputWord |= resolveLiteralByte(outputByteIndex) << (byteLane * 8u);
    }
  }
  outputWords[OUTPUT_OFFSET + outputWordIndex] = outputWord;
}`;
}

function addDecompressionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decompressor: GPULZ4RawDecompressor,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPULZ4RawShaderSource(decompressor, dispatchLayout);
  const outputWordCount = Math.ceil(decompressor.outputByteLength / 4);
  const workgroupCount = Math.ceil(outputWordCount / GPU_LZ4_RAW_WORKGROUP_SIZE);
  graph.addComputePass({
    id: decompressor.id,
    workload: {
      operation: 'GPULZ4RawDecompressor',
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * GPU_LZ4_RAW_WORKGROUP_SIZE,
      readByteLength:
        decompressor.compressedByteLength +
        decompressor.sequenceCount *
          LZ4_RAW_SEQUENCE_DESCRIPTOR_WORDS *
          Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: decompressor.outputByteLength
    },
    resources: [
      {buffer: decompressor.input, usage: 'storage-read'},
      {buffer: decompressor.sequenceDescriptors, usage: 'storage-read'},
      {buffer: decompressor.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: decompressor.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'descriptors', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputWords', type: 'storage', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputWords: getViewBinding(decompressor.input, getBuffer),
            descriptors: getViewBinding(decompressor.sequenceDescriptors, getBuffer),
            outputWords: getViewBinding(decompressor.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(decompressor: GPULZ4RawDecompressor): void {
  validatePackedUint32View(decompressor.input, `${decompressor.id} input`);
  validatePackedUint32View(
    decompressor.sequenceDescriptors,
    `${decompressor.id} sequenceDescriptors`
  );
  validatePackedUint32View(decompressor.output, `${decompressor.id} output`);
  validateUint32(decompressor.compressedByteLength, `${decompressor.id} compressedByteLength`);
  validateUint32(decompressor.outputByteLength, `${decompressor.id} outputByteLength`);
  validateUint32(decompressor.sequenceCount, `${decompressor.id} sequenceCount`);
  if (decompressor.outputByteLength > 0 && decompressor.sequenceCount === 0) {
    throw new Error(`${decompressor.id} requires a sequence for non-empty output`);
  }
  if (decompressor.input.length < Math.ceil(decompressor.compressedByteLength / 4)) {
    throw new Error(`${decompressor.id} input is shorter than compressedByteLength`);
  }
  if (
    decompressor.sequenceDescriptors.length <
    decompressor.sequenceCount * LZ4_RAW_SEQUENCE_DESCRIPTOR_WORDS
  ) {
    throw new Error(`${decompressor.id} sequenceDescriptors is shorter than sequenceCount`);
  }
  if (decompressor.output.length < Math.ceil(decompressor.outputByteLength / 4)) {
    throw new Error(`${decompressor.id} output is shorter than outputByteLength`);
  }
  if (
    decompressor.output.buffer === decompressor.input.buffer ||
    decompressor.output.buffer === decompressor.sequenceDescriptors.buffer
  ) {
    throw new Error(`${decompressor.id} output must use a separate buffer`);
  }
}

function validateUint32(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`${name} must be a non-negative uint32`);
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
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_LZ4_RAW_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_LZ4_RAW_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
