// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  MLS_MPM_FLUID_CLEAR_GRID_BINDINGS,
  MLS_MPM_FLUID_CLEAR_GRID_SHADER,
  MLS_MPM_FLUID_GRID_CELL_BYTE_LENGTH,
  MLS_MPM_FLUID_GRID_TO_PARTICLE_BINDINGS,
  MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER,
  MLS_MPM_FLUID_MAX_FIXED_POINT_SCALE,
  MLS_MPM_FLUID_MAXIMUM_DEFORMATION,
  MLS_MPM_FLUID_PARTICLE_BYTE_LENGTH,
  MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT,
  MLS_MPM_FLUID_PARTICLE_TO_GRID_BINDINGS,
  MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER,
  MLS_MPM_FLUID_UNIFORM_BYTE_LENGTH,
  MLS_MPM_FLUID_UNIFORM_FLOAT_COUNT,
  MLS_MPM_FLUID_UNIFORM_OFFSETS,
  MLS_MPM_FLUID_UPDATE_GRID_BINDINGS,
  MLS_MPM_FLUID_UPDATE_GRID_SHADER,
  MLS_MPM_FLUID_WORKGROUP_SIZE
} from './mls-mpm-fluid-simulation-shaders';

export const DEFAULT_MLS_MPM_FLUID_GRID_SIZE = [64, 64] as const;
export const DEFAULT_MLS_MPM_FLUID_PARTICLE_COUNT = 8192;
export const MAX_MLS_MPM_FLUID_PARTICLE_COUNT = 65_536;
export const MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE = 128;
export const MLS_MPM_FLUID_STAGE_ORDER = Object.freeze([
  'clear-mls-mpm-grid',
  'scatter-mls-mpm-particles-to-grid',
  'update-mls-mpm-grid',
  'advect-mls-mpm-grid-to-particles'
] as const);

const MINIMUM_GRID_DIMENSION = 8;
const MAXIMUM_GRID_DIMENSION = 512;
const DEFAULT_BOUNDARY_CELLS = 2;
const DEFAULT_PARTICLE_MASS = 1;
const DEFAULT_REST_DENSITY = 4;
const DEFAULT_STIFFNESS = 8;
const DEFAULT_VELOCITY_DAMPING = 0.08;
const DEFAULT_MAXIMUM_VELOCITY = 16;
const MAXIMUM_PARTICLE_MASS = 1;
const MAXIMUM_VELOCITY = 16;
const MINIMUM_TIME_STEP = 1e-7;
const MAXIMUM_TIME_STEP = 1 / 30;
const MAXIMUM_FORCE_COMPONENT = 200;
const MAXIMUM_GRAVITY_COMPONENT = 100;
const MAXIMUM_SIGNED_INTEGER = 2_147_483_647;
const MLS_MPM_CFL_NUMBER = 0.5;
const FIXED_POINT_INTEGER_MARGIN = 2;

/** CPU seed values accepted by the simulation and packed when uploaded. */
export type MLSMPMParticle = {
  /** Normalized domain position, clamped to the full-stencil interior when uploaded. */
  position: readonly [number, number];
  /** Normalized-domain velocity per second. Defaults to zero. */
  velocity?: readonly [number, number];
};

/** @internal Options for the deterministic packed particle seed generator. */
export type MLSMPMParticleSeedOptions = {
  particleCount: number;
  /** Unsigned 32-bit seed used only for sub-cell jitter. */
  seed?: number;
  /** Normalized [minimumX, minimumY, maximumX, maximumY] seed bounds. */
  bounds?: readonly [number, number, number, number];
  /** Shared initial normalized-domain velocity. */
  velocity?: readonly [number, number];
};

/** Construction props for the fixed-capacity WebGPU MLS-MPM solver. */
export type MLSMPMFluidSimulationProps = {
  /** Debug-resource prefix. */
  id?: string;
  /** Width and height of the nodal grid. Each dimension must be in [8, 512]. */
  gridSize?: readonly [number, number];
  /** Generated particle count when initialParticles is omitted. */
  particleCount?: number;
  /** Deterministic generator seed when initialParticles is omitted. */
  seed?: number;
  /** Explicit seed particles. particleCount, when supplied, must match this array. */
  initialParticles?: readonly MLSMPMParticle[];
  /** Solid boundary thickness in grid cells. */
  boundaryCells?: number;
  /** Uniform particle mass used by transfer and fixed-point capacity planning. */
  particleMass?: number;
  /** Rest density used to derive particle volume. */
  restDensity?: number;
  /** Isotropic equation-of-state stiffness. Zero disables pressure. */
  stiffness?: number;
  /** Global grid-velocity damping rate in inverse seconds. */
  velocityDamping?: number;
  /** Hard velocity bound used for stability and signed-atomic capacity. */
  maxVelocity?: number;
};

/** Optional localized acceleration applied during the grid update. */
export type MLSMPMFluidForce = {
  /** Normalized force center. */
  position: readonly [number, number];
  /** Normalized radial falloff extent. */
  radius: number;
  /** Normalized-domain acceleration vector. */
  vector: readonly [number, number];
};

