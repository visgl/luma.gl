// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  Texture,
  type BindingDeclaration,
  type CommandEncoder,
  type Device
} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {getGPUFFT2DSupport, GPUFFT2D, makeGPUFFT2DStats} from '../gpu-primitives/gpu-fft2d';
import {
  FFT_BLOOM_COMPOSITE_SHADER,
  FFT_BLOOM_EXTRACT_SHADER,
  FFT_BLOOM_MULTIPLY_SHADER,
  FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE,
  FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW,
  FFT_BLOOM_PARAMETER_BYTE_LENGTH,
  FFT_BLOOM_WORKGROUP_DIMENSION
} from './fft-bloom-shaders';

/** Construction options for frequency-domain photographic bloom. */
export type GPUConvolutionBloomProps = {
  id?: string;
  width: number;
  height: number;
  /** Fractional source resolution before rounding up to power-of-two FFT dimensions. */
  resolutionScale?: number;
  /** Scene-referred highlight threshold. Defaults to 0.8. */
  threshold?: number;
  /** Additive intensity applied after energy-normalized optical convolution. */
  intensity?: number;
  /** Adapted camera exposure used to scale the highlight threshold. */
  exposure?: number;
  /** Additional exposure compensation measured in photographic stops. */
  exposureCompensation?: number;
  /** Aperture blade count used when generating the default diffraction kernel. */
  apertureBlades?: number;
  /** Weight of diffraction spikes relative to the central Airy-like lobe. */
  diffractionStrength?: number;
  /** Horizontal or vertical stretching applied to the generated point-spread function. */
  anamorphicRatio?: number;
  /** Optional custom point-spread kernel containing one scalar per transform pixel. */
  pointSpreadFunction?: Float32Array;
};

/** Per-frame inputs and optical overrides for {@link GPUConvolutionBloom.encode}. */
export type GPUConvolutionBloomEncodeOptions = {
  sourceTexture: Texture;
  /** Caller-owned rgba16float output with Texture.STORAGE usage. */
  outputTexture: Texture;
  threshold?: number;
  intensity?: number;
  exposure?: number;
  exposureCompensation?: number;
};

/** Immutable resource and dispatch budget for the premium convolution path. */
export type GPUConvolutionBloomStats = {
  width: number;
  height: number;
  transformWidth: number;
  transformHeight: number;
  elementCount: number;
  complexBufferCount: number;
  complexBufferByteLength: number;
  totalComplexBufferByteLength: number;
  transformDispatchCount: number;
  steadyStateDispatchCount: number;
  kernelInitializationDispatchCount: number;
};

/** Capability result returned before allocating premium convolution resources. */
export type GPUConvolutionBloomSupport = {
  supported: boolean;
  reason?: string;
  stats?: GPUConvolutionBloomStats;
};

/** Parameters for constructing an energy-normalized aperture diffraction kernel. */
export type BloomPointSpreadFunctionOptions = {
  width: number;
  height: number;
  apertureBlades?: number;
  diffractionStrength?: number;
  anamorphicRatio?: number;
};

type GPUConvolutionBloomResources = {
  transform: GPUFFT2D;
  parameters: Buffer;
  kernelSpatial: Buffer;
  kernelSpectrum: Buffer;
  spatialChannels: Buffer[];
  spectralChannels: Buffer[];
  extract: Computation;
  multiply: Computation;
  composite: Computation;
};

/**
 * Computes physically motivated optical convolution using three complex 2D RGB transforms.
 *
 * The caller owns source/output textures and command submission. A custom point-spread function is
 * transformed once, then cached until it changes. Every supplied or generated kernel is normalized
 * before upload so convolution redistributes highlight energy without duplicating it.
 */
export class GPUConvolutionBloom {
  readonly device: Device;
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly stats: GPUConvolutionBloomStats;

