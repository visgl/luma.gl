// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import {getGPUVectorChunks} from '@luma.gl/gpgpu/gpu-data';
import {getGraphVectorData} from './graph-vector-view-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  GPU_FFT_COMMON_SHADER_SOURCE,
  GPU_FFT_MAX_LENGTH,
  makeGPUFFTPassPlan,
  type GPUFFTDirection,
  type GPUFFTPassPlan
} from './gpu-fft-utils';
import {
  createTransientView,
  getGraphDataPrefix,
  doGraphDataViewsOverlap,
  getViewBindingRange,
  getViewBinding,
  getViewElementOffset,
  validatePackedView
} from './graph-data-view-utils';

/** Number of invocations in direct, packing, FFT, multiply, and crop workgroups. */
export const GPU_CONVOLUTION_WORKGROUP_SIZE = 256;
/** Largest kernel area selected by the initial automatic direct/FFT heuristic. */
export const GPU_CONVOLUTION_AUTO_DIRECT_KERNEL_AREA = 4096;

/** Convolution execution strategy. */
export type GPUConvolutionStrategy = 'auto' | 'direct' | 'fft';
/** Sampling outside the input field. */
export type GPUConvolutionBoundary = 'zero' | 'wrap';

/** Dimensions and policy shared by planning, support checks, and construction. */
export type GPUConvolutionPlanProps = {
  width: number;
  height: number;
  kernelWidth: number;
  kernelHeight: number;
  strategy?: GPUConvolutionStrategy;
  boundary?: GPUConvolutionBoundary;
};

/** Construction properties for one graph-native convolution. */
export type GPUConvolutionProps = GPUConvolutionPlanProps & {
  id?: string;
  input: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  kernel: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  output: GraphDataView<'float32'> | GraphVectorView<'float32'>;
};

/** Device-independent direct and FFT workload plan. */
export type GPUConvolutionStats = {
  width: number;
  height: number;
  kernelWidth: number;
  kernelHeight: number;
  boundary: GPUConvolutionBoundary;
  elementCount: number;
  kernelElementCount: number;
  directMultiplyAddCount: number;
  fftWidth: number;
  fftHeight: number;
  fftElementCount: number;
  fftTransformPassCount: number;
  fftDispatchCount: number;
  fftComplexBufferByteLength: number;
  fftLogicalTransientByteLength: number;
};

/** Result returned by {@link getGPUConvolutionSupport}. */
export type GPUConvolutionSupport = {
  supported: boolean;
  reason?: string;
  stats?: GPUConvolutionStats;
  strategy?: Exclude<GPUConvolutionStrategy, 'auto'>;
};

type FFTAxis = 'horizontal' | 'vertical';
type FFT2DPass = GPUFFTPassPlan & {axis: FFTAxis};

type FFTPassProps = {
  id: string;
  input: GraphDataView<'float32x2'>;
  output: GraphDataView<'float32x2'>;
  width: number;
  height: number;
  direction: GPUFFTDirection;
  pass: FFT2DPass;
  finalPass: boolean;
};

/**
 * Graph-native, same-size, centered 2D float convolution.
 *
 * The direct strategy contributes one compute node. The FFT strategy contributes packing,
 * forward transforms, spectral multiplication, an inverse transform, and cropping nodes while
 * keeping every intermediate in graph-owned transient storage.
 */
export class GPUConvolution {
  readonly id: string;
  readonly input: GPUConvolutionProps['input'];
  readonly kernel: GPUConvolutionProps['kernel'];
  readonly output: GPUConvolutionProps['output'];
  readonly width: number;
  readonly height: number;
  readonly kernelWidth: number;
  readonly kernelHeight: number;
  readonly strategy: GPUConvolutionStrategy;
  readonly boundary: GPUConvolutionBoundary;
  readonly stats: GPUConvolutionStats;

  constructor(props: GPUConvolutionProps) {
    this.id = props.id ?? 'gpu-convolution';
    this.input = props.input;
    this.kernel = props.kernel;
    this.output = props.output;
    this.width = props.width;
    this.height = props.height;
    this.kernelWidth = props.kernelWidth;
    this.kernelHeight = props.kernelHeight;
    this.strategy = props.strategy ?? 'auto';
    this.boundary = props.boundary ?? 'zero';
    this.stats = makeGPUConvolutionStats(props);

    for (const view of [this.input, this.kernel, this.output]) {
      for (const chunk of getGraphVectorData(view)) validatePackedView(chunk, ['float32'], this.id);
    }
    if (this.input.length < this.stats.elementCount) {
      throw new Error(`${this.id} input must contain at least width * height rows`);
    }
    if (this.kernel.length < this.stats.kernelElementCount) {
      throw new Error(`${this.id} kernel must contain at least kernelWidth * kernelHeight rows`);
    }
    if (this.output.length < this.stats.elementCount) {
      throw new Error(`${this.id} output must contain at least width * height rows`);
    }
    const inputs = new Set(getGraphVectorData(this.input).map(chunk => chunk.buffer));
    const kernels = new Set(getGraphVectorData(this.kernel).map(chunk => chunk.buffer));
    const outputs = getGraphVectorData(this.output);
    if (outputs.some(chunk => inputs.has(chunk.buffer) || kernels.has(chunk.buffer))) {
      throw new Error(`${this.id} output must use a separate buffer from input and kernel`);
    }
    if (getGraphVectorData(this.input).some(chunk => kernels.has(chunk.buffer))) {
      throw new Error(`${this.id} input and kernel must use separate buffers`);
    }
    for (const [index, chunk] of outputs.entries()) {
      if (outputs.slice(0, index).some(previous => doGraphDataViewsOverlap(previous, chunk))) {
        throw new Error(`${this.id} output chunks must not overlap`);
      }
    }
    if (!['auto', 'direct', 'fft'].includes(this.strategy)) {
      throw new Error(`${this.id} strategy must be auto, direct, or fft`);
    }
  }

