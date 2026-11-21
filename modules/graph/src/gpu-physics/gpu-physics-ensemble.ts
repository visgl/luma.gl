// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CommandEncoder, Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding
} from '../gpu-core/gpu-command-graph';
import {
  GPURigidBodyWorld,
  type GPURigidBodyHeightFieldEdit,
  type GPURigidBodyWorldProps
} from './gpu-rigid-body-world';
import {GPUPhysicsEnsembleTerrain} from './gpu-physics-ensemble-terrain';
import type {GPURigidBodyTerrainStreamProps} from './rigid-body-terrain-stream';
import {getRigidBodyHeightFieldPageWords} from './rigid-body-height-field';
import {getTerrainAtlasBytes, type GPUPhysicsTerrainAtlasPool} from './rigid-body-terrain-atlas';

export type GPUPhysicsEnsembleProps = {
  /** All instances share solver settings and topology, but have independent dynamic state. */
  template: Omit<
    GPURigidBodyWorldProps,
    | 'joints'
    | 'triggers'
    | 'continuous'
    | 'collisionPartitionSize'
    | 'ensembleBodiesPerInstance'
    | 'ensembleTerrainSlots'
    | 'ensembleTerrainAtlas'
    | 'maximumPairs'
  >;
  instances: number;
  /** Template-local indices of vacant native height-field slots reserved per instance. */
  terrainSlots?: readonly number[];
  /** Optional shared atlas pools. Omit to give every reserved slot private storage. */
  terrainAtlas?: readonly GPUPhysicsTerrainAtlasPool[];
  /** Shared power-of-two contact capacity. Overflow rejects the entire ensemble step. */
  maximumPairs: number;
  /** Retained world buffers plus compiled graph scratch; excludes driver and compilation peaks. */
  maximumResidentBytes: number;
};

