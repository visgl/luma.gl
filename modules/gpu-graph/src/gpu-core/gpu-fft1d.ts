// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import type {Binding, Device} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView, GraphVectorView} from './gpu-command-graph';
import {getGPUVectorChunks} from '@luma.gl/gpgpu/gpu-data';
import {getGraphVectorData} from './graph-vector-view-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  getGPUFFTLengthReason,
  GPU_FFT_COMMON_SHADER_SOURCE,
  GPU_FFT_MAX_LENGTH,
  GPU_FFT_MIN_LENGTH,
  makeGPUFFTPassPlan,
  type GPUFFTDirection,
  type GPUFFTPassPlan
} from './gpu-fft-utils';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';
import {
  createTransientView,
  getViewBinding,
  getGraphDataPrefix,
  doGraphDataViewsOverlap,
  getViewBindingRange
} from './graph-data-view-utils';

/** Smallest supported transform length. */
export const GPU_FFT1D_MIN_LENGTH = GPU_FFT_MIN_LENGTH;
/** Largest supported transform length. */
export const GPU_FFT1D_MAX_LENGTH = GPU_FFT_MAX_LENGTH;
/** Number of invocations in every FFT pass workgroup. */
export const GPU_FFT1D_WORKGROUP_SIZE = 256;

/** Transform sign and normalization convention. */
export type GPUFFT1DDirection = GPUFFTDirection;

/** Requested FFT execution strategy. */
export type GPUFFT1DStrategy = 'auto' | 'portable' | 'subgroups';

/** Construction properties for one graph-native batched FFT. */
export type GPUFFT1DProps = {
  /** Prefix for generated graph node and transient resource IDs. */
  id?: string;
  /** Packed complex input, one `float32x2` row per complex value. */
  input: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
  /** Packed complex destination with the same logical transforms and independent chunks. */
  output: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
  /** Complex values per transform. Must be a power of two from 2 through 2048. */
  length: number;
  /** Number of tightly packed independent transforms. Defaults to one. */
  batchCount?: number;
  /** `forward` is unnormalized; `inverse` divides by `length`. */
  direction?: GPUFFT1DDirection;
  /** Optional subgroup acceleration preference. Defaults to `auto`. */
  strategy?: GPUFFT1DStrategy;
};

/** Device-independent contiguous-plan statistics; inspect the graph for chunk-lowered counts. */
export type GPUFFT1DStats = {
  length: number;
  batchCount: number;
  elementCount: number;
  complexBufferByteLength: number;
  stageCount: number;
  passCount: number;
  dispatchCount: number;
  scratchBufferByteLength: number;
  workgroupSize: number;
};

/** Result returned by {@link getGPUFFT1DSupport}. */
export type GPUFFT1DSupport = {
  supported: boolean;
  reason?: string;
  /** Available whenever the requested dimensions form a valid bounded radix-2 plan. */
  stats?: GPUFFT1DStats;
  /** Strategy that would be selected on this device. */
  strategy?: Exclude<GPUFFT1DStrategy, 'auto'>;
  /** Butterfly stages eligible for subgroup shuffles. */
  subgroupStageCount?: number;
};

/**
 * Graph-native out-of-place batched complex FFT.
 *
 * Bit reversal and radix-2 butterflies use graph-owned scratch. Independently chunked operands
 * run complete transforms in reusable scratch blocks while preserving caller storage.
 * The primitive never submits commands or synchronizes with the CPU.
 */
export class GPUFFT1D {
  readonly id: string;
  readonly input: GPUFFT1DProps['input'];
  readonly output: GPUFFT1DProps['output'];
  readonly length: number;
  readonly batchCount: number;
  readonly direction: GPUFFT1DDirection;
  readonly strategy: GPUFFT1DStrategy;
  readonly stats: GPUFFT1DStats;

