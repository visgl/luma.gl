// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {FlowParticleSimulation, type FlowParticleStepResult} from './flow-particle-simulation';
import {ScientificFlowField, type ScientificVectorFieldInput} from './scientific-flow-field';

/**
 * Minimal GPU-resident simulation graph:
 * scientific vector upload -> velocity sampling -> particle integration -> state texture.
 * The existing FlowParticleSimulation records and submits the GPU pass.
 */
export class ScientificFlowGraph {
  readonly field: ScientificFlowField;
  readonly simulation: FlowParticleSimulation;
  constructor(device: Device, props: {
    input: ScientificVectorFieldInput;
    particleCount?: number;
    lifetime?: number;
    seed?: number;
  }) {
    this.field = new ScientificFlowField(device, {input: props.input});
    try {
      this.simulation = new FlowParticleSimulation(device, {
        field: this.field.field,
        particleCount: props.particleCount,
        lifetime: props.lifetime,
        seed: props.seed
      });
    } catch (error) {
      this.field.destroy();
      throw error;
    }
  }
  /** Advances simulation on the GPU; output textures can be consumed by rendering. */
  step(deltaTime: number): FlowParticleStepResult {
    return this.simulation.step(deltaTime);
  }
  destroy(): void {
    this.simulation.destroy();
    this.field.destroy();
  }
}
