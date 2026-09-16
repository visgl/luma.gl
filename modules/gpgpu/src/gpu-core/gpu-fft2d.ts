// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {createGPUComputeCommandNode, type GPUCommandNode} from './gpu-command-node';
import {setGPUComputeDispatchWorkgroups} from './gpu-command-dispatch-metadata';
import {
  createTransientView,
  getViewBinding,
  getViewBindingRange,
  getGraphDataPrefix
} from './graph-data-view-utils';
import {getGraphVectorData} from './graph-vector-view-utils';
import {createChunkNode, getGraphDataRange, validateChunkViews} from './gpu-chunk-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  GPU_FFT2D_PARAMETER_BYTE_LENGTH,
  GPU_FFT2D_SHADER,
  GPU_FFT2D_WORKGROUP_DIMENSION
} from './gpu-fft2d-shaders';
import {
  getGPUFFTLengthReason,
  GPU_FFT_MAX_LENGTH,
  GPU_FFT_MIN_LENGTH,
  makeGPUFFTPassPlan,
  type GPUFFTDirection
} from './gpu-fft-utils';

/** Smallest supported transform dimension. */
export const GPU_FFT2D_MIN_DIMENSION = GPU_FFT_MIN_LENGTH;
/** Largest supported transform dimension. */
export const GPU_FFT2D_MAX_DIMENSION = GPU_FFT_MAX_LENGTH;

/** Construction options for {@link GPUFFT2D}. */
export type GPUFFT2DProps = {
  /** Borrowed row-major complex values, with independent input/output chunk boundaries. */
  input: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
  output: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
  /** Forward is unnormalized; inverse divides by width * height. */
  direction?: GPUFFT2DDirection;
  /** Prefix used for graph resource labels. */
  id?: string;
  /** Number of complex values in each row. Must be a power of two from 2 through 2048. */
  width: number;
  /** Number of complex values in each column. Must be a power of two from 2 through 2048. */
  height: number;
  /** Number of independent, tightly packed transforms encoded by each dispatch. Defaults to one. */
  batchCount?: number;
};

/** Transform sign and normalization convention. */
export type GPUFFT2DDirection = GPUFFTDirection;

/** Contiguous-plan statistics; inspect the compiled graph for chunk-lowered scratch and dispatches. */
export type GPUFFT2DStats = {
  width: number;
  height: number;
  /** Present when one dispatch processes multiple independent packed transforms. */
  batchCount?: number;
  elementCount: number;
  complexBufferByteLength: number;
  horizontalStageCount: number;
  verticalStageCount: number;
  passCount: number;
  dispatchCountPerEncode: number;
  workgroupSize: readonly [number, number, number];
  workgroupCount: readonly [number, number, number];
  scratchBufferByteLength: number;
  parameterBufferCount: number;
  parameterBufferByteLength: number;
};

/** Result returned by {@link getGPUFFT2DSupport}. */
export type GPUFFT2DSupport = {
  supported: boolean;
  reason?: string;
  /** Available whenever the requested dimensions form a valid bounded radix-2 plan. */
  stats?: GPUFFT2DStats;
};

type GPUFFT2DPassKind = 'bit-reversal' | 'butterfly';
type GPUFFT2DAxis = 'horizontal' | 'vertical';

type GPUFFT2DPassPlan = {
  axis: GPUFFT2DAxis;
  kind: GPUFFT2DPassKind;
  transformSize: number;
  stage: number;
};

/**
 * Graph-native out-of-place two-dimensional complex FFT.
 *
 * Contiguous fields retain the batched dispatch path. Chunked fields run one complete transform
 * at a time in reusable graph scratch; caller chunks are borrowed and never repacked or owned.
 */
export class GPUFFT2D {
  readonly id: string;
  readonly stats: GPUFFT2DStats;
  readonly props: GPUFFT2DProps;