  /** Adds the selected direct or FFT pipeline without compiling, submitting, or reading back. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    validateGPUConvolutionOwnership(graph, this.input, `${this.id} input`);
    validateGPUConvolutionOwnership(graph, this.kernel, `${this.id} kernel`);
    validateGPUConvolutionOwnership(graph, this.output, `${this.id} output`);
    const support = getGPUConvolutionSupport(graph.device, {
      width: this.width,
      height: this.height,
      kernelWidth: this.kernelWidth,
      kernelHeight: this.kernelHeight,
      strategy: this.strategy,
      boundary: this.boundary,
      input: this.input,
      kernel: this.kernel,
      output: this.output
    });
    if (!support.supported || !support.strategy) {
      throw new Error(support.reason);
    }
    if (support.strategy === 'direct') {
      nodes.push(...addGPUConvolutionDirectPass(graph, this));
    } else {
      nodes.push(...addGPUConvolutionFFTPipeline(graph, this));
    }

    return nodes;
  }
}

/** Builds immutable direct and FFT workload statistics. */
export function makeGPUConvolutionStats(props: GPUConvolutionPlanProps): GPUConvolutionStats {
  validateGPUConvolutionDimensions(props);
  const boundary = props.boundary ?? 'zero';
  const elementCount = props.width * props.height;
  const kernelElementCount = props.kernelWidth * props.kernelHeight;
  if (!Number.isSafeInteger(elementCount) || elementCount > 0xffffffff) {
    throw new Error('GPUConvolution width * height must fit in a uint32 index range.');
  }
  if (!Number.isSafeInteger(kernelElementCount) || kernelElementCount > 0xffffffff) {
    throw new Error('GPUConvolution kernel dimensions must fit in a uint32 index range.');
  }
  const fftWidth = getGPUConvolutionFFTDimension(props.width, props.kernelWidth, boundary);
  const fftHeight = getGPUConvolutionFFTDimension(props.height, props.kernelHeight, boundary);
  const fftElementCount = fftWidth * fftHeight;
  const fftTransformPassCount = Math.log2(fftWidth) + Math.log2(fftHeight) + 2;
  const fftComplexBufferByteLength = fftElementCount * 2 * Float32Array.BYTES_PER_ELEMENT;
  return Object.freeze({
    width: props.width,
    height: props.height,
    kernelWidth: props.kernelWidth,
    kernelHeight: props.kernelHeight,
    boundary,
    elementCount,
    kernelElementCount,
    directMultiplyAddCount: elementCount * kernelElementCount,
    fftWidth,
    fftHeight,
    fftElementCount,
    fftTransformPassCount,
    fftDispatchCount: 3 * fftTransformPassCount + 3,
    fftComplexBufferByteLength,
    fftLogicalTransientByteLength: 9 * fftComplexBufferByteLength
  });
}

/** Reports device support and the strategy selected by the initial crossover heuristic. */
export function getGPUConvolutionSupport(
  device: Device,
  props: GPUConvolutionPlanProps & Partial<Pick<GPUConvolutionProps, 'input' | 'kernel' | 'output'>>
): GPUConvolutionSupport {
  let stats: GPUConvolutionStats;
  try {
    stats = makeGPUConvolutionStats(props);
  } catch (error) {
    return {supported: false, reason: (error as Error).message};
  }
  if (device.type !== 'webgpu') {
    return {supported: false, reason: 'GPUConvolution requires WebGPU.', stats};
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 3) {
    return {
      supported: false,
      reason: 'GPUConvolution requires three compute storage buffers.',
      stats
    };
  }
  if (
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_CONVOLUTION_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_CONVOLUTION_WORKGROUP_SIZE
  ) {
    return {supported: false, reason: 'GPUConvolution requires 256 compute invocations.', stats};
  }
  const largestScalarByteLength =
    Math.max(stats.elementCount, stats.kernelElementCount) * Float32Array.BYTES_PER_ELEMENT;
  const hasViews = props.input && props.kernel && props.output;
  if (
    !hasViews &&
    (largestScalarByteLength > device.limits.maxStorageBufferBindingSize ||
      largestScalarByteLength > device.limits.maxBufferSize)
  ) {
    return {
      supported: false,
      reason: 'GPUConvolution scalar data exceeds device buffer limits.',
      stats
    };
  }
  if (hasViews) {
    for (const [view, count] of [
      [props.input!, stats.elementCount],
      [props.kernel!, stats.kernelElementCount],
      [props.output!, stats.elementCount]
    ] as const) {
      let remaining = count;
      for (const chunk of getGraphVectorData(view)) {
        const length = Math.min(remaining, chunk.length);
        if (
          length &&
          (getViewBindingRange(chunk).size - (chunk.length - length) * 4 >
            device.limits.maxStorageBufferBindingSize ||
            chunk.buffer.byteLength > device.limits.maxBufferSize)
        ) {
          return {
            supported: false,
            reason: 'GPUConvolution chunk exceeds device buffer limits.',
            stats
          };
        }
        remaining -= length;
        if (!remaining) break;
      }
    }
  }
  let dispatchElementCount = stats.elementCount;
  if (props.output) {
    let remaining = stats.elementCount;
    dispatchElementCount = 0;
    for (const chunk of getGraphVectorData(props.output)) {
      const length = Math.min(remaining, chunk.length);
      dispatchElementCount = Math.max(dispatchElementCount, length);
      remaining -= length;
      if (!remaining) break;
    }
  }
  try {
    getBoundedDispatchLayout(
      'GPUConvolution',
      dispatchElementCount,
      GPU_CONVOLUTION_WORKGROUP_SIZE,
      device.limits.maxComputeWorkgroupsPerDimension
    );
  } catch (error) {
    return {supported: false, reason: (error as Error).message, stats};
  }

  const requestedStrategy = props.strategy ?? 'auto';
  if (!['auto', 'direct', 'fft'].includes(requestedStrategy)) {
    return {
      supported: false,
      reason: 'GPUConvolution strategy must be auto, direct, or fft.',
      stats
    };
  }
  const fftReason = getGPUConvolutionFFTReason(device, props, stats);
  const strategy =
    requestedStrategy === 'auto'
      ? stats.kernelElementCount <= GPU_CONVOLUTION_AUTO_DIRECT_KERNEL_AREA || fftReason
        ? 'direct'
        : 'fft'
      : requestedStrategy;
  if (strategy === 'fft' && fftReason) {
    return {supported: false, reason: fftReason, stats};
  }
  return {supported: true, stats, strategy};
}

function addGPUConvolutionDirectPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const inputs = getConvolutionChunks(graph, convolution.input, convolution.stats.elementCount);
  const kernels = getConvolutionChunks(
    graph,
    convolution.kernel,
    convolution.stats.kernelElementCount
  );
  const outputs = getConvolutionChunks(graph, convolution.output, convolution.stats.elementCount);
  for (const destination of outputs) {
    const dispatchLayout = getBoundedDispatchLayout(
      convolution.id,
      destination.length,
      GPU_CONVOLUTION_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    let initializeOutput = true;
    for (const kernel of kernels) {
      for (const input of inputs) {
        const source = getGPUConvolutionDirectShaderSource(
          {
            ...convolution,
            input: input.data,
            kernel: kernel.data,
            output: destination.data,
            inputLogicalOffset: input.offset,
            kernelLogicalOffset: kernel.offset,
            outputLogicalOffset: destination.offset,
            initializeOutput
          },
          dispatchLayout
        );
        nodes.push(
          ...addGPUConvolutionComputePass(graph, {
            id: `${convolution.id}-direct-${nodes.length}`,
            source,
            bindings: {inputValues: input.data, kernelValues: kernel.data},
            outputs: {outputValues: destination.data},
            dispatchLayout,
            operation: 'GPUConvolution.direct',
            readOutputs: !initializeOutput,
            readByteLength:
              destination.length * kernel.length * 8 +
              (initializeOutput ? 0 : destination.length * 4),
            writeByteLength: destination.length * 4
          })
        );
        initializeOutput = false;
      }
    }
  }

  return nodes;
}

function getConvolutionChunks<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GPUConvolutionProps['input'],
  length: number
) {
  return getGPUVectorChunks(getGraphVectorData(getGraphDataPrefix(graph, view, length))).filter(
    chunk => chunk.length
  );
}

