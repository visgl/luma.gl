// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  getGPUFFT2DSupport,
  GPUFFT2D,
  type GPUFFT2DStats,
  makeGPUFFT2DStats
} from '../gpu-primitives/gpu-fft2d';
import {makeSpectralOceanInitialSpectrum} from './spectral-ocean-initial-spectrum';
import {
  SPECTRAL_OCEAN_ASSEMBLY_SHADER,
  SPECTRAL_OCEAN_EVOLUTION_SHADER,
  SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH,
  SPECTRAL_OCEAN_WORKGROUP_DIMENSION
} from './spectral-ocean-simulation-shaders';

/** Smallest supported square ocean field. */
export const SPECTRAL_OCEAN_MIN_RESOLUTION = 8;
/** Largest supported square ocean field. The bound caps owned storage near 96 MiB. */
export const SPECTRAL_OCEAN_MAX_RESOLUTION = 1024;

const DEFAULT_PATCH_SIZE = 256;
const DEFAULT_WIND_DIRECTION = Object.freeze([1, 0]) as readonly [number, number];
const DEFAULT_WIND_SPEED = 18;
const DEFAULT_AMPLITUDE = 0.0005;
const DEFAULT_CHOPPINESS = 1.3;
const DEFAULT_GRAVITY = 9.81;
const DEFAULT_SEED = 1;
const DEFAULT_FOAM_DECAY = 0.65;
const DEFAULT_FOAM_THRESHOLD = 0.82;
const DEFAULT_FOAM_GAIN = 2.4;
const DEFAULT_DELTA_TIME = 1 / 60;

/** Construction options for {@link SpectralOceanSimulation}. */
export type SpectralOceanSimulationProps = {
  /** Prefix used for every owned GPU resource label. */
  id?: string;
  /** Square power-of-two sample count from 8 through 1024. */
  resolution: number;
  /** Periodic world-space patch width and depth. Defaults to 256. */
  patchSize?: number;
  /** Horizontal wind direction in X/Z. It is normalized during construction. */
  windDirection?: readonly [number, number];
  /** Wind speed in world-space units per second. Defaults to 18. */
  windSpeed?: number;
  /** Phillips-spectrum energy scale. Defaults to 0.0005. */
  amplitude?: number;
  /** Horizontal displacement multiplier. Defaults to 1.3. */
  choppiness?: number;
  /** Gravitational acceleration. Defaults to 9.81. */
  gravity?: number;
  /** Deterministic unsigned 32-bit initial-spectrum seed. Defaults to 1. */
  seed?: number;
  /** Exponential whitecap-history decay per second. Defaults to 0.65. */
  foamDecay?: number;
  /** Horizontal-displacement Jacobian below which whitecaps form. Defaults to 0.82. */
  foamThreshold?: number;
  /** Compression-to-whitecap response multiplier. Defaults to 2.4. */
  foamGain?: number;
};

/** Per-step inputs recorded by {@link SpectralOceanSimulation.encode}. */
export type SpectralOceanSimulationEncodeOptions = {
  /** Absolute simulation time in seconds. */
  time: number;
  /** Elapsed history time in seconds. Defaults to 1/60 and only affects foam decay. */
  deltaTime?: number;
  /** Discards retained foam before evaluating current compression. Defaults to false. */
  resetFoamHistory?: boolean;
};

/** Immutable references to GPU buffers ready for storage or vertex-stage rendering. */
export type SpectralOceanSimulationOutputs = {
  /** `resolution * resolution` row-major `vec4<f32>` records containing `(dx, height, dz, 0)`. */
  readonly displacementBuffer: Buffer;
  /** Row-major `vec4<f32>` records containing unit `(nx, ny, nz)` and bounded foam intensity. */
  readonly normalFoamBuffer: Buffer;
  readonly resolution: number;
  readonly vertexCount: number;
  /** Byte stride of both output record formats. */
  readonly byteStride: 16;
};

/** Immutable allocation and dispatch plan for one ocean instance. */
export type SpectralOceanSimulationStats = {
  resolution: number;
  elementCount: number;
  patchSize: number;
  cellSize: number;
  complexBufferByteLength: number;
  outputBufferByteLength: number;
  simulationStorageBufferCount: number;
  simulationUniformBufferCount: number;
  simulationBufferByteLength: number;
  workgroupSize: readonly [number, number, number];
  workgroupCount: readonly [number, number, number];
  evolutionDispatchCount: number;
  inverseFFTDispatchCount: number;
  assemblyDispatchCount: number;
  dispatchCountPerEncode: number;
  fft: GPUFFT2DStats;
};