  constructor(props: GPUFFT1DProps) {
    this.id = props.id ?? 'gpu-fft1d';
    this.input = props.input;
    this.output = props.output;
    this.length = props.length;
    this.batchCount = props.batchCount ?? 1;
    this.direction = props.direction ?? 'forward';
    this.strategy = props.strategy ?? 'auto';
    this.stats = makeGPUFFT1DStats(this.length, this.batchCount);

    for (const view of [this.input, this.output]) {
      for (const chunk of getGraphVectorData(view)) validateGPUFFT1DView(chunk, this.id);
    }
    if (this.input.length < this.stats.elementCount) {
      throw new Error(`${this.id} input must contain at least length * batchCount rows`);
    }
    if (this.output.length < this.stats.elementCount) {
      throw new Error(`${this.id} output must contain at least length * batchCount rows`);
    }
    const inputs = new Set(getGraphVectorData(this.input).map(chunk => chunk.buffer));
    const outputs = getGraphVectorData(this.output);
    if (outputs.some(chunk => inputs.has(chunk.buffer))) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
    for (const [index, chunk] of outputs.entries()) {
      if (outputs.slice(0, index).some(previous => doGraphDataViewsOverlap(previous, chunk))) {
        throw new Error(`${this.id} output chunks must not overlap`);
      }
    }
    if (this.direction !== 'forward' && this.direction !== 'inverse') {
      throw new Error(`${this.id} direction must be forward or inverse`);
    }
    if (!['auto', 'portable', 'subgroups'].includes(this.strategy)) {
      throw new Error(`${this.id} strategy must be auto, portable, or subgroups`);
    }
  }

  /** Adds FFT stages with graph-owned scratch and borrowed input/output spans. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    validateGPUFFT1DOwnership(graph, this.input, `${this.id} input`);
    validateGPUFFT1DOwnership(graph, this.output, `${this.id} output`);
    const support = getGPUFFT1DSupport(graph.device, {
      length: this.length,
      batchCount: this.batchCount,
      strategy: this.strategy,
      input: this.input,
      output: this.output
    });
    if (!support.supported || !support.stats || !support.strategy) {
      throw new Error(support.reason);
    }

    const input = getGraphDataPrefix(graph, this.input, this.stats.elementCount);
    const output = getGraphDataPrefix(graph, this.output, this.stats.elementCount);
    if (
      input instanceof GraphVectorView ||
      output instanceof GraphVectorView ||
      usesGPUFFT1DBlocks(graph.device, input, output, this.stats.elementCount)
    ) {
      return addGPUFFT1DBatchedPasses(graph, this, support);
    }

    const scratch = createTransientView(
      graph,
      `${this.id}-scratch`,
      'float32x2',
      this.stats.elementCount
    );
    const passPlan = makeGPUFFTPassPlan(this.length);
    let passInput = input;
    for (const [passIndex, pass] of passPlan.entries()) {
      const remainingPassCount = passPlan.length - passIndex;
      const passOutput = remainingPassCount % 2 === 0 ? scratch : output;
      const useSubgroups =
        support.strategy === 'subgroups' &&
        pass.kind === 'butterfly' &&
        pass.stage <= (support.subgroupStageCount ?? 0);
      nodes.push(
        ...addGPUFFT1DPass(graph, {
          id: `${this.id}-${pass.kind}-${pass.stage}`,
          input: passInput,
          output: passOutput,
          length: this.length,
          batchCount: this.batchCount,
          direction: this.direction,
          pass,
          finalPass: passIndex === passPlan.length - 1,
          useSubgroups
        })
      );
      passInput = passOutput;
    }

    return nodes;
  }
}

/** Runs complete transforms in bounded scratch while borrowing every caller-owned span. */
function addGPUFFT1DBatchedPasses<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  transform: GPUFFT1D,
  support: GPUFFT1DSupport
): readonly GPUCommandNode<Parameters>[] {
  const inputs = getGPUVectorChunks(getGraphVectorData(transform.input));
  const outputs = getGPUVectorChunks(getGraphVectorData(transform.output));
  const blockCapacity = getGPUFFT1DBlockCapacity(graph.device, transform.stats);
  const firstScratch = createTransientView(
    graph,
    `${transform.id}-scratch-a`,
    'float32x2',
    blockCapacity
  );
  const secondScratch =
    transform.stats.stageCount > 1
      ? createTransientView(graph, `${transform.id}-scratch-b`, 'float32x2', blockCapacity)
      : undefined;
  const nodes: GPUCommandNode<Parameters>[] = [];
  const plan = makeGPUFFTPassPlan(transform.length);
  for (
    let blockOffset = 0;
    blockOffset < transform.stats.elementCount;
    blockOffset += blockCapacity
  ) {
    const elementCount = Math.min(blockCapacity, transform.stats.elementCount - blockOffset);
    const common = {
      length: transform.length,
      batchCount: elementCount / transform.length,
      direction: transform.direction
    };
    const sourceSpans = getFFT1DSpans(graph, inputs, blockOffset, elementCount);
    for (const [index, span] of sourceSpans.entries()) {
      nodes.push(
        ...addGPUFFT1DPass(graph, {
          ...common,
          id: `${transform.id}-${blockOffset}-reorder-${index}`,
          input: span.data,
          output: firstScratch,
          inputLogicalOffset: span.offset - blockOffset,
          pass: plan[0],
          finalPass: false,
          useSubgroups: false
        })
      );
    }
    let passInput = firstScratch;
    for (let passIndex = 1; passIndex < plan.length; passIndex++) {
      const pass = plan[passIndex];
      const finalPass = passIndex === plan.length - 1;
      const destinations = finalPass
        ? getFFT1DSpans(graph, outputs, blockOffset, elementCount)
        : [
            {
              data: passInput === firstScratch ? secondScratch! : firstScratch,
              offset: blockOffset,
              length: elementCount
            }
          ];
      for (const [index, span] of destinations.entries()) {
        nodes.push(
          ...addGPUFFT1DPass(graph, {
            ...common,
            id: `${transform.id}-${blockOffset}-stage-${pass.stage}-${index}`,
            input: passInput,
            output: span.data,
            pass,
            finalPass,
            outputLogicalOffset: span.offset - blockOffset,
            invocationCount: span.length,
            // A cropped output span may omit a shuffle partner. Use portable loads for that pass.
            useSubgroups:
              support.strategy === 'subgroups' &&
              pass.stage <= (support.subgroupStageCount ?? 0) &&
              span.offset === blockOffset &&
              span.length === elementCount
          })
        );
      }
      if (!finalPass) passInput = destinations[0].data;
    }
  }
  return nodes;
}

