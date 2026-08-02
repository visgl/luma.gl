// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder, Device, Sampler, Texture} from '@luma.gl/core';
import {Buffer, Texture as TextureResource} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GPUCommandGraphStats,
  type GraphBufferHandle,
  type GraphTextureView
} from '../gpu-primitives/gpu-command-graph';
import {
  VOLUMETRIC_FIRE_COMBUSTION_ADVECTION_BINDINGS,
  VOLUMETRIC_FIRE_COMBUSTION_ADVECTION_SHADER,
  VOLUMETRIC_FIRE_DIVERGENCE_PRESSURE_CLEAR_BINDINGS,
  VOLUMETRIC_FIRE_DIVERGENCE_PRESSURE_CLEAR_SHADER,
  VOLUMETRIC_FIRE_PRESSURE_JACOBI_BINDINGS,
  VOLUMETRIC_FIRE_PRESSURE_JACOBI_SHADER,
  VOLUMETRIC_FIRE_PRESSURE_PROJECTION_BINDINGS,
  VOLUMETRIC_FIRE_PRESSURE_PROJECTION_SHADER,
  VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH,
  VOLUMETRIC_FIRE_SIMULATION_UNIFORM_FLOAT_COUNT,
  VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS,
  VOLUMETRIC_FIRE_MAX_EMITTERS,
  VOLUMETRIC_FIRE_VELOCITY_ADVECTION_BINDINGS,
  VOLUMETRIC_FIRE_VELOCITY_ADVECTION_SHADER,
  VOLUMETRIC_FIRE_WORKGROUP_SIZE
} from './volumetric-fire-simulation-shaders';

export const DEFAULT_VOLUMETRIC_FIRE_DIMENSIONS = [64, 96, 64] as const;
export const DEFAULT_VOLUMETRIC_FIRE_PRESSURE_ITERATIONS = 6;
export const MAX_VOLUMETRIC_FIRE_EMITTERS = VOLUMETRIC_FIRE_MAX_EMITTERS;

/** One normalized source that injects fuel, heat, smoke, and momentum into the simulation. */
export type VolumetricFireEmitter = {
  /** Normalized volume position in the inclusive [0, 1] range. */
  position: readonly [number, number, number];
  /** Normalized source radius relative to the shortest volume dimension. */
  radius: number;
  /** Smoke-density source strength. */
  density?: number;
  /** Temperature source strength. */
  temperature?: number;
  /** Combustible-fuel source strength. */
  fuel?: number;
  /** Overall source-rate multiplier. */
  rate?: number;
  /** Momentum direction and relative magnitude injected by the source. */
  velocity?: readonly [number, number, number];
  /** Momentum multiplier applied to velocity. */
  impulse?: number;
};

/** Construction props for a fixed-resolution graph-driven WebGPU fire volume. */
export type VolumetricFireSimulationProps = {
  /** Debug-resource prefix. */
  id?: string;
  /** Width, height, and depth in voxels. */
  dimensions?: readonly [number, number, number];
  /** Jacobi iterations used to project the velocity field. */
  pressureIterations?: number;
  /** Optional caller-owned r8unorm 3D solid mask with matching dimensions. */
  obstacleTexture?: Texture;
};