/** Deterministic inputs for one safely substepped simulation interval. */
export type MLSMPMFluidSimulationStepOptions = {
  /** Requested interval in seconds. Must be in [1e-7, 1 / 30] and is safely substepped. */
  deltaTime: number;
  /** Constant normalized-domain acceleration. Defaults to [0, -9.81]. */
  gravity?: readonly [number, number];
  /** Optional smooth localized acceleration. */
  force?: MLSMPMFluidForce;
};

/** Result returned by {@link getMLSMPMFluidSimulationSupport}. */
export type MLSMPMFluidSimulationSupport = {
  supported: boolean;
  reason?: string;
};

/** Conservative integer accumulation bounds for one particle-to-grid dispatch. */
export type MLSMPMFluidFixedPointBounds = {
  massFixedPointScale: number;
  velocityFixedPointScale: number;
  maximumMassInteger: number;
  maximumSignedMomentumInteger: number;
  maximumRepresentableInteger: number;
};

/** Stable allocation and dispatch diagnostics plus the number of encoded steps. */
export type MLSMPMFluidSimulationStats = {
  gridSize: readonly [number, number];
  gridCellCount: number;
  gridBufferByteLength: number;
  particleBufferByteLength: number;
  particleWorkgroupCount: number;
  gridWorkgroupCount: number;
  massFixedPointScale: number;
  velocityFixedPointScale: number;
  fixedPointBounds: MLSMPMFluidFixedPointBounds;
  stageOrder: typeof MLS_MPM_FLUID_STAGE_ORDER;
  /** Conservative per-substep CFL/material bound selected at construction. */
  stableDeltaTime: number;
  /** Hard per-encode work budget; every substep records four compute dispatches. */
  maximumSubstepCount: number;
  /** Number of public encode calls recorded since construction or reset. */
  encodeCount: number;
  /** Total number of four-stage numerical substeps recorded. */
  stepCount: number;
  /** Numerical substeps used by the most recent encode call. */
  lastSubstepCount: number;
  /** Delta time of each numerical substep in the most recent encode call. */
  lastSubstepDeltaTime: number;
};

/** @internal Inputs to the fixed shader-uniform ABI packer for one stable substep. */
export type MLSMPMFluidSubstepUniformOptions = {
  gridSize: readonly [number, number];
  particleCount: number;
  boundaryCells: number;
  particleMass: number;
  restDensity: number;
  stiffness: number;
  velocityDamping: number;
  maxVelocity: number;
  step: MLSMPMFluidSimulationStepOptions;
};

/** Material and grid inputs used by the conservative stable-step calculator. */
export type MLSMPMFluidStabilityOptions = {
  gridSize: readonly [number, number];
  restDensity: number;
  stiffness: number;
  maxVelocity: number;
};

type ResolvedMLSMPMFluidSimulationProps = {
  id: string;
  gridSize: readonly [number, number];
  particleCount: number;
  boundaryCells: number;
  particleMass: number;
  restDensity: number;
  stiffness: number;
  velocityDamping: number;
  maxVelocity: number;
  initialParticleData: Float32Array;
};

/**
 * Evolves a two-dimensional weakly-compressible fluid with MLS-MPM/APIC transfers on WebGPU.
 *
 * Every encode divides the requested frame delta into conservative CFL/material substeps, records
 * the four ordered compute stages for each substep into the caller's command encoder, and never
 * submits it. Particle state is double buffered. The integer grid uses exact atomic addition for
 * deterministic scatter; after a submitted step its mass field remains fixed-point mass while its
 * two signed fields contain fixed-point grid velocity (they contain momentum only between the
 * particle-to-grid and grid-update stages inside the same command buffer).
 */
export class MLSMPMFluidSimulation {
  readonly device: Device;
  readonly id: string;
  readonly gridSize: readonly [number, number];
  readonly particleCount: number;
  readonly boundaryCells: number;
  readonly particleMass: number;
  readonly restDensity: number;
  readonly stiffness: number;
  readonly velocityDamping: number;
  readonly maxVelocity: number;
  /** Atomic grid buffer. See the class documentation for its phase-dependent signed fields. */
  readonly gridBuffer: Buffer;

  private readonly particleBuffers: readonly [Buffer, Buffer];
  private readonly uniformBuffer: Buffer;
  private readonly initialParticleData: Float32Array;
  private readonly clearGridComputation: Computation;
  private readonly particleToGridComputation: Computation;
  private readonly updateGridComputation: Computation;
  private readonly gridToParticleComputation: Computation;
  private readonly staticStats: Omit<
    MLSMPMFluidSimulationStats,
    'encodeCount' | 'stepCount' | 'lastSubstepCount' | 'lastSubstepDeltaTime'
  >;
  private currentParticleBufferIndex = 0;
  private encodedCallCount = 0;
  private encodedStepCount = 0;
  private mostRecentSubstepCount = 0;
  private mostRecentSubstepDeltaTime = 0;
  private destroyed = false;