  constructor(props: GPUFFT2DProps) {
    this.props = props;
    this.id = props.id ?? 'gpu-fft2d';
    this.stats = makeGPUFFT2DStats(props.width, props.height, props.batchCount ?? 1);
    if (props.direction && props.direction !== 'forward' && props.direction !== 'inverse') {
      throw new Error('GPUFFT2D direction must be forward or inverse');
    }
    for (const view of [props.input, props.output]) {
      if (view.length < this.stats.elementCount * (props.batchCount ?? 1)) {
        throw new Error('GPUFFT2D views must contain width * height * batchCount complex values');
      }
      for (const chunk of getGraphVectorData(view)) {
        if (
          chunk.format !== 'float32x2' ||
          chunk.byteStride !== 8 ||
          chunk.rowByteLength !== 8 ||
          chunk.byteOffset % 8 !== 0
        ) {
          throw new Error('GPUFFT2D requires packed, vec2-aligned float32x2 views');
        }
      }
    }
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    validateChunkViews(graph, [this.props.input], [this.props.output]);
    const support = getGPUFFT2DSupport(graph.device, this.props);
    if (!support.supported) throw new Error(support.reason);
    const count = this.stats.elementCount * (this.props.batchCount ?? 1);
    const input = getGraphDataPrefix(graph, this.props.input, count);
    const output = getGraphDataPrefix(graph, this.props.output, count);
    const nodes: GPUCommandNode<Parameters>[] = [];
    const contiguous =
      !(input instanceof GraphVectorView) &&
      !(output instanceof GraphVectorView) &&
      [input, output].every(
        view => getViewBindingRange(view).size <= graph.device.limits.maxStorageBufferBindingSize
      ) &&
      this.stats.complexBufferByteLength <= graph.device.limits.maxBufferSize &&
      (this.props.batchCount ?? 1) <= graph.device.limits.maxComputeWorkgroupsPerDimension;
    const capacity = contiguous ? count : this.stats.elementCount;
    const scratch = createTransientView(graph, `${this.id}-scratch`, 'float32x2', capacity);
    if (contiguous) {
      return createFFT2DPasses(
        graph,
        this,
        input,
        output,
        scratch,
        this.props.batchCount ?? 1,
        this.id
      );
    }
    const field = createTransientView(graph, `${this.id}-field`, 'float32x2', capacity);
    const gathered = this.stats.passCount % 2 === 0 ? field : scratch;
    for (let batch = 0; batch < (this.props.batchCount ?? 1); batch++) {
      const offset = batch * capacity;
      const prefix = `${this.id}-batch-${batch}`;
      nodes.push(
        ...copyFFT2DSpans(
          graph,
          `${prefix}-gather`,
          getGraphDataRange(graph, input, offset, capacity),
          gathered,
          true
        )
      );
      // The gathered field is no longer needed after the first pass; ping-pong back into it.
      nodes.push(...createFFT2DPasses(graph, this, gathered, field, scratch, 1, prefix));
      nodes.push(
        ...copyFFT2DSpans(
          graph,
          `${prefix}-scatter`,
          getGraphDataRange(graph, output, offset, capacity),
          field,
          false
        )
      );
    }
    return nodes;
  }
}

function createFFT2DPasses<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  transform: GPUFFT2D,
  input: GraphDataView<'float32x2'>,
  output: GraphDataView<'float32x2'>,
  scratch: GraphDataView<'float32x2'>,
  batchCount: number,
  id: string
): GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const plans = makeGPUFFT2DPassPlan(transform.props.width, transform.props.height);
  let source = input;
  for (const [index, plan] of plans.entries()) {
    const destination = (plans.length - index) % 2 === 0 ? scratch : output;
    const passInput = source;
    const passId = `${id}-${index}`;
    const direction = transform.props.direction ?? 'forward';
    const data = makeGPUFFT2DParameterData({
      width: transform.props.width,
      height: transform.props.height,
      ...plan,
      direction,
      normalizationScale:
        direction === 'inverse' && index === plans.length - 1
          ? 1 / transform.stats.elementCount
          : 1,
      inputOffset: (passInput.byteOffset % 256) / 8,
      outputOffset: (destination.byteOffset % 256) / 8
    });
    const workgroups = [
      transform.stats.workgroupCount[0],
      transform.stats.workgroupCount[1],
      batchCount
    ] as const;
    nodes.push(
      setGPUComputeDispatchWorkgroups(
        createGPUComputeCommandNode<Parameters>({
          id: passId,
          resources: [
            {buffer: passInput, usage: 'storage-read'},
            {buffer: destination, usage: 'storage-write'}
          ],
          workload: {
            commandCount: 1,
            maximumWorkgroupCount: workgroups[0] * workgroups[1] * batchCount,
            maximumInvocationCount: workgroups[0] * workgroups[1] * batchCount * 64
          },
          compile: ({device}) => {
            const parameters = device.createBuffer({
              id: `${passId}-parameters`,
              data,
              usage: Buffer.UNIFORM
            });
            let kernel: Kernel;
            try {
              kernel = new Kernel(device, {
                id: passId,
                source: GPU_FFT2D_SHADER,
                shaderLayout: {
                  bindings: [
                    {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
                    {name: 'outputValues', type: 'storage', group: 0, location: 1},
                    {name: 'parameters', type: 'uniform', group: 0, location: 2}
                  ]
                }
              });
            } catch (error) {
              parameters.destroy();
              throw error;
            }
            return {
              encode: ({computePass, getBuffer}) =>
                kernel.dispatch(computePass, {
                  bindings: {
                    inputValues: getViewBinding(passInput, getBuffer),
                    outputValues: getViewBinding(destination, getBuffer),
                    parameters
                  },
                  x: workgroups[0],
                  y: workgroups[1],
                  z: workgroups[2]
                }),
              destroy: () => {
                kernel.destroy();
                parameters.destroy();
              }
            };
          }
        }),
        workgroups
      )
    );
    source = destination;
  }
  return nodes;
}