/** Deterministic inputs for one encoded simulation step. */
export type VolumetricFireSimulationStepOptions = {
  /** Simulation time step in seconds. */
  deltaTime: number;
  /** Absolute simulation time used by turbulence forcing. */
  time?: number;
  /** Active source records. Entries beyond the fixed capacity are ignored. */
  emitters?: readonly VolumetricFireEmitter[];
  /** Upward acceleration from hot gas. */
  buoyancy?: number;
  /** Downward force contributed by dense smoke. */
  smokeWeight?: number;
  /** Strength of analytic divergence-free turbulence. */
  turbulence?: number;
  /** Small-scale rotational confinement. */
  vorticity?: number;
  /** Velocity retained over one nominal 60 Hz step. */
  velocityDissipation?: number;
  /** Smoke density retained over one nominal 60 Hz step. */
  densityDissipation?: number;
  /** Temperature retained over one nominal 60 Hz step. */
  temperatureDissipation?: number;
  /** Fuel retained over one nominal 60 Hz step. */
  fuelDissipation?: number;
  /** Fuel consumption rate. */
  reactionRate?: number;
  /** Temperature released by consumed fuel. */
  heatRelease?: number;
  /** Smoke produced by consumed fuel. */
  smokeYield?: number;
  /** Additional height-independent cooling rate. */
  cooling?: number;
  /** Velocity retained close to the simulation boundary. */
  boundaryDamping?: number;
  /** r8unorm mask value treated as solid. */
  obstacleThreshold?: number;
  /** Spatial frequency of analytic turbulence. */
  noiseScale?: number;
  /** Clears velocity and combustion before applying this step's emitters. */
  reset?: boolean;
};

/** GPU textures exposed to volume renderers and diagnostics. */
export type VolumetricFireSimulationBindings = {
  velocityTexture: Texture;
  combustionTexture: Texture;
  obstacleTexture: Texture;
};

/**
 * Evolves an obstacle-aware reactive fire volume entirely on WebGPU.
 *
 * The caller owns time. Each encode records exactly one semi-Lagrangian advection, pressure
 * projection, and combustion step into the supplied command encoder without submitting or
 * reading GPU data.
 */
export class VolumetricFireSimulation {
  readonly device: Device;
  readonly id: string;
  readonly dimensions: readonly [number, number, number];
  readonly pressureIterations: number;
  readonly velocityTexture: Texture;
  readonly combustionTexture: Texture;
  readonly obstacleTexture: Texture;

  private readonly ownsObstacleTexture: boolean;
  private readonly uniformBuffer: Buffer;
  private readonly volumeSampler: Sampler;
  private readonly compiled: CompiledGPUCommandGraph<void>;
  private destroyed = false;

  constructor(device: Device, props: VolumetricFireSimulationProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('VolumetricFireSimulation requires WebGPU.');
    }

    this.device = device;
    this.id = props.id || 'volumetric-fire-simulation';
    const dimensions = props.dimensions ?? DEFAULT_VOLUMETRIC_FIRE_DIMENSIONS;
    const copiedDimensions: [number, number, number] = [
      dimensions[0],
      dimensions[1],
      dimensions[2]
    ];
    this.dimensions = Object.freeze(copiedDimensions);
    this.pressureIterations =
      props.pressureIterations ?? DEFAULT_VOLUMETRIC_FIRE_PRESSURE_ITERATIONS;
    validateVolumetricFireDimensions(this.dimensions, device);
    if (!Number.isInteger(this.pressureIterations) || this.pressureIterations < 1) {
      throw new Error('VolumetricFireSimulation pressureIterations must be a positive integer.');
    }
    if (props.obstacleTexture) {
      validateObstacleTexture(props.obstacleTexture, this.dimensions, device);
    }