/** Result returned by {@link getSpectralOceanSimulationSupport}. */
export type SpectralOceanSimulationSupport = {
  supported: boolean;
  reason?: string;
  /** Available whenever the physical configuration and resolution are valid. */
  stats?: SpectralOceanSimulationStats;
};

type ResolvedSpectralOceanSimulationProps = {
  id: string;
  resolution: number;
  patchSize: number;
  windDirection: readonly [number, number];
  windSpeed: number;
  amplitude: number;
  choppiness: number;
  gravity: number;
  seed: number;
  foamDecay: number;
  foamThreshold: number;
  foamGain: number;
};

type SpectralOceanSimulationResources = {
  initialSpectrumBuffer: Buffer;
  heightSpectrumBuffer: Buffer;
  displacementXSpectrumBuffer: Buffer;
  displacementZSpectrumBuffer: Buffer;
  heightFieldBuffer: Buffer;
  displacementXFieldBuffer: Buffer;
  displacementZFieldBuffer: Buffer;
  displacementBuffer: Buffer;
  normalFoamBuffer: Buffer;
  uniformBuffer: Buffer;
  evolutionComputation: Computation;
  assemblyComputation: Computation;
  fft: GPUFFT2D;
};

/**
 * GPU-resident Tessendorf-style periodic ocean field built on {@link GPUFFT2D}.
 *
 * Construction uploads a deterministic Phillips spectrum. Each `encode()` records time evolution,
 * three ordered inverse transforms, and surface assembly onto the caller's command encoder. The
 * simulation never submits work or maps its outputs to the CPU.
 */
export class SpectralOceanSimulation {
  readonly device: Device;
  readonly id: string;
  readonly resolution: number;
  readonly patchSize: number;
  readonly windDirection: readonly [number, number];
  readonly windSpeed: number;
  readonly amplitude: number;
  readonly choppiness: number;
  readonly gravity: number;
  readonly seed: number;
  readonly foamDecay: number;
  readonly foamThreshold: number;
  readonly foamGain: number;
  readonly stats: SpectralOceanSimulationStats;
  readonly outputs: SpectralOceanSimulationOutputs;

  private readonly resources: SpectralOceanSimulationResources;
  private destroyed = false;

  constructor(device: Device, props: SpectralOceanSimulationProps) {
    const resolvedProps = resolveSpectralOceanSimulationProps(props);
    const support = getSpectralOceanSimulationSupport(device, props);
    if (!support.supported || !support.stats) {
      throw new Error(support.reason);
    }

    this.device = device;
    this.id = resolvedProps.id;
    this.resolution = resolvedProps.resolution;
    this.patchSize = resolvedProps.patchSize;
    this.windDirection = resolvedProps.windDirection;
    this.windSpeed = resolvedProps.windSpeed;
    this.amplitude = resolvedProps.amplitude;
    this.choppiness = resolvedProps.choppiness;
    this.gravity = resolvedProps.gravity;
    this.seed = resolvedProps.seed;
    this.foamDecay = resolvedProps.foamDecay;
    this.foamThreshold = resolvedProps.foamThreshold;
    this.foamGain = resolvedProps.foamGain;
    this.stats = support.stats;
    this.resources = createSpectralOceanSimulationResources(device, resolvedProps, this.stats);
    this.outputs = Object.freeze({
      displacementBuffer: this.resources.displacementBuffer,
      normalFoamBuffer: this.resources.normalFoamBuffer,
      resolution: this.resolution,
      vertexCount: this.stats.elementCount,
      byteStride: 16
    });
  }