/** Copy only active spans into explicit per-transform scratch, using storage-only caller buffers. */
function copyFFT2DSpans<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  spans: GraphVectorView<'float32x2'>,
  field: GraphDataView<'float32x2'>,
  gather: boolean
): GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  let logicalOffset = 0;
  for (const chunk of spans.data) {
    for (let start = 0; start < chunk.length; ) {
      const byteOffset = chunk.byteOffset + start * 8;
      const length = Math.min(
        chunk.length - start,
        Math.floor((graph.device.limits.maxStorageBufferBindingSize - (byteOffset % 256)) / 8)
      );
      if (length < 1) throw new Error('GPUFFT2D chunk offset exceeds storage binding capacity');
      const view = graph.createDataView(chunk.buffer, {format: 'float32x2', byteOffset, length});
      const input = gather ? view : field;
      const output = gather ? field : view;
      const sourceOffset = gather ? (byteOffset % 256) / 8 : logicalOffset + start;
      const destinationOffset = gather ? logicalOffset + start : (byteOffset % 256) / 8;
      const dispatch = getBoundedDispatchLayout(
        id,
        length,
        64,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      );
      nodes.push(
        createChunkNode(graph, {
          id: `${id}-${nodes.length}`,
          inputs: {inputValues: input},
          outputs: {outputValues: output},
          dispatch,
          workgroupSize: 64,
          source: `@group(0) @binding(0) var<storage, read> inputValues: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<vec2f>;
@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 64)}
  if (index < ${length}u) {
    outputValues[${destinationOffset}u + index] = inputValues[${sourceOffset}u + index];
  }
}`
        })
      );
      start += length;
    }
    logicalOffset += chunk.length;
  }
  return nodes;
}

/** Reports whether a device can allocate and dispatch the requested bounded radix-2 transform. */
export function getGPUFFT2DSupport(
  device: Device,
  props: Pick<GPUFFT2DProps, 'width' | 'height' | 'batchCount'> &
    Partial<Pick<GPUFFT2DProps, 'input' | 'output'>>
): GPUFFT2DSupport {
  const dimensionReason = getGPUFFT2DDimensionReason(
    props.width,
    props.height,
    props.batchCount ?? 1
  );
  if (dimensionReason) {
    return {supported: false, reason: dimensionReason};
  }

  const stats = makeGPUFFT2DStats(props.width, props.height, props.batchCount ?? 1);
  if (device.type !== 'webgpu') {
    return {supported: false, reason: 'GPUFFT2D requires WebGPU.', stats};
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 2) {
    return {supported: false, reason: 'GPUFFT2D requires two compute storage buffers.', stats};
  }
  if (device.limits.maxUniformBuffersPerShaderStage < 1) {
    return {supported: false, reason: 'GPUFFT2D requires one compute uniform buffer.', stats};
  }
  if (
    device.limits.maxComputeInvocationsPerWorkgroup <
      GPU_FFT2D_WORKGROUP_DIMENSION * GPU_FFT2D_WORKGROUP_DIMENSION ||
    device.limits.maxComputeWorkgroupSizeX < GPU_FFT2D_WORKGROUP_DIMENSION ||
    device.limits.maxComputeWorkgroupSizeY < GPU_FFT2D_WORKGROUP_DIMENSION
  ) {
    return {supported: false, reason: 'GPUFFT2D requires 8 by 8 compute workgroups.', stats};
  }
  if (
    stats.workgroupCount[0] > device.limits.maxComputeWorkgroupsPerDimension ||
    stats.workgroupCount[1] > device.limits.maxComputeWorkgroupsPerDimension ||
    (props.input && props.output ? 1 : stats.workgroupCount[2]) >
      device.limits.maxComputeWorkgroupsPerDimension
  ) {
    return {
      supported: false,
      reason: 'GPUFFT2D workgroup count exceeds the device dispatch limit.',
      stats
    };
  }
  const requiredByteLength =
    props.input && props.output ? stats.elementCount * 8 : stats.complexBufferByteLength;
  if (requiredByteLength > device.limits.maxStorageBufferBindingSize) {
    return {
      supported: false,
      reason: 'GPUFFT2D complex buffer exceeds maxStorageBufferBindingSize.',
      stats
    };
  }
  if (requiredByteLength > device.limits.maxBufferSize) {
    return {supported: false, reason: 'GPUFFT2D complex buffer exceeds maxBufferSize.', stats};
  }
  return {supported: true, stats};
}