  private readonly resources: GPUConvolutionBloomResources;
  private readonly defaults: Required<
    Pick<GPUConvolutionBloomProps, 'threshold' | 'intensity' | 'exposure' | 'exposureCompensation'>
  >;
  private kernelNeedsTransform = true;
  private destroyed = false;

  constructor(device: Device, props: GPUConvolutionBloomProps) {
    const support = getGPUConvolutionBloomSupport(device, props);
    if (!support.supported || !support.stats) {
      throw new Error(support.reason);
    }

    this.device = device;
    this.id = props.id ?? 'gpu-convolution-bloom';
    this.width = props.width;
    this.height = props.height;
    this.stats = support.stats;
    this.defaults = {
      threshold: props.threshold ?? 0.8,
      intensity: props.intensity ?? 1,
      exposure: props.exposure ?? 1,
      exposureCompensation: props.exposureCompensation ?? 0
    };

    const pointSpreadFunction =
      props.pointSpreadFunction ||
      makeBloomPointSpreadFunction({
        width: this.stats.transformWidth,
        height: this.stats.transformHeight,
        apertureBlades: props.apertureBlades,
        diffractionStrength: props.diffractionStrength,
        anamorphicRatio: props.anamorphicRatio
      });
    this.resources = createGPUConvolutionBloomResources(device, {
      id: this.id,
      stats: this.stats,
      pointSpreadFunction
    });
  }

  /** Replaces and normalizes the cached point-spread kernel without reallocating FFT resources. */
  setPointSpreadFunction(pointSpreadFunction: Float32Array): void {
    if (this.destroyed) {
      throw new Error('GPUConvolutionBloom has been destroyed.');
    }
    this.resources.kernelSpatial.write(
      makeComplexPointSpreadFunction(pointSpreadFunction, this.stats.elementCount)
    );
    this.kernelNeedsTransform = true;
  }

  /** Records extraction, RGB frequency multiplication, inverse transforms, and HDR composition. */
  encode(commandEncoder: CommandEncoder, options: GPUConvolutionBloomEncodeOptions): Texture {
    if (this.destroyed) {
      throw new Error('GPUConvolutionBloom has been destroyed.');
    }
    if (commandEncoder.device !== this.device) {
      throw new Error('GPUConvolutionBloom command encoder belongs to a different device.');
    }
    validateGPUConvolutionBloomTextures(this.device, this.stats, options);

    this.resources.parameters.write(
      makeGPUConvolutionBloomParameters(this.stats, {
        threshold: options.threshold ?? this.defaults.threshold,
        intensity: options.intensity ?? this.defaults.intensity,
        exposure: options.exposure ?? this.defaults.exposure,
        exposureCompensation: options.exposureCompensation ?? this.defaults.exposureCompensation
      })
    );

    if (this.kernelNeedsTransform) {
      this.resources.transform.encode(commandEncoder, {
        inputBuffer: this.resources.kernelSpatial,
        outputBuffer: this.resources.kernelSpectrum,
        direction: 'forward'
      });
      this.kernelNeedsTransform = false;
    }

    this.resources.extract.setBindings({
      parameters: this.resources.parameters,
      sourceTexture: options.sourceTexture.view,
      redChannel: this.resources.spatialChannels[0],
      greenChannel: this.resources.spatialChannels[1],
      blueChannel: this.resources.spatialChannels[2]
    });
    dispatchConvolutionComputation(
      commandEncoder,
      this.resources.extract,
      `${this.id}-extract`,
      Math.ceil(this.stats.transformWidth / FFT_BLOOM_WORKGROUP_DIMENSION),
      Math.ceil(this.stats.transformHeight / FFT_BLOOM_WORKGROUP_DIMENSION)
    );

    for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
      this.resources.transform.encode(commandEncoder, {
        inputBuffer: this.resources.spatialChannels[channelIndex],
        outputBuffer: this.resources.spectralChannels[channelIndex],
        direction: 'forward'
      });
    }

