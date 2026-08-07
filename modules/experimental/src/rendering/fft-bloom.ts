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
  FFT_BLOOM_WORKGROUP_DIMENSION,
  makeFFTBloomCompositeShader
} from './fft-bloom-shaders';

/** Optional lens reflections and dirt composited without another FFT or render pass. */
export type GPUConvolutionBloomLensOptions = {
  ghostIntensity?: number;
  ghostCount?: number;
  ghostSpacing?: number;
  haloIntensity?: number;
  haloRadius?: number;
  chromaticAberration?: number;
  dirtIntensity?: number;
};

/** Independent wavelength responses for measured or generated RGB diffraction. */
export type BloomSpectralPointSpreadFunction = {
  red: Float32Array;
  green: Float32Array;
  blue: Float32Array;
};

/** One shared optical response or separate measured responses per wavelength. */
export type BloomPointSpreadFunction = Float32Array | BloomSpectralPointSpreadFunction;

/** Construction options for frequency-domain photographic bloom. */
export type GPUConvolutionBloomProps = {
  id?: string;
  width: number;
  height: number;
  /** Fractional source resolution before rounding up to power-of-two FFT dimensions. */
  resolutionScale?: number;
  /** Zero-padded border around the sampled image, expressed as a fraction of its dimensions. */
  guardBand?: number;
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
  /** Wavelength-dependent aperture spread. Zero keeps all three diffraction kernels identical. */
  spectralSpread?: number;
  /** Blend all scene light through the normalized optical kernel instead of adding highlights. */
  energyConserving?: boolean;
  /** Optional neighborhood-clamped optical history accumulated during the existing composite. */
  temporalStability?: number;
  /** Chromatic ghosts, radial halo, and sampled dirt resolved during the existing composite. */
  lens?: GPUConvolutionBloomLensOptions;
  /** Shared or wavelength-specific point-spread kernels containing one scalar per FFT pixel. */
  pointSpreadFunction?: BloomPointSpreadFunction;
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
  /** Previous camera exposure used to correct persistent history between frames. */
  previousExposure?: number;
  /** Optional GPU-adapted 1x1 exposure state; no CPU luminance readback is required. */
  exposureTexture?: Texture;
  /** Optional sampled dirt texture used when lens.dirtIntensity is positive. */
  lensDirtTexture?: Texture;
};

/** Immutable resource and dispatch budget for the premium convolution path. */
export type GPUConvolutionBloomStats = {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  contentOffsetX: number;
  contentOffsetY: number;
  guardBand: number;
  transformWidth: number;
  transformHeight: number;
  elementCount: number;
  complexBufferCount: number;
  complexBufferByteLength: number;
  totalComplexBufferByteLength: number;
  batchCount: number;
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
  /** Wavelength in nanometers used to widen or contract the diffraction profile. */
  wavelength?: number;
  /** Interpolates between a common green response and independent red/green/blue wavelengths. */
  spectralSpread?: number;
};

