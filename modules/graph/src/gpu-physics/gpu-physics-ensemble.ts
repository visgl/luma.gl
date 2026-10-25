// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CommandEncoder, Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding
} from '../gpu-core/gpu-command-graph';
import {GPURigidBodyWorld, type GPURigidBodyWorldProps} from './gpu-rigid-body-world';

export type GPUPhysicsEnsembleProps = {
  /** All instances share solver settings and topology, but have independent dynamic state. */
  template: Omit<
    GPURigidBodyWorldProps,
    'joints' | 'triggers' | 'continuous' | 'collisionPartitionSize' | 'maximumPairs'
  >;
  instances: number;
  /** Shared power-of-two contact capacity. Overflow rejects the entire ensemble step. */
  maximumPairs: number;
  /** Retained world buffers plus compiled graph scratch; excludes driver and compilation peaks. */
  maximumResidentBytes: number;
};

/** Fixed-membership ensemble: one storage allocation and solver graph for many local worlds. */
export class GPUPhysicsEnsemble {
  readonly world: GPURigidBodyWorld;
  readonly bodiesPerInstance: number;
  readonly instances: number;
  private graph!: CompiledGPUCommandGraph<undefined>;
  private encoding?: GPUCommandGraphEncoding;
  private destroyed = false;

  private constructor(props: GPUPhysicsEnsembleProps) {
    const template: GPURigidBodyWorldProps = props.template;
    const colliderCount = template.bodies.reduce(
      (sum, body) => sum + (body.shape ? 1 : body.colliders.length),
      0
    );
    if (
      !Number.isSafeInteger(props.instances) ||
      props.instances < 1 ||
      !template.bodies.length ||
      !colliderCount ||
      props.instances * Math.max(template.bodies.length, colliderCount) > 65535 ||
      !Number.isSafeInteger(props.maximumResidentBytes) ||
      props.maximumResidentBytes < 1 ||
      template.joints?.length ||
      template.triggers?.length ||
      template.continuous ||
      template.collisionPartitionSize
    )
      throw new Error('Invalid ensemble layout');
    this.instances = props.instances;
    this.bodiesPerInstance = template.bodies.length;
    // Repeated mesh references intentionally survive the world's single structured clone.
    const bodies = Array.from({length: props.instances}, (_, instance) =>
      template.bodies.map(body => {
        if (body.shape) return body;
        return {
          ...body,
          colliders: body.colliders.map(collider => ({
            ...collider,
            excludedColliders: collider.excludedColliders?.map(
              index => index + instance * colliderCount
            )
          }))
        };
      })
    ).flat();
    this.world = new GPURigidBodyWorld({
      ...template,
      bodies,
      publicationBounds: template.publicationBounds
        ? Array.from({length: props.instances}, () => template.publicationBounds!).flat()
        : undefined,
      broadPhase: 'hierarchical-grid',
      solver: 'parallel',
      failurePolicy: 'rollback',
      maximumPairs: props.maximumPairs,
      collisionPartitionSize: colliderCount
    });
  }

  static async create(device: Device, props: GPUPhysicsEnsembleProps): Promise<GPUPhysicsEnsemble> {
    const ensemble = new GPUPhysicsEnsemble(props);
    try {
      if (ensemble.world.getCapacityInfo().ownedBufferBytes > props.maximumResidentBytes)
        throw new Error('Ensemble residency budget exhausted');
      const commands = new GPUCommandGraph<undefined>(device);
      ensemble.world.addToGraph(commands);
      ensemble.graph = await commands.compileAsync();
      if (ensemble.getStats().residentBytes > props.maximumResidentBytes)
        throw new Error('Ensemble residency budget exhausted');
      return ensemble;
    } catch (error) {
      ensemble.destroy();
      throw error;
    }
  }

  /** Stable mapping into published poses, controls, queries and contact-event body indices. */
  getBodyIndex(instance: number, body: number): number {
    if (
      this.destroyed ||
      !Number.isSafeInteger(instance) ||
      instance < 0 ||
      instance >= this.instances ||
      !Number.isSafeInteger(body) ||
      body < 0 ||
      body >= this.bodiesPerInstance
    )
      throw new Error('Invalid ensemble body');
    return instance * this.bodiesPerInstance + body;
  }

  /** One graph encoding per step regardless of instance count. No submission or readback. */
  encode(encoder: CommandEncoder, steps = 1): void {
    if (this.destroyed || !Number.isSafeInteger(steps) || steps < 0 || steps > 1024)
      throw new Error('Invalid ensemble step');
    for (let step = 0; step < steps; step++)
      this.encoding = this.graph.encode(encoder, {parameters: undefined});
  }

  inspect() {
    return {graph: this.graph, encoding: this.encoding};
  }

  getStats() {
    const worldBufferBytes = this.world.getCapacityInfo().ownedBufferBytes;
    const graphTransientBytes = this.graph.stats.physicalTransientResourceBytes;
    return {
      instances: this.instances,
      bodies: this.world.count,
      worldBufferBytes,
      graphTransientBytes,
      residentBytes: worldBufferBytes + graphTransientBytes,
      checkpointBytes: 0
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.graph?.destroy();
    this.world.destroy();
    this.destroyed = true;
  }
}
