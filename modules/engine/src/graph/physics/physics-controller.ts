// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device} from '@luma.gl/core';
import type {Geometry} from '@math.gl/geometry';
import type {
  GPURigidBody,
  GPURigidBodyShape,
  GPURigidBodyVehicle,
  GPURigidBodyWorldProps
} from '@luma.gl/graph/gpu-physics';
import {rotateRigidBodyVector} from '@luma.gl/graph/gpu-physics';
import {
  GroupNode,
  type ScenegraphNode,
  type ScenegraphJoint,
  type ScenegraphTransformSource
} from '../../index';
import {ScenegraphPhysicsSession} from './scenegraph-session';
import {makePhysicsControllerScene} from './physics-controller-geometry';

export type PhysicsNodeReference = ScenegraphNode | string;
export type PhysicsJointOptions = Omit<ScenegraphJoint, 'first' | 'second'> & {
  first: PhysicsNodeReference;
  second: PhysicsNodeReference;
};
export type PhysicsBodyOptions = Pick<
  GPURigidBody,
  | 'mass'
  | 'restitution'
  | 'friction'
  | 'velocity'
  | 'angularVelocity'
  | 'centerOfMass'
  | 'inertiaDiagonal'
  | 'inertiaOrientation'
  | 'gravityFactor'
> & {
  motion?: 'static' | 'dynamic' | 'kinematic';
  /** Infer CPU scene geometry by default, or supply an explicit node-local shape. */
  collider?: 'geometry' | GPURigidBodyShape;
  /** Optional CPU geometry for a node without retained model geometry. */
  geometry?: Geometry;
  /** Non-primitives default to a convex hull; concave surfaces must be explicit. */
  geometryMode?: 'convex-hull' | 'triangle-mesh';
};
export type PhysicsControllerProps = Omit<
  GPURigidBodyWorldProps,
  'bodies' | 'publicationBounds' | 'publishPoses' | 'joints' | 'vehicle' | 'vehicles'
> & {
  scene: GroupNode;
  /** Bound catch-up work; excess elapsed time is reported, not silently simulated. */
  maximumSubsteps?: number;
};
/** Vehicle tuning for a chassis and terrain identified by scenegraph references. */
export type PhysicsVehicleOptions = Omit<
  GPURigidBodyVehicle,
  'chassis' | 'terrainCollider' | 'additionalTerrainColliders'
>;

/** Authored terrain and tuning retained under the chassis node's identity. */
type PhysicsVehicleAttachment = {
  /** One to four static nodes, in contact preference order. */
  terrain: readonly ScenegraphNode[];
  /** Wheel geometry and force settings. */
  options: PhysicsVehicleOptions;
};

export type PhysicsBodyPose = {
  /** World-space scene-node origin, rather than the internal center of mass. */
  position: readonly [number, number, number];
  rotation: readonly [number, number, number, number];
};
export type PhysicsBody = {
  readonly node: ScenegraphNode;
  applyImpulse(
    impulse: readonly [number, number, number],
    options?: {point?: readonly [number, number, number]}
  ): void;
  setKinematicTarget(pose: PhysicsBodyPose): void;
  /** Resume taking a kinematic target from the node's authored world transform. */
  followScenegraph(): void;
  /** Explicit asynchronous inspection; never called by frame updates. */
  readPose(): Promise<PhysicsBodyPose>;
};
export type PhysicsUpdateResult = {steps: number; simulatedTime: number; droppedTime: number};

/** Application-facing scene physics, with setup-time path resolution and GPU-only frame updates. */
export class PhysicsController {
  readonly scene: GroupNode;
  readonly timeStep: number;
  private readonly maximumSubsteps: number;
  private readonly worldOptions: Omit<GPURigidBodyWorldProps, 'bodies'>;
  private readonly definitions = new Map<ScenegraphNode, PhysicsBodyOptions>();
  private readonly handles = new Map<ScenegraphNode, PhysicsBody>();
  private readonly manualTargets = new Set<ScenegraphNode>();
  /** Attachments in stable insertion order for unqualified legacy controls. */
  private readonly vehicleAttachments = new Map<ScenegraphNode, PhysicsVehicleAttachment>();
  /** Indices for the current compiled revision. */
  private vehicleIndices = new Map<ScenegraphNode, number>();
  private readonly joints: ScenegraphJoint[] = [];
  private indices: ReadonlyMap<ScenegraphNode, number> = new Map();
  private session?: ScenegraphPhysicsSession;
  private pending?: Promise<unknown>;
  private closed = false;
  private destruction?: Promise<void>;
  private dirty = true;
  private accumulator = 0;
  /** Stable proxy: renderers fetch current borrowed buffers after reset/rebuild. */
  readonly transformSource: ScenegraphTransformSource = {
    getFrame: () => {
      // A pending replacement must not expose buffers being retired asynchronously.
      if (this.closed || this.dirty || this.pending || !this.session) return null;
      const publication = this.session.publication;
      return {
        matrices: publication.matrices,
        matrixCount: this.session.world.count,
        revision: this.session.revision,
        bindings: publication.transformBindings
      };
    }
  };

