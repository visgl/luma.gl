// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPU_FFT2D_PARAMETER_BYTE_LENGTH,
  GPU_FFT2D_SHADER,
  GPU_FFT2D_WORKGROUP_DIMENSION
} from './gpu-fft2d-shaders';

/** Smallest supported transform dimension. */
export const GPU_FFT2D_MIN_DIMENSION = 2;
/** Largest supported transform dimension. */
export const GPU_FFT2D_MAX_DIMENSION = 2048;

/** Construction options for {@link GPUFFT2D}. */
export type GPUFFT2DProps = {
  /** Prefix used for owned GPU resource labels. */
  id?: string;
  /** Number of complex values in each row. Must be a power of two from 2 through 2048. */
  width: number;
  /** Number of complex values in each column. Must be a power of two from 2 through 2048. */
  height: number;
  /** Number of independent, tightly packed transforms encoded by each dispatch. Defaults to one. */
  batchCount?: number;
};

/** Transform sign and normalization convention. */
export type GPUFFT2DDirection = 'forward' | 'inverse';

/** Caller-owned resources supplied to {@link GPUFFT2D.encode}. */
export type GPUFFT2DEncodeOptions = {
  /** Row-major complex `vec2<f32>` input. The transform never modifies this buffer. */
  inputBuffer: Buffer;
  /** Separate row-major complex `vec2<f32>` destination. */
  outputBuffer: Buffer;
  /** `forward` is unnormalized; `inverse` divides by `width * height`. */
  direction?: GPUFFT2DDirection;
};

/** Immutable allocation and dispatch plan for one transform instance. */
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

type GPUFFT2DPassResources = {
  parameterBuffers: Record<GPUFFT2DDirection, Buffer>;
};

type GPUFFT2DResources = {
  scratchBuffer: Buffer;
  computation: Computation;
  passResources: GPUFFT2DPassResources[];
};

/**
 * Reusable out-of-place two-dimensional complex FFT for WebGPU storage buffers.
 *
 * The transform owns one scratch buffer, one compute pipeline, and immutable pass parameters.
 * Input/output buffers and command submission remain caller-owned. `encode()` records the complete
 * bit-reversal and radix-2 butterfly sequence onto the supplied encoder without submitting or
 * reading data back.
 */
export class GPUFFT2D {
  readonly device: Device;
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly batchCount: number;
  readonly stats: GPUFFT2DStats;

  private readonly scratchBuffer: Buffer;
  private readonly computation: Computation;
  private readonly passResources: GPUFFT2DPassResources[];
  private destroyed = false;

  constructor(device: Device, props: GPUFFT2DProps) {
    const support = getGPUFFT2DSupport(device, props);
    if (!support.supported || !support.stats) {
      throw new Error(support.reason);
    }

    this.device = device;
    this.id = props.id ?? 'gpu-fft2d';
    this.width = props.width;
    this.height = props.height;
    this.batchCount = props.batchCount ?? 1;
    this.stats = support.stats;
    const resources = createGPUFFT2DResources(device, {
      id: this.id,
      width: this.width,
      height: this.height,
      stats: this.stats
    });
    this.scratchBuffer = resources.scratchBuffer;
    this.computation = resources.computation;
    this.passResources = resources.passResources;
  }

  /**
   * Records one complete transform and returns the caller-owned output buffer.
   *
   * Forward transforms use the conventional negative exponent without normalization. Inverse
   * transforms use the positive exponent and divide the final pass by `width * height`.
   */
  encode(commandEncoder: CommandEncoder, options: GPUFFT2DEncodeOptions): Buffer {
    if (this.destroyed) {
      throw new Error('GPUFFT2D has been destroyed.');
    }
    if (commandEncoder.device !== this.device) {
      throw new Error('GPUFFT2D command encoder belongs to a different device.');
    }
    const direction = options.direction ?? 'forward';
    if (direction !== 'forward' && direction !== 'inverse') {
      throw new Error('GPUFFT2D direction must be forward or inverse.');
    }
    validateGPUFFT2DBuffer(this.device, options.inputBuffer, this.stats, 'input');
    validateGPUFFT2DBuffer(this.device, options.outputBuffer, this.stats, 'output');
    if (
      options.inputBuffer === options.outputBuffer ||
      options.inputBuffer.handle === options.outputBuffer.handle
    ) {
      throw new Error('GPUFFT2D input and output buffers must be separate.');
    }

    this.computation.predraw(commandEncoder);
    const computePass = commandEncoder.beginComputePass({id: `${this.id}-${direction}`});
    let inputBuffer = options.inputBuffer;
    for (const [passIndex, passResources] of this.passResources.entries()) {
      const remainingPassCount = this.passResources.length - passIndex;
      const outputBuffer = remainingPassCount % 2 === 0 ? this.scratchBuffer : options.outputBuffer;
      this.computation.setBindings({
        inputValues: inputBuffer,
        outputValues: outputBuffer,
        parameters: passResources.parameterBuffers[direction]
      });
      this.computation.dispatch(
        computePass,
        this.stats.workgroupCount[0],
        this.stats.workgroupCount[1],
        this.stats.workgroupCount[2]
      );
      inputBuffer = outputBuffer;
    }
    computePass.end();
    return options.outputBuffer;
  }