/** Intersects global rows with chunk and aligned-binding boundaries without copying storage. */
function getFFT1DSpans<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  chunks: readonly {data: GraphDataView<'float32x2'>; offset: number; length: number}[],
  offset: number,
  length: number
): {data: GraphDataView<'float32x2'>; offset: number; length: number}[] {
  const spans: {data: GraphDataView<'float32x2'>; offset: number; length: number}[] = [];
  for (const chunk of chunks) {
    const end = Math.min(offset + length, chunk.offset + chunk.length);
    for (let start = Math.max(offset, chunk.offset); start < end; ) {
      const byteOffset = chunk.data.byteOffset + (start - chunk.offset) * 8;
      const spanLength = Math.min(
        end - start,
        Math.floor((graph.device.limits.maxStorageBufferBindingSize - (byteOffset % 256)) / 8)
      );
      if (spanLength < 1) throw new Error('GPUFFT1D view offset exceeds the storage binding limit');
      spans.push({
        offset: start,
        length: spanLength,
        data: graph.createDataView(chunk.data.buffer, {
          format: 'float32x2',
          byteOffset,
          length: spanLength
        })
      });
      start += spanLength;
    }
  }
  return spans;
}

/** Builds the immutable radix-2 plan without allocating graph or GPU resources. */
export function makeGPUFFT1DStats(length: number, batchCount = 1): GPUFFT1DStats {
  const lengthReason = getGPUFFTLengthReason('GPUFFT1D', 'length', length);
  if (lengthReason) {
    throw new Error(lengthReason);
  }
  if (!Number.isSafeInteger(batchCount) || batchCount <= 0) {
    throw new Error('GPUFFT1D batchCount must be a positive integer.');
  }
  const elementCount = length * batchCount;
  if (!Number.isSafeInteger(elementCount) || elementCount > 0xffffffff) {
    throw new Error('GPUFFT1D length * batchCount must fit in a uint32 index range.');
  }
  const complexBufferByteLength = elementCount * 2 * Float32Array.BYTES_PER_ELEMENT;
  const stageCount = Math.log2(length);
  const passCount = stageCount + 1;
  return Object.freeze({
    length,
    batchCount,
    elementCount,
    complexBufferByteLength,
    stageCount,
    passCount,
    dispatchCount: passCount,
    scratchBufferByteLength: complexBufferByteLength,
    workgroupSize: GPU_FFT1D_WORKGROUP_SIZE
  });
}