/** Fixed-membership ensemble: one storage allocation and solver graph for many local worlds. */
export class GPUPhysicsEnsemble {
  readonly world: GPURigidBodyWorld;
  readonly bodiesPerInstance: number;
  readonly collidersPerInstance: number;
  /** Writable terrain slots in template-local collider order. */
  readonly terrainSlots: readonly number[];
  readonly instances: number;
  /** Number of chassis in each copy of the template. */
  readonly vehiclesPerInstance: number;
  private graph!: CompiledGPUCommandGraph<undefined>;
  private encoding?: GPUCommandGraphEncoding;
  private destroyed = false;
  private preparing = false;
  private resetBytes = 0;
  private terrainStreamer?: GPUPhysicsEnsembleTerrain;
  private directTerrain = false;
  private readonly minimumTerrainBytes: number;

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
    if (template.vehicle && template.vehicles) throw new Error('Choose vehicle or vehicles');
    const templateVehicles = template.vehicles ?? (template.vehicle ? [template.vehicle] : []);
    this.vehiclesPerInstance = templateVehicles.length;
    this.instances = props.instances;
    this.bodiesPerInstance = template.bodies.length;
    this.collidersPerInstance = colliderCount;
    this.terrainSlots = Object.freeze([...(props.terrainSlots ?? [])]);
    let minimumTerrainBytes = 0;
    if (this.terrainSlots.length) {
      const shapes = template.bodies.flatMap(body =>
        body.shape ? [body.shape] : body.colliders.map(collider => collider.shape)
      );
      if (new Set(this.terrainSlots).size !== this.terrainSlots.length)
        throw new Error('Invalid ensemble terrain slots');
      for (const index of this.terrainSlots) {
        const shape = shapes[index];
        if (!Number.isSafeInteger(index) || shape?.type !== 'height-field' || shape.field.heights)
          throw new Error('Invalid ensemble terrain slot');
        minimumTerrainBytes +=
          4 * getRigidBodyHeightFieldPageWords(shape.field.width, shape.field.height);
      }
    }
    this.minimumTerrainBytes = props.terrainAtlas
      ? getTerrainAtlasBytes(props.terrainAtlas)
      : minimumTerrainBytes * this.instances;
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
      vehicle: undefined,
      vehicles: Array.from({length: props.instances}, (_, instance) =>
        templateVehicles.map(vehicle => ({
          ...vehicle,
          chassis: vehicle.chassis + instance * this.bodiesPerInstance,
          terrainCollider: vehicle.terrainCollider + instance * colliderCount,
          additionalTerrainColliders: vehicle.additionalTerrainColliders?.map(
            collider => collider + instance * colliderCount
          )
        }))
      ).flat(),
      publicationBounds: template.publicationBounds
        ? Array.from({length: props.instances}, () => template.publicationBounds!).flat()
        : undefined,
      broadPhase: 'hierarchical-grid',
      solver: 'parallel',
      failurePolicy: 'rollback',
      maximumPairs: props.maximumPairs,
      collisionPartitionSize: colliderCount,
      ensembleBodiesPerInstance: this.bodiesPerInstance,
      ensembleTerrainAtlas: props.terrainAtlas,
      ensembleTerrainSlots: this.terrainSlots.length
        ? Array.from({length: this.instances}, (_, instance) =>
            this.terrainSlots.map(collider => instance * colliderCount + collider)
          ).flat()
        : undefined
    });
  }

  static async create(device: Device, props: GPUPhysicsEnsembleProps): Promise<GPUPhysicsEnsemble> {
    const ensemble = new GPUPhysicsEnsemble(props);
    try {
      if (
        ensemble.minimumTerrainBytes >
        Math.min(device.limits.maxBufferSize, device.limits.maxStorageBufferBindingSize)
      )
        throw new Error('Ensemble terrain atlas exceeds device limits');
      if (
        ensemble.minimumTerrainBytes > props.maximumResidentBytes ||
        ensemble.world.getCapacityInfo().ownedBufferBytes > props.maximumResidentBytes
      )
        throw new Error('Ensemble residency budget exhausted');
      const commands = new GPUCommandGraph<undefined>(device);
      ensemble.world.addToGraph(commands);
      ensemble.graph = await commands.compileAsync();
      ensemble.resetBytes = ensemble.world.initializeEnsembleReset();
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
      this.preparing ||
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

  /** Map a template collider to a fused world query or contact index. */
  getColliderIndex(instance: number, collider: number): number {
    this.getBodyIndex(instance, 0);
    if (!Number.isSafeInteger(collider) || collider < 0 || collider >= this.collidersPerInstance)
      throw new Error('Invalid ensemble collider');
    return instance * this.collidersPerInstance + collider;
  }

  /** Publish predecoded tiles directly to one instance between submissions. */
  setHeightFieldTiles(instance: number, edits: readonly GPURigidBodyHeightFieldEdit[]): void {
    if (this.terrainStreamer) throw new Error('Terrain slots are owned by the ensemble streamer');
    this.publishTerrain([{instance, edits}]);
    this.directTerrain ||= edits.length > 0;
  }

  /** Create the single provider streamer that owns this ensemble's reserved slots. */
  createTerrainStreamer(props: GPURigidBodyTerrainStreamProps): GPUPhysicsEnsembleTerrain {
    this.getBodyIndex(0, 0);
    if (!this.terrainSlots.length || this.terrainStreamer || this.directTerrain)
      throw new Error('Ensemble terrain streamer unavailable');
    this.terrainStreamer = new GPUPhysicsEnsembleTerrain(
      props,
      this.terrainSlots,
      instance => {
        this.getBodyIndex(instance, 0);
      },
      windows => this.publishTerrain(windows)
    );
    return this.terrainStreamer;
  }

  /** Translate template-local edits only after every slot is validated. */
  private publishTerrain(
    windows: readonly {instance: number; edits: readonly GPURigidBodyHeightFieldEdit[]}[]
  ): void {
    this.world.setHeightFieldTiles(
      windows.flatMap(({instance, edits}) => {
        const start = this.getColliderIndex(instance, 0);
        return edits.map(edit => {
          if (!this.terrainSlots.includes(edit.collider))
            throw new Error('Invalid ensemble terrain slot');
          return {...edit, collider: start + edit.collider};
        });
      })
    );
  }

  /** Map a template vehicle to its index for telemetry and GPU wheel poses. */
  getVehicleIndex(instance: number, vehicle: number): number {
    this.getBodyIndex(instance, 0);
    if (!Number.isSafeInteger(vehicle) || vehicle < 0 || vehicle >= this.vehiclesPerInstance)
      throw new Error('Invalid ensemble vehicle');
    return instance * this.vehiclesPerInstance + vehicle;
  }

  /** Update one vehicle, waking only its instance and respecting its enabled flag. */
  setVehicleControls(
    instance: number,
    vehicle: number,
    throttle: number,
    steering: number,
    brake: number
  ): void {
    this.world.setVehicleControls(
      throttle,
      steering,
      brake,
      this.getVehicleIndex(instance, vehicle)
    );
  }

  setActive(instance: number, active: boolean): void {
    this.getBodyIndex(instance, 0);
    this.world.setEnsembleActive(instance, active);
  }

  wake(instance: number): void {
    this.getBodyIndex(instance, 0);
    this.world.wakeEnsembleInstance(instance);
  }

  async reset(instance: number): Promise<void> {
    this.getBodyIndex(instance, 0);
    this.preparing = true;
    try {
      if (!(await this.world.readSimulationDiagnostics()).complete)
        throw new Error('Reconstruct after shared ensemble failure');
      this.world.resetEnsembleInstance(instance);
    } finally {
      this.preparing = false;
    }
  }

  async readStatus() {
    const state = await this.world.readEnsembleState();
    return {
      activeInstances: state[0],
      activeBodies: state[0] * this.bodiesPerInstance,
      instances: Array.from({length: this.instances}, (_, instance) => ({
        enabled: Boolean(state[16 + instance * 8]),
        active: Boolean(state[17 + instance * 8]),
        acceptedSteps: state[18 + instance * 8],
        rejectedSteps: state[19 + instance * 8],
        sharedFailure: Boolean(state[20 + instance * 8])
      }))
    };
  }

  /** One graph encoding per step regardless of instance count. No submission or readback. */
  encode(encoder: CommandEncoder, steps = 1): void {
    if (
      this.destroyed ||
      this.preparing ||
      !Number.isSafeInteger(steps) ||
      steps < 0 ||
      steps > 1024
    )
      throw new Error('Invalid ensemble step');
    for (let step = 0; step < steps; step++)
      this.encoding = this.graph.encode(encoder, {parameters: undefined});
  }

  /** Last-step GPU work and copied payload sizes, read explicitly outside the simulation loop. */
  readWorkStatistics() {
    return this.world.readEnsembleWork();
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
      residentBytes: worldBufferBytes + graphTransientBytes + this.resetBytes,
      checkpointBytes: this.resetBytes,
      terrainAtlas: this.world.getTerrainAtlasStats()
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    if (this.preparing) throw new Error('Ensemble operation pending');
    this.terrainStreamer?.release();
    this.graph?.destroy();
    this.world.destroy();
    this.destroyed = true;
  }
}