  /** Releases the owned compute pipeline, scratch storage, and immutable parameter buffers. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.computation.destroy();
    this.scratchBuffer.destroy();
    for (const passResources of this.passResources) {
      passResources.parameterBuffers.forward.destroy();
      passResources.parameterBuffers.inverse.destroy();
    }
  }
}

/** Reports whether a device can allocate and dispatch the requested bounded radix-2 transform. */
export function getGPUFFT2DSupport(device: Device, props: GPUFFT2DProps): GPUFFT2DSupport {
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
    stats.workgroupCount[2] > device.limits.maxComputeWorkgroupsPerDimension
  ) {
    return {
      supported: false,
      reason: 'GPUFFT2D workgroup count exceeds the device dispatch limit.',
      stats
    };
  }
  if (stats.complexBufferByteLength > device.limits.maxStorageBufferBindingSize) {
    return {
      supported: false,
      reason: 'GPUFFT2D complex buffer exceeds maxStorageBufferBindingSize.',
      stats
    };
  }
  if (stats.complexBufferByteLength > device.limits.maxBufferSize) {
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
    parameterBufferCount: passCount * 2,
    parameterBufferByteLength: passCount * 2 * GPU_FFT2D_PARAMETER_BYTE_LENGTH
  });
}

function makeGPUFFT2DPassPlan(width: number, height: number): GPUFFT2DPassPlan[] {
  const passes: GPUFFT2DPassPlan[] = [];
  addAxisPasses(passes, 'horizontal', width);
  addAxisPasses(passes, 'vertical', height);
  return passes;
}

function createGPUFFT2DResources(
  device: Device,
  props: {id: string; width: number; height: number; stats: GPUFFT2DStats}
): GPUFFT2DResources {
  let scratchBuffer: Buffer | undefined;
  let computation: Computation | undefined;
  const allocatedParameterBuffers: Buffer[] = [];
  try {
    scratchBuffer = device.createBuffer({
      id: `${props.id}-scratch`,
      byteLength: props.stats.scratchBufferByteLength,
      usage: Buffer.STORAGE
    });
    computation = new Computation(device, {
      id: `${props.id}-pass`,
      source: GPU_FFT2D_SHADER,
      shaderLayout: {
        bindings: [
          {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValues', type: 'storage', group: 0, location: 1},
          {name: 'parameters', type: 'uniform', group: 0, location: 2}
        ]
      }
    });
    const passResources = makeGPUFFT2DPassPlan(props.width, props.height).map((plan, passIndex) => {
      const forward = createGPUFFT2DParameterBuffer(device, props, plan, passIndex, 'forward');
      allocatedParameterBuffers.push(forward);
      const inverse = createGPUFFT2DParameterBuffer(device, props, plan, passIndex, 'inverse');
      allocatedParameterBuffers.push(inverse);
      return {parameterBuffers: {forward, inverse}};
    });
    return {scratchBuffer, computation, passResources};
  } catch (error) {
    for (const parameterBuffer of allocatedParameterBuffers) {
      parameterBuffer.destroy();
    }
    computation?.destroy();
    scratchBuffer?.destroy();
    throw error;
  }
}

function createGPUFFT2DParameterBuffer(
  device: Device,
  props: {id: string; width: number; height: number; stats: GPUFFT2DStats},
  plan: GPUFFT2DPassPlan,
  passIndex: number,
  direction: GPUFFT2DDirection
): Buffer {
  const finalInversePass = direction === 'inverse' && passIndex === props.stats.passCount - 1;
  return device.createBuffer({
    id: `${props.id}-${direction}-${passIndex}-parameters`,
    data: makeGPUFFT2DParameterData({
      width: props.width,
      height: props.height,
      axis: plan.axis,
      kind: plan.kind,
      transformSize: plan.transformSize,
      stage: plan.stage,
      direction,
      normalizationScale: finalInversePass ? 1 / props.stats.elementCount : 1
    }),
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
}

function addAxisPasses(
  passes: GPUFFT2DPassPlan[],
  axis: GPUFFT2DAxis,
  transformSize: number
): void {
  const stageCount = Math.log2(transformSize);
  passes.push({axis, kind: 'bit-reversal', transformSize, stage: stageCount});
  for (let stage = 1; stage <= stageCount; stage++) {
    passes.push({axis, kind: 'butterfly', transformSize, stage});
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
  return undefined;
}

function getDimensionReason(name: string, dimension: number): string | undefined {
  if (!Number.isInteger(dimension)) {
    return `GPUFFT2D ${name} must be an integer.`;
  }
  if (dimension < GPU_FFT2D_MIN_DIMENSION || dimension > GPU_FFT2D_MAX_DIMENSION) {
    return `GPUFFT2D ${name} must be from ${GPU_FFT2D_MIN_DIMENSION} through ${GPU_FFT2D_MAX_DIMENSION}.`;
  }
  if ((dimension & (dimension - 1)) !== 0) {
    return `GPUFFT2D ${name} must be a power of two.`;
  }
  return undefined;
}

function validateGPUFFT2DBuffer(
  device: Device,
  buffer: Buffer,
  stats: GPUFFT2DStats,
  label: string
): void {
  if (buffer.device !== device) {
    throw new Error(`GPUFFT2D ${label} buffer belongs to a different device.`);
  }
  if (buffer.destroyed) {
    throw new Error(`GPUFFT2D ${label} buffer has been destroyed.`);
  }
  if (!(buffer.usage & Buffer.STORAGE)) {
    throw new Error(`GPUFFT2D ${label} buffer requires Buffer.STORAGE usage.`);
  }
  if (buffer.byteLength < stats.complexBufferByteLength) {
    throw new Error(
      `GPUFFT2D ${label} buffer must contain at least ${stats.complexBufferByteLength} bytes.`
    );
  }
}