  constructor(
    private readonly device: Device,
    props: PhysicsControllerProps
  ) {
    const {scene, maximumSubsteps = 4, ...worldOptions} = props;
    this.scene = scene;
    this.timeStep = props.timeStep ?? 1 / 120;
    this.maximumSubsteps = maximumSubsteps;
    this.worldOptions = structuredClone({...worldOptions, timeStep: this.timeStep});
    if (
      !Number.isFinite(this.timeStep) ||
      this.timeStep <= 0 ||
      !Number.isSafeInteger(maximumSubsteps) ||
      maximumSubsteps <= 0
    )
      throw new Error('Invalid physics timestep or substep limit');
  }

  /** Borrowed rendering publication. Fetch again after prepare/reset changes the revision. */
  get publication() {
    return this.requireReady().publication;
  }
  get revision(): number {
    return this.session?.revision ?? 0;
  }

  addBody(reference: PhysicsNodeReference, options: PhysicsBodyOptions = {}): PhysicsBody {
    this.assertEditable();
    const node = this.resolveNode(reference);
    if (!node) throw new Error(`Physics node not found: ${reference}`);
    if (this.definitions.has(node)) throw new Error(`Physics body already attached: ${node.id}`);
    // Snapshot caller-owned options before asynchronous preparation, retaining borrowed geometry.
    const {geometry, ...properties} = options;
    this.definitions.set(node, {...structuredClone(properties), geometry});
    const binding = () => {
      const session = this.requireReady();
      const index = this.indices.get(node);
      if (index === undefined || this.handles.get(node) !== handle)
        throw new Error(`Physics body is no longer attached: ${node.id}`);
      return {session, world: session.world, index};
    };
    const handle: PhysicsBody = {
      node,
      applyImpulse: (impulse, {point} = {}) => {
        const {world, index} = binding();
        world.applyImpulse(index, impulse, point);
      },
      setKinematicTarget: pose => {
        const {world, index} = binding();
        if (this.definitions.get(node)?.motion !== 'kinematic')
          throw new Error('Explicit targets require a kinematic body');
        world.setKinematicTarget(index, pose.position, pose.rotation);
        this.manualTargets.add(node);
      },
      followScenegraph: () => {
        binding();
        this.manualTargets.delete(node);
      },
      readPose: () => {
        const {session, index} = binding();
        return this.exclusive(() =>
          session.withWorld(async world => {
            const state = (await world.readState())[index];
            const center = world.getBodyParameters(index).centerOfMass ?? [0, 0, 0];
            const offset = rotateRigidBodyVector(state.orientation, center);
            return {
              position: [
                state.position[0] - offset[0],
                state.position[1] - offset[1],
                state.position[2] - offset[2]
              ],
              rotation: state.orientation
            };
          })
        );
      }
    };
    this.handles.set(node, handle);
    this.dirty = true;
    return handle;
  }

  getBody(reference: PhysicsNodeReference): PhysicsBody | undefined {
    if (this.closed) return undefined;
    const node = this.resolveNode(reference);
    return node ? this.handles.get(node) : undefined;
  }

  removeBody(reference: PhysicsNodeReference): boolean {
    this.assertEditable();
    const node = this.resolveNode(reference);
    if (!node || !this.definitions.delete(node)) return false;
    for (const [chassis, attachment] of this.vehicleAttachments) {
      if (chassis === node || attachment.terrain.includes(node))
        this.vehicleAttachments.delete(chassis);
    }
    this.handles.delete(node);
    this.manualTargets.delete(node);
    this.dirty = true;
    return true;
  }

  /** Replace the fleet with one chassis using a single terrain node, for legacy callers. */
  setVehicle(
    chassis: PhysicsNodeReference,
    terrain: PhysicsNodeReference,
    options: PhysicsVehicleOptions
  ): void {
    this.setVehicleAttachment(chassis, [terrain], options, true);
  }

  /** Attach another independently controlled chassis to one to four static terrain nodes. */
  addVehicle(
    chassis: PhysicsNodeReference,
    terrain: readonly PhysicsNodeReference[],
    options: PhysicsVehicleOptions
  ): void {
    this.setVehicleAttachment(chassis, terrain, options, false);
  }

