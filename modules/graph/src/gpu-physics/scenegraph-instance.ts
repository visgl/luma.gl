// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, CommandEncoder} from '@luma.gl/core';
import {Vector3} from '@math.gl/core';
import type {ScenegraphNode} from '@luma.gl/engine';
import {GPUCommandGraph} from '../gpu-core/index';
import {
  GPURigidBodyWorld,
  type GPURigidBodyWorldProps,
  type GPURigidBodyCapture
} from './gpu-rigid-body-world';
import {rotateRigidBodyVector} from './rigid-body-properties';

export type ScenegraphPhysicsDefinition = {
  world: GPURigidBodyWorldProps;
  /** Stable scene object references; fixed synthetic bodies need not have a node. */
  bodies: ReadonlyMap<ScenegraphNode, number>;
};
/** Implementation-version capture. Node identities remain caller-owned object references. */
export type ScenegraphPhysicsCapture = {
  version: 1;
  authored: ScenegraphPhysicsDefinition;
  state: GPURigidBodyCapture;
};
type Execution = {
  world: GPURigidBodyWorld;
  graph: Awaited<ReturnType<GPUCommandGraph['compileAsync']>>;
};

/** Owns one independent simulation instance and transactional geometry/topology rebuilds. */
export class ScenegraphPhysicsInstance {
  private pending: Promise<unknown> | undefined;
  private destroying = false;
  private destroyed = false;
  /** Changes on reset/rebuild. Borrowed render buffers and event identities belong to one revision. */
  revision = 0;
  private constructor(
    private readonly device: Device,
    private definition: ScenegraphPhysicsDefinition,
    private execution: Execution
  ) {}

  static async create(
    device: Device,
    definition: ScenegraphPhysicsDefinition
  ): Promise<ScenegraphPhysicsInstance> {
    validateDefinition(definition);
    const saved = cloneDefinition(definition);
    const instance = new ScenegraphPhysicsInstance(
      device,
      saved,
      await compile(device, saved.world)
    );
    try {
      await instance.publish();
      return instance;
    } catch (error) {
      await instance.destroy();
      throw error;
    }
  }
  get world(): GPURigidBodyWorld {
    return this.execution.world;
  }
  get graph(): Execution['graph'] {
    return this.execution.graph;
  }
  get bodies(): ReadonlyMap<ScenegraphNode, number> {
    return this.definition.bodies;
  }

  /** Track queries/readbacks so reset, rebuild and destruction cannot invalidate their buffers. */
  async withWorld<T>(operation: (world: GPURigidBodyWorld) => Promise<T>): Promise<T> {
    return this.exclusive(() => operation(this.world));
  }

  /** Explicit editing/debugging readback; never part of advance(). Includes authored reset state. */
  async capture(): Promise<ScenegraphPhysicsCapture> {
    return this.exclusive(async () => {
      await this.finishSubmission();
      return {
        version: 1,
        authored: cloneDefinition(this.definition),
        state: await this.world.captureState()
      };
    });
  }

  /** Atomically restore live state, commands, caches and events, retaining the captured reset state. */
  async restore(
    capture: ScenegraphPhysicsCapture,
    prepare?: (world: GPURigidBodyWorld) => void
  ): Promise<void> {
    if (capture.version !== 1) throw new Error('Unsupported scene physics capture');
    validateDefinition(capture.authored);
    const authored = cloneDefinition(capture.authored);
    const state = structuredClone(capture.state);
    if (state.props.bodies.length !== authored.world.bodies.length)
      throw new Error('Invalid captured scene bindings');
    return this.exclusive(async () => {
      await this.finishSubmission();
      const replacement = await compile(this.device, state.props);
      try {
        replacement.world.restoreState(state);
        prepare?.(replacement.world);
        replacement.world.publishPoses();
        await this.finishSubmission();
      } catch (error) {
        replacement.graph.destroy();
        replacement.world.destroy();
        throw error;
      }
      const previous = this.execution;
      this.execution = replacement;
      this.definition = authored;
      this.revision++;
      previous.graph.destroy();
      previous.world.destroy();
    });
  }

  /** Publish current poses and bounds without advancing simulation time. */
  async publish(): Promise<void> {
    return this.exclusive(async () => {
      this.world.publishPoses();
      await this.finishSubmission();
    });
  }

  /** Advance one fixed step; state remains on GPU and only submission completion is awaited. */
  async advance(
    beforeStep?: (world: GPURigidBodyWorld) => void,
    encode?: (graph: Execution['graph'], encoder: CommandEncoder) => void
  ): Promise<void> {
    return this.exclusive(async () => {
      beforeStep?.(this.world);
      const encoder = this.device.createCommandEncoder();
      if (encode) encode(this.graph, encoder);
      else this.graph.encode(encoder, {parameters: undefined});
      this.device.submit(encoder.finish());
      await this.finishSubmission();
    });
  }

