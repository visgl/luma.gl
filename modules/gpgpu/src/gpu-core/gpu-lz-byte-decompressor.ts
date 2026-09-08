// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from './gpu-dispatch-utils';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

export const GPU_LZ_BYTE_DESCRIPTOR_WORDS = 5;
export const GPU_LZ_BYTE_WORKGROUP_SIZE = 256;

/** CPU result for compact LZ spans annotated with direct compressed-input provenance. */
export type GPULZByteDescriptorPlan = Readonly<{
  descriptors: Uint32Array;
  descriptorCount: number;
  directCopyCount: number;
  recursiveCopyCount: number;
  directCopyByteLength: number;
  recursiveCopyByteLength: number;
}>;

/**
 * Converts `[outputOffset, byteLength, literalSourceOffset, matchOffset]` spans into GPU records.
 *
 * A copy becomes a direct compressed-input gather when its source cycle is contained by one prior
 * direct descriptor. Other copies retain their compact backreference. Planning remains one record
 * per input span and never materializes byte-level provenance, keeping CPU work and upload size
 * bounded while removing descriptor recursion from the common literal-followed-by-copy pattern.
 */
export function planGPULZByteDescriptors(spans: readonly number[]): GPULZByteDescriptorPlan {
  if (spans.length % 4 !== 0) {
    throw new Error('LZ byte spans must contain four words per record');
  }
  const descriptors: number[] = [];
  let directCopyCount = 0;
  let recursiveCopyCount = 0;
  let directCopyByteLength = 0;
  let recursiveCopyByteLength = 0;
  for (let spanOffset = 0; spanOffset < spans.length; spanOffset += 4) {
    const outputOffset = spans[spanOffset];
    const byteLength = spans[spanOffset + 1];
    const literalSourceOffset = spans[spanOffset + 2];
    const matchOffset = spans[spanOffset + 3];
    if (matchOffset === 0) {
      descriptors.push(outputOffset, byteLength, literalSourceOffset, 0, 0);
      continue;
    }
    const directCopy = findDirectCopy(
      descriptors,
      outputOffset - matchOffset,
      byteLength,
      matchOffset
    );
    if (directCopy) {
      descriptors.push(
        outputOffset,
        byteLength,
        directCopy.literalSourceOffset,
        directCopy.literalPeriod,
        0
      );
      directCopyCount++;
      directCopyByteLength += byteLength;
    } else {
      descriptors.push(outputOffset, byteLength, 0, 0, matchOffset);
      recursiveCopyCount++;
      recursiveCopyByteLength += byteLength;
    }
  }
  return Object.freeze({
    descriptors: Uint32Array.from(descriptors),
    descriptorCount: descriptors.length / GPU_LZ_BYTE_DESCRIPTOR_WORDS,
    directCopyCount,
    recursiveCopyCount,
    directCopyByteLength,
    recursiveCopyByteLength
  });
}

function findDirectCopy(
  descriptors: readonly number[],
  sourceOutputOffset: number,
  byteLength: number,
  matchOffset: number
): {literalSourceOffset: number; literalPeriod: number} | undefined {
  const descriptorIndex = findContainingDescriptor(descriptors, sourceOutputOffset);
  if (descriptorIndex < 0) return undefined;
  const descriptorOffset = descriptorIndex * GPU_LZ_BYTE_DESCRIPTOR_WORDS;
  const descriptorOutputOffset = descriptors[descriptorOffset];
  const descriptorByteLength = descriptors[descriptorOffset + 1];
  const literalSourceOffset = descriptors[descriptorOffset + 2];
  const literalPeriod = descriptors[descriptorOffset + 3];
  const sourceMatchOffset = descriptors[descriptorOffset + 4];
  if (sourceMatchOffset !== 0) return undefined;
  const relativeSourceOffset = sourceOutputOffset - descriptorOutputOffset;
  const sourceCycleLength = Math.min(byteLength, matchOffset);
  if (relativeSourceOffset + sourceCycleLength > descriptorByteLength) return undefined;
  if (literalPeriod === 0) {
    return {
      literalSourceOffset: literalSourceOffset + relativeSourceOffset,
      literalPeriod: byteLength > matchOffset ? matchOffset : 0
    };
  }
  const literalPhase = relativeSourceOffset % literalPeriod;
  const repeatsSourceCycle = byteLength > matchOffset;
  if (literalPhase !== 0 || (repeatsSourceCycle && matchOffset % literalPeriod !== 0)) {
    return undefined;
  }
  return {literalSourceOffset, literalPeriod};
}

