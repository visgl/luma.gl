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
  type GPURigidBodyGPUCheckpoint,
  type GPURigidBodyCapture,
  type GPURigidBodyWorldProps
} from './gpu-rigid-body-world';

export type GPUPhysicsWorldHandle = Readonly<{id: string; generation: number}>;
export type GPUPhysicsBatchProps = {
  device: Device;
  /** Includes world buffers, reset snapshots and compiled graph transient allocations. */
  maximumResidentBytes: number;
  maximumResidentWorlds: number;
};
export type GPUPhysicsStreamedWorld = {
  template: string;
  origin: readonly [number, number, number];
  state: GPURigidBodyCapture;
};
type Slot = {
  template: string;
  world: GPURigidBodyWorld;
  graph: CompiledGPUCommandGraph<undefined>;
  checkpoint: GPURigidBodyGPUCheckpoint;
  bytes: number;
  worldBytes: number;
  handle: GPUPhysicsWorldHandle | null;
  origin: [number, number, number];
  active: boolean;
  steps: number;
  encoding?: GPUCommandGraphEncoding;
};

/**
 * Independent resident worlds sharing submissions, with bounded template-slot reuse.
 * Finish submitting encoded commands before changing residency, resetting or destroying.
 * Different worlds do not collide; this is not spatial partitioning of one interacting world.
 */
export class GPUPhysicsBatch {
  private readonly templates = new Map<string, GPURigidBodyWorldProps>();
  private readonly slots: Slot[] = [];
  private generation = 0;
  private preparing = false;
  private destroyed = false;
  private createdSlots = 0;
  private reusedSlots = 0;
  private evictedSlots = 0;

  constructor(private readonly props: GPUPhysicsBatchProps) {
    if (
      ![props.maximumResidentBytes, props.maximumResidentWorlds].every(
        value => Number.isSafeInteger(value) && value > 0
      )
    )
      throw new Error('Invalid physics residency budget');
  }

  /** Templates are copied once; mutations require a new template identity. */
  registerTemplate(id: string, props: GPURigidBodyWorldProps): void {
    this.assertIdle();
    if (this.templates.has(id)) throw new Error('Duplicate physics template');
    const definition = structuredClone(props);
    const probe = new GPURigidBodyWorld(definition);
    try {
      if (this.estimateResidentBytes(probe) > this.props.maximumResidentBytes)
        throw new Error('World and reset snapshot exceed residency budget');
      this.templates.set(id, definition);
    } finally {
      probe.destroy();
    }
  }

  /** Stream in a fresh instance. Reusing a released template slot performs GPU copies only. */
  async acquire(
    template: string,
    id: string,
    origin: readonly [number, number, number] = [0, 0, 0]
  ): Promise<GPUPhysicsWorldHandle> {
    this.assertIdle();
    const definition = this.templates.get(template);
    if (!definition || this.slots.some(slot => slot.handle?.id === id))
      throw new Error('Unknown template or duplicate world identity');
    if (origin.length !== 3 || !origin.every(Number.isFinite))
      throw new Error('Invalid world origin');
    this.preparing = true;
    try {
      let slot = this.slots.find(candidate => candidate.template === template && !candidate.handle);
      if (slot) {
        slot.checkpoint.restore();
        this.reusedSlots++;
      } else {
        const world = new GPURigidBodyWorld({
          ...structuredClone(definition),
          id: `batch-slot-${++this.generation}`
        });
        let graph: CompiledGPUCommandGraph<undefined> | undefined;
        let checkpoint: GPURigidBodyGPUCheckpoint | undefined;
        try {
          const worldBytes = world.getCapacityInfo().ownedBufferBytes;
          const expectedBytes = this.estimateResidentBytes(world);
          this.makeRoom(expectedBytes);
          const commands = new GPUCommandGraph<undefined>(this.props.device);
          world.addToGraph(commands);
          graph = await commands.compileAsync();
          const bytes = expectedBytes + graph.stats.physicalTransientResourceBytes;
          this.makeRoom(bytes);
          checkpoint = world.createGPUCheckpoint({includeRollbackScratch: false});
          checkpoint.save();
          slot = {
            template,
            world,
            graph,
            checkpoint,
            bytes,
            worldBytes,
            handle: null,
            origin: [0, 0, 0],
            active: true,
            steps: 0
          };
          this.slots.push(slot);
          this.createdSlots++;
        } catch (error) {
          checkpoint?.destroy();
          graph?.destroy();
          world.destroy();
          throw error;
        }
      }
      const handle = Object.freeze({id, generation: ++this.generation});
      slot.handle = handle;
      slot.origin = [...origin];
      slot.active = true;
      slot.steps = 0;
      slot.encoding = undefined;
      return handle;
    } finally {
      this.preparing = false;
    }
  }

