// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type Binding,
  type BindingDeclaration,
  type Device,
  type CommandEncoder,
  type ShaderLayout
} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GPUCommandGraphComputeExecutable
} from '../gpu-core/gpu-command-graph';
import {shiftRigidBodyBuffers} from './rigid-body-origin';
import {getRigidBodyShapeProperties} from './rigid-body-shape-properties';
import {packRigidBodyShapes} from './rigid-body-geometry';
import {
  getCompoundBodyInertia,
  normalizeRigidBodyRotation,
  rotateRigidBodyVector,
  type GPURigidBody,
  type GPURigidBodyShape,
  type GPURigidBodyCollider,
  type GPURigidBodyMaterial
} from './rigid-body-properties';
export type {
  GPURigidBody,
  GPURigidBodyShape,
  GPURigidBodyCollider,
  GPURigidBodyMaterial
} from './rigid-body-properties';
import {addGPUCommandNodes} from '../gpu-core/gpu-command-node';
import {
  GPURigidBodyBroadPhase,
  decodeRigidBodyBroadPhaseDiagnostics
} from './rigid-body-broad-phase';
import type {RigidBodySparseShaderLayout} from './rigid-body-cache-shaders';
import {
  addRigidBodyDiagnostics,
  decodeRigidBodySimulationDiagnostics,
  type GPURigidBodySimulationDiagnostics
} from './rigid-body-diagnostics';
import {getRigidBodyStorageLayout, type GPURigidBodyCapacityInfo} from './rigid-body-capacity';
import {RIGID_BODY_QUERY_GEOMETRY_SHADER} from './rigid-body-query-geometry';
import {addRigidBodyContinuous, type GPURigidBodyContinuousOptions} from './rigid-body-continuous';
import {
  addRigidBodyTriggers,
  makeRigidBodyTriggerLayout,
  decodeRigidBodyTriggerEvents,
  type GPURigidBodyTrigger,
  type GPURigidBodyTriggerBatch
} from './rigid-body-triggers';
import {addRigidBodyCheckpoint} from './rigid-body-transaction';
import {
  getRigidBodyJointShader,
  packRigidBodyJointState,
  RIGID_BODY_JOINT_STATE_BYTES,
  validateRigidBodyJoints,
  type GPURigidBodyJoint
} from './rigid-body-joints';
import {addRigidBodyPosePublication, type GPURigidBodyBounds} from './rigid-body-publication';
import {getRigidBodyShader} from './rigid-body-shaders';

type Vector3 = readonly [number, number, number];
import {
  decodeRigidBodyContactEvents,
  getRigidBodyEventShader,
  type GPURigidBodyContactBatch
} from './rigid-body-events';
import {
  RIGID_BODY_QUERY_SHADER,
  type GPURigidBodyRayQuery,
  type GPURigidBodySphereCastQuery,
  type GPURigidBodyOverlapQuery,
  type GPURigidBodyQueryResult
} from './rigid-body-queries';

/** In-memory, structured-cloneable debug capture; tied to this implementation's storage layout. */
export type GPURigidBodyCapture = {
  version: 1;
  origin?: [number, number, number];
  /** False omits temporary rollback buffers, rebuilt before the next step. */
  includeRollbackScratch?: boolean;
  props: GPURigidBodyWorldProps;
  buffers: {name: string; data: Uint8Array}[];
  contactCursor: number;
  triggerCursor: number;
  colliderShapeScales?: [number, number[]][];
};

/** Mutable motion properties; topology and authored pose use explicit scene reconstruction. */
export type GPURigidBodyParameters = Partial<
  Pick<
    GPURigidBody,
    | 'mode'
    | 'mass'
    | 'centerOfMass'
    | 'inertiaDiagonal'
    | 'inertiaOrientation'
    | 'velocity'
    | 'angularVelocity'
    | 'gravityFactor'
  >
>;

