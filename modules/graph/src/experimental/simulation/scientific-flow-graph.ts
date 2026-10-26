// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type CommandEncoder, type ComputePass, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding
} from '../../gpu-core';
import {ScientificFlowCompute} from './scientific-flow-compute';
import {ScientificFlowField, type ScientificVectorFieldInput} from './scientific-flow-field';

export type ScientificFlowGraphProps = {
  input: ScientificVectorFieldInput;
  /** Optional following snapshot; requires timeRange. Both snapshots share one grid. */
  nextInput?: ScientificVectorFieldInput;
  timeRange?: readonly [number, number];
  particleCount?: number;
  lifetime?: number;
  seed?: number;
  bounds?: readonly [number, number, number, number];
  coordinates?: 'cartesian' | 'lnglat';
  integrator?: 'rk2' | 'rk4';
};

/** Scientific upload -> bilinear sampling -> Runge–Kutta integration -> GPU storage buffer. */
export class ScientificFlowGraph {
  private currentField: ScientificFlowField;
  private readonly fieldOptions: Pick<ScientificFlowGraphProps, 'bounds' | 'coordinates'>;
  private nextField: ScientificFlowField;
  readonly simulation: ScientificFlowCompute;
  readonly commandGraph: CompiledGPUCommandGraph<{deltaTime: number; substeps: number}>;
  private readonly device: Device;

  constructor(device: Device, props: ScientificFlowGraphProps) {
    this.device = device;
    this.fieldOptions = {bounds: props.bounds, coordinates: props.coordinates};
    if (Boolean(props.nextInput) !== Boolean(props.timeRange)) {
      throw new Error('nextInput and timeRange must be supplied together');
    }
    this.currentField = new ScientificFlowField(device, props);
    this.nextField = this.field;
    let simulation: ScientificFlowCompute | undefined;
    try {
      if (props.nextInput)
        this.nextField = new ScientificFlowField(device, {...props, input: props.nextInput});
      simulation = this.simulation = new ScientificFlowCompute(device, this.field, {
        particleCount: props.particleCount ?? 65536,
        lifetime: props.lifetime ?? 20,
        seed: props.seed ?? 1,
        integrator: props.integrator
      });
      if (props.timeRange)
        this.simulation.setTimeInterval(this.field, this.nextField, props.timeRange);
      const graph = new GPUCommandGraph<{deltaTime: number; substeps: number}>(device, {
        id: 'scientific-flow'
      });
      const byteLength = this.simulation.output.byteLength;
      const previous = graph.importBuffer({id: 'flow-previous', byteLength, usage: Buffer.STORAGE});
      const next = graph.importBuffer({id: 'flow-next', byteLength, usage: Buffer.STORAGE});
      const uniforms = graph.importBuffer(
        {id: 'flow-uniforms', byteLength: 64, usage: Buffer.UNIFORM},
        this.simulation.uniforms
      );
      const textureDescriptor = {
        width: this.field.texture.width,
        height: this.field.texture.height,
        format: 'rgba32float' as const,
        usage: Texture.SAMPLE
      };
      const velocity = graph.importTexture({id: 'flow-velocity', ...textureDescriptor});
      const nextVelocity = graph.importTexture({id: 'flow-next-velocity', ...textureDescriptor});
      graph.addComputePass({
        id: 'advect-particles',
        resources: [
          {buffer: uniforms, usage: 'uniform'},
          {buffer: previous, usage: 'storage-read'},
          {buffer: next, usage: 'storage-write'},
          {texture: velocity, usage: 'sampled'},
          {texture: nextVelocity, usage: 'sampled'}
        ],
        workload: {
          operation: 'RungeKuttaAdvection',
          commandCount: 1,
          maximumWorkgroupCount: Math.ceil(this.simulation.particleCount / 128),
          maximumInvocationCount: Math.ceil(this.simulation.particleCount / 128) * 128,
          readByteLength: byteLength,
          writeByteLength: byteLength
        },
        compile: () => ({
          encode: ({computePass, parameters}) =>
            this.simulation.encode(computePass, parameters.deltaTime, parameters.substeps)
        })
      });
      this.commandGraph = graph.compile();
    } catch (error) {
      simulation?.destroy();
      this.field.destroy();
      this.nextField.destroy();
      throw error;
    }
  }

  /** Record one bounded step into the caller's compute pass. Submit before encoding another step. */
  encode(pass: ComputePass, deltaTime: number): void {
    this.simulation.encode(pass, deltaTime);
  }

  /** Advance by at most 1/30 second and submit. No particle readback is performed. */
  step(deltaTime: number): Buffer {
    this.simulation.validateStep(deltaTime);
    const encoder = this.device.createCommandEncoder();
    this.record(encoder, deltaTime);
    this.device.submit(encoder.finish());
    return this.output;
  }

  /** Encode the compiled graph and return its inspection handle; the caller controls submission. */
  record(encoder: CommandEncoder, deltaTime: number, substeps = 1): GPUCommandGraphEncoding {
    this.simulation.validateStep(deltaTime, substeps);
    return this.commandGraph.encode(encoder, {
      parameters: {deltaTime, substeps},
      textures: {
        'flow-velocity': this.field.texture,
        'flow-next-velocity': this.nextField.texture
      },
      buffers: {
        'flow-previous': this.output,
        'flow-next': this.previous
      }
    });
  }

  get field(): ScientificFlowField {
    return this.currentField;
  }

  /** Elapsed simulation time in seconds, initialized from timeRange for temporal fields. */
  get time(): number {
    return this.simulation.time;
  }

  /** Seconds remaining in the resident interval, or infinity for a steady field. */
  get remainingTime(): number {
    return this.simulation.remainingTime;
  }

  /** Advance an interval using half-cell/1/30-second bounded substeps in one GPU dispatch. */
  advance(deltaTime: number): Buffer {
    const substeps = Math.max(1, Math.ceil(deltaTime / this.simulation.maximumTimeStep));
    const stepTime = deltaTime / substeps;
    this.simulation.validateStep(stepTime, substeps);
    const encoder = this.device.createCommandEncoder();
    this.record(encoder, stepTime, substeps);
    this.device.submit(encoder.finish());
    return this.output;
  }

  /** At the interval endpoint, retain its last snapshot and upload the following one. */
  setNextSnapshot(input: ScientificVectorFieldInput, endTime: number): void {
    // Submit previously recorded commands before rotating or destroying their textures.
    if (this.nextField === this.field) throw new Error('A temporal field pair is required');
    const nextField = new ScientificFlowField(this.device, {
      input,
      ...this.fieldOptions
    });
    try {
      this.simulation.setTimeInterval(this.nextField, nextField, [this.time, endTime]);
    } catch (error) {
      nextField.destroy();
      throw error;
    }
    this.field.destroy();
    this.currentField = this.nextField;
    this.nextField = nextField;
  }

  get output(): Buffer {
    return this.simulation.output;
  }

  get previous(): Buffer {
    return this.simulation.previous;
  }

  destroy(): void {
    this.commandGraph.destroy();
    this.simulation.destroy();
    this.field.destroy();
    this.nextField.destroy();
  }
}