/** Builds the immutable CPU-side plan exposed by support queries and class instances. */
export function makeGPUFFT2DStats(width: number, height: number, batchCount = 1): GPUFFT2DStats {
  const dimensionReason = getGPUFFT2DDimensionReason(width, height, batchCount);
  if (dimensionReason) {
    throw new Error(dimensionReason);
  }
  const horizontalStageCount = Math.log2(width);
  const verticalStageCount = Math.log2(height);
  const passCount = horizontalStageCount + verticalStageCount + 2;
  const elementCount = width * height;
  const complexBufferByteLength = elementCount * batchCount * 2 * Float32Array.BYTES_PER_ELEMENT;
  return Object.freeze({
    width,
    height,
    ...(batchCount > 1 ? {batchCount} : {}),
    elementCount,
    complexBufferByteLength,
    horizontalStageCount,
    verticalStageCount,
    passCount,
    dispatchCountPerEncode: passCount,
    workgroupSize: Object.freeze([
      GPU_FFT2D_WORKGROUP_DIMENSION,
      GPU_FFT2D_WORKGROUP_DIMENSION,
      1
    ]) as readonly [number, number, number],
    workgroupCount: Object.freeze([
      Math.ceil(width / GPU_FFT2D_WORKGROUP_DIMENSION),
      Math.ceil(height / GPU_FFT2D_WORKGROUP_DIMENSION),
      batchCount
    ]) as readonly [number, number, number],
    scratchBufferByteLength: complexBufferByteLength,
    parameterBufferCount: passCount,
    parameterBufferByteLength: passCount * GPU_FFT2D_PARAMETER_BYTE_LENGTH
  });
}

function makeGPUFFT2DPassPlan(width: number, height: number): GPUFFT2DPassPlan[] {
  const passes: GPUFFT2DPassPlan[] = [];
  addAxisPasses(passes, 'horizontal', width);
  addAxisPasses(passes, 'vertical', height);
  return passes;
}

function addAxisPasses(
  passes: GPUFFT2DPassPlan[],
  axis: GPUFFT2DAxis,
  transformSize: number
): void {
  for (const pass of makeGPUFFTPassPlan(transformSize)) {
    passes.push({axis, transformSize, ...pass});
  }
}

function makeGPUFFT2DParameterData(props: {
  width: number;
  height: number;
  axis: GPUFFT2DAxis;
  kind: GPUFFT2DPassKind;
  transformSize: number;
  stage: number;
  direction: GPUFFT2DDirection;
  normalizationScale: number;
  inputOffset: number;
  outputOffset: number;
}): Uint32Array {
  const data = new ArrayBuffer(GPU_FFT2D_PARAMETER_BYTE_LENGTH);
  const unsignedValues = new Uint32Array(data);
  const floatValues = new Float32Array(data);
  unsignedValues[0] = props.width;
  unsignedValues[1] = props.height;
  unsignedValues[2] = props.axis === 'horizontal' ? 0 : 1;
  unsignedValues[3] = props.kind === 'bit-reversal' ? 0 : 1;
  unsignedValues[4] = props.transformSize;
  unsignedValues[5] = props.stage;
  floatValues[6] = props.direction === 'forward' ? -1 : 1;
  floatValues[7] = props.normalizationScale;
  unsignedValues[8] = props.inputOffset;
  unsignedValues[9] = props.outputOffset;
  return unsignedValues;
}

function getGPUFFT2DDimensionReason(
  width: number,
  height: number,
  batchCount = 1
): string | undefined {
  const widthReason = getDimensionReason('width', width);
  if (widthReason) {
    return widthReason;
  }
  const heightReason = getDimensionReason('height', height);
  if (heightReason) {
    return heightReason;
  }
  if (!Number.isSafeInteger(batchCount) || batchCount <= 0) {
    return 'GPUFFT2D batchCount must be a positive integer.';
  }
  if (width * height * batchCount > 0xffffffff)
    return 'GPUFFT2D logical length must fit uint32 addressing.';
  return undefined;
}

function getDimensionReason(name: string, dimension: number): string | undefined {
  return getGPUFFTLengthReason('GPUFFT2D', name, dimension);
}