  /**
   * Records one complete ocean step and returns stable class-owned output references.
   *
   * The first step starts with zero-initialized foam history. `resetFoamHistory` clears retained
   * history before current-frame compression is evaluated; it does not suppress newly formed foam.
   */
  encode(
    commandEncoder: CommandEncoder,
    options: SpectralOceanSimulationEncodeOptions
  ): SpectralOceanSimulationOutputs {
    if (this.destroyed) {
      throw new Error('SpectralOceanSimulation has been destroyed.');
    }
    if (commandEncoder.device !== this.device) {
      throw new Error('SpectralOceanSimulation command encoder belongs to a different device.');
    }
    validateSpectralOceanSimulationEncodeOptions(options);
    const deltaTime = options.deltaTime ?? DEFAULT_DELTA_TIME;
    this.device.writeBufferViaCommandEncoder(
      commandEncoder,
      this.resources.uniformBuffer,
      makeSpectralOceanUniformData({
        resolution: this.resolution,
        patchSize: this.patchSize,
        gravity: this.gravity,
        choppiness: this.choppiness,
        time: options.time,
        deltaTime,
        foamDecay: this.foamDecay,
        foamThreshold: this.foamThreshold,
        foamGain: this.foamGain,
        resetFoamHistory: options.resetFoamHistory ?? false
      })
    );

    this.resources.evolutionComputation.predraw(commandEncoder);
    const evolutionPass = commandEncoder.beginComputePass({id: `${this.id}-evolve`});
    this.resources.evolutionComputation.dispatch(
      evolutionPass,
      this.stats.workgroupCount[0],
      this.stats.workgroupCount[1],
      this.stats.workgroupCount[2]
    );
    evolutionPass.end();

    this.resources.fft.encode(commandEncoder, {
      inputBuffer: this.resources.heightSpectrumBuffer,
      outputBuffer: this.resources.heightFieldBuffer,
      direction: 'inverse'
    });
    this.resources.fft.encode(commandEncoder, {
      inputBuffer: this.resources.displacementXSpectrumBuffer,
      outputBuffer: this.resources.displacementXFieldBuffer,
      direction: 'inverse'
    });
    this.resources.fft.encode(commandEncoder, {
      inputBuffer: this.resources.displacementZSpectrumBuffer,
      outputBuffer: this.resources.displacementZFieldBuffer,
      direction: 'inverse'
    });

    this.resources.assemblyComputation.predraw(commandEncoder);
    const assemblyPass = commandEncoder.beginComputePass({id: `${this.id}-assemble`});
    this.resources.assemblyComputation.dispatch(
      assemblyPass,
      this.stats.workgroupCount[0],
      this.stats.workgroupCount[1],
      this.stats.workgroupCount[2]
    );
    assemblyPass.end();
    return this.outputs;
  }