type AtomicConvolution = Omit<GPUConvolution, 'input' | 'kernel' | 'output' | 'getCommandNodes'> & {
  input: GraphDataView<'float32'>;
  kernel: GraphDataView<'float32'>;
  output: GraphDataView<'float32'>;
};

function addGPUConvolutionFFTPipeline<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const {fftElementCount} = convolution.stats;
  const packedInput = createTransientView(
    graph,
    `${convolution.id}-fft-packed-input`,
    'float32x2',
    fftElementCount
  );
  const packedKernel = createTransientView(
    graph,
    `${convolution.id}-fft-packed-kernel`,
    'float32x2',
    fftElementCount
  );
  const inputSpectrum = createTransientView(
    graph,
    `${convolution.id}-fft-input-spectrum`,
    'float32x2',
    fftElementCount
  );
  const kernelSpectrum = createTransientView(
    graph,
    `${convolution.id}-fft-kernel-spectrum`,
    'float32x2',
    fftElementCount
  );
  const productSpectrum = createTransientView(
    graph,
    `${convolution.id}-fft-product-spectrum`,
    'float32x2',
    fftElementCount
  );
  const inverseSpatial = createTransientView(
    graph,
    `${convolution.id}-fft-inverse-spatial`,
    'float32x2',
    fftElementCount
  );
  const inputScratch = createTransientView(
    graph,
    `${convolution.id}-fft-input-scratch`,
    'float32x2',
    fftElementCount
  );
  const kernelScratch = createTransientView(
    graph,
    `${convolution.id}-fft-kernel-scratch`,
    'float32x2',
    fftElementCount
  );
  const inverseScratch = createTransientView(
    graph,
    `${convolution.id}-fft-inverse-scratch`,
    'float32x2',
    fftElementCount
  );

  nodes.push(...addGPUConvolutionPackPass(graph, convolution, packedInput, packedKernel));
  nodes.push(
    ...addGPUConvolutionFFT2D(
      graph,
      `${convolution.id}-fft-input`,
      packedInput,
      inputSpectrum,
      inputScratch,
      convolution.stats.fftWidth,
      convolution.stats.fftHeight,
      'forward'
    )
  );
  nodes.push(
    ...addGPUConvolutionFFT2D(
      graph,
      `${convolution.id}-fft-kernel`,
      packedKernel,
      kernelSpectrum,
      kernelScratch,
      convolution.stats.fftWidth,
      convolution.stats.fftHeight,
      'forward'
    )
  );
  nodes.push(
    ...addGPUConvolutionMultiplyPass(
      graph,
      convolution,
      inputSpectrum,
      kernelSpectrum,
      productSpectrum
    )
  );
  nodes.push(
    ...addGPUConvolutionFFT2D(
      graph,
      `${convolution.id}-fft-inverse`,
      productSpectrum,
      inverseSpatial,
      inverseScratch,
      convolution.stats.fftWidth,
      convolution.stats.fftHeight,
      'inverse'
    )
  );
  nodes.push(...addGPUConvolutionCropPass(graph, convolution, inverseSpatial));

  return nodes;
}

function addGPUConvolutionPackPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution,
  packedInput: GraphDataView<'float32x2'>,
  packedKernel: GraphDataView<'float32x2'>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const inputs = getConvolutionChunks(graph, convolution.input, convolution.stats.elementCount);
  const kernels = getConvolutionChunks(
    graph,
    convolution.kernel,
    convolution.stats.kernelElementCount
  );
  const dispatchLayout = getBoundedDispatchLayout(
    `${convolution.id} FFT pack`,
    convolution.stats.fftElementCount,
    GPU_CONVOLUTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  if (inputs.length > 1 || kernels.length > 1) {
    for (const [kind, chunks, output] of [
      ['input', inputs, packedInput],
      ['kernel', kernels, packedKernel]
    ] as const) {
      for (const [index, chunk] of chunks.entries()) {
        const coordinateSource =
          kind === 'input'
            ? `let sourceX = i32(coordinateX);
  let sourceY = i32(coordinateY);`
            : `var signedX = i32(coordinateX);
  var signedY = i32(coordinateY);
  if (coordinateX > ${Math.floor(convolution.kernelWidth / 2)}u) {
    signedX -= i32(FFT_WIDTH);
  }
  if (coordinateY > ${Math.floor(convolution.kernelHeight / 2)}u) {
    signedY -= i32(FFT_HEIGHT);
  }
  let sourceX = signedX + ${Math.floor(convolution.kernelWidth / 2)};
  let sourceY = signedY + ${Math.floor(convolution.kernelHeight / 2)};`;
        const width = kind === 'input' ? convolution.width : convolution.kernelWidth;
        const height = kind === 'input' ? convolution.height : convolution.kernelHeight;
        const source = `const FFT_ELEMENT_COUNT: u32 = ${convolution.stats.fftElementCount}u;
const FFT_WIDTH: u32 = ${convolution.stats.fftWidth}u;
const FFT_HEIGHT: u32 = ${convolution.stats.fftHeight}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> packedValues: array<vec2f>;

@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= FFT_ELEMENT_COUNT) {
    return;
  }
  ${index === 0 ? 'packedValues[index] = vec2f(0.0);' : ''}
  let coordinateY = index / FFT_WIDTH;
  let coordinateX = index % FFT_WIDTH;
  ${coordinateSource}
  if (sourceX >= 0 && sourceX < ${width} && sourceY >= 0 && sourceY < ${height}) {
    let sourceIndex = u32(sourceY) * ${width}u + u32(sourceX);
    if (sourceIndex >= ${chunk.offset}u && sourceIndex - ${chunk.offset}u < ${chunk.length}u) {
      packedValues[index] = vec2f(sourceValues[${getViewElementOffset(chunk.data)}u + sourceIndex - ${chunk.offset}u], 0.0);
    }
  }
}`;
        nodes.push(
          ...addGPUConvolutionComputePass(graph, {
            id: `${convolution.id}-fft-pack-${kind}-${index}`,
            source,
            bindings: {sourceValues: chunk.data},
            outputs: {packedValues: output},
            dispatchLayout,
            operation: 'GPUConvolution.fft.pack',
            readByteLength: chunk.length * 4,
            writeByteLength:
              index === 0 ? convolution.stats.fftComplexBufferByteLength : chunk.length * 8
          })
        );
      }
    }
    return nodes;
  }
  const source = getGPUConvolutionPackShaderSource(
    {...convolution, input: inputs[0].data, kernel: kernels[0].data},
    dispatchLayout
  );
  nodes.push(
    ...addGPUConvolutionComputePass(graph, {
      id: `${convolution.id}-fft-pack`,
      source,
      bindings: {inputValues: inputs[0].data, kernelValues: kernels[0].data},
      outputs: {packedInput, packedKernel},
      dispatchLayout,
      operation: 'GPUConvolution.fft.pack',
      readByteLength:
        (convolution.stats.elementCount + convolution.stats.kernelElementCount) *
        Float32Array.BYTES_PER_ELEMENT,
      writeByteLength: 2 * convolution.stats.fftComplexBufferByteLength
    })
  );

  return nodes;
}

function addGPUConvolutionMultiplyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution,
  inputSpectrum: GraphDataView<'float32x2'>,
  kernelSpectrum: GraphDataView<'float32x2'>,
  productSpectrum: GraphDataView<'float32x2'>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const dispatchLayout = getBoundedDispatchLayout(
    `${convolution.id} FFT multiply`,
    convolution.stats.fftElementCount,
    GPU_CONVOLUTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `${GPU_FFT_COMMON_SHADER_SOURCE}
const ELEMENT_COUNT: u32 = ${convolution.stats.fftElementCount}u;
@group(0) @binding(0) var<storage, read> inputSpectrum: array<vec2f>;
@group(0) @binding(1) var<storage, read> kernelSpectrum: array<vec2f>;
@group(0) @binding(2) var<storage, read_write> productSpectrum: array<vec2f>;
@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  productSpectrum[index] = multiplyComplex(inputSpectrum[index], kernelSpectrum[index]);
}`;
  nodes.push(
    ...addGPUConvolutionComputePass(graph, {
      id: `${convolution.id}-fft-multiply`,
      source,
      bindings: {inputSpectrum, kernelSpectrum},
      outputs: {productSpectrum},
      dispatchLayout,
      operation: 'GPUConvolution.fft.multiply',
      readByteLength: 2 * convolution.stats.fftComplexBufferByteLength,
      writeByteLength: convolution.stats.fftComplexBufferByteLength
    })
  );

  return nodes;
}

function addGPUConvolutionCropPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution,
  inverseSpatial: GraphDataView<'float32x2'>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const outputs = getConvolutionChunks(graph, convolution.output, convolution.stats.elementCount);
  for (const [outputIndex, output] of outputs.entries()) {
    const dispatchLayout = getBoundedDispatchLayout(
      `${convolution.id} FFT crop`,
      output.length,
      GPU_CONVOLUTION_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const source = `const ELEMENT_COUNT: u32 = ${output.length}u;
const WIDTH: u32 = ${convolution.width}u;
const FFT_WIDTH: u32 = ${convolution.stats.fftWidth}u;
@group(0) @binding(0) var<storage, read> inverseSpatial: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<f32>;
@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) {
    return;
  }
  let row = ${output.offset}u + index;
  let outputY = row / WIDTH;
  let outputX = row % WIDTH;
  outputValues[${getViewElementOffset(output.data)}u + index] =
    inverseSpatial[outputY * FFT_WIDTH + outputX].x;
}`;
    nodes.push(
      ...addGPUConvolutionComputePass(graph, {
        id: `${convolution.id}-fft-crop-${outputIndex}`,
        source,
        bindings: {inverseSpatial},
        outputs: {outputValues: output.data},
        dispatchLayout,
        operation: 'GPUConvolution.fft.crop',
        readByteLength: output.length * 2 * Float32Array.BYTES_PER_ELEMENT,
        writeByteLength: output.length * Float32Array.BYTES_PER_ELEMENT
      })
    );
  }

  return nodes;
}

function addGPUConvolutionFFT2D<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GraphDataView<'float32x2'>,
  output: GraphDataView<'float32x2'>,
  scratch: GraphDataView<'float32x2'>,
  width: number,
  height: number,
  direction: GPUFFTDirection
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const passes: FFT2DPass[] = [
    ...makeGPUFFTPassPlan(width).map(pass => ({axis: 'horizontal' as const, ...pass})),
    ...makeGPUFFTPassPlan(height).map(pass => ({axis: 'vertical' as const, ...pass}))
  ];
  let passInput = input;
  for (const [passIndex, pass] of passes.entries()) {
    const remainingPassCount = passes.length - passIndex;
    const passOutput = remainingPassCount % 2 === 0 ? scratch : output;
    nodes.push(
      ...addGPUConvolutionFFTPass(graph, {
        id: `${id}-${pass.axis}-${pass.kind}-${pass.stage}`,
        input: passInput,
        output: passOutput,
        width,
        height,
        direction,
        pass,
        finalPass: passIndex === passes.length - 1
      })
    );
    passInput = passOutput;
  }

  return nodes;
}

function addGPUConvolutionFFTPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: FFTPassProps
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const elementCount = props.width * props.height;
  const dispatchLayout = getBoundedDispatchLayout(
    props.id,
    elementCount,
    GPU_CONVOLUTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = getGPUConvolutionFFTShaderSource(props, dispatchLayout);
  nodes.push(
    ...addGPUConvolutionComputePass(graph, {
      id: props.id,
      source,
      bindings: {inputValues: props.input},
      outputs: {outputValues: props.output},
      dispatchLayout,
      operation: 'GPUConvolution.fft.transform',
      readByteLength: elementCount * 2 * Float32Array.BYTES_PER_ELEMENT,
      writeByteLength: elementCount * 2 * Float32Array.BYTES_PER_ELEMENT
    })
  );

  return nodes;
}

type ComputePassProps = {
  id: string;
  source: string;
  bindings: Record<string, GraphDataView>;
  outputs: Record<string, GraphDataView>;
  dispatchLayout: {x: number; y: number; z: number};
  operation: string;
  readByteLength: number;
  writeByteLength: number;
  readOutputs?: boolean;
};

function addGPUConvolutionComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: ComputePassProps
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const entries = [...Object.entries(props.bindings), ...Object.entries(props.outputs)];
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: props.id,
      workload: {
        operation: props.operation,
        commandCount: 1,
        maximumWorkgroupCount:
          props.dispatchLayout.x * props.dispatchLayout.y * props.dispatchLayout.z,
        maximumInvocationCount:
          props.dispatchLayout.x *
          props.dispatchLayout.y *
          props.dispatchLayout.z *
          GPU_CONVOLUTION_WORKGROUP_SIZE,
        readByteLength: props.readByteLength,
        writeByteLength: props.writeByteLength
      },
      resources: [
        ...Object.values(props.bindings).map(buffer => ({buffer, usage: 'storage-read' as const})),
        ...Object.values(props.outputs).map(buffer => ({
          buffer,
          usage: props.readOutputs ? ('storage-read-write' as const) : ('storage-write' as const)
        }))
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: props.id,
          source: props.source,
          shaderLayout: {
            bindings: entries.map(([name], location) => ({
              name,
              type: location < Object.keys(props.bindings).length ? 'read-only-storage' : 'storage',
              group: 0,
              location
            }))
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {};
            for (const [name, view] of entries) {
              bindings[name] = getViewBinding(view, getBuffer);
            }
            computation.setBindings(bindings);
            computation.dispatch(
              computePass,
              props.dispatchLayout.x,
              props.dispatchLayout.y,
              props.dispatchLayout.z
            );
          },
          destroy: () => computation.destroy()
        };
      }
    })
  );

  return nodes;
}

/** Returns the direct spatial convolution shader. @internal */
export function getGPUConvolutionDirectShaderSource(
  convolution: Pick<
    AtomicConvolution,
    | 'input'
    | 'kernel'
    | 'output'
    | 'width'
    | 'height'
    | 'kernelWidth'
    | 'kernelHeight'
    | 'boundary'
    | 'stats'
  > & {
    inputLogicalOffset?: number;
    kernelLogicalOffset?: number;
    outputLogicalOffset?: number;
    initializeOutput?: boolean;
  },
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const sampleSource =
    convolution.boundary === 'wrap'
      ? `let wrappedX = ((sourceX % i32(WIDTH)) + i32(WIDTH)) % i32(WIDTH);
    let wrappedY = ((sourceY % i32(HEIGHT)) + i32(HEIGHT)) % i32(HEIGHT);
    let sourceIndex = u32(wrappedY) * WIDTH + u32(wrappedX);`
      : `if (sourceX < 0 || sourceX >= i32(WIDTH) || sourceY < 0 || sourceY >= i32(HEIGHT)) {
      continue;
    }
    let sourceIndex = u32(sourceY) * WIDTH + u32(sourceX);`;
  return `const ELEMENT_COUNT: u32 = ${Math.min(convolution.output.length, convolution.stats.elementCount)}u;
const WIDTH: u32 = ${convolution.width}u;
const HEIGHT: u32 = ${convolution.height}u;
const KERNEL_WIDTH: u32 = ${convolution.kernelWidth}u;
const KERNEL_HEIGHT: u32 = ${convolution.kernelHeight}u;
const KERNEL_CENTER_X: u32 = ${Math.floor(convolution.kernelWidth / 2)}u;
const KERNEL_CENTER_Y: u32 = ${Math.floor(convolution.kernelHeight / 2)}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(convolution.input)}u;
const KERNEL_OFFSET: u32 = ${getViewElementOffset(convolution.kernel)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(convolution.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<f32>;
@group(0) @binding(1) var<storage, read> kernelValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<f32>;
@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) {
    return;
  }
  let outputIndex = ${convolution.outputLogicalOffset ?? 0}u + index;
  let outputY = outputIndex / WIDTH;
  let outputX = outputIndex - outputY * WIDTH;
  var total = 0.0;
  for (var kernelLocalIndex = 0u; kernelLocalIndex < ${Math.min(convolution.kernel.length, convolution.stats.kernelElementCount)}u; kernelLocalIndex++) {
    let kernelIndex = ${convolution.kernelLogicalOffset ?? 0}u + kernelLocalIndex;
    let kernelY = kernelIndex / KERNEL_WIDTH;
    let kernelX = kernelIndex % KERNEL_WIDTH;
    let sourceY = i32(outputY) - (i32(kernelY) - i32(KERNEL_CENTER_Y));
    let sourceX = i32(outputX) - (i32(kernelX) - i32(KERNEL_CENTER_X));
    let kernelValue = kernelValues[KERNEL_OFFSET + kernelLocalIndex];
    ${sampleSource}
    if (sourceIndex >= ${convolution.inputLogicalOffset ?? 0}u &&
        sourceIndex - ${convolution.inputLogicalOffset ?? 0}u < ${Math.min(convolution.input.length, convolution.stats.elementCount)}u) {
      total += inputValues[INPUT_OFFSET + sourceIndex - ${convolution.inputLogicalOffset ?? 0}u] * kernelValue;
    }
  }
  outputValues[OUTPUT_OFFSET + index] ${convolution.initializeOutput === false ? '+=' : '='} total;
}`;
}