    this.resources.multiply.setBindings({
      redSpectrum: this.resources.spectralChannels[0],
      greenSpectrum: this.resources.spectralChannels[1],
      blueSpectrum: this.resources.spectralChannels[2],
      kernelSpectrum: this.resources.kernelSpectrum,
      filteredRed: this.resources.spatialChannels[0],
      filteredGreen: this.resources.spatialChannels[1],
      filteredBlue: this.resources.spatialChannels[2]
    });
    const multiplyWorkgroupCount = Math.ceil(
      this.stats.elementCount / FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE
    );
    dispatchConvolutionComputation(
      commandEncoder,
      this.resources.multiply,
      `${this.id}-multiply`,
      Math.min(multiplyWorkgroupCount, FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW),
      Math.ceil(multiplyWorkgroupCount / FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW)
    );

    for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
      this.resources.transform.encode(commandEncoder, {
        inputBuffer: this.resources.spatialChannels[channelIndex],
        outputBuffer: this.resources.spectralChannels[channelIndex],
        direction: 'inverse'
      });
    }

    this.resources.composite.setBindings({
      parameters: this.resources.parameters,
      sourceTexture: options.sourceTexture.view,
      redChannel: this.resources.spectralChannels[0],
      greenChannel: this.resources.spectralChannels[1],
      blueChannel: this.resources.spectralChannels[2],
      outputTexture: options.outputTexture.view
    });
    dispatchConvolutionComputation(
      commandEncoder,
      this.resources.composite,
      `${this.id}-composite`,
      Math.ceil(this.width / FFT_BLOOM_WORKGROUP_DIMENSION),
      Math.ceil(this.height / FFT_BLOOM_WORKGROUP_DIMENSION)
    );
    return options.outputTexture;
  }

  /** Releases the FFT, cached optical spectrum, compute pipelines, and all owned GPU buffers. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    destroyGPUConvolutionBloomResources(this.resources);
  }
}

/** Reports the exact transform dimensions, steady-state GPU work, and capability failures. */
export function getGPUConvolutionBloomSupport(
  device: Device,
  props: Pick<GPUConvolutionBloomProps, 'width' | 'height' | 'resolutionScale'>
): GPUConvolutionBloomSupport {
  let stats: GPUConvolutionBloomStats;
  try {
    stats = makeGPUConvolutionBloomStats(props);
  } catch (error) {
    return {supported: false, reason: error instanceof Error ? error.message : String(error)};
  }

  const transformSupport = getGPUFFT2DSupport(device, {
    width: stats.transformWidth,
    height: stats.transformHeight
  });
  if (!transformSupport.supported) {
    return {supported: false, reason: transformSupport.reason, stats};
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 7) {
    return {supported: false, reason: 'GPUConvolutionBloom requires seven storage buffers.', stats};
  }
  if (device.limits.maxStorageTexturesPerShaderStage < 1) {
    return {supported: false, reason: 'GPUConvolutionBloom requires one storage texture.', stats};
  }
  const multiplyWorkgroupCount = Math.ceil(stats.elementCount / FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE);
  if (
    Math.min(multiplyWorkgroupCount, FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW) >
      device.limits.maxComputeWorkgroupsPerDimension ||
    Math.ceil(multiplyWorkgroupCount / FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW) >
      device.limits.maxComputeWorkgroupsPerDimension
  ) {
    return {
      supported: false,
      reason: 'GPUConvolutionBloom frequency multiplication exceeds the device dispatch limit.',
      stats
    };
  }
  if (!device.getTextureFormatCapabilities('rgba16float').store) {
    return {
      supported: false,
      reason: 'GPUConvolutionBloom requires rgba16float storage textures.',
      stats
    };
  }
  return {supported: true, stats};
}