/** Reports device limits and the portable/subgroup strategy for a bounded plan. */
export function getGPUFFT1DSupport(
  device: Device,
  props: Pick<GPUFFT1DProps, 'length' | 'batchCount' | 'strategy'> &
    Partial<Pick<GPUFFT1DProps, 'input' | 'output'>>
): GPUFFT1DSupport {
  let stats: GPUFFT1DStats;
  try {
    stats = makeGPUFFT1DStats(props.length, props.batchCount ?? 1);
  } catch (error) {
    return {supported: false, reason: (error as Error).message};
  }
  if (device.type !== 'webgpu') {
    return {supported: false, reason: 'GPUFFT1D requires WebGPU.', stats};
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 2) {
    return {supported: false, reason: 'GPUFFT1D requires two compute storage buffers.', stats};
  }
  if (device.limits.maxComputeInvocationsPerWorkgroup < GPU_FFT1D_WORKGROUP_SIZE) {
    return {supported: false, reason: 'GPUFFT1D requires 256 compute invocations.', stats};
  }
  if (device.limits.maxComputeWorkgroupSizeX < GPU_FFT1D_WORKGROUP_SIZE) {
    return {supported: false, reason: 'GPUFFT1D requires a workgroup width of 256.', stats};
  }
  const requiredByteLength =
    props.input && props.output ? props.length * 8 : stats.complexBufferByteLength;
  if (requiredByteLength > device.limits.maxStorageBufferBindingSize) {
    return {
      supported: false,
      reason: 'GPUFFT1D complex buffer exceeds maxStorageBufferBindingSize.',
      stats
    };
  }
  if (requiredByteLength > device.limits.maxBufferSize) {
    return {supported: false, reason: 'GPUFFT1D complex buffer exceeds maxBufferSize.', stats};
  }
  if (
    [props.input, props.output].some(
      view =>
        view &&
        getGraphVectorData(view).some(
          chunk => chunk.buffer.byteLength > device.limits.maxBufferSize
        )
    )
  ) {
    return {supported: false, reason: 'GPUFFT1D chunk exceeds maxBufferSize.', stats};
  }
  try {
    getBoundedDispatchLayout(
      'GPUFFT1D',
      props.input &&
        props.output &&
        usesGPUFFT1DBlocks(device, props.input, props.output, stats.elementCount)
        ? getGPUFFT1DBlockCapacity(device, stats)
        : stats.elementCount,
      GPU_FFT1D_WORKGROUP_SIZE,
      device.limits.maxComputeWorkgroupsPerDimension
    );
  } catch (error) {
    return {supported: false, reason: (error as Error).message, stats};
  }
  let strategy: Exclude<GPUFFT1DStrategy, 'auto'>;
  try {
    strategy = getGPUFFT1DStrategy(device, props.strategy ?? 'auto');
  } catch (error) {
    return {supported: false, reason: (error as Error).message, stats};
  }
  return {
    supported: true,
    stats,
    strategy,
    subgroupStageCount:
      strategy === 'subgroups' ? getGPUFFT1DSubgroupStageCount(device, props.length) : 0
  };
}

function usesGPUFFT1DBlocks(
  device: Device,
  input: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>,
  output: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>,
  elementCount: number
): boolean {
  return [input, output].some(
    view =>
      view instanceof GraphVectorView ||
      getViewBindingRange(view).size - (view.length - elementCount) * 8 >
        device.limits.maxStorageBufferBindingSize
  );
}

function getGPUFFT1DBlockCapacity(device: Device, stats: GPUFFT1DStats): number {
  return Math.min(
    stats.elementCount,
    Math.floor(
      Math.min(4096 * 8, device.limits.maxStorageBufferBindingSize, device.limits.maxBufferSize) /
        (stats.length * 8)
    ) * stats.length
  );
}

/** Resolves an explicit or automatic subgroup preference. */
export function getGPUFFT1DStrategy(
  device: Device,
  requestedStrategy: GPUFFT1DStrategy = 'auto'
): Exclude<GPUFFT1DStrategy, 'auto'> {
  const subgroupSize = device.info?.subgroupMinSize;
  const subgroupsAvailable =
    getGPUShaderSubgroupStrategy(device, {requiresSubgroupId: true}) === 'subgroups' &&
    Number.isSafeInteger(subgroupSize) &&
    (subgroupSize ?? 0) >= 2;
  if (requestedStrategy === 'subgroups' && !subgroupsAvailable) {
    throw new Error('GPUFFT1D subgroup strategy is not supported by this device.');
  }
  if (requestedStrategy === 'portable') {
    return 'portable';
  }
  return subgroupsAvailable ? 'subgroups' : 'portable';
}