/** Returns the real-to-complex input and centered-kernel packing shader. @internal */
export function getGPUConvolutionPackShaderSource(
  convolution: Pick<
    AtomicConvolution,
    'input' | 'kernel' | 'width' | 'height' | 'kernelWidth' | 'kernelHeight' | 'stats'
  >,
  dispatchLayout: {x: number; y: number; z: number}
): string {
  return `const FFT_ELEMENT_COUNT: u32 = ${convolution.stats.fftElementCount}u;
const WIDTH: u32 = ${convolution.width}u;
const HEIGHT: u32 = ${convolution.height}u;
const FFT_WIDTH: u32 = ${convolution.stats.fftWidth}u;
const FFT_HEIGHT: u32 = ${convolution.stats.fftHeight}u;
const KERNEL_WIDTH: u32 = ${convolution.kernelWidth}u;
const KERNEL_HEIGHT: u32 = ${convolution.kernelHeight}u;
const KERNEL_CENTER_X: i32 = ${Math.floor(convolution.kernelWidth / 2)};
const KERNEL_CENTER_Y: i32 = ${Math.floor(convolution.kernelHeight / 2)};
const INPUT_OFFSET: u32 = ${getViewElementOffset(convolution.input)}u;
const KERNEL_OFFSET: u32 = ${getViewElementOffset(convolution.kernel)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<f32>;
@group(0) @binding(1) var<storage, read> kernelValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> packedInput: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> packedKernel: array<vec2f>;
@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= FFT_ELEMENT_COUNT) { return; }
  let coordinateY = index / FFT_WIDTH;
  let coordinateX = index - coordinateY * FFT_WIDTH;
  var inputValue = 0.0;
  if (coordinateX < WIDTH && coordinateY < HEIGHT) {
    inputValue = inputValues[INPUT_OFFSET + coordinateY * WIDTH + coordinateX];
  }
  var signedX = i32(coordinateX);
  var signedY = i32(coordinateY);
  if (coordinateX > u32(KERNEL_CENTER_X)) { signedX -= i32(FFT_WIDTH); }
  if (coordinateY > u32(KERNEL_CENTER_Y)) { signedY -= i32(FFT_HEIGHT); }
  let kernelX = signedX + KERNEL_CENTER_X;
  let kernelY = signedY + KERNEL_CENTER_Y;
  var kernelValue = 0.0;
  if (kernelX >= 0 && kernelX < i32(KERNEL_WIDTH) &&
      kernelY >= 0 && kernelY < i32(KERNEL_HEIGHT)) {
    kernelValue = kernelValues[KERNEL_OFFSET + u32(kernelY) * KERNEL_WIDTH + u32(kernelX)];
  }
  packedInput[index] = vec2f(inputValue, 0.0);
  packedKernel[index] = vec2f(kernelValue, 0.0);
}`;
}