/** Computes the bounded power-of-two transform and its exact steady-state dispatch budget. */
export function makeGPUConvolutionBloomStats(
  props: Pick<GPUConvolutionBloomProps, 'width' | 'height' | 'resolutionScale'>
): GPUConvolutionBloomStats {
  if (!Number.isInteger(props.width) || props.width <= 0) {
    throw new Error('GPUConvolutionBloom width must be a positive integer.');
  }
  if (!Number.isInteger(props.height) || props.height <= 0) {
    throw new Error('GPUConvolutionBloom height must be a positive integer.');
  }
  const resolutionScale = props.resolutionScale ?? 0.25;
  if (!Number.isFinite(resolutionScale) || resolutionScale <= 0 || resolutionScale > 1) {
    throw new Error(
      'GPUConvolutionBloom resolutionScale must be greater than zero and at most one.'
    );
  }
  const transformWidth = nextPowerOfTwo(Math.max(Math.ceil(props.width * resolutionScale), 2));
  const transformHeight = nextPowerOfTwo(Math.max(Math.ceil(props.height * resolutionScale), 2));
  const transformStats = makeGPUFFT2DStats(transformWidth, transformHeight);
  const complexBufferCount = 9;

  return Object.freeze({
    width: props.width,
    height: props.height,
    transformWidth,
    transformHeight,
    elementCount: transformStats.elementCount,
    complexBufferCount,
    complexBufferByteLength: transformStats.complexBufferByteLength,
    totalComplexBufferByteLength: transformStats.complexBufferByteLength * complexBufferCount,
    transformDispatchCount: transformStats.dispatchCountPerEncode,
    steadyStateDispatchCount: transformStats.dispatchCountPerEncode * 6 + 3,
    kernelInitializationDispatchCount: transformStats.dispatchCountPerEncode
  });
}

/** Builds a nonnegative, unit-energy aperture point-spread function with diffraction spokes. */
export function makeBloomPointSpreadFunction(
  options: BloomPointSpreadFunctionOptions
): Float32Array {
  if (!Number.isInteger(options.width) || options.width <= 0) {
    throw new Error('Point-spread width must be a positive integer.');
  }
  if (!Number.isInteger(options.height) || options.height <= 0) {
    throw new Error('Point-spread height must be a positive integer.');
  }

  const apertureBlades = Math.min(Math.max(Math.round(options.apertureBlades ?? 6), 3), 12);
  const diffractionStrength = Math.max(options.diffractionStrength ?? 0.18, 0);
  const anamorphicRatio = Math.min(Math.max(options.anamorphicRatio ?? 0, -1), 1);
  const horizontalStretch = 1 + Math.max(anamorphicRatio, 0) * 2;
  const verticalStretch = 1 + Math.max(-anamorphicRatio, 0) * 2;
  const kernel = new Float32Array(options.width * options.height);
  let totalEnergy = 0;

  for (let pixelY = 0; pixelY < options.height; pixelY++) {
    const signedY = pixelY <= options.height / 2 ? pixelY : pixelY - options.height;
    for (let pixelX = 0; pixelX < options.width; pixelX++) {
      const signedX = pixelX <= options.width / 2 ? pixelX : pixelX - options.width;
      const normalizedX = signedX / horizontalStretch;
      const normalizedY = signedY / verticalStretch;
      const distance = Math.hypot(normalizedX, normalizedY);
      const radialPhase = distance * 0.95;
      const airyLobe = radialPhase < 0.00001 ? 1 : (Math.sin(radialPhase) / radialPhase) ** 2;
      const diffractionAngle = Math.atan2(normalizedY, normalizedX);
      const spoke = Math.abs(Math.cos(diffractionAngle * apertureBlades * 0.5)) ** 32;
      const diffraction = spoke / (1 + distance * distance * 0.065);
      const value = airyLobe + diffraction * diffractionStrength;
      kernel[pixelY * options.width + pixelX] = value;
      totalEnergy += value;
    }
  }

  for (let pixelIndex = 0; pixelIndex < kernel.length; pixelIndex++) {
    kernel[pixelIndex] /= totalEnergy;
  }
  return kernel;
}