function findContainingDescriptor(descriptors: readonly number[], outputOffset: number): number {
  let lowerIndex = 0;
  let upperIndex = descriptors.length / GPU_LZ_BYTE_DESCRIPTOR_WORDS;
  while (lowerIndex < upperIndex) {
    const middleIndex = lowerIndex + Math.floor((upperIndex - lowerIndex) / 2);
    if (descriptors[middleIndex * GPU_LZ_BYTE_DESCRIPTOR_WORDS] <= outputOffset) {
      lowerIndex = middleIndex + 1;
    } else {
      upperIndex = middleIndex;
    }
  }
  const descriptorIndex = lowerIndex - 1;
  if (descriptorIndex < 0) return -1;
  const descriptorOffset = descriptorIndex * GPU_LZ_BYTE_DESCRIPTOR_WORDS;
  return outputOffset < descriptors[descriptorOffset] + descriptors[descriptorOffset + 1]
    ? descriptorIndex
    : -1;
}

export type GPULZByteDecompressorProps = {
  id?: string;
  /** Compressed bytes packed into little-endian uint32 words. */
  input: GraphDataView<'uint32'>;
  /** Sorted `[outputOffset, byteLength, literalSourceOffset, literalPeriod, matchOffset]` records. */
  descriptors: GraphDataView<'uint32'>;
  /** Decompressed bytes packed into little-endian uint32 words. */
  output: GraphDataView<'uint32'>;
  inputByteLength: number;
  outputByteLength: number;
  descriptorCount: number;
};

/**
 * Expands literal and LZ backreference spans into a packed byte buffer.
 *
 * A zero `matchOffset` gathers compressed literal bytes directly; a nonzero `literalPeriod`
 * repeats that source range for a resolved overlapping copy. A nonzero `matchOffset` retains a
 * copy whose provenance crosses descriptor boundaries. Each invocation owns one complete output
 * word and only recursively resolves those remaining backreferences, so overlapping copies are
 * deterministic without global barriers or byte-level write races.
 */
export class GPULZByteDecompressor {
  readonly id: string;
  readonly props: Readonly<GPULZByteDecompressorProps>;