  /** Releases every class-owned GPU resource. Safe to call more than once. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    destroySpectralOceanSimulationResources(this.resources);
  }
}

/** Reports whether a device can allocate and dispatch the requested ocean field. */
export function getSpectralOceanSimulationSupport(
  device: Device,
  props: SpectralOceanSimulationProps
): SpectralOceanSimulationSupport {
  let resolvedProps: ResolvedSpectralOceanSimulationProps;
  let stats: SpectralOceanSimulationStats;
  try {
    resolvedProps = resolveSpectralOceanSimulationProps(props);
    stats = makeSpectralOceanSimulationStatsFromResolved(resolvedProps);
  } catch (error) {
    return {supported: false, reason: (error as Error).message};
  }

  const fftSupport = getGPUFFT2DSupport(device, {
    width: resolvedProps.resolution,
    height: resolvedProps.resolution
  });
  if (!fftSupport.supported) {
    return {supported: false, reason: fftSupport.reason, stats};
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 5) {
    return {
      supported: false,
      reason: 'SpectralOceanSimulation requires five compute storage buffers per shader stage.',
      stats
    };
  }
  if (device.limits.maxUniformBuffersPerShaderStage < 1) {
    return {
      supported: false,
      reason: 'SpectralOceanSimulation requires one compute uniform buffer per shader stage.',
      stats
    };
  }
  if (
    device.limits.maxComputeInvocationsPerWorkgroup <
      SPECTRAL_OCEAN_WORKGROUP_DIMENSION * SPECTRAL_OCEAN_WORKGROUP_DIMENSION ||
    device.limits.maxComputeWorkgroupSizeX < SPECTRAL_OCEAN_WORKGROUP_DIMENSION ||
    device.limits.maxComputeWorkgroupSizeY < SPECTRAL_OCEAN_WORKGROUP_DIMENSION
  ) {
    return {
      supported: false,
      reason: 'SpectralOceanSimulation requires 8 by 8 compute workgroups.',
      stats
    };
  }
  if (
    stats.workgroupCount[0] > device.limits.maxComputeWorkgroupsPerDimension ||
    stats.workgroupCount[1] > device.limits.maxComputeWorkgroupsPerDimension
  ) {
    return {
      supported: false,
      reason: 'SpectralOceanSimulation workgroup count exceeds the device dispatch limit.',
      stats
    };
  }
  if (stats.outputBufferByteLength > device.limits.maxStorageBufferBindingSize) {
    return {
      supported: false,
      reason: 'SpectralOceanSimulation output exceeds maxStorageBufferBindingSize.',
      stats
    };
  }
  if (stats.outputBufferByteLength > device.limits.maxBufferSize) {
    return {
      supported: false,
      reason: 'SpectralOceanSimulation output exceeds maxBufferSize.',
      stats
    };
  }
  return {supported: true, stats};
}

/** Builds the immutable CPU-side allocation and dispatch plan without allocating GPU resources. */
export function makeSpectralOceanSimulationStats(
  props: SpectralOceanSimulationProps
): SpectralOceanSimulationStats {
  return makeSpectralOceanSimulationStatsFromResolved(resolveSpectralOceanSimulationProps(props));
}

function makeSpectralOceanSimulationStatsFromResolved(
  props: ResolvedSpectralOceanSimulationProps
): SpectralOceanSimulationStats {
  const fft = makeGPUFFT2DStats(props.resolution, props.resolution);
  const elementCount = props.resolution * props.resolution;
  const complexBufferByteLength = elementCount * 2 * Float32Array.BYTES_PER_ELEMENT;
  const outputBufferByteLength = elementCount * 4 * Float32Array.BYTES_PER_ELEMENT;
  const inverseFFTDispatchCount = 3 * fft.dispatchCountPerEncode;
  return Object.freeze({
    resolution: props.resolution,
    elementCount,
    patchSize: props.patchSize,
    cellSize: props.patchSize / props.resolution,
    complexBufferByteLength,
    outputBufferByteLength,
    simulationStorageBufferCount: 9,
    simulationUniformBufferCount: 1,
    simulationBufferByteLength:
      7 * complexBufferByteLength + 2 * outputBufferByteLength + SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH,
    workgroupSize: Object.freeze([
      SPECTRAL_OCEAN_WORKGROUP_DIMENSION,
      SPECTRAL_OCEAN_WORKGROUP_DIMENSION,
      1
    ]) as readonly [number, number, number],
    workgroupCount: Object.freeze([
      Math.ceil(props.resolution / SPECTRAL_OCEAN_WORKGROUP_DIMENSION),
      Math.ceil(props.resolution / SPECTRAL_OCEAN_WORKGROUP_DIMENSION),
      1
    ]) as readonly [number, number, number],
    evolutionDispatchCount: 1,
    inverseFFTDispatchCount,
    assemblyDispatchCount: 1,
    dispatchCountPerEncode: inverseFFTDispatchCount + 2,
    fft
  });
}

function createSpectralOceanSimulationResources(
  device: Device,
  props: ResolvedSpectralOceanSimulationProps,
  stats: SpectralOceanSimulationStats
): SpectralOceanSimulationResources {
  const cleanupActions: Array<() => void> = [];
  const own = <T extends {destroy(): void}>(resource: T): T => {
    cleanupActions.push(() => resource.destroy());
    return resource;
  };

  try {
    const initialSpectrumBuffer = own(
      device.createBuffer({
        id: `${props.id}-initial-spectrum`,
        data: makeSpectralOceanInitialSpectrum(props),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      })
    );
    const heightSpectrumBuffer = own(
      createComplexBuffer(device, `${props.id}-height-spectrum`, stats.complexBufferByteLength)
    );
    const displacementXSpectrumBuffer = own(
      createComplexBuffer(
        device,
        `${props.id}-displacement-x-spectrum`,
        stats.complexBufferByteLength
      )
    );
    const displacementZSpectrumBuffer = own(
      createComplexBuffer(
        device,
        `${props.id}-displacement-z-spectrum`,
        stats.complexBufferByteLength
      )
    );
    const heightFieldBuffer = own(
      createComplexBuffer(device, `${props.id}-height-field`, stats.complexBufferByteLength)
    );
    const displacementXFieldBuffer = own(
      createComplexBuffer(device, `${props.id}-displacement-x-field`, stats.complexBufferByteLength)
    );
    const displacementZFieldBuffer = own(
      createComplexBuffer(device, `${props.id}-displacement-z-field`, stats.complexBufferByteLength)
    );
    const displacementBuffer = own(
      createOutputBuffer(device, `${props.id}-displacements`, stats.outputBufferByteLength)
    );
    const normalFoamBuffer = own(
      createOutputBuffer(device, `${props.id}-normal-foam`, stats.outputBufferByteLength)
    );
    const uniformBuffer = own(
      device.createBuffer({
        id: `${props.id}-uniforms`,
        byteLength: SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      })
    );

    const evolutionComputation = own(
      new Computation(device, {
        id: `${props.id}-evolution`,
        source: SPECTRAL_OCEAN_EVOLUTION_SHADER,
        shaderLayout: {
          bindings: [
            {name: 'initialSpectrum', type: 'read-only-storage', group: 0, location: 0},
            {name: 'heightSpectrum', type: 'storage', group: 0, location: 1},
            {name: 'displacementXSpectrum', type: 'storage', group: 0, location: 2},
            {name: 'displacementZSpectrum', type: 'storage', group: 0, location: 3},
            {name: 'parameters', type: 'uniform', group: 0, location: 4}
          ]
        },
        bindings: {
          initialSpectrum: initialSpectrumBuffer,
          heightSpectrum: heightSpectrumBuffer,
          displacementXSpectrum: displacementXSpectrumBuffer,
          displacementZSpectrum: displacementZSpectrumBuffer,
          parameters: uniformBuffer
        }
      })
    );
    const assemblyComputation = own(
      new Computation(device, {
        id: `${props.id}-assembly`,
        source: SPECTRAL_OCEAN_ASSEMBLY_SHADER,
        shaderLayout: {
          bindings: [
            {name: 'heightField', type: 'read-only-storage', group: 0, location: 0},
            {name: 'displacementXField', type: 'read-only-storage', group: 0, location: 1},
            {name: 'displacementZField', type: 'read-only-storage', group: 0, location: 2},
            {name: 'displacements', type: 'storage', group: 0, location: 3},
            {name: 'normalFoam', type: 'storage', group: 0, location: 4},
            {name: 'parameters', type: 'uniform', group: 0, location: 5}
          ]
        },
        bindings: {
          heightField: heightFieldBuffer,
          displacementXField: displacementXFieldBuffer,
          displacementZField: displacementZFieldBuffer,
          displacements: displacementBuffer,
          normalFoam: normalFoamBuffer,
          parameters: uniformBuffer
        }
      })
    );
    const fft = own(
      new GPUFFT2D(device, {
        id: `${props.id}-fft`,
        width: props.resolution,
        height: props.resolution
      })
    );

    return {
      initialSpectrumBuffer,
      heightSpectrumBuffer,
      displacementXSpectrumBuffer,
      displacementZSpectrumBuffer,
      heightFieldBuffer,
      displacementXFieldBuffer,
      displacementZFieldBuffer,
      displacementBuffer,
      normalFoamBuffer,
      uniformBuffer,
      evolutionComputation,
      assemblyComputation,
      fft
    };
  } catch (error) {
    for (const cleanup of cleanupActions.reverse()) {
      try {
        cleanup();
      } catch {
        // Preserve the original construction error after attempting every owned cleanup.
      }
    }
    throw error;
  }
}

function createComplexBuffer(device: Device, id: string, byteLength: number): Buffer {
  return device.createBuffer({id, byteLength, usage: Buffer.STORAGE});
}

function createOutputBuffer(device: Device, id: string, byteLength: number): Buffer {
  return device.createBuffer({
    id,
    byteLength,
    usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC
  });
}

function destroySpectralOceanSimulationResources(
  resources: SpectralOceanSimulationResources
): void {
  resources.fft.destroy();
  resources.assemblyComputation.destroy();
  resources.evolutionComputation.destroy();
  resources.uniformBuffer.destroy();
  resources.normalFoamBuffer.destroy();
  resources.displacementBuffer.destroy();
  resources.displacementZFieldBuffer.destroy();
  resources.displacementXFieldBuffer.destroy();
  resources.heightFieldBuffer.destroy();
  resources.displacementZSpectrumBuffer.destroy();
  resources.displacementXSpectrumBuffer.destroy();
  resources.heightSpectrumBuffer.destroy();
  resources.initialSpectrumBuffer.destroy();
}

function resolveSpectralOceanSimulationProps(
  props: SpectralOceanSimulationProps
): ResolvedSpectralOceanSimulationProps {
  validateResolution(props.resolution);
  const patchSize = props.patchSize ?? DEFAULT_PATCH_SIZE;
  const windDirection = props.windDirection ?? DEFAULT_WIND_DIRECTION;
  const windSpeed = props.windSpeed ?? DEFAULT_WIND_SPEED;
  const amplitude = props.amplitude ?? DEFAULT_AMPLITUDE;
  const choppiness = props.choppiness ?? DEFAULT_CHOPPINESS;
  const gravity = props.gravity ?? DEFAULT_GRAVITY;
  const seed = props.seed ?? DEFAULT_SEED;
  const foamDecay = props.foamDecay ?? DEFAULT_FOAM_DECAY;
  const foamThreshold = props.foamThreshold ?? DEFAULT_FOAM_THRESHOLD;
  const foamGain = props.foamGain ?? DEFAULT_FOAM_GAIN;

  validatePositiveFinite('patchSize', patchSize);
  validatePositiveFinite('windSpeed', windSpeed);
  validatePositiveFinite('amplitude', amplitude);
  validateNonNegativeFinite('choppiness', choppiness);
  validatePositiveFinite('gravity', gravity);
  validateNonNegativeFinite('foamDecay', foamDecay);
  validatePositiveFinite('foamGain', foamGain);
  if (!Number.isFinite(foamThreshold) || foamThreshold < 0 || foamThreshold > 1) {
    throw new Error('SpectralOceanSimulation foamThreshold must be from 0 through 1.');
  }
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error('SpectralOceanSimulation seed must be an unsigned 32-bit integer.');
  }
  if (!Number.isFinite(windDirection[0]) || !Number.isFinite(windDirection[1])) {
    throw new Error('SpectralOceanSimulation windDirection components must be finite.');
  }
  const windLength = Math.hypot(windDirection[0], windDirection[1]);
  if (windLength === 0) {
    throw new Error('SpectralOceanSimulation windDirection must be non-zero.');
  }