export type GPURigidBodyWorldProps = {
  id?: string;
  bodies: readonly GPURigidBody[];
  /** Authored visual bounds in body-node coordinates; enables GPU matrix/AABB publication. */
  publicationBounds?: readonly GPURigidBodyBounds[];
  /** Publish rigid body-node matrices without requiring authored visual bounds. */
  publishPoses?: boolean;
  /** Up to 64 ordered-solver joints with persistent impulses and connected-island sleeping. */
  joints?: readonly GPURigidBodyJoint[];
  gravity?: Vector3;
  timeStep?: number;
  iterations?: number;
  contactSlop?: number;
  /** Fraction of cached impulses retained per step, in [0, 1]. Default 1. */
  warmStartFactor?: number;
  /** Fraction of penetration corrected through velocity bias per step, in [0, 1]. */
  penetrationRecoveryFraction?: number;
  /** Maximum penetration recovery velocity in world units per second. Default 2. */
  maximumRecoverySpeed?: number;
  /** Additional under-relaxation for the parallel solver, in (0, 1]. Default 1. */
  parallelRelaxation?: number;
  /** Small worlds retain the all-pairs numerical oracle; larger worlds use sparse discovery. */
  /** Independent equal collider blocks; currently excludes joints, CCD and authored triggers. */
  collisionPartitionSize?: number;
  broadPhase?: 'all-pairs' | 'hierarchical-grid';
  /** Parallel block-Jacobi contact solving; ordered impulses remain the numerical oracle. */
  solver?: 'ordered' | 'parallel';
  /** Reuse a GPU compact contact queue for parallel iterations; false retains the scan oracle. */
  compactContacts?: boolean;
  /** Power-of-two persistent contact-pair cache capacity, for hierarchical discovery. */
  maximumPairs?: number;
  /** Maximum hash-bucket candidate tests per collider; incomplete traversal is reported. */
  maximumCandidateTestsPerCollider?: number;
  /** Maximum BVH-node and triangle tests per collider pair and discovery traversal. */
  maximumMeshTraversalTestsPerPair?: number;
  /** Zero disables the bounded GPU contact-event ring. */
  eventCapacity?: number;
  /** Emit sustained-contact impact samples above this total normal impulse. */
  impactImpulseThreshold?: number;
  /** Enable GPU ray, sphere-overlap and sphere-sweep queries. */
  enableQueries?: boolean;
  /** Roll back poses and persistent contacts after an incomplete step; failures latch until reconstruction. */
  /** Bounded sphere/static-surface CCD; requires rollback failure policy. */
  continuous?: GPURigidBodyContinuousOptions;
  failurePolicy?: 'report' | 'rollback';
  triggers?: readonly GPURigidBodyTrigger[];
  triggerEventCapacity?: number;
  contactMatchDistance?: number;
  restitutionThreshold?: number;
  /** Dynamic-body velocity decay rates in inverse seconds; default zero. */
  linearDamping?: number;
  angularDamping?: number;
  sleepAfter?: number;
  sleepLinearSpeed?: number;
  sleepAngularSpeed?: number;
};
export type GPURigidBodyState = {
  position: [number, number, number];
  orientation: [number, number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  sleeping: boolean;
};

/**
 * Experimental rigid-body dynamics with parallel SAT/GJK contact generation and an
 * ordered or opt-in parallel GPU impulse solver. Small worlds retain a bounded all-pairs oracle; larger
 * worlds use hierarchical discovery and sparse persistent manifolds. Buffers are world-owned.
 */
export type GPURigidBodyGPUCheckpoint = {
  readonly byteLength: number;
  save(): void;
  restore(): void;
  destroy(): void;
};

export class GPURigidBodyWorld {
  private worldOrigin: [number, number, number] = [0, 0, 0];
  readonly id: string;
  readonly count: number;
  readonly timeStep: number;
  readonly colliderCount: number;
  private readonly colliderStorageCount: number;
  readonly broadPhase: 'all-pairs' | 'hierarchical-grid';
  readonly solver: 'ordered' | 'parallel';
  readonly maximumPairs: number;
  /** Borrowed by renderers; updated after each accepted or rolled-back step. */
  poseMatrices: Buffer | null = null;
  poseBounds: Buffer | null = null;
  private encodePosePublication?: (encoder: CommandEncoder) => void;
  positions: Buffer | null = null;
  orientations: Buffer | null = null;
  velocities: Buffer | null = null;
  angularVelocities: Buffer | null = null;
  sleepStates: Buffer | null = null;
  /** World-owned GPU event ring; present only when eventCapacity is positive. */
  contactEvents: Buffer | null = null;
  private triggerEvents: Buffer | null = null;
  private triggerCursor = 0;
  private triggerRead: Promise<GPURigidBodyTriggerBatch> | null = null;
  private eventCursor = 0;
  private eventRead: Promise<GPURigidBodyContactBatch> | null = null;
  private queryComputation: Computation | null = null;
  private queryReduction: Computation | null = null;
  private querySettings: Buffer | null = null;
  private querySelection: Buffer | null = null;
  private queryOutput: Buffer | null = null;
  private queryPending = false;
  private targets: Buffer | null = null;
  private simulationStatistics: Buffer | null = null;
  private readonly colliders: readonly (GPURigidBodyCollider & {body: number})[];
  private readonly props: GPURigidBodyWorldProps;
  private readonly ownedBuffers: Buffer[] = [];
  private manifolds: Buffer | null = null;
  private meshTasks: Buffer | null = null;
  private parallelState: Buffer | null = null;
  private parallelDispatch: Buffer | null = null;
  private device: Device | null = null;
  private control: Computation | null = null;
  private invalidation: Computation | null = null;
  private controlSettings: Buffer | null = null;
  private destroyed = false;
  private colliderShapeScales = new Map<number, number[]>();
  private readonly gpuCheckpoints = new Set<GPURigidBodyGPUCheckpoint>();
  private broadPhaseCounters: {buffer: Buffer; byteOffset: number} | null = null;

  constructor(props: GPURigidBodyWorldProps) {
    for (const damping of [props.linearDamping ?? 0, props.angularDamping ?? 0]) {
      if (!Number.isFinite(damping) || damping < 0) throw new Error('Invalid damping');
    }
    if (
      props.publicationBounds &&
      (props.publicationBounds.length !== props.bodies.length ||
        props.publicationBounds.some(
          bounds =>
            bounds.some(
              vector =>
                vector.length !== 3 || !vector.every(value => Number.isFinite(Math.fround(value)))
            ) || bounds[0].some((value, axis) => value > bounds[1][axis])
        ))
    )
      throw new Error('Invalid publication bounds');
    this.id = props.id ?? 'gpu-rigid-body-world';
    this.count = props.bodies.length;
    this.solver = props.solver ?? 'ordered';
    if (!['ordered', 'parallel'].includes(this.solver))
      throw new Error('Invalid rigid-body solver');
    validateRigidBodyJoints(props.joints ?? [], props.bodies, this.solver);
    const colliderCount = props.bodies.reduce(
      (sum, body) => sum + (body.colliders?.length ?? 1),
      0
    );
    this.broadPhase =
      props.broadPhase ??
      (Math.max(this.count, colliderCount) > 128 ? 'hierarchical-grid' : 'all-pairs');
    this.timeStep = props.timeStep ?? 1 / 120;
    const iterations = props.iterations ?? 16;
    if (
      [
        props.warmStartFactor ?? 1,
        props.penetrationRecoveryFraction ?? 0.15,
        props.parallelRelaxation ?? 1
      ].some(value => !Number.isFinite(value) || value < 0 || value > 1) ||
      props.parallelRelaxation === 0 ||
      !Number.isFinite(props.maximumRecoverySpeed ?? 2) ||
      (props.maximumRecoverySpeed ?? 2) < 0
    )
      throw new Error('Invalid rigid-body stability settings');
    if (props.failurePolicy && !['report', 'rollback'].includes(props.failurePolicy))
      throw new Error('Invalid failure policy');
    const eventCapacity = props.eventCapacity ?? 0;
    if (
      !Number.isInteger(eventCapacity) ||
      eventCapacity < 0 ||
      eventCapacity > 65536 ||
      !Number.isFinite(props.impactImpulseThreshold ?? 1) ||
      (props.impactImpulseThreshold ?? 1) < 0
    )
      throw new Error('Invalid contact event settings');
    const maximumMeshTraversalTests = props.maximumMeshTraversalTestsPerPair ?? 65536;
    if (
      !Number.isInteger(maximumMeshTraversalTests) ||
      maximumMeshTraversalTests < 1 ||
      maximumMeshTraversalTests > 1048576
    )
      throw new Error('Invalid mesh traversal budget');
    const maximumCandidateTests = props.maximumCandidateTestsPerCollider ?? 4096;
    if (
      !Number.isInteger(maximumCandidateTests) ||
      maximumCandidateTests < 1 ||
      maximumCandidateTests > 65535
    )
      throw new Error('Invalid rigid-body traversal budget');
    if (
      this.count < 1 ||
      this.count > (this.broadPhase === 'all-pairs' ? 128 : 65535) ||
      !(this.timeStep > 0) ||
      !Number.isFinite(this.timeStep) ||
      !Number.isInteger(iterations) ||
      iterations < 1 ||
      iterations > 64
    )
      throw new Error('Invalid rigid-body capacity or timestep');
    const colliders: (GPURigidBodyCollider & {body: number})[] = [];
    for (const [bodyIndex, body] of props.bodies.entries()) {
      if (!Number.isFinite(body.mass ?? 1) || (body.mass ?? 1) < 0)
        throw new Error('Invalid rigid body mass');
      if (body.shape ? body.colliders !== undefined : body.colliders === undefined)
        throw new Error('Supply shape or colliders');
      const shapes: readonly GPURigidBodyCollider[] =
        body.colliders ?? (body.shape ? [{shape: body.shape}] : []);
      for (const collider of shapes) {
        const properties = getRigidBodyShapeProperties(collider.shape);
        if (
          !Number.isFinite(properties.volume) ||
          !properties.center.every(Number.isFinite) ||
          !properties.tensor.every(Number.isFinite)
        )
          throw new Error('Invalid shape properties');
        if (
          (collider.shape.type === 'convex-hull' || collider.shape.type === 'triangle-mesh') &&
          body.mode !== 'static' &&
          body.mass !== 0 &&
          (!(properties.volume > 0) ||
            ((collider.shape.type === 'convex-hull' || collider.shape.type === 'triangle-mesh') &&
              !collider.shape.geometry.closed))
        )
          throw new Error('Dynamic meshes require closed positive-volume geometry');
        normalizeRigidBodyRotation(collider.orientation);
        if (!(collider.position ?? []).every(Number.isFinite))
          throw new Error('Invalid collider position');
        const material = collider.material;
        if (
          [
            material?.staticFriction ?? 0.6,
            material?.dynamicFriction ?? 0.6,
            material?.restitution ?? 0.1
          ].some(value => !Number.isFinite(value) || value < 0) ||
          (material?.restitution ?? 0.1) > 1
        )
          throw new Error('Invalid collider material');
        colliders.push({...collider, body: bodyIndex});
      }
      normalizeRigidBodyRotation(body.orientation);
      normalizeRigidBodyRotation(body.inertiaOrientation);
      if (body.inertiaOrientation && !body.inertiaDiagonal)
        throw new Error('Inertia orientation requires diagonal');
      if (
        !(body.centerOfMass ?? []).every(Number.isFinite) ||
        (body.inertiaDiagonal ?? []).some(value => !Number.isFinite(value) || value < 0) ||
        !Number.isFinite(body.gravityFactor ?? 1)
      )
        throw new Error('Invalid mass properties');
      if (
        ![
          ...body.position,
          ...(body.velocity ?? []),
          ...(body.angularVelocity ?? []),
          ...(body.orientation ?? [])
        ].every(Number.isFinite) ||
        !Number.isFinite(body.friction ?? 0.6) ||
        (body.friction ?? 0.6) < 0 ||
        !Number.isFinite(body.restitution ?? 0.1) ||
        (body.restitution ?? 0.1) < 0 ||
        (body.restitution ?? 0.1) > 1
      )
        throw new Error('Invalid rigid body');
    }
    if (
      !(props.gravity ?? [0, 0, -9.81]).every(Number.isFinite) ||
      [
        props.contactSlop ?? 0.002,
        props.contactMatchDistance ?? 0.05,
        props.restitutionThreshold ?? 0.5,
        props.sleepAfter ?? 0.5,
        props.sleepLinearSpeed ?? 0.04,
        props.sleepAngularSpeed ?? 0.04
      ].some(value => !Number.isFinite(value) || value < 0)
    )
      throw new Error('Invalid rigid-body settings');
    if (colliders.length > (this.broadPhase === 'all-pairs' ? 128 : 65535))
      throw new Error('Rigid-body collider capacity exceeded');
    for (const collider of colliders)
      if (
        collider.excludedColliders?.some(
          index => !Number.isInteger(index) || index < 0 || index >= colliders.length
        )
      )
        throw new Error('Invalid collider filter');
    if (
      props.collisionPartitionSize !== undefined &&
      (!Number.isSafeInteger(props.collisionPartitionSize) ||
        props.collisionPartitionSize < 1 ||
        !colliders.length ||
        colliders.length % props.collisionPartitionSize !== 0 ||
        Boolean(props.joints?.length || props.continuous || props.triggers?.length))
    )
      throw new Error('Invalid collision partitions');
    this.colliderCount = colliders.length;
    this.colliderStorageCount = Math.max(1, colliders.length);
    // WGSL fixed arrays require a positive size. A lone private collider cannot
    // collide with itself and lets geometry-free bodies share the normal kernels.
    if (!colliders.length) colliders.push({body: 0, shape: {type: 'box', halfExtents: [0, 0, 0]}});
    this.maximumPairs =
      this.broadPhase === 'all-pairs'
        ? this.colliderStorageCount * this.colliderStorageCount
        : (props.maximumPairs ??
          2 ** Math.ceil(Math.log2(Math.max(64, this.colliderStorageCount * 16))));
    if (
      !['all-pairs', 'hierarchical-grid'].includes(this.broadPhase) ||
      !Number.isSafeInteger(this.maximumPairs) ||
      this.maximumPairs < 1 ||
      this.maximumPairs > 0x40000000 ||
      (this.broadPhase === 'hierarchical-grid' &&
        (this.maximumPairs & (this.maximumPairs - 1)) !== 0)
    )
      throw new Error('Invalid rigid-body pair capacity');
    if (props.continuous) {
      if (
        props.failurePolicy !== 'rollback' ||
        !Number.isInteger(props.continuous.maximumImpacts ?? 4) ||
        (props.continuous.maximumImpacts ?? 4) < 1 ||
        (props.continuous.maximumImpacts ?? 4) > 16 ||
        !['sphere-static', 'convex'].includes(props.continuous.mode ?? 'sphere-static') ||
        !Number.isSafeInteger(props.continuous.maximumCandidates ?? this.maximumPairs) ||
        (props.continuous.maximumCandidates ?? this.maximumPairs) < 1 ||
        (props.continuous.maximumCandidates ?? this.maximumPairs) > 0x40000000 ||
        (props.continuous.mode === 'convex' &&
          (Boolean(props.joints?.length) ||
            colliders.some(collider => ['plane', 'triangle-mesh'].includes(collider.shape.type))))
      )
        throw new Error('Invalid continuous settings');
      for (const index of props.continuous.bodies) {
        const body = props.bodies[index];
        const bodyColliders = colliders.filter(collider => collider.body === index);
        if (
          !Number.isInteger(index) ||
          !body ||
          (body.mode ?? ((body.mass ?? 1) === 0 ? 'static' : 'dynamic')) !== 'dynamic' ||
          body.mass === 0 ||
          bodyColliders.length !== 1 ||
          bodyColliders[0].isTrigger ||
          (props.continuous.mode !== 'convex' && bodyColliders[0].shape.type !== 'sphere') ||
          (props.continuous.mode !== 'convex' &&
            (bodyColliders[0].position ?? [0, 0, 0]).some(
              (value, axis) => value !== (body.centerOfMass ?? [0, 0, 0])[axis]
            ))
        )
          throw new Error('Invalid continuous body geometry');
      }
    }
    if (props.triggers?.length) {
      if (
        props.failurePolicy !== 'rollback' ||
        !Number.isInteger(props.triggerEventCapacity ?? 256) ||
        (props.triggerEventCapacity ?? 256) < 1 ||
        (props.triggerEventCapacity ?? 256) > 65536
      )
        throw new Error('Invalid trigger settings');
      makeRigidBodyTriggerLayout(props.triggers, colliders);
    }
    this.colliders = structuredClone(colliders);
    this.props = structuredClone(props);
  }

  private getStorageLayout() {
    const packed = packRigidBodyShapes(this.colliders);
    const sparse = this.broadPhase === 'hierarchical-grid';
    const extended = this.colliders.some(
      collider =>
        (collider.shape.type !== 'sphere' && collider.shape.type !== 'box') ||
        (collider.isTrigger && collider.shape.type !== 'sphere')
    );
    const parallel = this.solver === 'parallel';
    const storage = {
      packed,
      sparse,
      extended,
      parallel,
      ...getRigidBodyStorageLayout(
        this.count,
        this.colliderStorageCount,
        this.maximumPairs,
        packed.geometry.length,
        sparse,
        extended,
        parallel,
        this.props.eventCapacity ?? 0,
        this.props.enableQueries ?? false,
        this.props.failurePolicy === 'rollback',
        Boolean(this.props.continuous),
        this.props.joints?.length ?? 0
      )
    };
    if (this.props.continuous?.mode === 'convex') {
      storage.buffers = storage.buffers.filter(buffer => buffer.name !== 'continuous-previous');
      storage.buffers.push({name: 'continuous-dispatch', byteLength: 16, uniform: false});
      storage.buffers.push({
        name: 'continuous-work',
        byteLength:
          64 +
          2 ** Math.ceil(Math.log2(Math.max(1, this.colliders.length))) * 32 +
          this.count * 64 +
          (this.props.continuous.maximumCandidates ?? this.maximumPairs) * 48,
        uniform: false
      });
    }
    if (this.props.publicationBounds || this.props.publishPoses)
      storage.buffers.push(
        {name: 'pose-metadata', byteLength: this.count * 48, uniform: false},
        {name: 'pose-matrices', byteLength: this.count * 64, uniform: false},
        {name: 'pose-bounds', byteLength: this.count * 32, uniform: false}
      );
    const triggerLayout = this.props.triggers?.length
      ? makeRigidBodyTriggerLayout(this.props.triggers, this.colliders)
      : undefined;
    if (triggerLayout)
      storage.buffers.push(
        {name: 'trigger-previous', byteLength: this.colliderStorageCount * 16, uniform: false},
        {name: 'trigger-groups', byteLength: triggerLayout.groups.byteLength, uniform: false},
        {name: 'trigger-pairs', byteLength: triggerLayout.pairs.byteLength, uniform: false},
        {
          name: 'trigger-samples',
          byteLength: Math.max(1, triggerLayout.count) * 16,
          uniform: false
        },
        {
          name: 'trigger-history',
          byteLength: Math.max(1, triggerLayout.count) * 16,
          uniform: false
        },
        {
          name: 'trigger-events',
          byteLength: 16 + (this.props.triggerEventCapacity ?? 256) * 32,
          uniform: false
        }
      );
    return {...storage, triggerLayout};
  }

  /** Allocation preflight without GPU allocation. Graph scratch and driver overhead are separate. */
  getCapacityInfo(): GPURigidBodyCapacityInfo {
    const {buffers} = this.getStorageLayout();
    return {
      bodyCount: this.count,
      colliderCount: this.colliderCount,
      maximumPairs: this.maximumPairs,
      pairWorkgroups: Math.ceil(this.maximumPairs / 64),
      buffers,
      ownedBufferBytes: buffers.reduce((total, buffer) => total + buffer.byteLength, 0)
    };
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.device || this.destroyed)
      throw new Error('Rigid-body world already attached or destroyed');
    const {
      packed,
      sparse,
      extended,
      parallel,
      geometryOffset,
      pairOffset,
      diagnosticOffset,
      metadataLength,
      parallelByteLength,
      triggerLayout,
      buffers: allocationPlan
    } = this.getStorageLayout();
    if (Math.ceil(this.maximumPairs / 64) > graph.device.limits.maxComputeWorkgroupsPerDimension)
      throw new Error('Rigid-body pair dispatch exceeds device limits');
    if (
      this.props.continuous?.mode === 'convex' &&
      Math.max(
        Math.ceil((this.props.continuous.maximumCandidates ?? this.maximumPairs) / 64),
        Math.ceil(2 ** Math.ceil(Math.log2(Math.max(1, this.colliders.length))) / 64)
      ) > graph.device.limits.maxComputeWorkgroupsPerDimension
    )
      throw new Error('Continuous candidate dispatch exceeds device limits');
    for (const buffer of allocationPlan) {
      const bindingLimit = buffer.uniform
        ? graph.device.limits.maxUniformBufferBindingSize
        : graph.device.limits.maxStorageBufferBindingSize;
      if (buffer.byteLength > Math.min(graph.device.limits.maxBufferSize, bindingLimit))
        throw new Error(`Rigid-body ${buffer.name} storage exceeds device limits`);
    }
    this.device = graph.device;
    const allocate = (name: string, data: Float32Array | Uint32Array | number, uniform = false) => {
      const buffer = graph.device.createBuffer({
        id: `${this.id}-${name}`,
        ...(typeof data === 'number' ? {byteLength: data} : {data}),
        usage:
          (uniform ? Buffer.UNIFORM : Buffer.STORAGE) |
          Buffer.COPY_DST |
          Buffer.COPY_SRC |
          (['targets', 'parallel-dispatch', 'continuous-dispatch'].includes(name)
            ? Buffer.INDIRECT
            : 0)
      });
      this.ownedBuffers.push(buffer);
      return buffer;
    };
    const positions = new Float32Array(this.count * 4);
    const orientations = new Float32Array(this.count * 4);
    const velocities = new Float32Array(this.count * 4);
    const angular = new Float32Array(this.count * 4);
    const sparseLayout: RigidBodySparseShaderLayout | undefined = sparse
      ? {
          maximumPairs: this.maximumPairs,
          pairOffset: pairOffset - geometryOffset,
          diagnosticOffset: diagnosticOffset - geometryOffset
        }
      : undefined;
    const metadata = new Float32Array(metadataLength);
    metadata.set(packed.geometry, geometryOffset);
    const bodyColliders: GPURigidBodyCollider[][] = Array.from({length: this.count}, () => []);
    if (this.colliderCount)
      for (const collider of this.colliders) bodyColliders[collider.body].push(collider);
    for (const [index, body] of this.props.bodies.entries()) {
      const mass = body.mass ?? 1;
      const mode = body.mode ?? (mass === 0 ? 'static' : 'dynamic');
      const center: Vector3 = body.centerOfMass ?? [0, 0, 0];
      const quaternion = normalizeRigidBodyRotation(body.orientation);
      const offset = rotateRigidBodyVector(quaternion, center);
      positions.set(
        [
          ...body.position.map((value, axis) => value + offset[axis]),
          body.shape?.type === 'sphere' ? body.shape.radius : 0
        ],
        index * 4
      );
      orientations.set(quaternion, index * 4);
      velocities.set(
        [
          ...(mode === 'static' ? [0, 0, 0] : (body.velocity ?? [0, 0, 0])),
          mode === 'dynamic' && mass ? 1 / mass : 0
        ],
        index * 4
      );
      angular.set(mode === 'static' ? [0, 0, 0] : (body.angularVelocity ?? [0, 0, 0]), index * 4);
      const compound = getCompoundBodyInertia(mass, bodyColliders[index], center);
      const inertia = body.inertiaDiagonal ?? compound.diagonal;
      const inertiaRotation = normalizeRigidBodyRotation(
        body.inertiaOrientation ?? (body.inertiaDiagonal ? undefined : compound.orientation)
      );
      metadata.set(
        [
          ...inertia.map(value => (mode === 'dynamic' && value ? 1 / value : 0)),
          center[0],
          ...inertiaRotation,
          mode === 'static' ? 0 : mode === 'dynamic' ? 1 : 2,
          body.gravityFactor ?? 1,
          center[1],
          center[2]
        ],
        index * 12
      );
    }
    const policies: (GPURigidBodyMaterial['frictionCombine'] | undefined)[] = [
      'average',
      'minimum',
      'maximum',
      'multiply'
    ];
    for (const [index, collider] of this.colliders.entries()) {
      const body = this.props.bodies[collider.body];
      const material = collider.material;
      const center: Vector3 = body.centerOfMass ?? [0, 0, 0];
      const offset = (collider.position ?? [0, 0, 0]).map((value, axis) => value - center[axis]);
      const shape = packed.shapes[index];
      metadata.set(
        [
          ...shape.dimensions,
          ...offset,
          collider.body,
          ...normalizeRigidBodyRotation(collider.orientation),
          material?.restitution ?? body.restitution ?? 0.1,
          material?.staticFriction ?? body.friction ?? 0.6,
          material?.dynamicFriction ?? body.friction ?? 0.6,
          collider.isTrigger ? 1 : 0,
          material?.restitutionCombine ? policies.indexOf(material.restitutionCombine) : 4,
          material?.frictionCombine ? policies.indexOf(material.frictionCombine) : 4,
          ...shape.policies,
          ...shape.padding
        ],
        this.count * 12 + index * 24
      );
    }
    const exclusionOffset = this.count * 12 + this.colliderStorageCount * 24;
    for (const [index, filter] of packed.filters.entries())
      metadata.set(filter, exclusionOffset + index * 2);
    this.positions = allocate('positions', positions);
    this.orientations = allocate('orientations', orientations);
    this.velocities = allocate('velocities', velocities);
    this.angularVelocities = allocate('angular-velocities', angular);
    this.sleepStates = allocate('sleep', this.count * 16);
    this.targets = allocate(
      'targets',
      Math.ceil((this.count * 32 + (sparse ? 32 + this.maximumPairs * 8 : 16)) / 16) * 16 +
        (this.props.joints?.length ?? 0) * RIGID_BODY_JOINT_STATE_BYTES
    );
    for (const [index, joint] of (this.props.joints ?? []).entries()) {
      this.targets.write(
        packRigidBodyJointState(joint),
        this.getJointStateOffset() + index * RIGID_BODY_JOINT_STATE_BYTES
      );
    }
    // Four 96-byte contacts followed by a 32-byte aligned manifold header.
    this.manifolds = allocate('manifolds', this.maximumPairs * 416);
    if (extended) this.meshTasks = allocate('mesh-tasks', 16 + 65536 * 48);
    const bodies = allocate('bodies', metadata);
    if (sparse) this.broadPhaseCounters = {buffer: bodies, byteOffset: diagnosticOffset * 4};
    const settings = allocate(
      'settings',
      new Float32Array([
        ...(this.props.gravity ?? [0, 0, -9.81]),
        this.timeStep,
        this.props.contactSlop ?? 0.002,
        0,
        this.props.restitutionThreshold ?? 0.5,
        this.props.contactMatchDistance ?? 0.05,
        this.props.sleepAfter ?? 0.5,
        this.props.sleepLinearSpeed ?? 0.04,
        this.props.sleepAngularSpeed ?? 0.04,
        0,
        this.props.warmStartFactor ?? 1,
        this.props.penetrationRecoveryFraction ?? 0.15,
        this.props.maximumRecoverySpeed ?? 2,
        this.props.parallelRelaxation ?? 1
      ]),
      true
    );
    if (parallel) {
      this.parallelState = allocate('parallel-state', parallelByteLength);
      this.parallelDispatch = allocate('parallel-dispatch', 48);
    }
    const buffers = {
      settings,
      positions: this.positions,
      orientations: this.orientations,
      velocities: this.velocities,
      angularVelocities: this.angularVelocities,
      bodies,
      manifolds: this.manifolds,
      sleepStates: this.sleepStates,
      targets: this.targets,
      ...(this.meshTasks ? {meshTasks: this.meshTasks} : {}),
      ...(this.parallelState
        ? {parallelState: this.parallelState, parallelDispatch: this.parallelDispatch!}
        : {}),
      ...(sparse
        ? {
            minima: allocate('minima', this.colliderStorageCount * 12),
            maxima: allocate('maxima', this.colliderStorageCount * 12)
          }
        : {})
    };
    const bindings = Object.entries(buffers).map(([name, buffer], location) => ({
      name,
      buffer,
      location:
        name === 'parallelDispatch'
          ? 27
          : name === 'parallelState'
            ? 26
            : name === 'minima'
              ? 24
              : name === 'maxima'
                ? 25
                : location >= 8
                  ? location + 1
                  : location,
      resource: graph.importBuffer(
        {
          id: `${this.id}-${name}`,
          byteLength: buffer.byteLength,
          usage:
            location === 0
              ? Buffer.UNIFORM
              : Buffer.STORAGE |
                Buffer.COPY_SRC |
                (['targets', 'parallelDispatch'].includes(name) ? Buffer.INDIRECT : 0)
        },
        buffer
      )
    }));
    const shaderLayout: ShaderLayout = {
      attributes: [],
      bindings: bindings.map(({name, location}): BindingDeclaration => {
        const base = {name, location, group: 0};
        return location === 0
          ? {...base, type: 'uniform'}
          : {...base, type: name === 'bodies' ? 'read-only-storage' : 'storage'};
      })
    };
    const objectAttributes = sparse
      ? allocate(
          'object-attributes',
          Uint32Array.from(this.colliders, collider => {
            const body = this.props.bodies[collider.body];
            const mode = body.mode ?? ((body.mass ?? 1) === 0 ? 'static' : 'dynamic');
            return collider.body | (mode === 'dynamic' ? 0x10000 : 0);
          })
        )
      : null;
    const objectAttributeView = objectAttributes
      ? graph.createDataView(
          graph.importBuffer(
            {
              id: `${this.id}-object-attributes`,
              byteLength: objectAttributes.byteLength,
              usage: Buffer.STORAGE
            },
            objectAttributes
          ),
          {format: 'uint32', length: this.colliderStorageCount}
        )
      : undefined;
    const source = getRigidBodyShader(
      this.count,
      this.props.iterations ?? 16,
      this.colliderStorageCount,
      extended,
      sparseLayout,
      parallel,
      this.props.maximumMeshTraversalTestsPerPair ?? 65536,
      getRigidBodyJointShader(this.props.joints ?? [], this.props.bodies),
      Boolean(this.props.joints?.length),
      this.props.linearDamping ?? 0,
      this.props.angularDamping ?? 0,
      this.props.joints?.length ?? 0,
      this.props.compactContacts ?? true,
      this.props.collisionPartitionSize
    );
    const parallelBindings: Record<string, readonly string[]> = {
      parallelReset: ['parallelState'],
      parallelCompact: ['manifolds', 'parallelState'],
      parallelDispatchCount: ['parallelState', 'parallelDispatch'],
      parallelActive: ['bodies', 'sleepStates', 'manifolds', 'parallelState'],
      parallelActiveCount: ['parallelState', 'parallelDispatch'],
      parallelLink: ['velocities', 'angularVelocities', 'bodies', 'manifolds', 'parallelState'],
      parallelUnion: ['bodies', 'manifolds', 'parallelState'],
      parallelCompress: ['sleepStates', 'parallelState'],
      parallelWakeRoots: ['bodies', 'sleepStates', 'parallelState'],
      parallelWakeBodies: ['bodies', 'sleepStates', 'parallelState'],
      parallelWarm: [
        'positions',
        'orientations',
        'velocities',
        'bodies',
        'manifolds',
        'sleepStates',
        'parallelState'
      ],
      parallelPairs: [
        'settings',
        'positions',
        'orientations',
        'velocities',
        'angularVelocities',
        'bodies',
        'manifolds',
        'sleepStates',
        'parallelState'
      ],
      parallelGather: ['velocities', 'angularVelocities', 'bodies', 'sleepStates', 'parallelState'],
      parallelAdvance: [
        'settings',
        'positions',
        'orientations',
        'velocities',
        'angularVelocities',
        'bodies',
        'sleepStates',
        'targets',
        'parallelState'
      ],
      parallelMarkSleep: ['settings', 'bodies', 'sleepStates', 'parallelState'],
      parallelSleep: ['velocities', 'angularVelocities', 'bodies', 'sleepStates', 'parallelState']
    };
    parallelBindings['parallelSolve'] = parallelBindings['parallelPairs'];
    this.simulationStatistics = allocate('simulation-statistics', 64);
    const statisticsResource = graph.importBuffer(
      {id: `${this.id}-statistics`, byteLength: 64, usage: Buffer.STORAGE},
      this.simulationStatistics
    );
    const restoreCheckpoint =
      this.props.failurePolicy === 'rollback'
        ? addRigidBodyCheckpoint(
            graph,
            this.id,
            [
              'positions',
              'orientations',
              'velocities',
              'angularVelocities',
              'sleepStates',
              'targets',
              'manifolds'
            ].map(name => {
              const binding = bindings.find(binding => binding.name === name)!;
              return {buffer: binding.buffer, resource: binding.resource};
            }),
            {buffer: this.simulationStatistics, resource: statisticsResource},
            allocate
          )
        : undefined;

    const continuousSelection = new Uint32Array(this.count);
    for (const body of this.props.continuous?.bodies ?? [])
      continuousSelection[body] = this.colliders.findIndex(collider => collider.body === body) + 1;
    const continuous = this.props.continuous
      ? addRigidBodyContinuous(
          graph,
          this.id,
          source,
          this.count,
          continuousSelection,
          this.props.continuous.maximumImpacts ?? 4,
          bindings,
          allocate,
          Boolean(this.props.joints?.length),
          this.props.continuous.mode === 'convex'
            ? (this.props.continuous.maximumCandidates ?? this.maximumPairs)
            : 0,
          this.colliderStorageCount,
          extended,
          this.colliders.some(collider => collider.shape.type === 'convex-hull')
        )
      : undefined;
    const triggers = triggerLayout
      ? addRigidBodyTriggers(
          graph,
          this.id,
          source,
          this.colliderStorageCount,
          triggerLayout,
          this.props.triggerEventCapacity ?? 256,
          bindings,
          {
            name: 'triggerStatistics',
            buffer: this.simulationStatistics,
            resource: statisticsResource,
            location: 18
          },
          allocate,
          Boolean(this.props.joints?.length),
          extended
        )
      : undefined;
    this.triggerEvents = triggers?.events ?? null;
    const passDescriptions: Record<string, string> = {
      integrate: 'Apply gravity and advance body velocities and predicted poses for this timestep.',
      prepare: 'Reset broad-phase counters before generating potential collider pairs.',
      bounds: 'Compute world-space collider bounds for broad-phase collision detection.',
      collide: 'Find overlapping collider pairs and generate contact manifolds.',
      meshCollide: 'Generate contacts against triangle meshes and heightfields.',
      meshCollect: 'Collect mesh contacts for the parallel constraint solver.',
      solve: 'Resolve contact and joint constraints, including friction and restitution.',
      finish: 'Publish solved body poses and update sleeping state.',
      parallelReset: 'Initialize body ownership for parallel contact islands.',
      parallelCompact: 'Compact live contact manifolds into a reusable GPU work queue.',
      parallelDispatchCount: 'Build indirect workgroup counts from the compact contact queue.',
      parallelLink: 'Link bodies connected by active contacts or joints.',
      parallelUnion: 'Merge connected bodies into constraint islands.',
      parallelCompress: 'Compress island links to their root body.',
      parallelWakeRoots: 'Mark islands that must wake for active constraints.',
      parallelWakeBodies: 'Wake bodies belonging to active constraint islands.',
      parallelActive: 'Compact awake bodies and contacts after connected islands wake.',
      parallelActiveCount: 'Build indirect dispatches for awake solver work.',
      parallelAdvance: 'Advance body poses using the solved velocities.',
      parallelMarkSleep: 'Identify islands whose bodies are quiet enough to sleep.',
      parallelSleep: 'Put quiet constraint islands to sleep.'
    };
    for (const entryPoint of [
      'integrate',
      ...(sparse ? ['prepare', 'bounds'] : []),
      'collide',
      ...(extended ? ['meshCollide'] : []),
      ...(parallel
        ? [
            ...(extended ? ['meshCollect'] : []),
            'parallelReset',
            ...(this.props.compactContacts !== false
              ? ['parallelCompact', 'parallelDispatchCount']
              : []),
            'parallelLink',
            'parallelUnion',
            'parallelCompress',
            'parallelWakeRoots',
            'parallelWakeBodies',
            ...(this.props.compactContacts !== false
              ? ['parallelActive', 'parallelActiveCount']
              : []),
            'parallelSolve',
            'parallelAdvance',
            'parallelMarkSleep',
            'parallelSleep'
          ]
        : [...(extended && this.props.joints?.length ? ['meshCollect'] : []), 'solve', 'finish'])
    ]) {
      if (sparse && entryPoint === 'collide') {
        const bodyBinding = bindings.find(binding => binding.name === 'bodies')!;
        const minimumBinding = bindings.find(binding => binding.name === 'minima')!;
        const maximumBinding = bindings.find(binding => binding.name === 'maxima')!;
        const broadPhase = new GPURigidBodyBroadPhase({
          id: `${this.id}-broad-phase`,
          objectMetadata: objectAttributeView,
          partitionSize: this.props.collisionPartitionSize,
          maximumCandidateTestsPerQuery: this.props.maximumCandidateTestsPerCollider,
          minima: graph.createDataView(minimumBinding.resource, {
            format: 'float32x3',
            length: this.colliderStorageCount
          }),
          maxima: graph.createDataView(maximumBinding.resource, {
            format: 'float32x3',
            length: this.colliderStorageCount
          }),
          pairs: graph.createDataView(bodyBinding.resource, {
            format: 'uint32x2',
            length: this.maximumPairs,
            byteOffset: pairOffset * 4
          }),
          diagnostics: graph.createDataView(bodyBinding.resource, {
            format: 'uint32',
            length: 8,
            byteOffset: diagnosticOffset * 4
          })
        });
        addGPUCommandNodes(graph, broadPhase.getCommandNodes(graph));
      }
      const unusedCore = entryPoint.startsWith('parallel')
        ? bindings
            .filter(binding => !parallelBindings[entryPoint].includes(binding.name))
            .map(binding => binding.name)
        : entryPoint === 'meshCollect'
          ? ['sleepStates', 'targets', 'parallelState']
          : entryPoint === 'prepare'
            ? bindings
                .filter(binding => !['targets', 'manifolds'].includes(binding.name))
                .map(binding => binding.name)
            : entryPoint === 'bounds'
              ? bindings
                  .filter(
                    binding =>
                      ![
                        'settings',
                        'positions',
                        'orientations',
                        'bodies',
                        'minima',
                        'maxima'
                      ].includes(binding.name)
                  )
                  .map(binding => binding.name)
              : entryPoint === 'meshCollide'
                ? ['velocities', 'angularVelocities', 'manifolds', 'sleepStates', 'targets']
                : entryPoint === 'integrate'
                  ? ['manifolds']
                  : entryPoint === 'collide'
                    ? [
                        'sleepStates',
                        ...(extended || sparse || this.props.joints?.length ? [] : ['targets'])
                      ]
                    : entryPoint === 'finish'
                      ? ['manifolds', 'meshTasks']
                      : this.props.joints?.length
                        ? []
                        : ['targets'];
      const unused = [
        ...unusedCore,
        ...(entryPoint === 'solve' && this.props.joints?.length ? ['meshTasks'] : []),
        ...(entryPoint.startsWith('parallel') ? [] : ['parallelState', 'parallelDispatch']),
        ...(entryPoint === 'bounds' ? [] : ['minima', 'maxima'])
      ];
      const activeBindings = bindings.filter(binding => !unused.includes(binding.name));
      const activeLayout: ShaderLayout = {
        attributes: [],
        bindings: shaderLayout.bindings!.filter(binding => !unused.includes(binding.name))
      };
      const indirectPairs =
        parallel &&
        this.props.compactContacts !== false &&
        ['parallelSolve', 'parallelLink', 'parallelUnion'].includes(entryPoint);
      const dispatchBinding = bindings.find(binding => binding.name === 'parallelDispatch');
      const indirectResources = indirectPairs
        ? [{buffer: dispatchBinding!.resource, usage: 'indirect' as const}]
        : [];
      if (entryPoint === 'parallelSolve') {
        const stages = ['parallelWarm', 'parallelPairs', 'parallelGather'];
        const properties = stages.map(stage => ({
          id: `${this.id}-${stage}`,
          source,
          entryPoint: stage,
          shaderLayout: {
            attributes: [],
            bindings: activeLayout.bindings!.filter(binding =>
              parallelBindings[stage].includes(binding.name)
            )
          }
        }));
        const executable = (
          computations: Computation[]
        ): GPUCommandGraphComputeExecutable<Parameters> => ({
          encode: ({computePass, getBuffer}) => {
            const resolved: Record<string, Binding> = {};
            for (const binding of activeBindings)
              resolved[binding.name] = getBuffer(binding.resource);
            for (const [index, computation] of computations.entries())
              computation.setBindings(
                Object.fromEntries(
                  Object.entries(resolved).filter(([name]) =>
                    parallelBindings[stages[index]].includes(name)
                  )
                )
              );
            const dispatchPairs = (computation: Computation) => {
              if (indirectPairs)
                computation.dispatchIndirect(computePass, getBuffer(dispatchBinding!.resource), 16);
              else computation.dispatch(computePass, Math.ceil(this.maximumPairs / 64));
            };
            const dispatchBodies = (computation: Computation) => {
              if (indirectPairs)
                computation.dispatchIndirect(computePass, getBuffer(dispatchBinding!.resource), 32);
              else computation.dispatch(computePass, Math.ceil(this.count / 64));
            };
            dispatchPairs(computations[0]);
            dispatchBodies(computations[2]);
            for (let iteration = 0; iteration < (this.props.iterations ?? 16); iteration++) {
              dispatchPairs(computations[1]);
              dispatchBodies(computations[2]);
            }
          },
          destroy: () => {
            for (const computation of computations) computation.destroy();
          }
        });
        // Iterations share one semantic graph node; dispatch boundaries synchronize pair and body owners.
        graph.addComputePass({
          id: `${this.id}-solve`,
          description: passDescriptions['solve'],
          resources: [
            ...indirectResources,
            ...activeBindings.map(binding => ({
              buffer: binding.resource,
              usage:
                binding.name === 'settings'
                  ? ('uniform' as const)
                  : binding.name === 'bodies'
                    ? ('storage-read' as const)
                    : ('storage-read-write' as const)
            }))
          ],
          compile: ({device}) =>
            executable(properties.map(properties => new Computation(device, properties))),
          compileAsync: async ({device}) =>
            executable(
              await Promise.all(
                properties.map(properties => Computation.createAsync(device, properties))
              )
            )
        });
        continue;
      }
      const createExecutable = (
        computation: Computation
      ): GPUCommandGraphComputeExecutable<Parameters> => ({
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const binding of activeBindings)
            resolved[binding.name] = getBuffer(binding.resource);
          computation.setBindings(resolved);
          if (indirectPairs) {
            computation.dispatchIndirect(computePass, getBuffer(dispatchBinding!.resource), 0);
          } else if (entryPoint === 'meshCollide') {
            const targetBinding = bindings.find(binding => binding.name === 'targets')!;
            computation.dispatchIndirect(
              computePass,
              getBuffer(targetBinding.resource),
              this.count * 32
            );
          } else {
            computation.dispatch(
              computePass,
              ['parallelLink', 'parallelUnion', 'parallelCompact'].includes(entryPoint)
                ? Math.ceil(this.maximumPairs / 64)
                : entryPoint === 'parallelActive'
                  ? Math.ceil(Math.max(this.maximumPairs, this.count) / 64)
                  : ['parallelDispatchCount', 'parallelActiveCount'].includes(entryPoint)
                    ? 1
                    : entryPoint.startsWith('parallel')
                      ? Math.ceil(this.count / 64)
                      : entryPoint === 'collide'
                        ? Math.ceil(this.maximumPairs / 64)
                        : entryPoint === 'bounds'
                          ? Math.ceil(this.colliderStorageCount / 64)
                          : entryPoint === 'integrate'
                            ? Math.ceil(this.count / 64)
                            : 1
            );
          }
        },
        destroy: () => computation.destroy()
      });
      const computationProps = {
        id: `${this.id}-${entryPoint}`,
        source,
        entryPoint,
        shaderLayout: activeLayout
      };
      graph.addComputePass({
        id: computationProps.id,
        description: passDescriptions[entryPoint],
        resources: [
          ...indirectResources,
          ...activeBindings.map(binding => ({
            buffer: binding.resource,
            usage:
              binding.location === 0
                ? ('uniform' as const)
                : binding.name === 'bodies'
                  ? ('storage-read' as const)
                  : ('storage-read-write' as const)
          })),
          ...(entryPoint === 'meshCollide'
            ? [
                {
                  buffer: bindings.find(binding => binding.name === 'targets')!.resource,
                  usage: 'indirect' as const
                }
              ]
            : [])
        ],
        compile: ({device}) => createExecutable(new Computation(device, computationProps)),
        compileAsync: async ({device}) =>
          createExecutable(await Computation.createAsync(device, computationProps))
      });
    }
    continuous?.finish();
    triggers?.sample();
    restoreCheckpoint?.validate();
    const diagnosticBinding = (name: string) => {
      const binding = bindings.find(binding => binding.name === name)!;
      return {buffer: binding.buffer, resource: binding.resource};
    };
    addRigidBodyDiagnostics(graph, `${this.id}-diagnostics`, this.simulationStatistics, {
      statisticsResource,
      ...(restoreCheckpoint ? {validity: restoreCheckpoint.validity} : {}),
      ...(triggers ? {triggers: triggers.samples} : {}),
      ...(continuous ? {continuous: {...continuous.status, count: this.count}} : {}),
      ...(sparse
        ? {
            broadPhase: {...diagnosticBinding('bodies'), wordOffset: diagnosticOffset},
            targets: {...diagnosticBinding('targets'), wordOffset: this.count * 8 + 4}
          }
        : {}),
      ...(extended ? {meshTasks: diagnosticBinding('meshTasks')} : {}),
      ...(parallel ? {parallelState: diagnosticBinding('parallelState')} : {})
    });
    restoreCheckpoint?.restore();
    triggers?.publish();
    if (this.props.publicationBounds || this.props.publishPoses) {
      const publication = addRigidBodyPosePublication(
        graph,
        this.id,
        this.props.bodies,
        this.props.publicationBounds ??
          this.props.bodies.map(() => [
            [0, 0, 0],
            [0, 0, 0]
          ]),
        diagnosticBinding('positions'),
        diagnosticBinding('orientations'),
        allocate
      );
      this.encodePosePublication = publication.encode;
      this.poseMatrices = publication.matrices;
      this.poseBounds = this.props.publicationBounds ? publication.bounds : null;
    }
    if (this.props.eventCapacity) {
      const contactHistory = allocate('contact-history', this.maximumPairs * 16);
      this.contactEvents = allocate('contact-events', 16 + this.props.eventCapacity * 64);
      const eventBindings = [
        ...bindings.filter(binding => ['bodies', 'manifolds'].includes(binding.name)),
        ...(this.props.failurePolicy === 'rollback'
          ? [
              {
                name: 'eventStatistics',
                buffer: this.simulationStatistics,
                resource: statisticsResource,
                location: 14
              }
            ]
          : []),
        ...[
          {name: 'contactHistory', buffer: contactHistory, location: 12},
          {name: 'contactEvents', buffer: this.contactEvents, location: 13}
        ].map(binding => ({
          ...binding,
          resource: graph.importBuffer(
            {
              id: `${this.id}-${binding.name}`,
              byteLength: binding.buffer.byteLength,
              usage: Buffer.STORAGE
            },
            binding.buffer
          )
        }))
      ];
      const properties = {
        id: `${this.id}-contact-events`,
        source:
          source +
          getRigidBodyEventShader(
            this.props.eventCapacity,
            this.props.impactImpulseThreshold ?? 1,
            this.props.failurePolicy === 'rollback'
          ),
        entryPoint: 'recordContacts',
        shaderLayout: {
          bindings: eventBindings.map(({name, location}) => ({
            name,
            location,
            group: 0,
            type: ['bodies', 'eventStatistics'].includes(name)
              ? ('read-only-storage' as const)
              : ('storage' as const)
          }))
        }
      };
      const executable = (
        computation: Computation
      ): GPUCommandGraphComputeExecutable<Parameters> => ({
        encode: ({computePass, getBuffer}) => {
          computation.setBindings(
            Object.fromEntries(
              eventBindings.map(binding => [binding.name, getBuffer(binding.resource)])
            )
          );
          computation.dispatch(computePass, 1);
        },
        destroy: () => computation.destroy()
      });
      graph.addComputePass({
        id: properties.id,
        description: 'Compare contact history and publish contact begin, persist, and end events.',
        resources: eventBindings.map(binding => ({
          buffer: binding.resource,
          usage: ['bodies', 'eventStatistics'].includes(binding.name)
            ? ('storage-read' as const)
            : ('storage-read-write' as const)
        })),
        compile: () => executable(new Computation(graph.device, properties)),
        compileAsync: async () =>
          executable(await Computation.createAsync(graph.device, properties))
      });
    }
    if (this.props.enableQueries) {
      this.querySettings = allocate('query-settings', 48, true);
      this.querySelection = allocate('query-selection', Math.max(4, this.colliderStorageCount * 4));
      this.queryOutput = allocate('query-output', 16 + Math.max(1, this.colliderStorageCount) * 48);
      const queryProperties = {
        id: `${this.id}-queries`,
        source: source + RIGID_BODY_QUERY_GEOMETRY_SHADER + RIGID_BODY_QUERY_SHADER,
        entryPoint: 'queryColliders',
        shaderLayout: {
          bindings: [
            ...shaderLayout.bindings!.filter(binding =>
              ['positions', 'orientations', 'bodies'].includes(binding.name)
            ),
            {name: 'query', group: 0, location: 12, type: 'uniform'},
            {name: 'querySelection', group: 0, location: 13, type: 'read-only-storage'},
            {name: 'queryOutput', group: 0, location: 14, type: 'storage'}
          ]
        },
        bindings: {
          positions: this.positions,
          orientations: this.orientations,
          bodies,
          query: this.querySettings,
          querySelection: this.querySelection,
          queryOutput: this.queryOutput
        }
      } satisfies ConstructorParameters<typeof Computation>[1];
      this.queryComputation = new Computation(graph.device, queryProperties);
      this.queryReduction = new Computation(graph.device, {
        ...queryProperties,
        entryPoint: 'reduceQueries',
        shaderLayout: {
          bindings: queryProperties.shaderLayout.bindings.filter(binding =>
            ['query', 'querySelection', 'queryOutput'].includes(binding.name)
          )
        },
        bindings: {
          query: this.querySettings,
          querySelection: this.querySelection,
          queryOutput: this.queryOutput
        }
      });
    }
    this.controlSettings = allocate('control-settings', 64, true);
    const controlProperties = {
      id: `${this.id}-impulse`,
      source:
        source +
        /* wgsl */ `
struct Command { impulse: vec4f, point: vec4f, orientation: vec4f, bodyIndex: vec4u }
@group(0) @binding(8) var<uniform> command: Command;
@compute @workgroup_size(1) fn control() {
 if(command.bodyIndex.y==0u) {applyImpulse(command.bodyIndex.x,command.point.xyz,command.impulse.xyz);}
 else if(command.bodyIndex.y==6u){
  let body=command.bodyIndex.x;let shift=rotate(orientations[body],command.impulse.xyz);
  positions[body]=vec4f(positions[body].xyz+shift,positions[body].w);
  var linear=velocities[body].xyz+cross(angularVelocities[body].xyz,shift);
  var angular=angularVelocities[body].xyz;
  if(command.point.w>0.0){linear=command.point.xyz;}
  if(command.orientation.w>0.0){angular=command.orientation.xyz;}
  if(bodies.bodies[body].motion.x==0.0){linear=vec3f(0);angular=vec3f(0);}
  velocities[body]=vec4f(linear,command.impulse.w);angularVelocities[body]=vec4f(angular,0);
  if(command.bodyIndex.z!=0u){targets.entries[body].position.w=0.0;}
 }
 else if(command.bodyIndex.y==5u){let body=command.bodyIndex.x;if(dynamic(body)){angularVelocities[body]=vec4f(angularVelocities[body].xyz+inverseInertia(body,command.impulse.xyz),0);}}
 else if(command.bodyIndex.y==2u) {applyImpulse(command.bodyIndex.x,positions[command.bodyIndex.x].xyz,command.impulse.xyz);}
 ${this.props.joints?.length ? 'else if(command.bodyIndex.y==3u){targets.joints[command.bodyIndex.x].control.x=command.impulse.x;}' : ''}
 else {targets.entries[command.bodyIndex.x].position=vec4f(command.point.xyz,1);targets.entries[command.bodyIndex.x].orientation=command.orientation;}
}
@compute @workgroup_size(64) fn invalidate(@builtin(global_invocation_id) invocation:vec3u) {
 let index=invocation.x+invocation.y*4194240u;
 if(index<BODY_COUNT){sleepStates[index]=vec4f(0);}
 if(index<PAIR_CAPACITY){manifolds[index].count=0u;}
 ${this.props.joints?.length ? `if(index<${this.props.joints.length}u){for(var row=0u;row<8u;row++){targets.joints[index].impulses[row]=0.0;}}` : ''}
}`,
      entryPoint: 'control',
      shaderLayout: {
        bindings: [
          ...shaderLayout.bindings!.filter(
            binding =>
              ![
                'settings',
                'meshTasks',
                'parallelState',
                'parallelDispatch',
                'minima',
                'maxima'
              ].includes(binding.name)
          ),
          {name: 'command', group: 0, location: 8, type: 'uniform'}
        ]
      },
      bindings: {
        ...Object.fromEntries(
          Object.entries(buffers).filter(
            ([name]) =>
              ![
                'settings',
                'meshTasks',
                'parallelState',
                'parallelDispatch',
                'minima',
                'maxima'
              ].includes(name)
          )
        ),
        command: this.controlSettings
      }
    } satisfies ConstructorParameters<typeof Computation>[1];
    this.control = new Computation(graph.device, {
      ...controlProperties,
      shaderLayout: {
        bindings: controlProperties.shaderLayout.bindings.filter(
          binding => !['sleepStates', 'manifolds'].includes(binding.name)
        )
      },
      bindings: Object.fromEntries(
        Object.entries(controlProperties.bindings).filter(
          ([name]) => !['sleepStates', 'manifolds'].includes(name)
        )
      )
    });
    const invalidationBindings = [
      'sleepStates',
      'manifolds',
      ...(this.props.joints?.length ? ['targets'] : [])
    ];
    this.invalidation = new Computation(graph.device, {
      ...controlProperties,
      id: `${this.id}-invalidate`,
      entryPoint: 'invalidate',
      shaderLayout: {
        bindings: controlProperties.shaderLayout.bindings.filter(binding =>
          invalidationBindings.includes(binding.name)
        )
      },
      bindings: Object.fromEntries(
        Object.entries(controlProperties.bindings).filter(([name]) =>
          invalidationBindings.includes(name)
        )
      )
    });
  }

  private invalidateState(pass: Parameters<Computation['dispatch']>[0]): void {
    const workgroups = Math.ceil(
      Math.max(this.count, this.maximumPairs, this.props.joints?.length ?? 0) / 64
    );
    this.invalidation!.dispatch(pass, Math.min(65535, workgroups), Math.ceil(workgroups / 65535));
  }

  /** Double-precision global origin. GPU poses, controls, queries and event points are local. */
  get origin(): readonly [number, number, number] {
    return [...this.worldOrigin];
  }

  /** Rebase between submissions, preserving velocities, contact impulses and sleeping state. */
  shiftOrigin(shift: Vector3): void {
    if (!this.device || this.destroyed || this.queryPending || this.eventRead || this.triggerRead)
      throw new Error('Origin shifting requires an idle attached world');
    // Exact float32 shifts keep the CPU origin and GPU subtraction consistent.
    if (
      shift.length !== 3 ||
      shift.some(value => !Number.isFinite(value) || Math.fround(value) !== value)
    )
      throw new Error('Origin shift must be an exactly representable float32 vector');
    if (shift.every(value => value === 0)) return;
    shiftRigidBodyBuffers(
      this.device,
      this.id,
      this.ownedBuffers,
      this.count,
      this.colliderStorageCount,
      this.maximumPairs,
      this.props.eventCapacity ?? 0,
      shift
    );
    this.worldOrigin = this.worldOrigin.map((value, axis) => value + shift[axis]) as [
      number,
      number,
      number
    ];
    this.publishPoses();
  }

  /** Inspect the declared motion mode without exposing mutable world configuration. */
  getBodyMode(body: number): 'static' | 'dynamic' | 'kinematic' | undefined {
    const definition = this.props.bodies[body];
    return definition
      ? (definition.mode ?? ((definition.mass ?? 1) === 0 ? 'static' : 'dynamic'))
      : undefined;
  }

  /** Submit an impulse at a world-space point, or the current GPU center of mass when omitted. */
  applyImpulse(body: number, impulse: Vector3, point?: Vector3): void {
    if (
      !this.control ||
      !this.device ||
      !this.controlSettings ||
      this.destroyed ||
      !Number.isInteger(body) ||
      body < 0 ||
      body >= this.count ||
      ![...impulse, ...(point ?? [])].every(Number.isFinite)
    )
      throw new Error('Invalid rigid-body impulse');
    const data = new ArrayBuffer(64);
    new Float32Array(data).set([...impulse, 0, ...(point ?? [0, 0, 0]), 0]);
    new Uint32Array(data)[12] = body;
    new Uint32Array(data)[13] = point ? 0 : 2;
    this.controlSettings.write(new Uint8Array(data));
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.control.dispatch(pass, 1);
    this.invalidateState(pass);
    pass.end();
    this.device.submit(encoder.finish());
  }

  /** Read configured motion properties; use readState() for simulated pose and velocity. */
  getBodyParameters(
    body: number,
    {deriveInertia = true}: {deriveInertia?: boolean} = {}
  ): GPURigidBodyParameters {
    const definition = this.props.bodies[body];
    if (!definition || this.destroyed) throw new Error('Invalid body');
    const {
      mode,
      mass,
      centerOfMass,
      inertiaDiagonal,
      inertiaOrientation,
      velocity,
      angularVelocity,
      gravityFactor
    } = definition;
    const compound = getCompoundBodyInertia(
      mass ?? 1,
      this.colliders.filter(collider => collider.body === body),
      centerOfMass ?? [0, 0, 0]
    );
    return structuredClone({
      mode: mode ?? ((mass ?? 1) === 0 ? 'static' : 'dynamic'),
      mass: mass ?? 1,
      centerOfMass: centerOfMass ?? [0, 0, 0],
      inertiaDiagonal: inertiaDiagonal ?? (deriveInertia ? compound.diagonal : undefined),
      inertiaOrientation:
        inertiaOrientation ??
        (deriveInertia ? (inertiaDiagonal ? [0, 0, 0, 1] : compound.orientation) : undefined),
      velocity: velocity ?? [0, 0, 0],
      angularVelocity: angularVelocity ?? [0, 0, 0],
      gravityFactor: gravityFactor ?? 1
    });
  }

  /** Refresh render outputs without integrating or solving a simulation step. */
  publishPoses(): void {
    if (!this.device || this.destroyed) throw new Error('Unavailable physics world');
    if (!this.encodePosePublication) return;
    const encoder = this.device.createCommandEncoder();
    this.encodePosePublication(encoder);
    this.device.submit(encoder.finish());
  }

  /** Update visual bounds independently of collision geometry, before the next submission. */
  setPublicationBounds(bounds: readonly GPURigidBodyBounds[]): void {
    if (
      !this.poseBounds ||
      bounds.length !== this.count ||
      bounds.some(
        bound =>
          bound.length !== 2 ||
          bound.some(
            vector =>
              vector.length !== 3 || !vector.every(value => Number.isFinite(Math.fround(value)))
          ) ||
          bound[0].some((value, axis) => value > bound[1][axis])
      )
    )
      throw new Error('Invalid publication bounds');
    const metadata = this.ownedBuffers.find(buffer => buffer.id === `${this.id}-pose-metadata`)!;
    const data = new Float32Array(this.count * 12);
    for (const [index, body] of this.props.bodies.entries())
      data.set(
        [...(body.centerOfMass ?? [0, 0, 0]), 0, ...bounds[index][0], 0, ...bounds[index][1], 0],
        index * 12
      );
    metadata.write(data);
    this.props.publicationBounds = structuredClone(bounds);
  }

  /** Applied scale relative to the initially cooked analytic shape. */
  getColliderShapeScale(colliderIndex: number): number[] {
    this.getColliderShape(colliderIndex);
    return [...(this.colliderShapeScales.get(colliderIndex) ?? [1, 1, 1])];
  }

  /** Return a detached copy of the configured collision geometry. */
  getColliderShape(colliderIndex: number): GPURigidBodyShape {
    const collider = this.colliders[colliderIndex];
    if (!Number.isInteger(colliderIndex) || !collider || this.destroyed)
      throw new Error('Invalid collider');
    return structuredClone(collider.shape);
  }

  /** Edit analytic dimensions without recompiling or reading body state back to the CPU.
   * All edits are validated before publication. Shape kinds and mesh topology require rebuild().
   * Explicit mass/COM/inertia and authored visual bounds remain caller-owned.
   */
  setColliderShapes(
    edits: readonly {collider: number; shape: GPURigidBodyShape; shapeScale?: readonly number[]}[]
  ): void {
    if (!this.device || this.destroyed) throw new Error('World is not attached');
    const indices = new Set<number>();
    const shapes = edits.map(edit => {
      const previous = this.getColliderShape(edit.collider);
      const shape = structuredClone(edit.shape);
      if (
        edit.shapeScale &&
        (edit.shapeScale.length !== 3 ||
          edit.shapeScale.some(value => !Number.isFinite(value) || value <= 0))
      )
        throw new Error('Invalid collider shape scale');
      if (
        indices.has(edit.collider) ||
        previous.type !== shape.type ||
        shape.type === 'convex-hull' ||
        shape.type === 'triangle-mesh'
      )
        throw new Error('Shape edit requires a topology rebuild');
      indices.add(edit.collider);
      const properties = getRigidBodyShapeProperties(shape);
      const packed = packRigidBodyShapes([{shape}]).shapes[0];
      if (
        ![
          ...packed.dimensions,
          properties.volume,
          ...properties.tensor,
          ...properties.center
        ].every(value => Number.isFinite(Math.fround(value)))
      )
        throw new Error('Shape exceeds float32 range');
      return {
        collider: edit.collider,
        shape,
        dimensions: packed.dimensions,
        shapeScale: edit.shapeScale
      };
    });
    const metadata = this.ownedBuffers.find(buffer => buffer.id === `${this.id}-bodies`);
    if (!metadata) throw new Error('World is not attached');
    for (const edit of shapes) {
      metadata.write(new Float32Array(edit.dimensions), this.count * 48 + edit.collider * 96);
      this.colliders[edit.collider].shape = edit.shape;
      if (edit.shapeScale) this.colliderShapeScales.set(edit.collider, [...edit.shapeScale]);
    }
    for (const body of new Set(shapes.map(edit => this.colliders[edit.collider].body))) {
      this.updateColliderDefinitions(body);
      // Recalculate derived inertia while preserving simulated velocities and the node origin.
      this.setBodyParameters(body, {});
    }
  }

  /** Change an existing collider material between submissions, invalidating cached friction. */
  setColliderMaterial(colliderIndex: number, material: GPURigidBodyMaterial): void {
    const collider = this.colliders[colliderIndex];
    if (!this.device || this.destroyed || !Number.isInteger(colliderIndex) || !collider)
      throw new Error('Invalid collider');
    const policies: (GPURigidBodyMaterial['frictionCombine'] | undefined)[] = [
      'average',
      'minimum',
      'maximum',
      'multiply'
    ];
    if (
      [
        material.staticFriction ?? 0.6,
        material.dynamicFriction ?? 0.6,
        material.restitution ?? 0.1
      ].some(value => !Number.isFinite(Math.fround(value)) || value < 0) ||
      (material.restitution ?? 0.1) > 1 ||
      [material.frictionCombine, material.restitutionCombine].some(
        value => value !== undefined && !policies.includes(value)
      )
    )
      throw new Error('Invalid collider material');
    const body = this.props.bodies[collider.body];
    const metadata = this.ownedBuffers.find(buffer => buffer.id === `${this.id}-bodies`);
    if (!metadata) throw new Error('World is not attached');
    metadata.write(
      new Float32Array([
        material.restitution ?? body.restitution ?? 0.1,
        material.staticFriction ?? body.friction ?? 0.6,
        material.dynamicFriction ?? body.friction ?? 0.6
      ]),
      this.count * 48 + colliderIndex * 96 + 48
    );
    metadata.write(
      new Float32Array([
        material.restitutionCombine ? policies.indexOf(material.restitutionCombine) : 4,
        material.frictionCombine ? policies.indexOf(material.frictionCombine) : 4
      ]),
      this.count * 48 + colliderIndex * 96 + 64
    );
    collider.material = structuredClone(material);
    this.updateColliderDefinitions(collider.body);
    this.wake();
  }

  /** Teleport a collider in its body-node frame, preserving the body pose and explicit COM. */
  setColliderTransform(
    colliderIndex: number,
    position: Vector3,
    orientation: readonly [number, number, number, number]
  ): void {
    const collider = this.colliders[colliderIndex];
    if (
      this.destroyed ||
      !this.device ||
      !collider ||
      !position.every(value => Number.isFinite(Math.fround(value)))
    )
      throw new Error('Invalid collider transform');
    const rotation = normalizeRigidBodyRotation(orientation);
    const center = this.props.bodies[collider.body].centerOfMass ?? [0, 0, 0];
    if (
      this.props.continuous?.mode !== 'convex' &&
      this.props.continuous?.bodies.includes(collider.body) &&
      position.some((value, axis) => value !== center[axis])
    )
      throw new Error('Collider transform exceeds continuous envelope');
    const metadata = this.ownedBuffers.find(buffer => buffer.id === `${this.id}-bodies`);
    if (!metadata) throw new Error('World is not attached');
    metadata.write(
      new Float32Array([
        ...position.map((value, axis) => value - center[axis]),
        collider.body,
        ...rotation
      ]),
      this.count * 48 + colliderIndex * 96 + 16
    );
    collider.position = [...position];
    collider.orientation = rotation;
    this.updateColliderDefinitions(collider.body);
    this.setBodyParameters(collider.body, {});
  }

  private updateColliderDefinitions(bodyIndex: number): void {
    const {shape, colliders, ...properties} = this.props.bodies[bodyIndex];
    const updated = this.colliders
      .filter(candidate => candidate.body === bodyIndex)
      .map(({body, ...candidate}) => candidate);
    const bodies = [...this.props.bodies];
    bodies[bodyIndex] = {...properties, colliders: updated};
    this.props.bodies = bodies;
  }

  getColliderMaterial(collider: number): GPURigidBodyMaterial {
    const definition = this.colliders[collider];
    if (!definition || this.destroyed) throw new Error('Invalid collider');
    return structuredClone(definition.material ?? {});
  }

  private restoreColliderDefinitions(): void {
    for (const [bodyIndex, body] of this.props.bodies.entries()) {
      const definitions: readonly GPURigidBodyCollider[] =
        body.colliders ?? (body.shape ? [{shape: body.shape}] : []);
      let index = 0;
      for (const collider of this.colliders)
        if (collider.body === bodyIndex) {
          const definition = definitions[index++];
          collider.shape = structuredClone(definition.shape);
          collider.material = structuredClone(definition.material);
          collider.position = structuredClone(definition.position);
          collider.orientation = structuredClone(definition.orientation);
        }
    }
  }

  /** Update motion properties between submissions; preserve the node pose when its COM changes. */
  setBodyParameters(bodyIndex: number, parameters: GPURigidBodyParameters): void {
    if (
      !this.device ||
      !this.control ||
      !this.controlSettings ||
      this.destroyed ||
      !Number.isInteger(bodyIndex) ||
      !this.props.bodies[bodyIndex]
    )
      throw new Error('Invalid body mutation');
    const previous = this.props.bodies[bodyIndex];
    const next = {...previous, ...structuredClone(parameters)};
    const mass = next.mass ?? 1;
    const mode = next.mode ?? (mass === 0 ? 'static' : 'dynamic');
    const center: Vector3 = next.centerOfMass ?? [0, 0, 0];
    const oldCenter: Vector3 = previous.centerOfMass ?? [0, 0, 0];
    if (
      !['static', 'dynamic', 'kinematic'].includes(mode) ||
      !Number.isFinite(Math.fround(mass)) ||
      mass < 0 ||
      ![
        ...center,
        ...(next.velocity ?? []),
        ...(next.angularVelocity ?? []),
        next.gravityFactor ?? 1
      ].every(value => Number.isFinite(Math.fround(value))) ||
      (next.inertiaDiagonal ?? []).some(
        value => !Number.isFinite(Math.fround(value)) || value < 0
      ) ||
      (next.inertiaOrientation && !next.inertiaDiagonal)
    )
      throw new Error('Invalid motion properties');
    const colliders = this.colliders.filter(collider => collider.body === bodyIndex);
    for (const collider of colliders)
      if (
        (collider.shape.type === 'convex-hull' || collider.shape.type === 'triangle-mesh') &&
        mode !== 'static' &&
        mass > 0 &&
        (!collider.shape.geometry.closed ||
          !(getRigidBodyShapeProperties(collider.shape).volume > 0))
      )
        throw new Error('Dynamic meshes require closed positive-volume geometry');
    if (
      this.props.continuous?.bodies.includes(bodyIndex) &&
      (mode !== 'dynamic' ||
        mass === 0 ||
        (this.props.continuous.mode !== 'convex' &&
          (colliders[0].position ?? [0, 0, 0]).some((value, axis) => value !== center[axis])))
    )
      throw new Error('Mutation exceeds the continuous body envelope');
    const compound = getCompoundBodyInertia(mass, colliders, center);
    const inertia = next.inertiaDiagonal ?? compound.diagonal;
    const rotation = normalizeRigidBodyRotation(
      next.inertiaOrientation ?? (next.inertiaDiagonal ? undefined : compound.orientation)
    );
    const metadata = this.ownedBuffers.find(buffer => buffer.id === `${this.id}-bodies`)!;
    metadata.write(
      new Float32Array([
        ...inertia.map(value => (mode === 'dynamic' && value ? 1 / value : 0)),
        center[0],
        ...rotation,
        mode === 'static' ? 0 : mode === 'dynamic' ? 1 : 2,
        next.gravityFactor ?? 1,
        center[1],
        center[2]
      ]),
      bodyIndex * 48
    );
    const attributes = this.ownedBuffers.find(
      buffer => buffer.id === `${this.id}-object-attributes`
    );
    for (const [index, collider] of this.colliders.entries())
      if (collider.body === bodyIndex) {
        metadata.write(
          new Float32Array(
            (collider.position ?? [0, 0, 0]).map((value, axis) => value - center[axis])
          ),
          this.count * 48 + index * 96 + 16
        );
        attributes?.write(
          new Uint32Array([bodyIndex | (mode === 'dynamic' ? 0x10000 : 0)]),
          index * 4
        );
      }
    this.ownedBuffers
      .find(buffer => buffer.id === `${this.id}-pose-metadata`)
      ?.write(new Float32Array(center), bodyIndex * 48);
    const data = new ArrayBuffer(64);
    new Float32Array(data).set([
      ...center.map((value, axis) => value - oldCenter[axis]),
      mode === 'dynamic' && mass ? 1 / mass : 0,
      ...(parameters.velocity ?? [0, 0, 0]),
      parameters.velocity ? 1 : 0,
      ...(parameters.angularVelocity ?? [0, 0, 0]),
      parameters.angularVelocity ? 1 : 0
    ]);
    new Uint32Array(data).set([bodyIndex, 6, mode !== this.getBodyMode(bodyIndex) ? 1 : 0], 12);
    this.controlSettings.write(new Uint8Array(data));
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.control.dispatch(pass, 1);
    this.invalidateState(pass);
    pass.end();
    this.device.submit(encoder.finish());
    const bodies = [...this.props.bodies];
    bodies[bodyIndex] = next;
    this.props.bodies = bodies;
  }

  /** Apply a world-space angular impulse at the current GPU pose. */
  applyAngularImpulse(body: number, impulse: Vector3): void {
    if (
      !this.control ||
      !this.device ||
      !this.controlSettings ||
      this.destroyed ||
      !Number.isInteger(body) ||
      body < 0 ||
      body >= this.count ||
      !impulse.every(Number.isFinite)
    )
      throw new Error('Invalid angular impulse');
    const data = new ArrayBuffer(64);
    new Float32Array(data).set(impulse);
    new Uint32Array(data)[12] = body;
    new Uint32Array(data)[13] = 5;
    this.controlSettings.write(new Uint8Array(data));
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.control.dispatch(pass, 1);
    this.invalidateState(pass);
    pass.end();
    this.device.submit(encoder.finish());
  }

  /** Set a world-space node target for a kinematic body, held until replaced. */
  setKinematicTarget(
    body: number,
    position: Vector3,
    orientation: readonly [number, number, number, number]
  ): void {
    if (
      !this.control ||
      !this.controlSettings ||
      !this.device ||
      this.destroyed ||
      !Number.isInteger(body) ||
      this.props.bodies[body]?.mode !== 'kinematic' ||
      !position.every(Number.isFinite)
    )
      throw new Error('Invalid kinematic target');
    const rotation = normalizeRigidBodyRotation(orientation);
    const offset = rotateRigidBodyVector(
      rotation,
      this.props.bodies[body].centerOfMass ?? [0, 0, 0]
    );
    const data = new ArrayBuffer(64);
    new Float32Array(data).set([...position.map((value, axis) => value + offset[axis]), 0], 4);
    new Float32Array(data).set(rotation, 8);
    new Uint32Array(data).set([body, 1], 12);
    this.controlSettings.write(new Uint8Array(data));
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.control.dispatch(pass, 1);
    this.invalidateState(pass);
    pass.end();
    this.device.submit(encoder.finish());
  }

  private getJointStateOffset(): number {
    return (
      Math.ceil(
        (this.count * 32 +
          (this.broadPhase === 'hierarchical-grid' ? 32 + this.maximumPairs * 8 : 16)) /
          16
      ) * 16
    );
  }

  getJointParameters(index: number): GPURigidBodyJoint {
    const joint = this.props.joints?.[index];
    if (!joint || this.destroyed) throw new Error('Invalid joint');
    return structuredClone(joint);
  }

  /** Update an existing constraint's response without recompiling or changing attachment topology. */
  setJointParameters(index: number, parameters: GPURigidBodyJoint): void {
    this.setJointParameterEdits([{index, parameters}]);
  }

  /** Validate every shared-resource edit before submitting any control writes. */
  setJointParameterEdits(edits: readonly {index: number; parameters: GPURigidBodyJoint}[]): void {
    for (const {index, parameters} of edits) this.validateJointParameters(index, parameters);
    for (const {index, parameters} of edits) this.writeJointParameters(index, parameters);
  }

  private validateJointParameters(index: number, parameters: GPURigidBodyJoint): void {
    const previous = this.props.joints?.[index];
    if (
      !previous ||
      !this.targets ||
      this.destroyed ||
      previous.type !== parameters.type ||
      previous.first !== parameters.first ||
      previous.second !== parameters.second ||
      JSON.stringify(previous.firstFrame) !== JSON.stringify(parameters.firstFrame) ||
      JSON.stringify(previous.secondFrame) !== JSON.stringify(parameters.secondFrame)
    )
      throw new Error('Joint topology must remain unchanged');
    validateRigidBodyJoints([parameters], this.props.bodies, this.solver);
  }

  private writeJointParameters(index: number, parameters: GPURigidBodyJoint): void {
    const joints = [...this.props.joints!];
    joints[index] = structuredClone(parameters);
    this.props.joints = joints;
    this.targets!.write(
      packRigidBodyJointState(parameters),
      this.getJointStateOffset() + index * RIGID_BODY_JOINT_STATE_BYTES
    );
    this.setJointEnabled(index, parameters.enabled !== false);
  }

  /** Enable a predeclared joint between submissions; wakes bodies and clears cached impulses. */
  setJointEnabled(joint: number, enabled: boolean): void {
    if (
      !this.control ||
      !this.controlSettings ||
      !this.device ||
      this.destroyed ||
      !Number.isInteger(joint) ||
      !this.props.joints?.[joint]
    )
      throw new Error('Invalid joint');
    const data = new ArrayBuffer(64);
    new Float32Array(data)[0] = enabled ? 1 : 0;
    new Uint32Array(data).set([joint, 3], 12);
    this.controlSettings.write(new Uint8Array(data));
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.control.dispatch(pass, 1);
    this.invalidateState(pass);
    pass.end();
    this.device.submit(encoder.finish());
    const joints = [...this.props.joints!];
    joints[joint] = {...joints[joint], enabled};
    this.props.joints = joints;
  }

  /** Clear persistence and sleeping after direct state writes between submissions. */
  wake(): void {
    if (this.destroyed || !this.device || !this.invalidation) return;
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.invalidateState(pass);
    pass.end();
    this.device.submit(encoder.finish());
  }

  /** Optional asynchronous event readback. Concurrent readers share one snapshot/cursor. */
  readContactEvents(): Promise<GPURigidBodyContactBatch> {
    if (!this.contactEvents || this.destroyed)
      return Promise.reject(new Error('Contact events are not enabled'));
    if (!this.eventRead)
      this.eventRead = this.contactEvents
        .readAsync()
        .then(bytes => {
          const batch = decodeRigidBodyContactEvents(
            new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4),
            this.eventCursor
          );
          this.eventCursor = batch.sequence;
          return batch;
        })
        .finally(() => {
          this.eventRead = null;
        });
    return this.eventRead;
  }

  /** Nearest exact sphere/OBB hit. Origins inside a shape return distance zero and a zero normal. */
  raycast(query: GPURigidBodyRayQuery): Promise<GPURigidBodyQueryResult> {
    return this.runQuery(query);
  }

  /** Exact sphere overlap against selected sphere/OBB colliders, in collider-index order. */
  overlapSphere(query: GPURigidBodyOverlapQuery): Promise<GPURigidBodyQueryResult> {
    return this.runQuery(query);
  }

  private async runQuery(
    query: GPURigidBodyRayQuery | GPURigidBodyOverlapQuery | GPURigidBodySphereCastQuery
  ): Promise<GPURigidBodyQueryResult> {
    if (
      !this.device ||
      !this.queryComputation ||
      !this.querySettings ||
      !this.querySelection ||
      !this.queryOutput ||
      this.destroyed ||
      this.queryPending
    )
      throw new Error('Queries are disabled or busy');
    const ray = 'origin' in query;
    const cast = ray && 'radius' in query;
    const origin = ray ? query.origin : query.center;
    const direction = ray ? query.direction : [0, 0, 0];
    const length = Math.hypot(...direction);
    const maximumHits = ray ? 1 : (query.maximumHits ?? this.colliderCount);
    if (
      (cast && (!Number.isFinite(query.radius) || query.radius < 0)) ||
      origin.length !== 3 ||
      !origin.every(value => Number.isFinite(Math.fround(value))) ||
      direction.length !== 3 ||
      !direction.every(Number.isFinite) ||
      (ray
        ? !Number.isFinite(length) ||
          length === 0 ||
          !Number.isFinite(query.maximumDistance) ||
          query.maximumDistance < 0
        : !Number.isFinite(query.radius) || query.radius < 0) ||
      !Number.isInteger(maximumHits) ||
      maximumHits < 0 ||
      maximumHits > Math.max(1, this.colliderCount) ||
      (query.excludeBody !== undefined &&
        (!Number.isInteger(query.excludeBody) ||
          query.excludeBody < 0 ||
          query.excludeBody >= this.count))
    )
      throw new Error('Invalid collision query');
    const selected =
      query.colliderIndices ?? Array.from({length: this.colliderCount}, (_, index) => index);
    const selection = new Uint32Array(this.colliderStorageCount);
    for (const index of selected) {
      if (!Number.isInteger(index) || index < 0 || index >= this.colliderCount)
        throw new Error('Invalid query collider');
      const collider = this.colliders[index];
      if (collider.body === query.excludeBody) continue;
      selection[index] = 1;
    }
    this.queryPending = true;
    try {
      const data = new ArrayBuffer(48);
      new Float32Array(data).set([
        ...origin,
        ray ? (cast ? query.radius : 0) : query.radius,
        ...direction.map(value => (ray ? value / length : 0)),
        ray ? query.maximumDistance : 1e30
      ]);
      new Uint32Array(data).set([ray ? (cast ? 2 : 0) : 1, maximumHits, 0, 0], 8);
      this.querySettings.write(new Uint8Array(data));
      this.querySelection.write(selection);
      const encoder = this.device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      this.queryComputation.dispatch(pass, Math.ceil(this.colliderStorageCount / 64));
      this.queryReduction!.dispatch(pass, 1);
      pass.end();
      this.device.submit(encoder.finish());
      const bytes = await this.queryOutput.readAsync(0, 16 + maximumHits * 48);
      const words = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      const floats = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      const hits = Array.from({length: words[0]}, (_, index) => {
        const offset = 4 + index * 12;
        return {
          body: words[offset],
          collider: words[offset + 1],
          point: [floats[offset + 4], floats[offset + 5], floats[offset + 6]] as [
            number,
            number,
            number
          ],
          distance: floats[offset + 7],
          normal: [floats[offset + 8], floats[offset + 9], floats[offset + 10]] as [
            number,
            number,
            number
          ]
        };
      });
      return {
        hits,
        totalHits: words[1],
        truncated: !ray && words[1] > words[0],
        complete: words[2] === 0
      };
    } finally {
      this.queryPending = false;
    }
  }

  /** Cast a sphere against selected collision surfaces using bounded conservative advancement. */
  castSphere(query: GPURigidBodySphereCastQuery): Promise<GPURigidBodyQueryResult> {
    return this.runQuery(query);
  }

  async readState(): Promise<GPURigidBodyState[]> {
    if (
      !this.positions ||
      !this.orientations ||
      !this.velocities ||
      !this.angularVelocities ||
      !this.sleepStates ||
      this.destroyed
    )
      throw new Error('Rigid-body world is not active');
    const arrays = await Promise.all(
      [
        this.positions,
        this.orientations,
        this.velocities,
        this.angularVelocities,
        this.sleepStates
      ].map(async buffer => new Float32Array((await buffer.readAsync()).buffer))
    );
    return Array.from({length: this.count}, (_, index) => {
      const offset = index * 4;
      return {
        position: [arrays[0][offset], arrays[0][offset + 1], arrays[0][offset + 2]],
        orientation: [
          arrays[1][offset],
          arrays[1][offset + 1],
          arrays[1][offset + 2],
          arrays[1][offset + 3]
        ],
        velocity: [arrays[2][offset], arrays[2][offset + 1], arrays[2][offset + 2]],
        angularVelocity: [arrays[3][offset], arrays[3][offset + 1], arrays[3][offset + 2]],
        sleeping: arrays[4][offset + 1] > 0.5
      };
    });
  }

  /** Read step-ordered trigger transitions without losing intermediate enter/exit changes. */
  readTriggerEvents(): Promise<GPURigidBodyTriggerBatch> {
    if (!this.triggerEvents || this.destroyed) throw new Error('Triggers are disabled');
    if (this.triggerRead) return this.triggerRead;
    this.triggerRead = this.triggerEvents
      .readAsync()
      .then(bytes => {
        const batch = decodeRigidBodyTriggerEvents(
          new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4),
          this.triggerCursor
        );
        this.triggerCursor = batch.sequence;
        return batch;
      })
      .finally(() => {
        this.triggerRead = null;
      });
    return this.triggerRead;
  }

  private getSnapshotBuffers(includeRollbackScratch = true): Buffer[] {
    return this.ownedBuffers.filter(
      buffer => includeRollbackScratch || !buffer.id.startsWith(`${this.id}-checkpoint-`)
    );
  }

  /** Reusable same-world GPU checkpoint; copies state without CPU pose or buffer readback. */
  createGPUCheckpoint(options: {includeRollbackScratch?: boolean} = {}): GPURigidBodyGPUCheckpoint {
    if (!this.device || this.destroyed) throw new Error('Checkpoint requires an attached world');
    const device = this.device;
    // Rollback scratch is overwritten at the start of every step, before it can be restored.
    const checkpointBuffers = this.getSnapshotBuffers(options.includeRollbackScratch);
    const snapshots: Buffer[] = [];
    let released = false;
    let saved = false;
    let origin = [...this.worldOrigin] as [number, number, number];
    let joints = structuredClone(this.props.joints);
    let bodyDefinitions = structuredClone(this.props.bodies);
    let contactCursor = 0;
    let triggerCursor = 0;
    try {
      for (const buffer of checkpointBuffers)
        snapshots.push(
          device.createBuffer({
            id: `${buffer.id}-recovery`,
            byteLength: buffer.byteLength,
            usage: Buffer.COPY_SRC | Buffer.COPY_DST
          })
        );
    } catch (error) {
      for (const buffer of snapshots) buffer.destroy();
      throw error;
    }
    const copy = (restore: boolean) => {
      if (released || this.destroyed || this.queryPending || this.eventRead || this.triggerRead)
        throw new Error('Checkpoint requires an idle live world');
      const encoder = device.createCommandEncoder();
      for (const [index, buffer] of checkpointBuffers.entries())
        encoder.copyBufferToBuffer({
          sourceBuffer: restore ? snapshots[index] : buffer,
          destinationBuffer: restore ? buffer : snapshots[index],
          size: buffer.byteLength
        });
      device.submit(encoder.finish());
    };
    let shapeScales = structuredClone(this.colliderShapeScales);
    let publicationBounds = structuredClone(this.props.publicationBounds);
    const checkpoint: GPURigidBodyGPUCheckpoint = {
      byteLength: snapshots.reduce((sum, buffer) => sum + buffer.byteLength, 0),
      save: () => {
        copy(false);
        origin = [...this.worldOrigin];
        joints = structuredClone(this.props.joints);
        bodyDefinitions = structuredClone(this.props.bodies);
        shapeScales = structuredClone(this.colliderShapeScales);
        publicationBounds = structuredClone(this.props.publicationBounds);
        contactCursor = this.eventCursor;
        triggerCursor = this.triggerCursor;
        saved = true;
      },
      restore: () => {
        if (!saved) throw new Error('Checkpoint has not been saved');
        copy(true);
        this.worldOrigin = [...origin];
        this.props.joints = structuredClone(joints);
        this.props.bodies = structuredClone(bodyDefinitions);
        this.restoreColliderDefinitions();
        this.colliderShapeScales = structuredClone(shapeScales);
        this.props.publicationBounds = structuredClone(publicationBounds);
        this.eventCursor = contactCursor;
        this.triggerCursor = triggerCursor;
      },
      destroy: () => {
        if (released) return;
        released = true;
        for (const buffer of snapshots) buffer.destroy();
        this.gpuCheckpoints.delete(checkpoint);
      }
    };
    this.gpuCheckpoints.add(checkpoint);
    return checkpoint;
  }

  /** Stop graph submissions and controls first; includes diagnostics, caches and event history. */
  async captureState(
    options: {includeRollbackScratch?: boolean} = {}
  ): Promise<GPURigidBodyCapture> {
    if (!this.device || this.destroyed || this.queryPending || this.eventRead || this.triggerRead)
      throw new Error('Capture requires an idle attached world');
    return {
      version: 1,
      origin: [...this.worldOrigin],
      includeRollbackScratch: options.includeRollbackScratch !== false,
      props: structuredClone(this.props),
      colliderShapeScales: structuredClone([...this.colliderShapeScales]),
      contactCursor: this.eventCursor,
      triggerCursor: this.triggerCursor,
      buffers: await Promise.all(
        this.getSnapshotBuffers(options.includeRollbackScratch).map(async buffer => ({
          name: buffer.id.slice(this.id.length + 1),
          data: new Uint8Array(await buffer.readAsync())
        }))
      )
    };
  }

  /** Restore between submissions on the same configuration and implementation; no implicit wake. */
  restoreState(capture: GPURigidBodyCapture): void {
    const checkpointBuffers = this.getSnapshotBuffers(capture.includeRollbackScratch);
    if (
      !this.device ||
      this.destroyed ||
      this.queryPending ||
      this.eventRead ||
      this.triggerRead ||
      capture.version !== 1 ||
      (capture.origin !== undefined &&
        (capture.origin.length !== 3 || !capture.origin.every(Number.isFinite))) ||
      capture.buffers.length !== checkpointBuffers.length ||
      serializeCaptureProps(capture.props) !== serializeCaptureProps(this.props) ||
      ![capture.contactCursor, capture.triggerCursor].every(
        value => Number.isInteger(value) && value >= 0 && value <= 0xffffffff
      )
    )
      throw new Error('Incompatible rigid-body capture');
    const shapeScales = new Map(capture.colliderShapeScales ?? []);
    for (const [index, scale] of shapeScales) {
      this.getColliderShape(index);
      if (scale.length !== 3 || scale.some(value => !Number.isFinite(value) || value <= 0))
        throw new Error('Invalid captured collider scale');
    }
    // Validate every allocation before writing any state. Captures are trusted debug artifacts.
    for (const [index, buffer] of checkpointBuffers.entries()) {
      const saved = capture.buffers[index];
      if (
        saved.name !== buffer.id.slice(this.id.length + 1) ||
        !(saved.data instanceof Uint8Array) ||
        saved.data.byteLength !== buffer.byteLength
      )
        throw new Error('Incompatible rigid-body capture storage');
    }
    for (const [index, buffer] of checkpointBuffers.entries())
      buffer.write(capture.buffers[index].data);
    this.props.joints = structuredClone(capture.props.joints);
    this.props.bodies = structuredClone(capture.props.bodies);
    this.props.publicationBounds = structuredClone(capture.props.publicationBounds);
    this.restoreColliderDefinitions();
    this.colliderShapeScales = structuredClone(shapeScales);
    this.worldOrigin = [...(capture.origin ?? [0, 0, 0])];
    this.eventCursor = capture.contactCursor;
    this.triggerCursor = capture.triggerCursor;
  }

  /** Stop submissions first. Reconstruct with these accepted poses and larger budgets after rollback. */
  async getRecoveryProps(
    overrides: Pick<
      GPURigidBodyWorldProps,
      'maximumPairs' | 'maximumCandidateTestsPerCollider' | 'maximumMeshTraversalTestsPerPair'
    > = {}
  ): Promise<GPURigidBodyWorldProps> {
    if (this.props.failurePolicy !== 'rollback') throw new Error('Recovery requires rollback');
    if (this.props.bodies.some(body => body.mode === 'kinematic'))
      throw new Error('Kinematic recovery requires explicit target replay');
    const states = await this.readState();
    return {
      ...structuredClone(this.props),
      ...overrides,
      bodies: this.props.bodies.map((body, index) => {
        const state = states[index];
        const offset = rotateRigidBodyVector(state.orientation, body.centerOfMass ?? [0, 0, 0]);
        return {
          ...structuredClone(body),
          position: state.position.map((value, axis) => value - offset[axis]) as [
            number,
            number,
            number
          ],
          orientation: state.orientation,
          velocity: state.velocity,
          angularVelocity: state.angularVelocity
        };
      })
    };
  }

  /** Optional bounded readback of the last convex CCD attempt; never needed for execution. */
  async readContinuousWork(): Promise<{
    candidateCapacity: number;
    peakSpatialTests: number;
    rounds: number;
    peakCandidates: number;
    peakCandidateWorkgroups: number;
    impacts: number;
    incomplete: boolean;
  } | null> {
    if (this.props.continuous?.mode !== 'convex') return null;
    const buffer = this.ownedBuffers.find(buffer => buffer.id === `${this.id}-continuous-status`);
    if (!buffer) return null;
    const bytes = await buffer.readAsync(0, 16);
    const values = new Uint32Array(bytes.buffer, bytes.byteOffset, 4);
    const work = this.ownedBuffers.find(buffer => buffer.id === `${this.id}-continuous-work`)!;
    const statistics = await work.readAsync(16, 16);
    const spatial = new Uint32Array(statistics.buffer, statistics.byteOffset, 4);
    return {
      peakSpatialTests: spatial[1],
      rounds: spatial[2],
      candidateCapacity: this.props.continuous.maximumCandidates ?? this.maximumPairs,
      peakCandidates: values[3],
      peakCandidateWorkgroups: Math.ceil(
        Math.min(values[3], this.props.continuous.maximumCandidates ?? this.maximumPairs) / 64
      ),
      impacts: values[2],
      incomplete: values[0] !== 0
    };
  }

  /** Optional diagnostic readback of the last parallel queue; never required for execution. */
  async readSolverWork(): Promise<{
    compacted: boolean;
    activeContacts: number | null;
    awakeBodies: number | null;
    awakeContacts: number | null;
    bodyWorkgroups: number;
    pairCapacity: number;
    pairWorkgroups: number;
  } | null> {
    if (!this.parallelState || this.destroyed) return null;
    const bytes = await this.parallelState.readAsync(0, 16);
    const counters = new Uint32Array(bytes.buffer, bytes.byteOffset, 4);
    const compacted = this.props.compactContacts !== false;
    return {
      compacted,
      activeContacts: compacted ? counters[1] : null,
      awakeBodies: compacted ? counters[2] : null,
      awakeContacts: compacted ? counters[3] : null,
      bodyWorkgroups: Math.ceil((compacted ? counters[2] : this.count) / 64),
      pairCapacity: this.maximumPairs,
      pairWorkgroups: Math.ceil((compacted ? counters[3] : this.maximumPairs) / 64)
    };
  }

  /** Lifetime counters, including failures in steps between diagnostic snapshots. */
  async readSimulationDiagnostics(): Promise<GPURigidBodySimulationDiagnostics> {
    if (!this.simulationStatistics || this.destroyed)
      throw new Error('Rigid-body world is not active');
    return decodeRigidBodySimulationDiagnostics(
      new Uint32Array((await this.simulationStatistics.readAsync()).buffer)
    );
  }

  /** Optional diagnostics readback; never required to advance simulation. */
  async readCollisionDiagnostics(): Promise<{
    unresolvedQueries: number;
    triangleQueries: number;
    droppedTriangleQueries: number;
    incompleteMeshQueries: number;
    droppedManifolds: number;
    incompleteIslandUnions: number;
    broadPhase?: ReturnType<typeof decodeRigidBodyBroadPhaseDiagnostics>;
  }> {
    if (!this.manifolds || this.destroyed) throw new Error('Rigid-body world is not active');
    const tasks = this.meshTasks
      ? new Uint32Array((await this.meshTasks.readAsync(0, 16)).buffer)
      : new Uint32Array(4);
    const broadPhase = this.broadPhaseCounters
      ? decodeRigidBodyBroadPhaseDiagnostics(
          new Uint32Array(
            (await this.broadPhaseCounters.buffer.readAsync(this.broadPhaseCounters.byteOffset, 32))
              .buffer
          )
        )
      : undefined;
    const droppedManifolds =
      this.broadPhase === 'hierarchical-grid'
        ? new Uint32Array((await this.targets!.readAsync(this.count * 32 + 16, 4)).buffer)[0]
        : 0;
    return {
      unresolvedQueries: tasks[2],
      triangleQueries: tasks[0],
      droppedTriangleQueries: tasks[1],
      incompleteMeshQueries: tasks[3],
      droppedManifolds,
      incompleteIslandUnions: this.parallelState
        ? new Uint32Array((await this.parallelState.readAsync(0, 4)).buffer)[0]
        : 0,
      broadPhase
    };
  }

  /** Destroy the compiled graph and finish readbacks before destroying its world. */
  destroy(): void {
    if (this.destroyed) return;
    for (const checkpoint of this.gpuCheckpoints) checkpoint.destroy();
    this.destroyed = true;
    this.control?.destroy();
    this.invalidation?.destroy();
    this.queryComputation?.destroy();
    this.queryReduction?.destroy();
    for (const buffer of this.ownedBuffers) buffer.destroy();
    this.ownedBuffers.length = 0;
  }
}