  /** Restore this instance's authored state. Does not modify scene nodes or the camera. */
  async reset(prepare?: (world: GPURigidBodyWorld) => void): Promise<void> {
    return this.replace(this.definition, false, false, prepare);
  }

  /** Re-cook upstream first, then atomically install the resulting geometry and bindings.
   * Preserves dynamic node poses and velocities by object identity. New/static/kinematic
   * nodes use the new authored state. Contact caches and event histories start a new revision.
   */
  async rebuild(
    definition: ScenegraphPhysicsDefinition,
    preserveState = true,
    prepare?: (world: GPURigidBodyWorld) => void
  ): Promise<void> {
    return this.replace(definition, preserveState, true, prepare);
  }

  private async replace(
    definition: ScenegraphPhysicsDefinition,
    preserveState: boolean,
    updateAuthored: boolean,
    prepare?: (world: GPURigidBodyWorld) => void
  ): Promise<void> {
    // Validate and snapshot caller-owned data before accepting an asynchronous operation.
    validateDefinition(definition);
    const authored = cloneDefinition(definition);
    return this.exclusive(async () => {
      await this.finishSubmission();
      const props = structuredClone(authored.world);
      if (preserveState) {
        // Rebuilds are explicit editing operations, not a per-frame simulation bridge.
        const states = await this.world.readState();
        const bodies = [...props.bodies];
        for (const [node, index] of authored.bodies) {
          const previous = this.definition.bodies.get(node);
          const body = bodies[index];
          const mode = body.mode ?? ((body.mass ?? 1) === 0 ? 'static' : 'dynamic');
          if (
            previous === undefined ||
            mode !== 'dynamic' ||
            this.world.getBodyMode(previous) !== 'dynamic'
          )
            continue;
          const state = states[previous];
          const offset = rotateRigidBodyVector(
            state.orientation,
            this.world.getBodyParameters(previous).centerOfMass ?? [0, 0, 0]
          );
          bodies[index] = {
            ...body,
            position: [
              state.position[0] - offset[0],
              state.position[1] - offset[1],
              state.position[2] - offset[2]
            ],
            orientation: state.orientation,
            velocity: new Vector3(state.velocity)
              .add(
                new Vector3(state.angularVelocity).cross(
                  new Vector3(
                    rotateRigidBodyVector(state.orientation, body.centerOfMass ?? [0, 0, 0])
                  ).subtract(offset)
                )
              )
              .toArray() as [number, number, number],
            angularVelocity: state.angularVelocity
          };
        }
        props.bodies = bodies;
      }
      const replacement = await compile(this.device, props);
      try {
        prepare?.(replacement.world);
        replacement.world.publishPoses();
        await this.finishSubmission();
      } catch (error) {
        replacement.graph.destroy();
        replacement.world.destroy();
        throw error;
      }
      const previous = this.execution;
      this.execution = replacement;
      if (updateAuthored) this.definition = authored;
      this.revision++;
      previous.graph.destroy();
      previous.world.destroy();
    });
  }

  private async exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (this.pending || this.destroying || this.destroyed)
      throw new Error('Physics instance is busy or destroyed');
    // Claim the lifetime before invoking caller code, including synchronous re-entry.
    const pending = Promise.resolve().then(operation);
    this.pending = pending;
    try {
      return await pending;
    } finally {
      this.pending = undefined;
    }
  }
  private async finishSubmission(): Promise<void> {
    const fence = this.device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
  }
  /** Wait for this instance's pending operation and submissions before releasing resources. */
  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroying = true;
    try {
      await this.pending;
    } catch {
      /* A rejected edit still leaves an owned live execution. */
    }
    await this.finishSubmission();
    if (this.destroyed) return;
    this.destroyed = true;
    this.execution.graph.destroy();
    this.execution.world.destroy();
  }
}

function cloneDefinition(definition: ScenegraphPhysicsDefinition): ScenegraphPhysicsDefinition {
  return {world: structuredClone(definition.world), bodies: new Map(definition.bodies)};
}
function validateDefinition(definition: ScenegraphPhysicsDefinition): void {
  const indices = [...definition.bodies.values()];
  if (
    new Set(indices).size !== indices.length ||
    indices.some(
      index => !Number.isInteger(index) || index < 0 || index >= definition.world.bodies.length
    )
  )
    throw new Error('Invalid scene body bindings');
}
async function compile(device: Device, props: GPURigidBodyWorldProps): Promise<Execution> {
  const world = new GPURigidBodyWorld(props);
  try {
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    return {world, graph: await definition.compileAsync()};
  } catch (error) {
    world.destroy();
    throw error;
  }
}