function createGPUConvolutionBloomResources(
  device: Device,
  options: {id: string; stats: GPUConvolutionBloomStats; pointSpreadFunction: Float32Array}
): GPUConvolutionBloomResources {
  let transform: GPUFFT2D | undefined;
  const buffers: Buffer[] = [];
  const computations: Computation[] = [];
  const makeStorageBuffer = (name: string, data?: Float32Array): Buffer => {
    const buffer = device.createBuffer({
      id: `${options.id}-${name}`,
      ...(data ? {data} : {byteLength: options.stats.complexBufferByteLength}),
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    });
    buffers.push(buffer);
    return buffer;
  };

  try {
    transform = new GPUFFT2D(device, {
      id: `${options.id}-fft`,
      width: options.stats.transformWidth,
      height: options.stats.transformHeight
    });
    const parameters = device.createBuffer({
      id: `${options.id}-parameters`,
      byteLength: FFT_BLOOM_PARAMETER_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    buffers.push(parameters);
    const kernelSpatial = makeStorageBuffer(
      'kernel-spatial',
      makeComplexPointSpreadFunction(options.pointSpreadFunction, options.stats.elementCount)
    );
    const kernelSpectrum = makeStorageBuffer('kernel-spectrum');
    const spatialChannels = ['red', 'green', 'blue'].map(channel =>
      makeStorageBuffer(`${channel}-spatial`)
    );
    const spectralChannels = ['red', 'green', 'blue'].map(channel =>
      makeStorageBuffer(`${channel}-spectrum`)
    );
    const extract = makeConvolutionComputation(
      device,
      `${options.id}-extract`,
      FFT_BLOOM_EXTRACT_SHADER,
      [
        {name: 'parameters', type: 'uniform', group: 0, location: 0},
        {
          name: 'sourceTexture',
          type: 'texture',
          group: 0,
          location: 1,
          sampleType: 'unfilterable-float'
        },
        {name: 'redChannel', type: 'storage', group: 0, location: 2},
        {name: 'greenChannel', type: 'storage', group: 0, location: 3},
        {name: 'blueChannel', type: 'storage', group: 0, location: 4}
      ]
    );
    computations.push(extract);
    const multiply = makeConvolutionComputation(
      device,
      `${options.id}-multiply`,
      FFT_BLOOM_MULTIPLY_SHADER,
      [
        {name: 'redSpectrum', type: 'read-only-storage', group: 0, location: 0},
        {name: 'greenSpectrum', type: 'read-only-storage', group: 0, location: 1},
        {name: 'blueSpectrum', type: 'read-only-storage', group: 0, location: 2},
        {name: 'kernelSpectrum', type: 'read-only-storage', group: 0, location: 3},
        {name: 'filteredRed', type: 'storage', group: 0, location: 4},
        {name: 'filteredGreen', type: 'storage', group: 0, location: 5},
        {name: 'filteredBlue', type: 'storage', group: 0, location: 6}
      ]
    );
    computations.push(multiply);
    const composite = makeConvolutionComputation(
      device,
      `${options.id}-composite`,
      FFT_BLOOM_COMPOSITE_SHADER,
      [
        {name: 'parameters', type: 'uniform', group: 0, location: 0},
        {
          name: 'sourceTexture',
          type: 'texture',
          group: 0,
          location: 1,
          sampleType: 'unfilterable-float'
        },
        {name: 'redChannel', type: 'read-only-storage', group: 0, location: 2},
        {name: 'greenChannel', type: 'read-only-storage', group: 0, location: 3},
        {name: 'blueChannel', type: 'read-only-storage', group: 0, location: 4},
        {
          name: 'outputTexture',
          type: 'storage',
          group: 0,
          location: 5,
          access: 'write-only',
          format: 'rgba16float'
        }
      ]
    );
    computations.push(composite);

    return {
      transform,
      parameters,
      kernelSpatial,
      kernelSpectrum,
      spatialChannels,
      spectralChannels,
      extract,
      multiply,
      composite
    };
  } catch (error) {
    for (const computation of computations) {
      computation.destroy();
    }
    for (const buffer of buffers) {
      buffer.destroy();
    }
    transform?.destroy();
    throw error;
  }
}

function makeConvolutionComputation(
  device: Device,
  id: string,
  source: string,
  bindings: BindingDeclaration[]
): Computation {
  return new Computation(device, {id, source, shaderLayout: {bindings}});
}

function dispatchConvolutionComputation(
  commandEncoder: CommandEncoder,
  computation: Computation,
  id: string,
  workgroupCountX: number,
  workgroupCountY: number
): void {
  computation.predraw(commandEncoder);
  const computePass = commandEncoder.beginComputePass({id});
  computation.dispatch(computePass, workgroupCountX, workgroupCountY, 1);
  computePass.end();
}

function makeComplexPointSpreadFunction(kernel: Float32Array, elementCount: number): Float32Array {
  if (kernel.length !== elementCount) {
    throw new Error('Point-spread function must match the transform dimensions.');
  }

  let energy = 0;
  for (const value of kernel) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Point-spread samples must be finite and nonnegative.');
    }
    energy += value;
  }
  if (energy <= 0) {
    throw new Error('Point-spread function must contain positive energy.');
  }

  const complexKernel = new Float32Array(elementCount * 2);
  for (let index = 0; index < elementCount; index++) {
    complexKernel[index * 2] = kernel[index] / energy;
  }
  return complexKernel;
}