  /** Explicit CPU transfer for nonresident persistence; excluded from stepping timings. */
  async streamOut(handle: GPUPhysicsWorldHandle): Promise<GPUPhysicsStreamedWorld> {
    this.assertIdle();
    const slot = this.getSlot(handle);
    this.preparing = true;
    try {
      const state = await slot.world.captureState();
      slot.handle = null;
      return {template: slot.template, origin: [...slot.origin], state};
    } finally {
      this.preparing = false;
    }
  }

  async streamIn(id: string, snapshot: GPUPhysicsStreamedWorld): Promise<GPUPhysicsWorldHandle> {
    const handle = await this.acquire(snapshot.template, id, snapshot.origin);
    try {
      this.getSlot(handle).world.restoreState(snapshot.state);
      return handle;
    } catch (error) {
      this.release(handle);
      throw error;
    }
  }

  /** Release residency for reuse; old handles cannot address a recycled instance. */
  release(handle: GPUPhysicsWorldHandle): void {
    this.assertIdle();
    this.getSlot(handle).handle = null;
  }

  /** Skip an entire world's graph while preserving state and residency. */
  setActive(handle: GPUPhysicsWorldHandle, active: boolean): void {
    this.assertIdle();
    this.getSlot(handle).active = active;
  }

  /** Borrowed world for local-coordinate controls, queries and rendering. */
  getWorld(handle: GPUPhysicsWorldHandle): GPURigidBodyWorld {
    this.assertIdle();
    return this.getSlot(handle).world;
  }

  getOrigin(handle: GPUPhysicsWorldHandle): readonly [number, number, number] {
    const slot = this.getSlot(handle);
    return slot.origin.map((value, axis) => value + slot.world.origin[axis]) as [
      number,
      number,
      number
    ];
  }

  /** Small render-relative translation without converting a large global coordinate to float32. */
  getRenderTranslation(
    handle: GPUPhysicsWorldHandle,
    cameraOrigin: readonly [number, number, number]
  ): [number, number, number] {
    const slot = this.getSlot(handle);
    const offset = slot.world.origin;
    // Subtract large origins before adding the small local rebase displacement.
    return [
      slot.origin[0] - cameraOrigin[0] + offset[0],
      slot.origin[1] - cameraOrigin[1] + offset[1],
      slot.origin[2] - cameraOrigin[2] + offset[2]
    ];
  }

  reset(handle: GPUPhysicsWorldHandle): void {
    this.assertIdle();
    const slot = this.getSlot(handle);
    slot.checkpoint.restore();
    slot.steps = 0;
    slot.encoding = undefined;
  }

  /** Bound CPU encoding bursts. Oversized worlds remain indivisible and are reported. */
  planSubmissions(maximumWorlds: number, maximumBodies = Number.MAX_SAFE_INTEGER) {
    this.assertIdle();
    if (![maximumWorlds, maximumBodies].every(value => Number.isSafeInteger(value) && value > 0))
      throw new Error('Invalid submission budget');
    const groups: {handles: GPUPhysicsWorldHandle[]; bodies: number; oversized: boolean}[] = [];
    for (const slot of this.slots) {
      if (!slot.handle || !slot.active) continue;
      let group = groups[groups.length - 1];
      if (
        !group ||
        group.handles.length >= maximumWorlds ||
        group.bodies + slot.world.count > maximumBodies
      ) {
        group = {handles: [], bodies: 0, oversized: slot.world.count > maximumBodies};
        groups.push(group);
      }
      group.handles.push(slot.handle);
      group.bodies += slot.world.count;
    }
    return groups;
  }