  return {
    id: props.id ?? 'spectral-ocean-simulation',
    resolution: props.resolution,
    patchSize,
    windDirection: Object.freeze([
      windDirection[0] / windLength,
      windDirection[1] / windLength
    ]) as readonly [number, number],
    windSpeed,
    amplitude,
    choppiness,
    gravity,
    seed,
    foamDecay,
    foamThreshold,
    foamGain
  };
}

function validateResolution(resolution: number): void {
  if (!Number.isInteger(resolution)) {
    throw new Error('SpectralOceanSimulation resolution must be an integer.');
  }
  if (resolution < SPECTRAL_OCEAN_MIN_RESOLUTION || resolution > SPECTRAL_OCEAN_MAX_RESOLUTION) {
    throw new Error(
      `SpectralOceanSimulation resolution must be from ${SPECTRAL_OCEAN_MIN_RESOLUTION} through ${SPECTRAL_OCEAN_MAX_RESOLUTION}.`
    );
  }
  if ((resolution & (resolution - 1)) !== 0) {
    throw new Error('SpectralOceanSimulation resolution must be a power of two.');
  }
}

function validatePositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`SpectralOceanSimulation ${name} must be positive and finite.`);
  }
}

function validateNonNegativeFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`SpectralOceanSimulation ${name} must be non-negative and finite.`);
  }
}

