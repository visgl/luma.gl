// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type CommandEncoder, type ComputePass, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {ScientificFlowCompute} from './scientific-flow-compute';
import {ScientificFlowField, type ScientificVectorFieldInput} from './scientific-flow-field';

export type ScientificFlowGraphProps = {
  input: ScientificVectorFieldInput;
  particleCount?: number;
  lifetime?: number;
  seed?: number;
  bounds?: readonly [number, number, number, number];
  coordinates?: 'cartesian' | 'lnglat';
  integrator?: 'rk2' | 'rk4';
};

/** Scientific upload -> bilinear sampling -> Runge–Kutta integration -> GPU storage buffer. */
export class ScientificFlowGraph {
  readonly field: ScientificFlowField;
  readonly simulation: ScientificFlowCompute;
  readonly commandGraph: CompiledGPUCommandGraph<{deltaTime: number}>;
  private readonly device: Device;

  constructor(device: Device, props: ScientificFlowGraphProps) {
    this.device = device;
    this.field = new ScientificFlowField(device, props);
    try {
      this.simulation = new ScientificFlowCompute(device, this.field, {
        particleCount: props.particleCount ?? 65536,
        lifetime: props.lifetime ?? 20,
        seed: props.seed ?? 1,
        integrator: props.integrator
      });
      const graph = new GPUCommandGraph<{deltaTime: number}>(device, {id: 'scientific-flow'});
      const byteLength = this.simulation.output.byteLength;
      const previous = graph.importBuffer({id: 'flow-previous', byteLength, usage: Buffer.STORAGE});
      const next = graph.importBuffer({id: 'flow-next', byteLength, usage: Buffer.STORAGE});
      const uniforms = graph.importBuffer(
        {id: 'flow-uniforms', byteLength: 48, usage: Buffer.UNIFORM},
        this.simulation.uniforms
      );
      const velocity = graph.importTexture(
        {
          id: 'flow-velocity',
          width: this.field.texture.width,
          height: this.field.texture.height,
          format: 'rgba32float',
          usage: Texture.SAMPLE
        },
        this.field.texture
      );
      graph.addComputePass({
        id: 'advect-particles',
        resources: [
          {buffer: uniforms, usage: 'uniform'},
          {buffer: previous, usage: 'storage-read'},
          {buffer: next, usage: 'storage-write'},
          {texture: velocity, usage: 'sampled'}
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
            this.simulation.encode(computePass, parameters.deltaTime)
        })
      });
      this.commandGraph = graph.compile();
    } catch (error) {
      this.simulation?.destroy();
      this.field.destroy();
      throw error;
    }
  }

  /** Record one bounded step into the caller's compute pass. Submit before encoding another step. */
  encode(pass: ComputePass, deltaTime: number): void {
    this.simulation.encode(pass, deltaTime);
  }

  /** Advance by at most 1/30 second and submit. No particle readback is performed. */
  step(deltaTime: number): Buffer {
    const encoder = this.device.createCommandEncoder();
    this.record(encoder, deltaTime);
    this.device.submit(encoder.finish());
    return this.output;
  }

  /** Encode the compiled graph; the caller controls command submission. */
  record(encoder: CommandEncoder, deltaTime: number): void {
    this.commandGraph.encode(encoder, {
      parameters: {deltaTime},
      buffers: {
        'flow-previous': this.output,
        'flow-next': this.previous
      }
    });
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
  }
}