/** Returns one portable 2D FFT stage used by the spectral convolution pipeline. @internal */
export function getGPUConvolutionFFTShaderSource(
  props: FFTPassProps,
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const elementCount = props.width * props.height;
  const horizontal = props.pass.axis === 'horizontal';
  const directionSign = props.direction === 'forward' ? '-1.0' : '1.0';
  const normalizationScale =
    props.direction === 'inverse' && props.finalPass ? `${1 / elementCount}` : '1.0';
  const commonSource = `const ELEMENT_COUNT: u32 = ${elementCount}u;
const WIDTH: u32 = ${props.width}u;
const INPUT_OFFSET: u32 = ${getComplexViewOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getComplexViewOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<vec2f>;
${GPU_FFT_COMMON_SHADER_SOURCE}`;
  const coordinates = `let coordinateY = index / WIDTH;
  let coordinateX = index - coordinateY * WIDTH;`;
  if (props.pass.kind === 'bit-reversal') {
    const sourceIndex = horizontal
      ? `coordinateY * WIDTH + reverseLowBits(coordinateX, ${props.pass.stage}u)`
      : `reverseLowBits(coordinateY, ${props.pass.stage}u) * WIDTH + coordinateX`;
    return `${commonSource}
@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  ${coordinates}
  outputValues[OUTPUT_OFFSET + index] = inputValues[INPUT_OFFSET + ${sourceIndex}];
}`;
  }
  const butterflySpan = 1 << props.pass.stage;
  const butterflyHalfSpan = butterflySpan >> 1;
  const coordinate = horizontal ? 'coordinateX' : 'coordinateY';
  const firstIndex = horizontal
    ? 'coordinateY * WIDTH + firstCoordinate'
    : 'firstCoordinate * WIDTH + coordinateX';
  const secondIndex = horizontal
    ? 'coordinateY * WIDTH + secondCoordinate'
    : 'secondCoordinate * WIDTH + coordinateX';
  return `${commonSource}
@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  ${coordinates}
  let butterflyOffset = ${coordinate} & ${butterflySpan - 1}u;
  let twiddleIndex = butterflyOffset & ${butterflyHalfSpan - 1}u;
  let butterflyStart = ${coordinate} - butterflyOffset;
  let firstCoordinate = butterflyStart + twiddleIndex;
  let secondCoordinate = firstCoordinate + ${butterflyHalfSpan}u;
  let firstValue = inputValues[INPUT_OFFSET + ${firstIndex}];
  let secondValue = inputValues[INPUT_OFFSET + ${secondIndex}];
  let angle = ${directionSign} * 2.0 * GPU_FFT_PI * f32(twiddleIndex) /
    f32(${butterflySpan}u);
  let rotatedSecondValue = multiplyComplex(secondValue, vec2f(cos(angle), sin(angle)));
  let butterflyValue = select(
    firstValue + rotatedSecondValue,
    firstValue - rotatedSecondValue,
    butterflyOffset >= ${butterflyHalfSpan}u
  );
  outputValues[OUTPUT_OFFSET + index] = butterflyValue * ${normalizationScale};
}`;
}

function validateGPUConvolutionDimensions(props: GPUConvolutionPlanProps): void {
  for (const [name, value] of [
    ['width', props.width],
    ['height', props.height],
    ['kernelWidth', props.kernelWidth],
    ['kernelHeight', props.kernelHeight]
  ] as const) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`GPUConvolution ${name} must be a positive integer.`);
    }
  }
  if (props.kernelWidth % 2 === 0 || props.kernelHeight % 2 === 0) {
    throw new Error('GPUConvolution kernel dimensions must be odd.');
  }
  if (props.boundary !== undefined && props.boundary !== 'zero' && props.boundary !== 'wrap') {
    throw new Error('GPUConvolution boundary must be zero or wrap.');
  }
}

function getGPUConvolutionFFTDimension(
  inputDimension: number,
  kernelDimension: number,
  boundary: GPUConvolutionBoundary
): number {
  const requiredDimension =
    boundary === 'zero' ? inputDimension + kernelDimension - 1 : inputDimension;
  return Math.max(2, 2 ** Math.ceil(Math.log2(requiredDimension)));
}

function getGPUConvolutionFFTReason(
  device: Device,
  props: GPUConvolutionPlanProps,
  stats: GPUConvolutionStats
): string | undefined {
  if (props.boundary === 'wrap') {
    if (!isPowerOfTwo(props.width) || !isPowerOfTwo(props.height)) {
      return 'GPUConvolution FFT wrap boundary requires power-of-two input dimensions.';
    }
    if (props.kernelWidth > props.width || props.kernelHeight > props.height) {
      return 'GPUConvolution FFT wrap boundary requires the kernel to fit inside the input field.';
    }
  }
  if (stats.fftWidth > GPU_FFT_MAX_LENGTH || stats.fftHeight > GPU_FFT_MAX_LENGTH) {
    return `GPUConvolution FFT dimensions must not exceed ${GPU_FFT_MAX_LENGTH}.`;
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 4) {
    return 'GPUConvolution FFT strategy requires four compute storage buffers.';
  }
  if (
    stats.fftComplexBufferByteLength > device.limits.maxStorageBufferBindingSize ||
    stats.fftComplexBufferByteLength > device.limits.maxBufferSize
  ) {
    return 'GPUConvolution FFT scratch exceeds device buffer limits.';
  }
  try {
    getBoundedDispatchLayout(
      'GPUConvolution FFT',
      stats.fftElementCount,
      GPU_CONVOLUTION_WORKGROUP_SIZE,
      device.limits.maxComputeWorkgroupsPerDimension
    );
  } catch (error) {
    return (error as Error).message;
  }
  return undefined;
}

function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0;
}

function getComplexViewOffset(view: GraphDataView<'float32x2'>): number {
  return (view.byteOffset % 256) / (2 * Float32Array.BYTES_PER_ELEMENT);
}

function validateGPUConvolutionOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GPUConvolutionProps['input'],
  name: string
): void {
  if (getGraphVectorData(view).some(chunk => chunk.buffer.graph !== graph)) {
    throw new Error(`${name} belongs to a different GPUCommandGraph`);
  }
}