  constructor(device: Device, props: MLSMPMFluidSimulationProps = {}) {
    const resolvedProps = resolveMLSMPMFluidSimulationProps(props);
    const support = getMLSMPMFluidSupportForResolvedProps(device, resolvedProps);
    if (!support.supported) {
      throw new Error(support.reason);
    }

    this.device = device;
    this.id = resolvedProps.id;
    this.gridSize = resolvedProps.gridSize;
    this.particleCount = resolvedProps.particleCount;
    this.boundaryCells = resolvedProps.boundaryCells;
    this.particleMass = resolvedProps.particleMass;
    this.restDensity = resolvedProps.restDensity;
    this.stiffness = resolvedProps.stiffness;
    this.velocityDamping = resolvedProps.velocityDamping;
    this.maxVelocity = resolvedProps.maxVelocity;
    this.initialParticleData = resolvedProps.initialParticleData;

    const particleBufferByteLength = this.particleCount * MLS_MPM_FLUID_PARTICLE_BYTE_LENGTH;
    const gridCellCount = this.gridSize[0] * this.gridSize[1];
    const gridBufferByteLength = gridCellCount * MLS_MPM_FLUID_GRID_CELL_BYTE_LENGTH;
    const ownedBuffers: Buffer[] = [];
    const ownedComputations: Computation[] = [];
    try {
      const particleBufferA = device.createBuffer({
        id: `${this.id}-particles-a`,
        data: this.initialParticleData,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      ownedBuffers.push(particleBufferA);
      const particleBufferB = device.createBuffer({
        id: `${this.id}-particles-b`,
        data: this.initialParticleData,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      ownedBuffers.push(particleBufferB);
      const gridBuffer = device.createBuffer({
        id: `${this.id}-grid`,
        byteLength: gridBufferByteLength,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      });
      ownedBuffers.push(gridBuffer);
      const uniformBuffer = device.createBuffer({
        id: `${this.id}-uniforms`,
        byteLength: MLS_MPM_FLUID_UNIFORM_BYTE_LENGTH,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
      ownedBuffers.push(uniformBuffer);

      const clearGridComputation = new Computation(device, {
        id: `${this.id}-clear-grid`,
        source: MLS_MPM_FLUID_CLEAR_GRID_SHADER,
        shaderLayout: {bindings: MLS_MPM_FLUID_CLEAR_GRID_BINDINGS}
      });
      ownedComputations.push(clearGridComputation);
      const particleToGridComputation = new Computation(device, {
        id: `${this.id}-particle-to-grid`,
        source: MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER,
        shaderLayout: {bindings: MLS_MPM_FLUID_PARTICLE_TO_GRID_BINDINGS}
      });
      ownedComputations.push(particleToGridComputation);
      const updateGridComputation = new Computation(device, {
        id: `${this.id}-update-grid`,
        source: MLS_MPM_FLUID_UPDATE_GRID_SHADER,
        shaderLayout: {bindings: MLS_MPM_FLUID_UPDATE_GRID_BINDINGS}
      });
      ownedComputations.push(updateGridComputation);
      const gridToParticleComputation = new Computation(device, {
        id: `${this.id}-grid-to-particle`,
        source: MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER,
        shaderLayout: {bindings: MLS_MPM_FLUID_GRID_TO_PARTICLE_BINDINGS}
      });
      ownedComputations.push(gridToParticleComputation);

      this.particleBuffers = [particleBufferA, particleBufferB];
      this.gridBuffer = gridBuffer;
      this.uniformBuffer = uniformBuffer;
      this.clearGridComputation = clearGridComputation;
      this.particleToGridComputation = particleToGridComputation;
      this.updateGridComputation = updateGridComputation;
      this.gridToParticleComputation = gridToParticleComputation;
      this.clearGridComputation.setBindings({grid: this.gridBuffer});
      this.updateGridComputation.setBindings({grid: this.gridBuffer, uniforms: this.uniformBuffer});
    } catch (error) {
      for (const computation of ownedComputations.reverse()) {
        computation.destroy();
      }
      for (const buffer of ownedBuffers.reverse()) {
        buffer.destroy();
      }
      throw error;
    }

    const fixedPointBounds = getMLSMPMFluidFixedPointBounds({
      particleCount: this.particleCount,
      particleMass: this.particleMass,
      maxVelocity: this.maxVelocity
    });
    this.staticStats = Object.freeze({
      gridSize: this.gridSize,
      gridCellCount,
      gridBufferByteLength,
      particleBufferByteLength,
      particleWorkgroupCount: Math.ceil(this.particleCount / MLS_MPM_FLUID_WORKGROUP_SIZE),
      gridWorkgroupCount: Math.ceil(gridCellCount / MLS_MPM_FLUID_WORKGROUP_SIZE),
      massFixedPointScale: fixedPointBounds.massFixedPointScale,
      velocityFixedPointScale: fixedPointBounds.velocityFixedPointScale,
      fixedPointBounds: Object.freeze(fixedPointBounds),
      stageOrder: MLS_MPM_FLUID_STAGE_ORDER,
      maximumSubstepCount: MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE,
      stableDeltaTime: getMLSMPMFluidStableDeltaTime({
        gridSize: this.gridSize,
        restDensity: this.restDensity,
        stiffness: this.stiffness,
        maxVelocity: this.maxVelocity
      })
    });
  }

  /** Current particle storage buffer, suitable for a storage-backed renderer after submission. */
  get particleBuffer(): Buffer {
    return this.particleBuffers[this.currentParticleBufferIndex];
  }

  /** Returns allocation, dispatch, fixed-point, stage-order, and encoded-step diagnostics. */
  get stats(): MLSMPMFluidSimulationStats {
    return {
      ...this.staticStats,
      encodeCount: this.encodedCallCount,
      stepCount: this.encodedStepCount,
      lastSubstepCount: this.mostRecentSubstepCount,
      lastSubstepDeltaTime: this.mostRecentSubstepDeltaTime
    };
  }

  /** Records stable four-stage MLS-MPM substeps and returns the new current particle buffer. */
  encode(commandEncoder: CommandEncoder, options: MLSMPMFluidSimulationStepOptions): Buffer {
    this.assertUsable();
    validateStepOptions(options);
    const substepCount = Math.max(
      1,
      Math.ceil(options.deltaTime / this.staticStats.stableDeltaTime)
    );
    // Four dispatches per substep make this the command-recording work budget for one encode.
    if (substepCount > MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE) {
      throw new Error(
        `MLSMPMFluidSimulation encode requires ${substepCount} substeps; maximum is ${MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE}. Reduce deltaTime or solver resolution.`
      );
    }
    const substepDeltaTime = options.deltaTime / substepCount;
    const uniformData = makeMLSMPMFluidSubstepUniformData({
      gridSize: this.gridSize,
      particleCount: this.particleCount,
      boundaryCells: this.boundaryCells,
      particleMass: this.particleMass,
      restDensity: this.restDensity,
      stiffness: this.stiffness,
      velocityDamping: this.velocityDamping,
      maxVelocity: this.maxVelocity,
      step: {...options, deltaTime: substepDeltaTime}
    });
    this.device.writeBufferViaCommandEncoder(commandEncoder, this.uniformBuffer, uniformData);

    this.setParticleTransferBindings(this.currentParticleBufferIndex);
    this.clearGridComputation.predraw(commandEncoder);
    this.particleToGridComputation.predraw(commandEncoder);
    this.updateGridComputation.predraw(commandEncoder);
    this.gridToParticleComputation.predraw(commandEncoder);

    let nextParticleBufferIndex = this.currentParticleBufferIndex;
    const computePass = commandEncoder.beginComputePass({id: `${this.id}-substeps`});
    try {
      for (let substepIndex = 0; substepIndex < substepCount; substepIndex++) {
        this.setParticleTransferBindings(nextParticleBufferIndex);
        this.clearGridComputation.dispatch(computePass, this.staticStats.gridWorkgroupCount);
        this.particleToGridComputation.dispatch(
          computePass,
          this.staticStats.particleWorkgroupCount
        );
        this.updateGridComputation.dispatch(computePass, this.staticStats.gridWorkgroupCount);
        this.gridToParticleComputation.dispatch(
          computePass,
          this.staticStats.particleWorkgroupCount
        );
        nextParticleBufferIndex = 1 - nextParticleBufferIndex;
      }
    } finally {
      computePass.end();
    }

    this.currentParticleBufferIndex = nextParticleBufferIndex;
    this.encodedCallCount += 1;
    this.encodedStepCount += substepCount;
    this.mostRecentSubstepCount = substepCount;
    this.mostRecentSubstepDeltaTime = substepDeltaTime;
    return this.particleBuffer;
  }

  /**
   * Records deterministic data uploads into both particle buffers without submitting.
   * Omitting particles restores the constructor's original generated or explicit seed.
   */
  reset(commandEncoder: CommandEncoder, particles?: readonly MLSMPMParticle[]): void {
    this.assertUsable();
    if (particles && particles.length !== this.particleCount) {
      throw new Error(
        `MLSMPMFluidSimulation reset requires exactly ${this.particleCount} particles.`
      );
    }
    const particleData = particles
      ? packMLSMPMParticles(particles, this.maxVelocity, this.gridSize, this.boundaryCells)
      : this.initialParticleData;
    this.device.writeBufferViaCommandEncoder(commandEncoder, this.particleBuffers[0], particleData);
    this.device.writeBufferViaCommandEncoder(commandEncoder, this.particleBuffers[1], particleData);
    this.currentParticleBufferIndex = 0;
    this.encodedCallCount = 0;
    this.encodedStepCount = 0;
    this.mostRecentSubstepCount = 0;
    this.mostRecentSubstepDeltaTime = 0;
  }

  /** Releases all owned pipelines and buffers. Safe to call more than once. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.gridToParticleComputation.destroy();
    this.updateGridComputation.destroy();
    this.particleToGridComputation.destroy();
    this.clearGridComputation.destroy();
    this.uniformBuffer.destroy();
    this.gridBuffer.destroy();
    this.particleBuffers[1].destroy();
    this.particleBuffers[0].destroy();
    this.destroyed = true;
  }

  private assertUsable(): void {
    if (this.destroyed) {
      throw new Error('MLSMPMFluidSimulation has been destroyed.');
    }
  }

  private setParticleTransferBindings(inputParticleBufferIndex: number): void {
    const inputParticleBuffer = this.particleBuffers[inputParticleBufferIndex];
    const outputParticleBuffer = this.particleBuffers[1 - inputParticleBufferIndex];
    this.particleToGridComputation.setBindings({
      particlesInput: inputParticleBuffer,
      grid: this.gridBuffer,
      uniforms: this.uniformBuffer
    });
    this.gridToParticleComputation.setBindings({
      particlesInput: inputParticleBuffer,
      grid: this.gridBuffer,
      particlesOutput: outputParticleBuffer,
      uniforms: this.uniformBuffer
    });
  }
}

/** Returns whether the device and requested allocation satisfy the portable solver requirements. */
export function getMLSMPMFluidSimulationSupport(
  device: Device,
  props: MLSMPMFluidSimulationProps = {}
): MLSMPMFluidSimulationSupport {
  let resolvedProps: ResolvedMLSMPMFluidSimulationProps;
  try {
    resolvedProps = resolveMLSMPMFluidSimulationProps(props);
  } catch (error) {
    return {supported: false, reason: error instanceof Error ? error.message : String(error)};
  }
  return getMLSMPMFluidSupportForResolvedProps(device, resolvedProps);
}

/** Returns the conservative advection/material delta used to split public encode calls. */
export function getMLSMPMFluidStableDeltaTime(options: MLSMPMFluidStabilityOptions): number {
  validateGridSize(options.gridSize);
  validateNumberInRange(options.restDensity, 0.1, 100, 'MLS-MPM restDensity');
  validateNumberInRange(options.stiffness, 0, 100, 'MLS-MPM stiffness');
  validateNumberInRange(options.maxVelocity, 0.1, MAXIMUM_VELOCITY, 'MLS-MPM maxVelocity');
  const minimumCellSize = 1 / Math.max(options.gridSize[0] - 1, options.gridSize[1] - 1);
  const materialWaveSpeed =
    MLS_MPM_FLUID_MAXIMUM_DEFORMATION * Math.sqrt(options.stiffness / options.restDensity);
  const transportSpeed = options.maxVelocity + materialWaveSpeed;
  return Math.min(MAXIMUM_TIME_STEP, (MLS_MPM_CFL_NUMBER * minimumCellSize) / transportSpeed);
}

/** Selects safe power-of-two scales and computes capacity before any GPU allocation. */
export function getMLSMPMFluidFixedPointBounds(options: {
  particleCount: number;
  particleMass: number;
  maxVelocity: number;
}): MLSMPMFluidFixedPointBounds {
  validateIntegerInRange(
    options.particleCount,
    1,
    MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    'MLS-MPM particleCount'
  );
  validateNumberInRange(options.particleMass, 0.001, MAXIMUM_PARTICLE_MASS, 'MLS-MPM particleMass');
  validateNumberInRange(options.maxVelocity, 0.1, MAXIMUM_VELOCITY, 'MLS-MPM maxVelocity');
  const maximumMassScale =
    (MAXIMUM_SIGNED_INTEGER / options.particleCount - FIXED_POINT_INTEGER_MARGIN) /
    options.particleMass;
  const maximumVelocityScale =
    (MAXIMUM_SIGNED_INTEGER / options.particleCount - FIXED_POINT_INTEGER_MARGIN) /
    (options.particleMass * options.maxVelocity);
  const massFixedPointScale = getBoundedPowerOfTwoScale(maximumMassScale);
  const velocityFixedPointScale = getBoundedPowerOfTwoScale(maximumVelocityScale);
  const maximumMassInteger = Math.ceil(
    options.particleCount *
      (options.particleMass * massFixedPointScale + FIXED_POINT_INTEGER_MARGIN)
  );
  const maximumSignedMomentumInteger = Math.ceil(
    options.particleCount *
      (options.particleMass * options.maxVelocity * velocityFixedPointScale +
        FIXED_POINT_INTEGER_MARGIN)
  );
  if (
    maximumMassInteger > MAXIMUM_SIGNED_INTEGER ||
    maximumSignedMomentumInteger > MAXIMUM_SIGNED_INTEGER
  ) {
    throw new Error('MLS-MPM fixed-point accumulation can exceed signed 32-bit atomic capacity.');
  }
  return {
    massFixedPointScale,
    velocityFixedPointScale,
    maximumMassInteger,
    maximumSignedMomentumInteger,
    maximumRepresentableInteger: MAXIMUM_SIGNED_INTEGER
  };
}

/** @internal Generates deterministic, jittered particle state in the 48-byte GPU ABI. */
export function makeMLSMPMParticleData(options: MLSMPMParticleSeedOptions): Float32Array {
  validateIntegerInRange(
    options.particleCount,
    1,
    MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    'MLS-MPM particleCount'
  );
  const seed = options.seed ?? 1;
  validateUnsignedInteger(seed, 'MLS-MPM seed');
  const bounds = options.bounds ?? [0.14, 0.12, 0.5, 0.82];
  validateParticleBounds(bounds);
  const velocity = options.velocity ?? [0, 0];
  validateVelocity(velocity, MAXIMUM_VELOCITY, 'MLS-MPM seed velocity');

  const data = new Float32Array(options.particleCount * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT);
  const boundsWidth = bounds[2] - bounds[0];
  const boundsHeight = bounds[3] - bounds[1];
  const aspect = boundsWidth / boundsHeight;
  const columnCount = Math.max(1, Math.ceil(Math.sqrt(options.particleCount * aspect)));
  const rowCount = Math.ceil(options.particleCount / columnCount);
  let randomState = seed >>> 0;
  for (let particleIndex = 0; particleIndex < options.particleCount; particleIndex++) {
    const column = particleIndex % columnCount;
    const row = Math.floor(particleIndex / columnCount);
    randomState = advanceRandomState(randomState);
    const jitterX = randomState / 0x1_0000_0000 - 0.5;
    randomState = advanceRandomState(randomState);
    const jitterY = randomState / 0x1_0000_0000 - 0.5;
    const normalizedX = (column + 0.5 + jitterX * 0.35) / columnCount;
    const normalizedY = (row + 0.5 + jitterY * 0.35) / rowCount;
    const valueOffset = particleIndex * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT;
    data[valueOffset] = bounds[0] + normalizedX * boundsWidth;
    data[valueOffset + 1] = bounds[1] + normalizedY * boundsHeight;
    data[valueOffset + 2] = velocity[0];
    data[valueOffset + 3] = velocity[1];
    data[valueOffset + 8] = 1;
  }
  return data;
}

/** @internal Packs the cross-stage 80-byte uniform ABI for one validated stable substep. */
export function makeMLSMPMFluidSubstepUniformData(
  options: MLSMPMFluidSubstepUniformOptions
): Float32Array {
  validateGridSize(options.gridSize);
  validateIntegerInRange(
    options.particleCount,
    1,
    MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    'MLS-MPM particleCount'
  );
  validateBoundaryCells(options.boundaryCells, options.gridSize);
  validateNumberInRange(options.particleMass, 0.001, MAXIMUM_PARTICLE_MASS, 'MLS-MPM particleMass');
  validateNumberInRange(options.restDensity, 0.1, 100, 'MLS-MPM restDensity');
  validateNumberInRange(options.stiffness, 0, 100, 'MLS-MPM stiffness');
  validateNumberInRange(options.velocityDamping, 0, 20, 'MLS-MPM velocityDamping');
  validateNumberInRange(options.maxVelocity, 0.1, MAXIMUM_VELOCITY, 'MLS-MPM maxVelocity');
  validateStepOptions(options.step);
  const stableDeltaTime = getMLSMPMFluidStableDeltaTime({
    gridSize: options.gridSize,
    restDensity: options.restDensity,
    stiffness: options.stiffness,
    maxVelocity: options.maxVelocity
  });
  if (options.step.deltaTime > stableDeltaTime) {
    throw new Error(
      `MLS-MPM substep deltaTime must not exceed the stable bound ${stableDeltaTime}.`
    );
  }
  const fixedPointBounds = getMLSMPMFluidFixedPointBounds(options);

  const gravity = options.step.gravity ?? [0, -9.81];
  const force = options.step.force;
  const data = new Float32Array(MLS_MPM_FLUID_UNIFORM_FLOAT_COUNT);
  data.set(
    [options.gridSize[0], options.gridSize[1], options.step.deltaTime, options.particleCount],
    MLS_MPM_FLUID_UNIFORM_OFFSETS.gridSizeDeltaTime
  );
  data.set(
    [options.particleMass, options.restDensity, options.stiffness, options.velocityDamping],
    MLS_MPM_FLUID_UNIFORM_OFFSETS.material
  );
  data.set(
    [gravity[0], gravity[1], options.boundaryCells, options.maxVelocity],
    MLS_MPM_FLUID_UNIFORM_OFFSETS.gravityBoundary
  );
  data.set(
    force ? [force.position[0], force.position[1], force.radius, 1] : [0, 0, 1, 0],
    MLS_MPM_FLUID_UNIFORM_OFFSETS.forcePositionRadius
  );
  data.set(
    [
      force?.vector[0] ?? 0,
      force?.vector[1] ?? 0,
      fixedPointBounds.massFixedPointScale,
      fixedPointBounds.velocityFixedPointScale
    ],
    MLS_MPM_FLUID_UNIFORM_OFFSETS.forceVectorScales
  );
  return data;
}

function resolveMLSMPMFluidSimulationProps(
  props: MLSMPMFluidSimulationProps
): ResolvedMLSMPMFluidSimulationProps {
  const mutableGridSize = props.gridSize ?? DEFAULT_MLS_MPM_FLUID_GRID_SIZE;
  const gridSize: [number, number] = [mutableGridSize[0], mutableGridSize[1]];
  validateGridSize(gridSize);
  const boundaryCells = props.boundaryCells ?? DEFAULT_BOUNDARY_CELLS;
  validateBoundaryCells(boundaryCells, gridSize);
  const particleMass = props.particleMass ?? DEFAULT_PARTICLE_MASS;
  const restDensity = props.restDensity ?? DEFAULT_REST_DENSITY;
  const stiffness = props.stiffness ?? DEFAULT_STIFFNESS;
  const velocityDamping = props.velocityDamping ?? DEFAULT_VELOCITY_DAMPING;
  const maxVelocity = props.maxVelocity ?? DEFAULT_MAXIMUM_VELOCITY;
  validateNumberInRange(particleMass, 0.001, MAXIMUM_PARTICLE_MASS, 'MLS-MPM particleMass');
  validateNumberInRange(restDensity, 0.1, 100, 'MLS-MPM restDensity');
  validateNumberInRange(stiffness, 0, 100, 'MLS-MPM stiffness');
  validateNumberInRange(velocityDamping, 0, 20, 'MLS-MPM velocityDamping');
  validateNumberInRange(maxVelocity, 0.1, MAXIMUM_VELOCITY, 'MLS-MPM maxVelocity');

  if (props.initialParticles && props.initialParticles.length === 0) {
    throw new Error('MLS-MPM initialParticles must contain at least one particle.');
  }
  if (
    props.initialParticles &&
    props.particleCount !== undefined &&
    props.particleCount !== props.initialParticles.length
  ) {
    throw new Error('MLS-MPM particleCount must match initialParticles.length.');
  }
  const particleCount =
    props.initialParticles?.length ?? props.particleCount ?? DEFAULT_MLS_MPM_FLUID_PARTICLE_COUNT;
  validateIntegerInRange(
    particleCount,
    1,
    MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    'MLS-MPM particleCount'
  );
  const seed = props.seed ?? 1;
  validateUnsignedInteger(seed, 'MLS-MPM seed');
  const initialParticleData = props.initialParticles
    ? packMLSMPMParticles(props.initialParticles, maxVelocity, gridSize, boundaryCells)
    : clampParticleDataToInterior(
        makeMLSMPMParticleData({particleCount, seed}),
        gridSize,
        boundaryCells
      );
  getMLSMPMFluidFixedPointBounds({particleCount, particleMass, maxVelocity});

  return {
    id: props.id || 'mls-mpm-fluid-simulation',
    gridSize: Object.freeze(gridSize),
    particleCount,
    boundaryCells,
    particleMass,
    restDensity,
    stiffness,
    velocityDamping,
    maxVelocity,
    initialParticleData
  };
}

function getMLSMPMFluidSupportForResolvedProps(
  device: Device,
  props: ResolvedMLSMPMFluidSimulationProps
): MLSMPMFluidSimulationSupport {
  if (device.type !== 'webgpu') {
    return {supported: false, reason: 'MLSMPMFluidSimulation requires a WebGPU device.'};
  }
  if (device.limits.maxStorageBuffersPerShaderStage < 3) {
    return {
      supported: false,
      reason: 'MLSMPMFluidSimulation requires three compute-stage storage buffers.'
    };
  }
  if (
    device.limits.maxComputeInvocationsPerWorkgroup < MLS_MPM_FLUID_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < MLS_MPM_FLUID_WORKGROUP_SIZE
  ) {
    return {
      supported: false,
      reason: `MLSMPMFluidSimulation requires ${MLS_MPM_FLUID_WORKGROUP_SIZE} compute invocations per workgroup.`
    };
  }

  const particleBufferByteLength = props.particleCount * MLS_MPM_FLUID_PARTICLE_BYTE_LENGTH;
  const gridCellCount = props.gridSize[0] * props.gridSize[1];
  const gridBufferByteLength = gridCellCount * MLS_MPM_FLUID_GRID_CELL_BYTE_LENGTH;
  const maximumStorageBufferByteLength = Math.min(
    device.limits.maxBufferSize,
    device.limits.maxStorageBufferBindingSize
  );
  if (
    particleBufferByteLength > maximumStorageBufferByteLength ||
    gridBufferByteLength > maximumStorageBufferByteLength
  ) {
    return {
      supported: false,
      reason: 'MLSMPMFluidSimulation buffers exceed maxBufferSize or maxStorageBufferBindingSize.'
    };
  }
  const particleWorkgroupCount = Math.ceil(props.particleCount / MLS_MPM_FLUID_WORKGROUP_SIZE);
  const gridWorkgroupCount = Math.ceil(gridCellCount / MLS_MPM_FLUID_WORKGROUP_SIZE);
  if (
    particleWorkgroupCount > device.limits.maxComputeWorkgroupsPerDimension ||
    gridWorkgroupCount > device.limits.maxComputeWorkgroupsPerDimension
  ) {
    return {
      supported: false,
      reason: 'MLSMPMFluidSimulation dispatch exceeds maxComputeWorkgroupsPerDimension.'
    };
  }
  return {supported: true};
}

function packMLSMPMParticles(
  particles: readonly MLSMPMParticle[],
  maxVelocity: number,
  gridSize: readonly [number, number],
  boundaryCells: number
): Float32Array {
  if (particles.length < 1 || particles.length > MAX_MLS_MPM_FLUID_PARTICLE_COUNT) {
    throw new Error(
      `MLS-MPM particles length must be in [1, ${MAX_MLS_MPM_FLUID_PARTICLE_COUNT}].`
    );
  }
  const interiorBounds = getInteriorPositionBounds(gridSize, boundaryCells);
  const data = new Float32Array(particles.length * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT);
  particles.forEach((particle, particleIndex) => {
    validateVector(particle.position, 0, 1, `MLS-MPM particle ${particleIndex} position`);
    const velocity = particle.velocity ?? [0, 0];
    validateVelocity(velocity, maxVelocity, `MLS-MPM particle ${particleIndex} velocity`);
    const valueOffset = particleIndex * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT;
    data[valueOffset] = clamp(particle.position[0], interiorBounds[0], interiorBounds[2]);
    data[valueOffset + 1] = clamp(particle.position[1], interiorBounds[1], interiorBounds[3]);
    data[valueOffset + 2] = velocity[0];
    data[valueOffset + 3] = velocity[1];
    data[valueOffset + 8] = 1;
  });
  return data;
}

function validateGridSize(gridSize: readonly [number, number]): void {
  validateIntegerInRange(
    gridSize[0],
    MINIMUM_GRID_DIMENSION,
    MAXIMUM_GRID_DIMENSION,
    'MLS-MPM grid width'
  );
  validateIntegerInRange(
    gridSize[1],
    MINIMUM_GRID_DIMENSION,
    MAXIMUM_GRID_DIMENSION,
    'MLS-MPM grid height'
  );
}

function validateBoundaryCells(boundaryCells: number, gridSize: readonly [number, number]): void {
  const maximumBoundaryCells = Math.floor(Math.min(gridSize[0], gridSize[1]) / 4);
  validateIntegerInRange(boundaryCells, 1, maximumBoundaryCells, 'MLS-MPM boundaryCells');
}

function validateStepOptions(options: MLSMPMFluidSimulationStepOptions): void {
  validateNumberInRange(
    options.deltaTime,
    MINIMUM_TIME_STEP,
    MAXIMUM_TIME_STEP,
    'MLS-MPM deltaTime'
  );
  validateVector(
    options.gravity ?? [0, -9.81],
    -MAXIMUM_GRAVITY_COMPONENT,
    MAXIMUM_GRAVITY_COMPONENT,
    'MLS-MPM gravity'
  );
  if (options.force) {
    validateVector(options.force.position, 0, 1, 'MLS-MPM force position');
    validateNumberInRange(options.force.radius, 0.001, 1, 'MLS-MPM force radius');
    validateVector(
      options.force.vector,
      -MAXIMUM_FORCE_COMPONENT,
      MAXIMUM_FORCE_COMPONENT,
      'MLS-MPM force vector'
    );
  }
}

function validateParticleBounds(bounds: readonly [number, number, number, number]): void {
  bounds.forEach((value, index) =>
    validateNumberInRange(value, 0, 1, `MLS-MPM seed bounds[${index}]`)
  );
  if (bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) {
    throw new Error('MLS-MPM seed bounds must have positive width and height.');
  }
}

function validateVector(
  vector: readonly [number, number],
  minimum: number,
  maximum: number,
  name: string
): void {
  validateNumberInRange(vector[0], minimum, maximum, `${name}.x`);
  validateNumberInRange(vector[1], minimum, maximum, `${name}.y`);
}

function validateVelocity(
  velocity: readonly [number, number],
  maximumMagnitude: number,
  name: string
): void {
  validateVector(velocity, -maximumMagnitude, maximumMagnitude, name);
  if (Math.hypot(velocity[0], velocity[1]) > maximumMagnitude) {
    throw new Error(`${name} magnitude must not exceed ${maximumMagnitude}.`);
  }
}

function validateNumberInRange(
  value: number,
  minimum: number,
  maximum: number,
  name: string
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be a finite number in [${minimum}, ${maximum}].`);
  }
}

function validateIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  name: string
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer in [${minimum}, ${maximum}].`);
  }
}

function validateUnsignedInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error(`${name} must be an unsigned 32-bit integer.`);
  }
}

function advanceRandomState(state: number): number {
  return (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
}

function getBoundedPowerOfTwoScale(maximumScale: number): number {
  const boundedScale = Math.min(Math.floor(maximumScale), MLS_MPM_FLUID_MAX_FIXED_POINT_SCALE);
  if (boundedScale < 1) {
    throw new Error('MLS-MPM fixed-point accumulation has no safe integer scale.');
  }
  return 2 ** Math.floor(Math.log2(boundedScale));
}

function getInteriorPositionBounds(
  gridSize: readonly [number, number],
  boundaryCells: number
): readonly [number, number, number, number] {
  const minimumX = boundaryCells / (gridSize[0] - 1);
  const minimumY = boundaryCells / (gridSize[1] - 1);
  return [minimumX, minimumY, 1 - minimumX, 1 - minimumY];
}

function clampParticleDataToInterior(
  particleData: Float32Array,
  gridSize: readonly [number, number],
  boundaryCells: number
): Float32Array {
  const bounds = getInteriorPositionBounds(gridSize, boundaryCells);
  for (
    let valueOffset = 0;
    valueOffset < particleData.length;
    valueOffset += MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT
  ) {
    particleData[valueOffset] = clamp(particleData[valueOffset], bounds[0], bounds[2]);
    particleData[valueOffset + 1] = clamp(particleData[valueOffset + 1], bounds[1], bounds[3]);
  }
  return particleData;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