  /** Encode active worlds into the caller's command buffer; never submits or reads back. */
  encode(
    encoder: CommandEncoder,
    steps = 1,
    handles?: readonly GPUPhysicsWorldHandle[]
  ): {worldSteps: number; bodySteps: number} {
    this.assertIdle();
    if (!Number.isSafeInteger(steps) || steps < 0 || steps > 1024)
      throw new Error('Invalid batch step count');
    const selected = handles ? handles.map(handle => this.getSlot(handle)) : this.slots;
    if (new Set(selected).size !== selected.length) throw new Error('Duplicate batch selection');
    let worldSteps = 0;
    let bodySteps = 0;
    for (let step = 0; step < steps; step++) {
      for (const slot of selected) {
        if (!slot.handle || !slot.active) continue;
        slot.encoding = slot.graph.encode(encoder, {parameters: undefined});
        slot.steps++;
        worldSteps++;
        bodySteps += slot.world.count;
      }
    }
    return {worldSteps, bodySteps};
  }

  /** Borrowed diagnostic snapshot of the most recent encoding; no GPU readback. */
  inspect(handle: GPUPhysicsWorldHandle) {
    const slot = this.getSlot(handle);
    return {graph: slot.graph, encoding: slot.encoding};
  }

  getStats() {
    return {
      residentWorlds: this.slots.length,
      leasedWorlds: this.slots.filter(slot => slot.handle).length,
      activeWorlds: this.slots.filter(slot => slot.handle && slot.active).length,
      residentBytes: this.slots.reduce((sum, slot) => sum + slot.bytes, 0),
      worldBufferBytes: this.slots.reduce((sum, slot) => sum + slot.worldBytes, 0),
      checkpointBytes: this.slots.reduce((sum, slot) => sum + slot.checkpoint.byteLength, 0),
      graphTransientBytes: this.slots.reduce(
        (sum, slot) => sum + slot.graph.stats.physicalTransientResourceBytes,
        0
      ),
      createdSlots: this.createdSlots,
      reusedSlots: this.reusedSlots,
      evictedSlots: this.evictedSlots
    };
  }

  trim(): void {
    this.assertIdle();
    for (const slot of [...this.slots]) if (!slot.handle) this.evict(slot);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.assertIdle();
    for (const slot of [...this.slots]) this.evict(slot);
    this.templates.clear();
    this.destroyed = true;
  }

  private estimateResidentBytes(world: GPURigidBodyWorld): number {
    const capacity = world.getCapacityInfo();
    const rollbackScratchBytes = capacity.buffers
      .filter(buffer => buffer.name.startsWith('checkpoint-'))
      .reduce((sum, buffer) => sum + buffer.byteLength, 0);
    return capacity.ownedBufferBytes * 2 - rollbackScratchBytes;
  }

  private makeRoom(bytes: number): void {
    while (
      this.slots.length >= this.props.maximumResidentWorlds ||
      this.getStats().residentBytes + bytes > this.props.maximumResidentBytes
    ) {
      const available = this.slots.find(slot => !slot.handle);
      if (!available) throw new Error('Physics residency budget exhausted');
      this.evict(available);
    }
  }

  private evict(slot: Slot): void {
    slot.graph.destroy();
    slot.world.destroy();
    this.slots.splice(this.slots.indexOf(slot), 1);
    this.evictedSlots++;
  }

  private getSlot(handle: GPUPhysicsWorldHandle): Slot {
    const slot = this.slots.find(candidate => candidate.handle === handle);
    if (!slot || this.destroyed) throw new Error('Stale physics world handle');
    return slot;
  }

  private assertIdle(): void {
    if (this.destroyed || this.preparing) throw new Error('Physics batch is busy or destroyed');
  }
}