  /** Remove one chassis's suspension on the next preparation without removing its rigid body. */
  removeVehicle(chassis: PhysicsNodeReference): boolean {
    this.assertEditable();
    const node = this.resolveNode(chassis);
    if (!node || !this.vehicleAttachments.delete(node)) return false;
    this.dirty = true;
    return true;
  }

  /** Borrow the first registered vehicle's wheel poses after preparation. */
  get vehicleWheelPoses() {
    return this.requireReady().world.vehicleWheelPoses;
  }

  /** Borrow a registered chassis's wheel transforms after preparation. */
  getVehicleWheelPoses(chassis: PhysicsNodeReference) {
    return this.requireReady().world.getVehicleWheelPoses(this.getVehicleIndex(chassis));
  }

  /** Read wheel telemetry for the selected chassis, or for the first chassis by default. */
  readVehicleWheels(chassis?: PhysicsNodeReference) {
    const session = this.requireReady();
    const vehicleIndex = this.getVehicleIndex(chassis);
    return this.exclusive(() => session.withWorld(world => world.readVehicleWheels(vehicleIndex)));
  }

  /** Set controls for the selected chassis, or for the first chassis by default. */
  setVehicleControls(
    throttle: number,
    steering: number,
    brake: number,
    chassis?: PhysicsNodeReference
  ): void {
    this.requireReady().world.setVehicleControls(
      throttle,
      steering,
      brake,
      this.getVehicleIndex(chassis)
    );
  }

  /** Validate path references before replacing or appending an attachment. */
  private setVehicleAttachment(
    chassis: PhysicsNodeReference,
    terrain: readonly PhysicsNodeReference[],
    options: PhysicsVehicleOptions,
    replace: boolean
  ): void {
    this.assertEditable();
    const chassisNode = this.resolveNode(chassis);
    if (!chassisNode || (!replace && this.vehicleAttachments.has(chassisNode)))
      throw new Error('Missing or duplicate vehicle chassis');
    const terrainNodes = terrain.map(reference => {
      const terrainNode = this.resolveNode(reference);
      if (!terrainNode) throw new Error('Missing vehicle terrain');
      return terrainNode;
    });
    if (
      !terrainNodes.length ||
      terrainNodes.length > 4 ||
      new Set(terrainNodes).size !== terrainNodes.length
    )
      throw new Error('Vehicle requires one to four distinct terrain nodes');
    const tuning = structuredClone(options);
    if (replace) this.vehicleAttachments.clear();
    this.vehicleAttachments.set(chassisNode, {terrain: terrainNodes, options: tuning});
    this.dirty = true;
  }

  /** Resolve a chassis to the vehicle slot of the compiled world. */
  private getVehicleIndex(reference?: PhysicsNodeReference): number {
    if (reference === undefined) return 0;
    const node = this.resolveNode(reference);
    const vehicleIndex = node && this.vehicleIndices.get(node);
    if (vehicleIndex === undefined) throw new Error('Vehicle chassis is not attached');
    return vehicleIndex;
  }

  addJoint(options: PhysicsJointOptions): ScenegraphJoint {
    this.assertEditable();
    const {first, second, ...properties} = options;
    const firstNode = this.resolveNode(first),
      secondNode = this.resolveNode(second);
    if (!firstNode || !secondNode) throw new Error('Physics joint attachment not found');
    const joint = {...structuredClone(properties), first: firstNode, second: secondNode};
    this.joints.push(joint);
    this.dirty = true;
    return joint;
  }

  removeJoint(joint: ScenegraphJoint): boolean {
    this.assertEditable();
    const index = this.joints.indexOf(joint);
    if (index < 0) return false;
    this.joints.splice(index, 1);
    this.dirty = true;
    return true;
  }