export type GPUFFT1DPassProps = {
  id: string;
  input: GraphDataView<'float32x2'>;
  output: GraphDataView<'float32x2'>;
  length: number;
  batchCount: number;
  direction: GPUFFT1DDirection;
  pass: GPUFFTPassPlan;
  finalPass: boolean;
  useSubgroups: boolean;
  /** Logical source span in the current block, for split bit-reversal reads. */
  inputLogicalOffset?: number;
  /** Logical invocation span in the current block, for split final writes. */
  outputLogicalOffset?: number;
  invocationCount?: number;
};

function addGPUFFT1DPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: GPUFFT1DPassProps
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const elementCount = props.invocationCount ?? props.length * props.batchCount;
  const dispatchLayout = getBoundedDispatchLayout(
    props.id,
    elementCount,
    GPU_FFT1D_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = getGPUFFT1DShaderSource(props, dispatchLayout);
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: props.id,
      workload: {
        operation: props.useSubgroups ? 'GPUFFT1D.subgroups' : 'GPUFFT1D',
        commandCount: 1,
        maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
        maximumInvocationCount:
          dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * GPU_FFT1D_WORKGROUP_SIZE,
        readByteLength: elementCount * 2 * Float32Array.BYTES_PER_ELEMENT,
        writeByteLength: elementCount * 2 * Float32Array.BYTES_PER_ELEMENT
      },
      resources: [
        {buffer: props.input, usage: 'storage-read'},
        {buffer: props.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const kernel = new Kernel(device, {
          id: props.id,
          source,
          shaderLayout: {
            bindings: [
              {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
              {name: 'outputValues', type: 'storage', group: 0, location: 1}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              inputValues: getViewBinding(props.input, getBuffer),
              outputValues: getViewBinding(props.output, getBuffer)
            };

            kernel.dispatch(computePass, {
              bindings,
              x: dispatchLayout.x,
              y: dispatchLayout.y,
              z: dispatchLayout.z
            });
          },
          destroy: () => kernel.destroy()
        };
      }
    })
  );

  return nodes;
}