function makeGPUConvolutionBloomParameters(
  stats: GPUConvolutionBloomStats,
  options: {threshold: number; intensity: number; exposure: number; exposureCompensation: number}
): ArrayBuffer {
  const buffer = new ArrayBuffer(FFT_BLOOM_PARAMETER_BYTE_LENGTH);
  const view = new DataView(buffer);
  view.setUint32(0, stats.width, true);
  view.setUint32(4, stats.height, true);
  view.setUint32(8, stats.transformWidth, true);
  view.setUint32(12, stats.transformHeight, true);
  view.setFloat32(16, options.threshold, true);
  view.setFloat32(20, options.intensity, true);
  view.setFloat32(24, options.exposure, true);
  view.setFloat32(28, options.exposureCompensation, true);
  return buffer;
}

function validateGPUConvolutionBloomTextures(
  device: Device,
  stats: GPUConvolutionBloomStats,
  options: GPUConvolutionBloomEncodeOptions
): void {
  if (options.sourceTexture.device !== device || options.outputTexture.device !== device) {
    throw new Error('GPUConvolutionBloom textures must belong to the same device.');
  }
  if (
    options.sourceTexture.width !== stats.width ||
    options.sourceTexture.height !== stats.height ||
    options.outputTexture.width !== stats.width ||
    options.outputTexture.height !== stats.height
  ) {
    throw new Error('GPUConvolutionBloom textures must match the configured source dimensions.');
  }
  if (options.outputTexture.format !== 'rgba16float') {
    throw new Error('GPUConvolutionBloom output must use rgba16float.');
  }
  if (((options.outputTexture.props.usage || 0) & Texture.STORAGE) === 0) {
    throw new Error('GPUConvolutionBloom output requires Texture.STORAGE usage.');
  }
  if (
    options.sourceTexture === options.outputTexture ||
    options.sourceTexture.handle === options.outputTexture.handle
  ) {
    throw new Error('GPUConvolutionBloom source and output textures must be separate.');
  }
}

function destroyGPUConvolutionBloomResources(resources: GPUConvolutionBloomResources): void {
  resources.extract.destroy();
  resources.multiply.destroy();
  resources.composite.destroy();
  resources.transform.destroy();
  resources.parameters.destroy();
  resources.kernelSpatial.destroy();
  resources.kernelSpectrum.destroy();
  for (const buffer of [...resources.spatialChannels, ...resources.spectralChannels]) {
    buffer.destroy();
  }
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(value));
}