  constructor(props: GPULZByteDecompressorProps) {
    this.id = props.id ?? 'gpu-lz-byte-decompressor';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    for (const view of [props.input, props.descriptors, props.output]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.outputByteLength === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    const outputWordCount = Math.ceil(props.outputByteLength / 4);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPULZByteDecompressor',
      outputWordCount,
      GPU_LZ_BYTE_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addDecompressionPass(graph, props, dispatchLayout);
  }
}

/** Returns the literal/backreference resolver shader. @internal */
export function getGPULZByteDecompressorShaderSource(
  props: Readonly<GPULZByteDecompressorProps>,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  const outputWordCount = Math.ceil(props.outputByteLength / 4);
  return `const OUTPUT_BYTE_LENGTH: u32 = ${props.outputByteLength}u;
const OUTPUT_WORD_COUNT: u32 = ${outputWordCount}u;
const DESCRIPTOR_COUNT: u32 = ${props.descriptorCount}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const DESCRIPTOR_OFFSET: u32 = ${getViewElementOffset(props.descriptors)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read> descriptors: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputWords: array<u32>;
fn readInputByte(byteIndex: u32) -> u32 {
  let word = inputWords[INPUT_OFFSET + byteIndex / 4u];
  return (word >> ((byteIndex & 3u) * 8u)) & 255u;
}
fn findDescriptor(outputByteIndex: u32) -> u32 {
  var lowerDescriptorIndex = 0u;
  var upperDescriptorIndex = DESCRIPTOR_COUNT;
  while (lowerDescriptorIndex < upperDescriptorIndex) {
    let middleDescriptorIndex = lowerDescriptorIndex +
      (upperDescriptorIndex - lowerDescriptorIndex) / 2u;
    let descriptorOutputOffset = descriptors[DESCRIPTOR_OFFSET + middleDescriptorIndex * 5u];
    if (descriptorOutputOffset <= outputByteIndex) {
      lowerDescriptorIndex = middleDescriptorIndex + 1u;
    } else {
      upperDescriptorIndex = middleDescriptorIndex;
    }
  }
  return lowerDescriptorIndex - 1u;
}
fn resolveLiteralByte(outputByteIndex: u32, initialDescriptorIndex: u32) -> u32 {
  var sourceOutputByteIndex = outputByteIndex;
  var sourceDescriptorIndex = initialDescriptorIndex;
  for (var depth = 0u; depth < DESCRIPTOR_COUNT; depth++) {
    let descriptorIndex = DESCRIPTOR_OFFSET + sourceDescriptorIndex * 5u;
    let descriptorOutputOffset = descriptors[descriptorIndex];
    let literalSourceOffset = descriptors[descriptorIndex + 2u];
    let literalPeriod = descriptors[descriptorIndex + 3u];
    let matchOffset = descriptors[descriptorIndex + 4u];
    var relativeByteIndex = sourceOutputByteIndex - descriptorOutputOffset;
    if (matchOffset == 0u) {
      if (literalPeriod != 0u) {
        relativeByteIndex %= literalPeriod;
      }
      return readInputByte(literalSourceOffset + relativeByteIndex);
    }
    sourceOutputByteIndex = descriptorOutputOffset - matchOffset + relativeByteIndex % matchOffset;
    sourceDescriptorIndex = findDescriptor(sourceOutputByteIndex);
  }
  return 0u;
}
@compute @workgroup_size(${GPU_LZ_BYTE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_LZ_BYTE_WORKGROUP_SIZE)}
  let outputWordIndex = index;
  if (outputWordIndex >= OUTPUT_WORD_COUNT) { return; }
  var outputWord = 0u;
  var descriptorIndex = findDescriptor(outputWordIndex * 4u);
  for (var byteLane = 0u; byteLane < 4u; byteLane++) {
    let outputByteIndex = outputWordIndex * 4u + byteLane;
    if (outputByteIndex < OUTPUT_BYTE_LENGTH) {
      if (descriptorIndex + 1u < DESCRIPTOR_COUNT &&
          descriptors[DESCRIPTOR_OFFSET + (descriptorIndex + 1u) * 5u] <= outputByteIndex) {
        descriptorIndex += 1u;
      }
      outputWord |= resolveLiteralByte(outputByteIndex, descriptorIndex) << (byteLane * 8u);
    }
  }
  outputWords[OUTPUT_OFFSET + outputWordIndex] = outputWord;
}`;
}

function addDecompressionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPULZByteDecompressorProps>,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPULZByteDecompressorShaderSource(props, dispatchLayout);
  const outputWordCount = Math.ceil(props.outputByteLength / 4);
  const workgroupCount = Math.ceil(outputWordCount / GPU_LZ_BYTE_WORKGROUP_SIZE);
  graph.addComputePass({
    id: props.id ?? 'gpu-lz-byte-decompressor',
    workload: {
      operation: 'GPULZByteDecompressor',
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * GPU_LZ_BYTE_WORKGROUP_SIZE,
      readByteLength:
        props.inputByteLength +
        props.descriptorCount * GPU_LZ_BYTE_DESCRIPTOR_WORDS * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: props.outputByteLength
    },
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.descriptors, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
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
            inputWords: getViewBinding(props.input, getBuffer),
            descriptors: getViewBinding(props.descriptors, getBuffer),
            outputWords: getViewBinding(props.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(props: Readonly<GPULZByteDecompressorProps>): void {
  validatePackedUint32View(props.input, `${props.id} input`);
  validatePackedUint32View(props.descriptors, `${props.id} descriptors`);
  validatePackedUint32View(props.output, `${props.id} output`);
  for (const [name, value] of Object.entries({
    inputByteLength: props.inputByteLength,
    outputByteLength: props.outputByteLength,
    descriptorCount: props.descriptorCount
  })) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error(`${props.id} ${name} must be a non-negative uint32`);
    }
  }
  if (props.outputByteLength > 0 && props.descriptorCount === 0) {
    throw new Error(`${props.id} requires descriptors for non-empty output`);
  }
  if (props.input.length * 4 < props.inputByteLength) {
    throw new Error(`${props.id} input is shorter than inputByteLength`);
  }
  if (props.descriptors.length < props.descriptorCount * GPU_LZ_BYTE_DESCRIPTOR_WORDS) {
    throw new Error(`${props.id} descriptors is shorter than descriptorCount`);
  }
  if (props.output.length * 4 < props.outputByteLength) {
    throw new Error(`${props.id} output is shorter than outputByteLength`);
  }
  if (
    props.output.buffer === props.input.buffer ||
    props.output.buffer === props.descriptors.buffer
  ) {
    throw new Error(`${props.id} output must use a separate buffer`);
  }
}

function validateDevice(device: Device, id: string): void {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_LZ_BYTE_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_LZ_BYTE_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