type GPUConvolutionBloomResources = {
  transform: GPUFFT2D;
  parameters: Buffer;
  kernelSpectrum: Buffer;
  spatialChannels: Buffer;
  spectralChannels: Buffer;
  historyTextures?: [Texture, Texture];
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
  private readonly energyConserving: boolean;
  private readonly temporalStability: number;
  private readonly lens: Required<GPUConvolutionBloomLensOptions>;
  private kernelNeedsTransform = true;
  private historyValid = false;
  private historyIndex = 0;
  private previousExposure?: number;
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
    this.energyConserving = props.energyConserving ?? false;
    this.temporalStability = Math.min(Math.max(props.temporalStability ?? 0, 0), 0.95);
    this.lens = {
      ghostIntensity: Math.max(props.lens?.ghostIntensity ?? 0, 0),
      ghostCount: Math.min(Math.max(Math.round(props.lens?.ghostCount ?? 3), 1), 6),
      ghostSpacing: Math.min(Math.max(props.lens?.ghostSpacing ?? 0.32, 0), 1),
      haloIntensity: Math.max(props.lens?.haloIntensity ?? 0, 0),
      haloRadius: Math.min(Math.max(props.lens?.haloRadius ?? 0.34, 0), 1),
      chromaticAberration: Math.min(Math.max(props.lens?.chromaticAberration ?? 0, 0), 1),
      dirtIntensity: Math.max(props.lens?.dirtIntensity ?? 0, 0)
    };

    const pointSpreadFunction =
      props.pointSpreadFunction ||
      makeBloomSpectralPointSpreadFunction({
        width: this.stats.transformWidth,
        height: this.stats.transformHeight,
        apertureBlades: props.apertureBlades,
        diffractionStrength: props.diffractionStrength,
        anamorphicRatio: props.anamorphicRatio,
        spectralSpread: props.spectralSpread
      });
    this.resources = createGPUConvolutionBloomResources(device, {
      id: this.id,
      stats: this.stats,
      pointSpreadFunction,
      temporalStability: this.temporalStability > 0
    });
  }

  /** Replaces and normalizes the cached point-spread kernel without reallocating FFT resources. */
  setPointSpreadFunction(pointSpreadFunction: BloomPointSpreadFunction): void {
    if (this.destroyed) {
      throw new Error('GPUConvolutionBloom has been destroyed.');
    }
    this.resources.spatialChannels.write(
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

    const exposure = Math.max(options.exposure ?? this.defaults.exposure, 0.0001);
    const previousExposure = Math.max(
      options.previousExposure ?? this.previousExposure ?? exposure,
      0.0001
    );
    this.resources.parameters.write(
      makeGPUConvolutionBloomParameters(this.stats, {
        threshold: options.threshold ?? this.defaults.threshold,
        intensity: options.intensity ?? this.defaults.intensity,
        exposure,
        exposureCompensation: options.exposureCompensation ?? this.defaults.exposureCompensation,
        energyConserving: this.energyConserving,
        useExposureTexture: Boolean(options.exposureTexture),
        temporalStability: this.temporalStability,
        exposureScale: exposure / previousExposure,
        lens: this.lens,
        historyValid: this.historyValid
      })
    );

    if (this.kernelNeedsTransform) {
      this.resources.transform.encode(commandEncoder, {
        inputBuffer: this.resources.spatialChannels,
        outputBuffer: this.resources.kernelSpectrum,
        direction: 'forward'
      });
      this.kernelNeedsTransform = false;
    }

    this.resources.extract.setBindings({
      parameters: this.resources.parameters,
      sourceTexture: options.sourceTexture.view,
      exposureTexture: (options.exposureTexture || options.sourceTexture).view,
      spatialChannels: this.resources.spatialChannels
    });
    dispatchConvolutionComputation(
      commandEncoder,
      this.resources.extract,
      `${this.id}-extract`,
      Math.ceil(this.stats.transformWidth / FFT_BLOOM_WORKGROUP_DIMENSION),
      Math.ceil(this.stats.transformHeight / FFT_BLOOM_WORKGROUP_DIMENSION)
    );

    this.resources.transform.encode(commandEncoder, {
      inputBuffer: this.resources.spatialChannels,
      outputBuffer: this.resources.spectralChannels,
      direction: 'forward'
    });

    this.resources.multiply.setBindings({
      sourceSpectrum: this.resources.spectralChannels,
      kernelSpectrum: this.resources.kernelSpectrum,
      filteredChannels: this.resources.spatialChannels
    });
    const multiplyWorkgroupCount = Math.ceil(
      (this.stats.elementCount * this.stats.batchCount) / FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE
    );
    dispatchConvolutionComputation(
      commandEncoder,
      this.resources.multiply,
      `${this.id}-multiply`,
      Math.min(multiplyWorkgroupCount, FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW),
      Math.ceil(multiplyWorkgroupCount / FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW)
    );

    this.resources.transform.encode(commandEncoder, {
      inputBuffer: this.resources.spatialChannels,
      outputBuffer: this.resources.spectralChannels,
      direction: 'inverse'
    });

    const compositeBindings: Record<string, Buffer | Texture['view']> = {
      parameters: this.resources.parameters,
      sourceTexture: options.sourceTexture.view,
      convolvedChannels: this.resources.spectralChannels,
      outputTexture: options.outputTexture.view,
      lensDirtTexture: (options.lensDirtTexture || options.sourceTexture).view,
      exposureTexture: (options.exposureTexture || options.sourceTexture).view
    };
    if (this.resources.historyTextures) {
      compositeBindings['historyTexture'] = this.resources.historyTextures[this.historyIndex].view;
      compositeBindings['historyOutput'] =
        this.resources.historyTextures[1 - this.historyIndex].view;
    }
    this.resources.composite.setBindings(compositeBindings);
    dispatchConvolutionComputation(
      commandEncoder,
      this.resources.composite,
      `${this.id}-composite`,
      Math.ceil(this.width / FFT_BLOOM_WORKGROUP_DIMENSION),
      Math.ceil(this.height / FFT_BLOOM_WORKGROUP_DIMENSION)
    );
    if (this.resources.historyTextures) {
      this.historyIndex = 1 - this.historyIndex;
      this.historyValid = true;
    }
    this.previousExposure = exposure;
    return options.outputTexture;
  }

  /** Drops optical history without reallocating cached FFT buffers or lens resources. */
  resetHistory(): void {
    this.historyValid = false;
    this.previousExposure = undefined;
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
  props: Pick<
    GPUConvolutionBloomProps,
    'width' | 'height' | 'resolutionScale' | 'guardBand' | 'temporalStability'
  >
): GPUConvolutionBloomSupport {
  let stats: GPUConvolutionBloomStats;
  try {
    stats = makeGPUConvolutionBloomStats(props);
  } catch (error) {
    return {supported: false, reason: error instanceof Error ? error.message : String(error)};
  }

  const transformSupport = getGPUFFT2DSupport(device, {
    width: stats.transformWidth,
    height: stats.transformHeight,
    batchCount: stats.batchCount
  });
  if (!transformSupport.supported) {
    return {supported: false, reason: transformSupport.reason, stats};
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 3) {
    return {supported: false, reason: 'GPUConvolutionBloom requires three storage buffers.', stats};
  }
  const requiredStorageTextures = (props.temporalStability ?? 0) > 0 ? 2 : 1;
  if (device.limits.maxStorageTexturesPerShaderStage < requiredStorageTextures) {
    return {
      supported: false,
      reason: `GPUConvolutionBloom requires ${requiredStorageTextures} storage textures.`,
      stats
    };
  }
  const multiplyWorkgroupCount = Math.ceil(
    (stats.elementCount * stats.batchCount) / FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE
  );
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
  props: Pick<GPUConvolutionBloomProps, 'width' | 'height' | 'resolutionScale' | 'guardBand'>
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
  const guardBand = props.guardBand ?? 0.125;
  if (!Number.isFinite(guardBand) || guardBand < 0 || guardBand > 1) {
    throw new Error('GPUConvolutionBloom guardBand must be between zero and one.');
  }
  const contentWidth = Math.max(Math.ceil(props.width * resolutionScale), 1);
  const contentHeight = Math.max(Math.ceil(props.height * resolutionScale), 1);
  const transformWidth = nextPowerOfTwo(
    Math.max(contentWidth + Math.ceil(contentWidth * guardBand) * 2, 2)
  );
  const transformHeight = nextPowerOfTwo(
    Math.max(contentHeight + Math.ceil(contentHeight * guardBand) * 2, 2)
  );
  const batchCount = 3;
  const transformStats = makeGPUFFT2DStats(transformWidth, transformHeight, batchCount);
  const complexBufferCount = 4;

  return Object.freeze({
    width: props.width,
    height: props.height,
    contentWidth,
    contentHeight,
    contentOffsetX: Math.floor((transformWidth - contentWidth) / 2),
    contentOffsetY: Math.floor((transformHeight - contentHeight) / 2),
    guardBand,
    transformWidth,
    transformHeight,
    elementCount: transformStats.elementCount,
    complexBufferCount,
    complexBufferByteLength: transformStats.complexBufferByteLength,
    totalComplexBufferByteLength: transformStats.complexBufferByteLength * complexBufferCount,
    batchCount,
    transformDispatchCount: transformStats.dispatchCountPerEncode,
    steadyStateDispatchCount: transformStats.dispatchCountPerEncode * 2 + 3,
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
  const wavelength = Math.min(Math.max(options.wavelength ?? 550, 380), 780);
  const wavelengthScale = wavelength / 550;
  const kernel = new Float32Array(options.width * options.height);
  let totalEnergy = 0;

  for (let pixelY = 0; pixelY < options.height; pixelY++) {
    const signedY = pixelY <= options.height / 2 ? pixelY : pixelY - options.height;
    for (let pixelX = 0; pixelX < options.width; pixelX++) {
      const signedX = pixelX <= options.width / 2 ? pixelX : pixelX - options.width;
      const normalizedX = signedX / horizontalStretch;
      const normalizedY = signedY / verticalStretch;
      const distance = Math.hypot(normalizedX, normalizedY);
      const radialPhase = (distance * 0.95) / wavelengthScale;
      const airyLobe = radialPhase < 0.00001 ? 1 : (Math.sin(radialPhase) / radialPhase) ** 2;
      const diffractionAngle = Math.atan2(normalizedY, normalizedX);
      const spoke = Math.abs(Math.cos(diffractionAngle * apertureBlades * 0.5)) ** 32;
      const diffraction = spoke / (1 + (distance * distance * 0.065) / wavelengthScale);
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

/** Generates separately normalized red, green, and blue wavelength-dependent optical kernels. */
export function makeBloomSpectralPointSpreadFunction(
  options: BloomPointSpreadFunctionOptions
): BloomSpectralPointSpreadFunction {
  const spectralSpread = Math.min(Math.max(options.spectralSpread ?? 0, 0), 1);
  return {
    red: makeBloomPointSpreadFunction({
      ...options,
      wavelength: 550 + (650 - 550) * spectralSpread
    }),
    green: makeBloomPointSpreadFunction({...options, wavelength: 550}),
    blue: makeBloomPointSpreadFunction({
      ...options,
      wavelength: 550 + (460 - 550) * spectralSpread
    })
  };
}

function createGPUConvolutionBloomResources(
  device: Device,
  options: {
    id: string;
    stats: GPUConvolutionBloomStats;
    pointSpreadFunction: BloomPointSpreadFunction;
    temporalStability: boolean;
  }
): GPUConvolutionBloomResources {
  let transform: GPUFFT2D | undefined;
  const buffers: Buffer[] = [];
  const computations: Computation[] = [];
  const textures: Texture[] = [];
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
      height: options.stats.transformHeight,
      batchCount: options.stats.batchCount
    });
    const parameters = device.createBuffer({
      id: `${options.id}-parameters`,
      byteLength: FFT_BLOOM_PARAMETER_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    buffers.push(parameters);
    const kernelSpectrum = makeStorageBuffer('kernel-spectrum');
    const spatialChannels = makeStorageBuffer(
      'rgb-spatial',
      makeComplexPointSpreadFunction(options.pointSpreadFunction, options.stats.elementCount)
    );
    const spectralChannels = makeStorageBuffer('rgb-spectrum');
    const historyTextures = options.temporalStability
      ? ([0, 1].map(historyIndex => {
          const texture = device.createTexture({
            id: `${options.id}-history-${historyIndex}`,
            width: options.stats.width,
            height: options.stats.height,
            format: 'rgba16float',
            usage: Texture.SAMPLE | Texture.STORAGE
          });
          textures.push(texture);
          return texture;
        }) as [Texture, Texture])
      : undefined;
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
        {
          name: 'exposureTexture',
          type: 'texture',
          group: 0,
          location: 2,
          sampleType: 'unfilterable-float'
        },
        {name: 'spatialChannels', type: 'storage', group: 0, location: 3}
      ]
    );
    computations.push(extract);
    const multiply = makeConvolutionComputation(
      device,
      `${options.id}-multiply`,
      FFT_BLOOM_MULTIPLY_SHADER,
      [
        {name: 'sourceSpectrum', type: 'read-only-storage', group: 0, location: 0},
        {name: 'kernelSpectrum', type: 'read-only-storage', group: 0, location: 1},
        {name: 'filteredChannels', type: 'storage', group: 0, location: 2}
      ]
    );
    computations.push(multiply);
    const composite = makeConvolutionComputation(
      device,
      `${options.id}-composite`,
      options.temporalStability ? makeFFTBloomCompositeShader(true) : FFT_BLOOM_COMPOSITE_SHADER,
      [
        {name: 'parameters', type: 'uniform', group: 0, location: 0},
        {
          name: 'sourceTexture',
          type: 'texture',
          group: 0,
          location: 1,
          sampleType: 'unfilterable-float'
        },
        {name: 'convolvedChannels', type: 'read-only-storage', group: 0, location: 2},
        {
          name: 'outputTexture',
          type: 'storage',
          group: 0,
          location: 3,
          access: 'write-only',
          format: 'rgba16float'
        },
        {
          name: 'lensDirtTexture',
          type: 'texture',
          group: 0,
          location: 4,
          sampleType: 'unfilterable-float'
        },
        {
          name: 'exposureTexture',
          type: 'texture',
          group: 0,
          location: 5,
          sampleType: 'unfilterable-float'
        },
        ...(options.temporalStability
          ? ([
              {
                name: 'historyTexture',
                type: 'texture',
                group: 0,
                location: 6,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'historyOutput',
                type: 'storage',
                group: 0,
                location: 7,
                access: 'write-only',
                format: 'rgba16float'
              }
            ] satisfies BindingDeclaration[])
          : [])
      ]
    );
    computations.push(composite);

    return {
      transform,
      parameters,
      kernelSpectrum,
      spatialChannels,
      spectralChannels,
      historyTextures,
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
    for (const texture of textures) {
      texture.destroy();
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

function makeComplexPointSpreadFunction(
  pointSpreadFunction: BloomPointSpreadFunction,
  elementCount: number
): Float32Array {
  const kernels =
    pointSpreadFunction instanceof Float32Array
      ? [pointSpreadFunction, pointSpreadFunction, pointSpreadFunction]
      : [pointSpreadFunction.red, pointSpreadFunction.green, pointSpreadFunction.blue];
  const complexKernel = new Float32Array(elementCount * 3 * 2);

  for (const [channelIndex, kernel] of kernels.entries()) {
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
    const channelOffset = channelIndex * elementCount * 2;
    for (let index = 0; index < elementCount; index++) {
      complexKernel[channelOffset + index * 2] = kernel[index] / energy;
    }
  }

  return complexKernel;
}

function makeGPUConvolutionBloomParameters(
  stats: GPUConvolutionBloomStats,
  options: {
    threshold: number;
    intensity: number;
    exposure: number;
    exposureCompensation: number;
    energyConserving: boolean;
    useExposureTexture: boolean;
    temporalStability: number;
    exposureScale: number;
    lens: Required<GPUConvolutionBloomLensOptions>;
    historyValid: boolean;
  }
): ArrayBuffer {
  const buffer = new ArrayBuffer(FFT_BLOOM_PARAMETER_BYTE_LENGTH);
  const view = new DataView(buffer);
  view.setUint32(0, stats.width, true);
  view.setUint32(4, stats.height, true);
  view.setUint32(8, stats.contentWidth, true);
  view.setUint32(12, stats.contentHeight, true);
  view.setUint32(16, stats.transformWidth, true);
  view.setUint32(20, stats.transformHeight, true);
  view.setUint32(24, stats.contentOffsetX, true);
  view.setUint32(28, stats.contentOffsetY, true);
  view.setFloat32(32, options.threshold, true);
  view.setFloat32(36, options.intensity, true);
  view.setFloat32(40, options.exposure, true);
  view.setFloat32(44, options.exposureCompensation, true);
  view.setFloat32(48, Number(options.energyConserving), true);
  view.setFloat32(52, Number(options.useExposureTexture), true);
  view.setFloat32(56, options.temporalStability, true);
  view.setFloat32(60, options.exposureScale, true);
  view.setFloat32(64, options.lens.ghostIntensity, true);
  view.setFloat32(68, options.lens.ghostSpacing, true);
  view.setFloat32(72, options.lens.haloIntensity, true);
  view.setFloat32(76, options.lens.haloRadius, true);
  view.setFloat32(80, options.lens.chromaticAberration, true);
  view.setFloat32(84, options.lens.dirtIntensity, true);
  view.setFloat32(88, options.lens.ghostCount, true);
  view.setFloat32(92, Number(options.historyValid), true);
  return buffer;
}

function validateGPUConvolutionBloomTextures(
  device: Device,
  stats: GPUConvolutionBloomStats,
  options: GPUConvolutionBloomEncodeOptions
): void {
  if (
    options.sourceTexture.device !== device ||
    options.outputTexture.device !== device ||
    (options.exposureTexture && options.exposureTexture.device !== device) ||
    (options.lensDirtTexture && options.lensDirtTexture.device !== device)
  ) {
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
  for (const auxiliaryTexture of [options.exposureTexture, options.lensDirtTexture]) {
    if (
      auxiliaryTexture &&
      (auxiliaryTexture === options.outputTexture ||
        auxiliaryTexture.handle === options.outputTexture.handle)
    ) {
      throw new Error('GPUConvolutionBloom auxiliary and output textures must be separate.');
    }
  }
}

function destroyGPUConvolutionBloomResources(resources: GPUConvolutionBloomResources): void {
  resources.extract.destroy();
  resources.multiply.destroy();
  resources.composite.destroy();
  resources.transform.destroy();
  resources.parameters.destroy();
  resources.kernelSpectrum.destroy();
  resources.spatialChannels.destroy();
  resources.spectralChannels.destroy();
  for (const texture of resources.historyTextures || []) {
    texture.destroy();
  }
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(value));
}