function validateSpectralOceanSimulationEncodeOptions(
  options: SpectralOceanSimulationEncodeOptions
): void {
  if (!Number.isFinite(options.time)) {
    throw new Error('SpectralOceanSimulation time must be finite.');
  }
  if (options.deltaTime !== undefined) {
    validateNonNegativeFinite('deltaTime', options.deltaTime);
  }
  if (options.resetFoamHistory !== undefined && typeof options.resetFoamHistory !== 'boolean') {
    throw new Error('SpectralOceanSimulation resetFoamHistory must be boolean.');
  }
}

function makeSpectralOceanUniformData(props: {
  resolution: number;
  patchSize: number;
  gravity: number;
  choppiness: number;
  time: number;
  deltaTime: number;
  foamDecay: number;
  foamThreshold: number;
  foamGain: number;
  resetFoamHistory: boolean;
}): Uint32Array {
  const data = new ArrayBuffer(SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH);
  const unsignedValues = new Uint32Array(data);
  const floatValues = new Float32Array(data);
  unsignedValues[0] = props.resolution;
  unsignedValues[1] = props.resetFoamHistory ? 1 : 0;
  floatValues[4] = props.patchSize;
  floatValues[5] = props.gravity;
  floatValues[6] = props.choppiness;
  floatValues[7] = props.time;
  floatValues[8] = props.deltaTime;
  floatValues[9] = props.foamDecay;
  floatValues[10] = props.foamThreshold;
  floatValues[11] = props.foamGain;
  return unsignedValues;
}