/** Returns one generated FFT pass shader. @internal */
export function getGPUFFT1DShaderSource(
  props: GPUFFT1DPassProps,
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const directionSign = props.direction === 'forward' ? '-1.0' : '1.0';
  const normalizationScale =
    props.direction === 'inverse' && props.finalPass ? `${1 / props.length}` : '1.0';
  const commonSource = `const ELEMENT_COUNT: u32 = ${props.invocationCount ?? props.length * props.batchCount}u;
const TRANSFORM_LENGTH: u32 = ${props.length}u;
const INPUT_OFFSET: u32 = ${getGPUFFT1DViewOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getGPUFFT1DViewOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<vec2f>;
${GPU_FFT_COMMON_SHADER_SOURCE}`;
  const indexSource = getBoundedInvocationIndexSource(dispatchLayout, GPU_FFT1D_WORKGROUP_SIZE);
  if (props.pass.kind === 'bit-reversal') {
    return `${commonSource}
@compute @workgroup_size(${GPU_FFT1D_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${indexSource}
  if (index >= ELEMENT_COUNT) { return; }
  let batchIndex = index / TRANSFORM_LENGTH;
  let coordinate = index - batchIndex * TRANSFORM_LENGTH;
  let sourceCoordinate = reverseLowBits(coordinate, ${props.pass.stage}u);
  let sourceIndex = batchIndex * TRANSFORM_LENGTH + sourceCoordinate;
  ${props.inputLogicalOffset === undefined ? '' : `if (sourceIndex < ${props.inputLogicalOffset}u || sourceIndex - ${props.inputLogicalOffset}u >= ${props.input.length}u) {\n    return;\n  }`}
  outputValues[OUTPUT_OFFSET + index] =
    inputValues[INPUT_OFFSET + sourceIndex - ${props.inputLogicalOffset ?? 0}u];
}`;
  }

  const butterflySpan = 1 << props.pass.stage;
  const butterflyHalfSpan = butterflySpan >> 1;
  const subgroupSource = props.useSubgroups
    ? `let currentValue = inputValues[INPUT_OFFSET + safeIndex];
  let shuffledValue = subgroupShuffleXor(currentValue, ${butterflyHalfSpan}u);
  let subgroupMappingMatches = subgroupAll(
    localInvocationIndex % subgroupSize == subgroupInvocationId
  );
  var firstValue = currentValue;
  var secondValue = shuffledValue;
  if (subgroupMappingMatches) {
    let secondHalf = butterflyOffset >= ${butterflyHalfSpan}u;
    firstValue = select(currentValue, shuffledValue, secondHalf);
    secondValue = select(shuffledValue, currentValue, secondHalf);
  } else {
    firstValue = inputValues[INPUT_OFFSET + batchIndex * TRANSFORM_LENGTH + firstCoordinate];
    secondValue = inputValues[INPUT_OFFSET + batchIndex * TRANSFORM_LENGTH + secondCoordinate];
  }`
    : `let firstValue = inputValues[INPUT_OFFSET + batchIndex * TRANSFORM_LENGTH + firstCoordinate];
  let secondValue = inputValues[INPUT_OFFSET + batchIndex * TRANSFORM_LENGTH + secondCoordinate];`;
  return `${props.useSubgroups ? 'enable subgroups;\nrequires subgroup_id;\n' : ''}${commonSource}
@compute @workgroup_size(${GPU_FFT1D_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32${
    props.useSubgroups
      ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,\n  @builtin(subgroup_size) subgroupSize: u32'
      : ''
  }
) {
  ${indexSource}
  ${
    props.useSubgroups
      ? `let elementIsActive = index < ELEMENT_COUNT;
  let safeIndex = min(index, ELEMENT_COUNT - 1u);`
      : `if (index >= ELEMENT_COUNT) {\n    return;\n  }\n  let safeIndex = index + ${props.outputLogicalOffset ?? 0}u;`
  }
  let batchIndex = safeIndex / TRANSFORM_LENGTH;
  let coordinate = safeIndex - batchIndex * TRANSFORM_LENGTH;
  let butterflyOffset = coordinate & ${butterflySpan - 1}u;
  let twiddleIndex = butterflyOffset & ${butterflyHalfSpan - 1}u;
  let butterflyStart = coordinate - butterflyOffset;
  let firstCoordinate = butterflyStart + twiddleIndex;
  let secondCoordinate = firstCoordinate + ${butterflyHalfSpan}u;
  ${subgroupSource}
  let angle = ${directionSign} * 2.0 * GPU_FFT_PI * f32(twiddleIndex) /
    f32(${butterflySpan}u);
  let rotatedSecondValue = multiplyComplex(secondValue, vec2f(cos(angle), sin(angle)));
  let butterflyValue = select(
    firstValue + rotatedSecondValue,
    firstValue - rotatedSecondValue,
    butterflyOffset >= ${butterflyHalfSpan}u
  );
  ${
    props.useSubgroups
      ? `if (elementIsActive) {
    outputValues[OUTPUT_OFFSET + index] = butterflyValue * ${normalizationScale};
  }`
      : `outputValues[OUTPUT_OFFSET + index] = butterflyValue * ${normalizationScale};`
  }
}`;
}

function getGPUFFT1DSubgroupStageCount(device: Device, length: number): number {
  const subgroupMinSize = device.info?.subgroupMinSize ?? 0;
  return Math.min(Math.log2(length), Math.floor(Math.log2(subgroupMinSize)));
}

function validateGPUFFT1DView(view: GraphDataView, name: string): void {
  if (
    view.format !== 'float32x2' ||
    view.byteStride !== 2 * Float32Array.BYTES_PER_ELEMENT ||
    view.rowByteLength !== 2 * Float32Array.BYTES_PER_ELEMENT ||
    view.byteOffset % (2 * Float32Array.BYTES_PER_ELEMENT) !== 0
  ) {
    throw new Error(`${name} must be packed, vec2-aligned float32x2 GPU data`);
  }
}

function getGPUFFT1DViewOffset(view: GraphDataView<'float32x2'>): number {
  return (view.byteOffset % 256) / (2 * Float32Array.BYTES_PER_ELEMENT);
}

function validateGPUFFT1DOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GPUFFT1DProps['input'],
  name: string
): void {
  if (getGraphVectorData(view).some(chunk => chunk.buffer.graph !== graph)) {
    throw new Error(`${name} belongs to a different GPUCommandGraph`);
  }
}