/** Canonicalize object keys, preserving array order and ignoring the world's debug label. */
function serializeCaptureProps(props: GPURigidBodyWorldProps): string {
  return JSON.stringify(
    {
      ...props,
      id: undefined,
      publicationBounds: props.publicationBounds
        ? props.publicationBounds.map(() => true)
        : undefined,
      bodies: props.bodies.map(body => ({
        ...body,
        shape: undefined,
        colliders: (body.colliders ?? [{shape: body.shape}]).map(collider => ({
          ...collider,
          shape:
            collider.shape?.type === 'convex-hull' || collider.shape?.type === 'triangle-mesh'
              ? collider.shape
              : {type: collider.shape?.type},
          material: undefined,
          position: undefined,
          orientation: undefined
        })),
        mode: undefined,
        mass: undefined,
        centerOfMass: undefined,
        inertiaDiagonal: undefined,
        inertiaOrientation: undefined,
        velocity: undefined,
        angularVelocity: undefined,
        gravityFactor: undefined
      })),
      joints: props.joints?.map(joint => ({
        type: joint.type,
        first: joint.first,
        second: joint.second,
        firstFrame: joint.firstFrame,
        secondFrame: joint.secondFrame
      }))
    },
    (_key, value: unknown) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
      const record = value as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(record)
          .sort()
          .map(key => [key, record[key]])
      );
    }
  );
}
