// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
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
  input: GraphDataView<'float32'>;
  kernel: GraphDataView<'float32'>;
  output: GraphDataView<'float32'>;
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
  readonly input: GraphDataView<'float32'>;
  readonly kernel: GraphDataView<'float32'>;
  readonly output: GraphDataView<'float32'>;
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

    validatePackedView(this.input, ['float32'], `${this.id} input`);
    validatePackedView(this.kernel, ['float32'], `${this.id} kernel`);
    validatePackedView(this.output, ['float32'], `${this.id} output`);
    if (this.input.length < this.stats.elementCount) {
      throw new Error(`${this.id} input must contain at least width * height rows`);
    }
    if (this.kernel.length < this.stats.kernelElementCount) {
      throw new Error(`${this.id} kernel must contain at least kernelWidth * kernelHeight rows`);
    }
    if (this.output.length < this.stats.elementCount) {
      throw new Error(`${this.id} output must contain at least width * height rows`);
    }
    if (this.output.buffer === this.input.buffer || this.output.buffer === this.kernel.buffer) {
      throw new Error(`${this.id} output must use a separate buffer from input and kernel`);
    }
    if (this.input.buffer === this.kernel.buffer) {
      throw new Error(`${this.id} input and kernel must use separate buffers`);
    }
    if (!['auto', 'direct', 'fft'].includes(this.strategy)) {
      throw new Error(`${this.id} strategy must be auto, direct, or fft`);
    }
  }

  /** Adds the selected direct or FFT pipeline without compiling, submitting, or reading back. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateGPUConvolutionOwnership(graph, this.input, `${this.id} input`);
    validateGPUConvolutionOwnership(graph, this.kernel, `${this.id} kernel`);
    validateGPUConvolutionOwnership(graph, this.output, `${this.id} output`);
    const support = getGPUConvolutionSupport(graph.device, {
      width: this.width,
      height: this.height,
      kernelWidth: this.kernelWidth,
      kernelHeight: this.kernelHeight,
      strategy: this.strategy,
      boundary: this.boundary
    });
    if (!support.supported || !support.strategy) {
      throw new Error(support.reason);
    }
    if (support.strategy === 'direct') {
      addGPUConvolutionDirectPass(graph, this);
    } else {
      addGPUConvolutionFFTPipeline(graph, this);
    }
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
  props: GPUConvolutionPlanProps
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
  if (
    largestScalarByteLength > device.limits.maxStorageBufferBindingSize ||
    largestScalarByteLength > device.limits.maxBufferSize
  ) {
    return {
      supported: false,
      reason: 'GPUConvolution scalar data exceeds device buffer limits.',
      stats
    };
  }
  try {
    getBoundedDispatchLayout(
      'GPUConvolution',
      stats.elementCount,
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
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    convolution.id,
    convolution.stats.elementCount,
    GPU_CONVOLUTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = getGPUConvolutionDirectShaderSource(convolution, dispatchLayout);
  addGPUConvolutionComputePass(graph, {
    id: `${convolution.id}-direct`,
    source,
    bindings: {inputValues: convolution.input, kernelValues: convolution.kernel},
    outputs: {outputValues: convolution.output},
    dispatchLayout,
    operation: 'GPUConvolution.direct',
    readByteLength: convolution.stats.directMultiplyAddCount * 2 * Float32Array.BYTES_PER_ELEMENT,
    writeByteLength: convolution.stats.elementCount * Float32Array.BYTES_PER_ELEMENT
  });
}

function addGPUConvolutionFFTPipeline<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution
): void {
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

  addGPUConvolutionPackPass(graph, convolution, packedInput, packedKernel);
  addGPUConvolutionFFT2D(
    graph,
    `${convolution.id}-fft-input`,
    packedInput,
    inputSpectrum,
    inputScratch,
    convolution.stats.fftWidth,
    convolution.stats.fftHeight,
    'forward'
  );
  addGPUConvolutionFFT2D(
    graph,
    `${convolution.id}-fft-kernel`,
    packedKernel,
    kernelSpectrum,
    kernelScratch,
    convolution.stats.fftWidth,
    convolution.stats.fftHeight,
    'forward'
  );
  addGPUConvolutionMultiplyPass(graph, convolution, inputSpectrum, kernelSpectrum, productSpectrum);
  addGPUConvolutionFFT2D(
    graph,
    `${convolution.id}-fft-inverse`,
    productSpectrum,
    inverseSpatial,
    inverseScratch,
    convolution.stats.fftWidth,
    convolution.stats.fftHeight,
    'inverse'
  );
  addGPUConvolutionCropPass(graph, convolution, inverseSpatial);
}

function addGPUConvolutionPackPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution,
  packedInput: GraphDataView<'float32x2'>,
  packedKernel: GraphDataView<'float32x2'>
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    `${convolution.id} FFT pack`,
    convolution.stats.fftElementCount,
    GPU_CONVOLUTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = getGPUConvolutionPackShaderSource(convolution, dispatchLayout);
  addGPUConvolutionComputePass(graph, {
    id: `${convolution.id}-fft-pack`,
    source,
    bindings: {inputValues: convolution.input, kernelValues: convolution.kernel},
    outputs: {packedInput, packedKernel},
    dispatchLayout,
    operation: 'GPUConvolution.fft.pack',
    readByteLength:
      (convolution.stats.elementCount + convolution.stats.kernelElementCount) *
      Float32Array.BYTES_PER_ELEMENT,
    writeByteLength: 2 * convolution.stats.fftComplexBufferByteLength
  });
}

function addGPUConvolutionMultiplyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution,
  inputSpectrum: GraphDataView<'float32x2'>,
  kernelSpectrum: GraphDataView<'float32x2'>,
  productSpectrum: GraphDataView<'float32x2'>
): void {
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
  addGPUConvolutionComputePass(graph, {
    id: `${convolution.id}-fft-multiply`,
    source,
    bindings: {inputSpectrum, kernelSpectrum},
    outputs: {productSpectrum},
    dispatchLayout,
    operation: 'GPUConvolution.fft.multiply',
    readByteLength: 2 * convolution.stats.fftComplexBufferByteLength,
    writeByteLength: convolution.stats.fftComplexBufferByteLength
  });
}

function addGPUConvolutionCropPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  convolution: GPUConvolution,
  inverseSpatial: GraphDataView<'float32x2'>
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    `${convolution.id} FFT crop`,
    convolution.stats.elementCount,
    GPU_CONVOLUTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const ELEMENT_COUNT: u32 = ${convolution.stats.elementCount}u;
const WIDTH: u32 = ${convolution.width}u;
const FFT_WIDTH: u32 = ${convolution.stats.fftWidth}u;
@group(0) @binding(0) var<storage, read> inverseSpatial: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<f32>;
@compute @workgroup_size(${GPU_CONVOLUTION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_CONVOLUTION_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  let outputY = index / WIDTH;
  let outputX = index - outputY * WIDTH;
  outputValues[${getViewElementOffset(convolution.output)}u + index] =
    inverseSpatial[outputY * FFT_WIDTH + outputX].x;
}`;
  addGPUConvolutionComputePass(graph, {
    id: `${convolution.id}-fft-crop`,
    source,
    bindings: {inverseSpatial},
    outputs: {outputValues: convolution.output},
    dispatchLayout,
    operation: 'GPUConvolution.fft.crop',
    readByteLength: convolution.stats.elementCount * 2 * Float32Array.BYTES_PER_ELEMENT,
    writeByteLength: convolution.stats.elementCount * Float32Array.BYTES_PER_ELEMENT
  });
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
): void {
  const passes: FFT2DPass[] = [
    ...makeGPUFFTPassPlan(width).map(pass => ({axis: 'horizontal' as const, ...pass})),
    ...makeGPUFFTPassPlan(height).map(pass => ({axis: 'vertical' as const, ...pass}))
  ];
  let passInput = input;
  for (const [passIndex, pass] of passes.entries()) {
    const remainingPassCount = passes.length - passIndex;
    const passOutput = remainingPassCount % 2 === 0 ? scratch : output;
    addGPUConvolutionFFTPass(graph, {
      id: `${id}-${pass.axis}-${pass.kind}-${pass.stage}`,
      input: passInput,
      output: passOutput,
      width,
      height,
      direction,
      pass,
      finalPass: passIndex === passes.length - 1
    });
    passInput = passOutput;
  }
}

function addGPUConvolutionFFTPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: FFTPassProps
): void {
  const elementCount = props.width * props.height;
  const dispatchLayout = getBoundedDispatchLayout(
    props.id,
    elementCount,
    GPU_CONVOLUTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = getGPUConvolutionFFTShaderSource(props, dispatchLayout);
  addGPUConvolutionComputePass(graph, {
    id: props.id,
    source,
    bindings: {inputValues: props.input},
    outputs: {outputValues: props.output},
    dispatchLayout,
    operation: 'GPUConvolution.fft.transform',
    readByteLength: elementCount * 2 * Float32Array.BYTES_PER_ELEMENT,
    writeByteLength: elementCount * 2 * Float32Array.BYTES_PER_ELEMENT
  });
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
};

function addGPUConvolutionComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: ComputePassProps
): void {
  const entries = [...Object.entries(props.bindings), ...Object.entries(props.outputs)];
  graph.addComputePass({
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
      ...Object.values(props.outputs).map(buffer => ({buffer, usage: 'storage-write' as const}))
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
  });
}

/** Returns the direct spatial convolution shader. @internal */
export function getGPUConvolutionDirectShaderSource(
  convolution: Pick<
    GPUConvolution,
    | 'input'
    | 'kernel'
    | 'output'
    | 'width'
    | 'height'
    | 'kernelWidth'
    | 'kernelHeight'
    | 'boundary'
    | 'stats'
  >,
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const sampleSource =
    convolution.boundary === 'wrap'
      ? `let wrappedX = ((sourceX % i32(WIDTH)) + i32(WIDTH)) % i32(WIDTH);
      let wrappedY = ((sourceY % i32(HEIGHT)) + i32(HEIGHT)) % i32(HEIGHT);
      total += inputValues[INPUT_OFFSET + u32(wrappedY) * WIDTH + u32(wrappedX)] * kernelValue;`
      : `if (sourceX >= 0 && sourceX < i32(WIDTH) && sourceY >= 0 && sourceY < i32(HEIGHT)) {
        total += inputValues[INPUT_OFFSET + u32(sourceY) * WIDTH + u32(sourceX)] * kernelValue;
      }`;
  return `const ELEMENT_COUNT: u32 = ${convolution.stats.elementCount}u;
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
  if (index >= ELEMENT_COUNT) { return; }
  let outputY = index / WIDTH;
  let outputX = index - outputY * WIDTH;
  var total = 0.0;
  for (var kernelY = 0u; kernelY < KERNEL_HEIGHT; kernelY++) {
    let sourceY = i32(outputY) - (i32(kernelY) - i32(KERNEL_CENTER_Y));
    for (var kernelX = 0u; kernelX < KERNEL_WIDTH; kernelX++) {
      let sourceX = i32(outputX) - (i32(kernelX) - i32(KERNEL_CENTER_X));
      let kernelValue = kernelValues[KERNEL_OFFSET + kernelY * KERNEL_WIDTH + kernelX];
      ${sampleSource}
    }
  }
  outputValues[OUTPUT_OFFSET + index] = total;
}`;
}

/** Returns the real-to-complex input and centered-kernel packing shader. @internal */
export function getGPUConvolutionPackShaderSource(
  convolution: Pick<
    GPUConvolution,
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
  view: GraphDataView,
  name: string
): void {
  if (view.buffer.graph !== graph) {
    throw new Error(`${name} belongs to a different GPUCommandGraph`);
  }
}