    this.ownsObstacleTexture = !props.obstacleTexture;
    let velocityTexture: Texture | undefined;
    let combustionTexture: Texture | undefined;
    let obstacleTexture: Texture | undefined;
    let uniformBuffer: Buffer | undefined;
    let volumeSampler: Sampler | undefined;
    try {
      velocityTexture = createSimulationTexture(
        device,
        `${this.id}-velocity`,
        this.dimensions,
        'rgba16float'
      );
      combustionTexture = createSimulationTexture(
        device,
        `${this.id}-combustion`,
        this.dimensions,
        'rgba16float'
      );
      obstacleTexture =
        props.obstacleTexture ??
        device.createTexture({
          id: `${this.id}-obstacles`,
          dimension: '3d',
          width: this.dimensions[0],
          height: this.dimensions[1],
          depth: this.dimensions[2],
          format: 'r8unorm',
          usage: TextureResource.SAMPLE | TextureResource.COPY_DST
        });
      validateObstacleTexture(obstacleTexture, this.dimensions, device);

      uniformBuffer = device.createBuffer({
        id: `${this.id}-uniforms`,
        byteLength: VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
      volumeSampler = device.createSampler({
        id: `${this.id}-linear-sampler`,
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge'
      });
      this.velocityTexture = velocityTexture;
      this.combustionTexture = combustionTexture;
      this.obstacleTexture = obstacleTexture;
      this.uniformBuffer = uniformBuffer;
      this.volumeSampler = volumeSampler;
      this.compiled = this.createCommandGraph();
    } catch (error) {
      volumeSampler?.destroy();
      uniformBuffer?.destroy();
      velocityTexture?.destroy();
      combustionTexture?.destroy();
      if (this.ownsObstacleTexture) {
        obstacleTexture?.destroy();
      }
      throw error;
    }
  }

  /** Resource-allocation and scheduled-node diagnostics from the compiled command graph. */
  get stats(): GPUCommandGraphStats {
    return this.compiled.stats;
  }

  /** Returns the current GPU-resident fields without transferring them to the CPU. */
  getBindings(): VolumetricFireSimulationBindings {
    return {
      velocityTexture: this.velocityTexture,
      combustionTexture: this.combustionTexture,
      obstacleTexture: this.obstacleTexture
    };
  }

  /** Records one deterministic simulation step into a caller-owned command encoder. */
  encode(
    commandEncoder: CommandEncoder,
    options: VolumetricFireSimulationStepOptions
  ): GPUCommandGraphEncoding {
    if (this.destroyed) {
      throw new Error('VolumetricFireSimulation has been destroyed.');
    }
    this.device.writeBufferViaCommandEncoder(
      commandEncoder,
      this.uniformBuffer,
      makeVolumetricFireSimulationUniformData(this.dimensions, options)
    );
    return this.compiled.encode(commandEncoder, {parameters: undefined});
  }

  /** Releases graph-owned resources and simulation textures. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.compiled.destroy();
    this.volumeSampler.destroy();
    this.uniformBuffer.destroy();
    this.velocityTexture.destroy();
    this.combustionTexture.destroy();
    if (this.ownsObstacleTexture) {
      this.obstacleTexture.destroy();
    }
    this.destroyed = true;
  }

  private createCommandGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: `${this.id}-graph`});
    const velocity = graph.importTexture(
      getGraphTextureDescriptor('velocity', this.velocityTexture),
      this.velocityTexture
    );
    const combustion = graph.importTexture(
      getGraphTextureDescriptor('combustion', this.combustionTexture),
      this.combustionTexture
    );
    const obstacles = graph.importTexture(
      getGraphTextureDescriptor('obstacles', this.obstacleTexture),
      this.obstacleTexture
    );
    const uniforms = graph.importBuffer(
      {
        id: 'uniforms',
        byteLength: this.uniformBuffer.byteLength,
        usage: this.uniformBuffer.usage
      },
      this.uniformBuffer
    );
    const velocityScratch = graph.createTransientTexture({
      id: 'velocity-scratch',
      dimension: '3d',
      width: this.dimensions[0],
      height: this.dimensions[1],
      depth: this.dimensions[2],
      format: 'rgba16float',
      usage: TextureResource.SAMPLE | TextureResource.STORAGE
    });
    const combustionScratch = graph.createTransientTexture({
      id: 'combustion-scratch',
      dimension: '3d',
      width: this.dimensions[0],
      height: this.dimensions[1],
      depth: this.dimensions[2],
      format: 'rgba16float',
      usage: TextureResource.SAMPLE | TextureResource.STORAGE | TextureResource.COPY_SRC
    });
    const divergence = graph.createTransientTexture({
      id: 'divergence',
      dimension: '3d',
      width: this.dimensions[0],
      height: this.dimensions[1],
      depth: this.dimensions[2],
      format: 'r32float',
      usage: TextureResource.SAMPLE | TextureResource.STORAGE
    });
    const pressureA = graph.createTransientTexture({
      id: 'pressure-a',
      dimension: '3d',
      width: this.dimensions[0],
      height: this.dimensions[1],
      depth: this.dimensions[2],
      format: 'r32float',
      usage: TextureResource.SAMPLE | TextureResource.STORAGE
    });
    const pressureB = graph.createTransientTexture({
      id: 'pressure-b',
      dimension: '3d',
      width: this.dimensions[0],
      height: this.dimensions[1],
      depth: this.dimensions[2],
      format: 'r32float',
      usage: TextureResource.SAMPLE | TextureResource.STORAGE
    });

    const velocityView = graph.createTextureView(velocity, {dimension: '3d'});
    const combustionView = graph.createTextureView(combustion, {dimension: '3d'});
    const obstacleView = graph.createTextureView(obstacles, {dimension: '3d'});
    const velocityScratchView = graph.createTextureView(velocityScratch, {dimension: '3d'});
    const combustionScratchView = graph.createTextureView(combustionScratch, {dimension: '3d'});
    const divergenceView = graph.createTextureView(divergence, {dimension: '3d'});
    const pressureAView = graph.createTextureView(pressureA, {dimension: '3d'});
    const pressureBView = graph.createTextureView(pressureB, {dimension: '3d'});

    this.addAdvectVelocityPass(
      graph,
      velocityView,
      combustionView,
      obstacleView,
      velocityScratchView,
      uniforms
    );
    this.addDivergencePass(
      graph,
      velocityScratchView,
      obstacleView,
      divergenceView,
      pressureAView,
      uniforms
    );

    let pressureInput = pressureAView;
    let pressureOutput = pressureBView;
    for (let iteration = 0; iteration < this.pressureIterations; iteration++) {
      this.addJacobiPass(
        graph,
        iteration,
        pressureInput,
        divergenceView,
        obstacleView,
        pressureOutput,
        uniforms
      );
      [pressureInput, pressureOutput] = [pressureOutput, pressureInput];
    }

    this.addProjectionPass(
      graph,
      velocityScratchView,
      pressureInput,
      obstacleView,
      velocityView,
      uniforms
    );
    this.addCombustionPass(
      graph,
      combustionView,
      velocityView,
      obstacleView,
      combustionScratchView,
      uniforms
    );
    graph.addCopyPass({
      id: 'commit-combustion',
      resources: [
        {texture: combustionScratch, usage: 'copy-source'},
        {texture: combustion, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getTexture}) => {
          commandEncoder.copyTextureToTexture({
            sourceTexture: getTexture(combustionScratch),
            destinationTexture: getTexture(combustion),
            width: this.dimensions[0],
            height: this.dimensions[1],
            depthOrArrayLayers: this.dimensions[2]
          });
        }
      })
    });

    return graph.compile();
  }

  private addAdvectVelocityPass(
    graph: GPUCommandGraph<void>,
    velocityInput: GraphTextureView,
    combustionInput: GraphTextureView,
    obstacleTexture: GraphTextureView,
    velocityOutput: GraphTextureView,
    uniforms: GraphBufferHandle
  ): void {
    graph.addComputePass({
      id: 'advect-fire-velocity',
      resources: [
        {texture: velocityInput, usage: 'sampled'},
        {texture: combustionInput, usage: 'sampled'},
        {texture: obstacleTexture, usage: 'sampled'},
        {texture: velocityOutput, usage: 'storage-write'},
        {buffer: uniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-advect-velocity`,
          source: VOLUMETRIC_FIRE_VELOCITY_ADVECTION_SHADER,
          shaderLayout: {bindings: VOLUMETRIC_FIRE_VELOCITY_ADVECTION_BINDINGS}
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            computation.setBindings({
              velocityInput: getTextureView(velocityInput),
              combustionInput: getTextureView(combustionInput),
              obstacleTexture: getTextureView(obstacleTexture),
              volumeSampler: this.volumeSampler,
              velocityOutput: getTextureView(velocityOutput),
              uniforms: getBuffer(uniforms)
            });
            dispatchVolume(computation, computePass, this.dimensions);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addDivergencePass(
    graph: GPUCommandGraph<void>,
    velocityInput: GraphTextureView,
    obstacleTexture: GraphTextureView,
    divergenceOutput: GraphTextureView,
    pressureOutput: GraphTextureView,
    uniforms: GraphBufferHandle
  ): void {
    graph.addComputePass({
      id: 'measure-divergence-and-clear-pressure',
      resources: [
        {texture: velocityInput, usage: 'sampled'},
        {texture: obstacleTexture, usage: 'sampled'},
        {texture: divergenceOutput, usage: 'storage-write'},
        {texture: pressureOutput, usage: 'storage-write'},
        {buffer: uniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-divergence`,
          source: VOLUMETRIC_FIRE_DIVERGENCE_PRESSURE_CLEAR_SHADER,
          shaderLayout: {bindings: VOLUMETRIC_FIRE_DIVERGENCE_PRESSURE_CLEAR_BINDINGS}
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            computation.setBindings({
              velocityInput: getTextureView(velocityInput),
              obstacleTexture: getTextureView(obstacleTexture),
              divergenceOutput: getTextureView(divergenceOutput),
              pressureOutput: getTextureView(pressureOutput),
              uniforms: getBuffer(uniforms)
            });
            dispatchVolume(computation, computePass, this.dimensions);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addJacobiPass(
    graph: GPUCommandGraph<void>,
    iteration: number,
    pressureInput: GraphTextureView,
    divergenceInput: GraphTextureView,
    obstacleTexture: GraphTextureView,
    pressureOutput: GraphTextureView,
    uniforms: GraphBufferHandle
  ): void {
    graph.addComputePass({
      id: `project-pressure-${iteration + 1}`,
      resources: [
        {texture: pressureInput, usage: 'sampled'},
        {texture: divergenceInput, usage: 'sampled'},
        {texture: obstacleTexture, usage: 'sampled'},
        {texture: pressureOutput, usage: 'storage-write'},
        {buffer: uniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-pressure-${iteration + 1}`,
          source: VOLUMETRIC_FIRE_PRESSURE_JACOBI_SHADER,
          shaderLayout: {bindings: VOLUMETRIC_FIRE_PRESSURE_JACOBI_BINDINGS}
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            computation.setBindings({
              pressureInput: getTextureView(pressureInput),
              divergenceInput: getTextureView(divergenceInput),
              obstacleTexture: getTextureView(obstacleTexture),
              pressureOutput: getTextureView(pressureOutput),
              uniforms: getBuffer(uniforms)
            });
            dispatchVolume(computation, computePass, this.dimensions);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addProjectionPass(
    graph: GPUCommandGraph<void>,
    velocityInput: GraphTextureView,
    pressureInput: GraphTextureView,
    obstacleTexture: GraphTextureView,
    velocityOutput: GraphTextureView,
    uniforms: GraphBufferHandle
  ): void {
    graph.addComputePass({
      id: 'project-fire-velocity',
      resources: [
        {texture: velocityInput, usage: 'sampled'},
        {texture: pressureInput, usage: 'sampled'},
        {texture: obstacleTexture, usage: 'sampled'},
        {texture: velocityOutput, usage: 'storage-write'},
        {buffer: uniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-project-velocity`,
          source: VOLUMETRIC_FIRE_PRESSURE_PROJECTION_SHADER,
          shaderLayout: {bindings: VOLUMETRIC_FIRE_PRESSURE_PROJECTION_BINDINGS}
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            computation.setBindings({
              velocityInput: getTextureView(velocityInput),
              pressureInput: getTextureView(pressureInput),
              obstacleTexture: getTextureView(obstacleTexture),
              velocityOutput: getTextureView(velocityOutput),
              uniforms: getBuffer(uniforms)
            });
            dispatchVolume(computation, computePass, this.dimensions);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addCombustionPass(
    graph: GPUCommandGraph<void>,
    combustionInput: GraphTextureView,
    velocityInput: GraphTextureView,
    obstacleTexture: GraphTextureView,
    combustionOutput: GraphTextureView,
    uniforms: GraphBufferHandle
  ): void {
    graph.addComputePass({
      id: 'advect-react-and-emit',
      resources: [
        {texture: combustionInput, usage: 'sampled'},
        {texture: velocityInput, usage: 'sampled'},
        {texture: obstacleTexture, usage: 'sampled'},
        {texture: combustionOutput, usage: 'storage-write'},
        {buffer: uniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-advect-combustion`,
          source: VOLUMETRIC_FIRE_COMBUSTION_ADVECTION_SHADER,
          shaderLayout: {bindings: VOLUMETRIC_FIRE_COMBUSTION_ADVECTION_BINDINGS}
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            computation.setBindings({
              combustionInput: getTextureView(combustionInput),
              velocityInput: getTextureView(velocityInput),
              obstacleTexture: getTextureView(obstacleTexture),
              volumeSampler: this.volumeSampler,
              combustionOutput: getTextureView(combustionOutput),
              uniforms: getBuffer(uniforms)
            });
            dispatchVolume(computation, computePass, this.dimensions);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}

/** Packs one step into the public shader ABI used by every simulation kernel. */
export function makeVolumetricFireSimulationUniformData(
  dimensions: readonly [number, number, number],
  options: VolumetricFireSimulationStepOptions
): Float32Array {
  const emitters = options.emitters ?? [];
  if (!Number.isFinite(options.deltaTime) || options.deltaTime <= 0) {
    // A non-positive or non-finite step cannot produce a stable advection characteristic.
    throw new Error('Invalid volumetric fire deltaTime.');
  }
  for (
    let emitterIndex = 0;
    emitterIndex < Math.min(emitters.length, MAX_VOLUMETRIC_FIRE_EMITTERS);
    emitterIndex++
  ) {
    const emitter = emitters[emitterIndex];
    if (
      !Number.isFinite(emitter.radius) ||
      emitter.radius < 0 ||
      emitter.position.some(position => !Number.isFinite(position) || position < 0 || position > 1)
    ) {
      // Active emitters must describe a finite source inside the normalized volume.
      throw new Error('Invalid volumetric fire emitter.');
    }
  }
  const values = new Float32Array(VOLUMETRIC_FIRE_SIMULATION_UNIFORM_FLOAT_COUNT);
  values.set(
    [dimensions[0], dimensions[1], dimensions[2], options.deltaTime],
    VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.gridSizeDeltaTime
  );
  values.set(
    [options.time ?? 0, options.reset ? 1 : 0, emitters.length, 0],
    VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.timeCounts
  );
  values.set(
    [
      options.buoyancy ?? 2.2,
      options.smokeWeight ?? 0.28,
      options.turbulence ?? 0.8,
      options.vorticity ?? 0.45
    ],
    VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.forces
  );
  values.set(
    [
      options.velocityDissipation ?? 0.997,
      options.densityDissipation ?? 0.995,
      options.temperatureDissipation ?? 0.99,
      options.fuelDissipation ?? 0.985
    ],
    VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.dissipation
  );
  values.set(
    [
      options.reactionRate ?? 2.6,
      options.heatRelease ?? 1.45,
      options.smokeYield ?? 0.62,
      options.cooling ?? 0.12
    ],
    VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.reaction
  );
  values.set(
    [
      options.boundaryDamping ?? 0.72,
      options.obstacleThreshold ?? 0.5,
      options.noiseScale ?? 3.4,
      0
    ],
    VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.boundary
  );

  for (
    let emitterIndex = 0;
    emitterIndex < Math.min(emitters.length, MAX_VOLUMETRIC_FIRE_EMITTERS);
    emitterIndex++
  ) {
    const emitter = emitters[emitterIndex];
    const wordOffset =
      VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.emitters +
      emitterIndex * VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.emitterStride;
    const radiusInGridCells =
      emitter.radius * Math.min(dimensions[0], dimensions[1], dimensions[2]);
    values.set(
      [
        (emitter.position[0] - 0.5) * dimensions[0],
        (emitter.position[1] - 0.5) * dimensions[1],
        (emitter.position[2] - 0.5) * dimensions[2],
        radiusInGridCells
      ],
      wordOffset + VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.emitterPositionRadius
    );
    values.set(
      [emitter.density ?? 1, emitter.temperature ?? 1, emitter.fuel ?? 1, emitter.rate ?? 1],
      wordOffset + VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.emitterSource
    );
    values.set(
      [...(emitter.velocity ?? [0, 1, 0]), emitter.impulse ?? 1],
      wordOffset + VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.emitterVelocityImpulse
    );
  }
  values[VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS.timeCounts + 2] = Math.min(
    emitters.length,
    MAX_VOLUMETRIC_FIRE_EMITTERS
  );
  if (!values.every(Number.isFinite)) {
    // Non-finite step inputs would poison every dependent voxel in the simulation.
    throw new Error('Volumetric fire step values must be finite.');
  }
  return values;
}

function createSimulationTexture(
  device: Device,
  id: string,
  dimensions: readonly [number, number, number],
  format: 'rgba16float'
): Texture {
  return device.createTexture({
    id,
    dimension: '3d',
    width: dimensions[0],
    height: dimensions[1],
    depth: dimensions[2],
    format,
    usage:
      TextureResource.SAMPLE |
      TextureResource.STORAGE |
      TextureResource.COPY_SRC |
      TextureResource.COPY_DST
  });
}

function getGraphTextureDescriptor(id: string, texture: Texture) {
  return {
    id,
    dimension: texture.dimension,
    width: texture.width,
    height: texture.height,
    depth: texture.depth,
    format: texture.format,
    usage: texture.props.usage
  } as const;
}

function dispatchVolume(
  computation: Computation,
  computePass: Parameters<Computation['dispatch']>[0],
  dimensions: readonly [number, number, number]
): void {
  computation.dispatch(
    computePass,
    Math.ceil(dimensions[0] / VOLUMETRIC_FIRE_WORKGROUP_SIZE),
    Math.ceil(dimensions[1] / VOLUMETRIC_FIRE_WORKGROUP_SIZE),
    Math.ceil(dimensions[2] / VOLUMETRIC_FIRE_WORKGROUP_SIZE)
  );
}

function validateVolumetricFireDimensions(
  dimensions: readonly [number, number, number],
  device: Device
): void {
  const maximum = device.limits.maxTextureDimension3D;
  if (
    dimensions.some(
      dimension => !Number.isInteger(dimension) || dimension < 4 || dimension > maximum
    )
  ) {
    throw new Error('VolumetricFireSimulation dimensions must fit the WebGPU 3D texture limit.');
  }
}

function validateObstacleTexture(
  texture: Texture,
  dimensions: readonly [number, number, number],
  device: Device
): void {
  if (
    texture.device !== device ||
    texture.dimension !== '3d' ||
    texture.format !== 'r8unorm' ||
    texture.width !== dimensions[0] ||
    texture.height !== dimensions[1] ||
    texture.depth !== dimensions[2] ||
    !(texture.props.usage & TextureResource.SAMPLE)
  ) {
    throw new Error(
      'VolumetricFireSimulation obstacleTexture must be a matching r8unorm 3D texture.'
    );
  }
}