  /** Compile once, or explicitly rebuild after body, geometry, scale or topology edits. */
  prepare({preserveState = true}: {preserveState?: boolean} = {}): Promise<void> {
    return this.exclusive(async () => {
      // Destruction can begin before this queued preparation starts.
      assert(!this.closed);
      if (this.scene.transformSource && this.scene.transformSource !== this.transformSource)
        throw new Error('Scene already has a transform source');
      // Claim before the first await so another controller cannot prepare this root concurrently.
      this.scene.transformSource = this.transformSource;
      try {
        this.dirty = true;
        const scene = makePhysicsControllerScene(
          this.scene,
          this.definitions,
          this.worldOptions,
          this.joints
        );
        const vehicleIndices = new Map<ScenegraphNode, number>();
        if (this.vehicleAttachments.size) {
          const bodies = scene.definition.world.bodies;
          const colliderOffsets: number[] = [];
          let offset = 0;
          for (const body of bodies) {
            colliderOffsets.push(offset);
            offset += body.colliders?.length ?? 1;
          }
          scene.definition.world.vehicles = Array.from(
            this.vehicleAttachments,
            ([node, attachment], index) => {
              const chassis = scene.definition.bodies.get(node);
              if (chassis === undefined)
                throw new Error('Vehicle chassis requires a registered body');
              const terrainColliders = attachment.terrain.map(terrainNode => {
                const terrain = scene.definition.bodies.get(terrainNode);
                if (terrain === undefined || (bodies[terrain].colliders?.length ?? 1) !== 1)
                  throw new Error('Vehicle terrain nodes require one registered collider each');
                return colliderOffsets[terrain];
              });
              vehicleIndices.set(node, index);
              return {
                ...attachment.options,
                chassis,
                terrainCollider: terrainColliders[0],
                additionalTerrainColliders: terrainColliders.slice(1)
              };
            }
          );
        }
        if (this.session) await this.session.rebuild(async () => scene, preserveState);
        else this.session = await ScenegraphPhysicsSession.create(this.device, scene);
        this.indices = scene.definition.bodies;
        this.vehicleIndices = vehicleIndices;
        this.manualTargets.clear();
        this.accumulator = 0;
        this.dirty = false;
      } catch (error) {
        if (!this.session && this.scene.transformSource === this.transformSource)
          this.scene.transformSource = null;
        throw error;
      }
    });
  }

  /** Synchronously submit bounded fixed steps; rendering can follow on the same GPU queue. */
  update(
    deltaTime: number,
    {
      animatedNodes = new Set<ScenegraphNode>()
    }: {
      animatedNodes?: ReadonlySet<ScenegraphNode>;
    } = {}
  ): PhysicsUpdateResult {
    const session = this.requireReady();
    if (!Number.isFinite(deltaTime) || deltaTime < 0) throw new Error('Invalid physics frame time');
    const available = this.accumulator + deltaTime;
    const maximumTime = this.timeStep * this.maximumSubsteps;
    this.accumulator = Math.min(available, maximumTime);
    const steps = Math.min(
      this.maximumSubsteps,
      Math.floor((this.accumulator + this.timeStep * 1e-9) / this.timeStep)
    );
    if (steps) {
      const targetNodes = new Set<ScenegraphNode>();
      for (const [node, options] of this.definitions)
        if (options.motion === 'kinematic' && !this.manualTargets.has(node)) targetNodes.add(node);
      const encoder = this.device.createCommandEncoder();
      session.encode(encoder, {
        steps,
        animatedNodes,
        targetNodes,
        excludedNodes: this.manualTargets
      });
      this.device.submit(encoder.finish());
      this.accumulator = Math.max(0, this.accumulator - steps * this.timeStep);
    }
    return {
      steps,
      simulatedTime: steps * this.timeStep,
      droppedTime: Math.max(0, available - maximumTime)
    };
  }

  /** Restore authored bodies and node transforms without changing application cameras. */
  reset(): Promise<void> {
    this.requireReady();
    return this.exclusive(async () => {
      await this.session!.reset();
      this.accumulator = 0;
      this.manualTargets.clear();
    });
  }

  destroy(): Promise<void> {
    if (this.destruction) return this.destruction;
    this.closed = true;
    if (this.scene.transformSource === this.transformSource) this.scene.transformSource = null;
    this.destruction = (async () => {
      try {
        await this.pending;
      } catch {
        /* A rejected edit retains an owned session. */
      }
      await this.session?.destroy();
      this.session = undefined;
      this.handles.clear();
      this.definitions.clear();
      this.vehicleAttachments.clear();
      this.vehicleIndices.clear();
      this.manualTargets.clear();
      this.joints.length = 0;
      this.indices = new Map();
    })();
    return this.destruction;
  }

  private resolveNode(reference: PhysicsNodeReference): ScenegraphNode | undefined {
    return typeof reference === 'string' ? this.scene.findNode(reference) : reference;
  }
  private assertEditable(): void {
    // Editing cannot overlap an asynchronous operation or follow destruction.
    assert(!this.pending && !this.closed);
  }
  private requireReady(): ScenegraphPhysicsSession {
    // Preparation must finish before frame updates, body commands or publication borrowing.
    assert(this.session && !this.dirty && !this.pending && !this.closed);
    return this.session;
  }
  private async exclusive<T>(operation: () => Promise<T>): Promise<T> {
    this.assertEditable();
    const pending = Promise.resolve().then(operation);
    this.pending = pending;
    try {
      return await pending;
    } finally {
      this.pending = undefined;
    }
  }
}
