// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type BoundKernel,
  createBoundKernel,
  createBoundKernelAsync
} from '../gpu-core/utils/bound-kernel';

import {Buffer, type Binding, type ShaderLayout, type BindingDeclaration} from '@luma.gl/core';

import {
  GPUCommandGraph,
  type GraphDataView,
  type GraphBufferUse
} from '../gpu-core/gpu-command-graph';
import type {GPUCommandGraphComputeExecutable} from '../gpu-core/gpu-command-graph-types';
import {addGPUCommandNodes} from '../gpu-core/gpu-command-node';
import {GPUSort} from '../gpu-core/gpu-sort';
import {GPUScan} from '../gpu-core/gpu-scan';
import {createTransientView, getViewBinding} from '../gpu-core/graph-data-view-utils';
import {
  getSphereWorldShaderHeader,
  INTEGRATE_SPHERES,
  ASSIGN_SPHERE_CELLS,
  getSphereContactShader,
  SOLVE_SPHERE_CONTACTS,
  FINALIZE_SPHERES,
  CONTROL_SPHERE
} from './sphere-world-shaders';
import {
  PERSISTENT_CONTACT_HEADER,
  makePersistentContactShader,
  makeAccumulatedSphereSolver,
  RESTORE_SPHERE_CONTACTS,
  WARM_SPHERE_CONTACTS,
  STORE_SPHERE_CONTACTS
} from './sphere-persistent-contacts';
import {getSweepShader, getEventShader} from './sphere-world-events';
import {decodeSphereEvents, type GPUSphereEventBatch, type GPUSphereTrigger} from './sphere-events';

type Vector3 = readonly [number, number, number];

/** A one-sided rectangle, or an infinite plane when halfExtents is omitted. */
export type GPUSpherePlane = {
  normal?: Vector3;
  /** Signed distance along the normalized normal. */
  offset?: number;
  halfExtents?: readonly [number, number];
  /** Rectangle center; defaults to normal * offset. */
  center?: Vector3;
  restitution?: number;
  staticFriction?: number;
  dynamicFriction?: number;
  rollingResistance?: number;
  /** Additional resistance to rotation around the contact normal. */
  spinningResistance?: number;
  /** Cushion contact height above the center, as a fraction of radius (0 <= value < 1).
   * Uses the direction opposite gravity projected onto the plane. Defaults to zero.
   */
  contactHeightRatio?: number;
  /** Restitution becomes restitution / (1 + scale * normal impact speed). Default zero. */
  restitutionVelocityScale?: number;
};

/** Live values. Update once before submitting the next batch of graph encodings. */
export type GPUSphereWorldParameters = {
  gravity?: Vector3;
  plane?: GPUSpherePlane;
  /** Up to 32 static surfaces. Overrides plane; [] removes all surfaces. */
  planes?: readonly GPUSpherePlane[];
  restitution?: number;
  staticFriction?: number;
  dynamicFriction?: number;
  rollingResistance?: number;
  sleepAfter?: number;
  sleepLinearSpeed?: number;
  sleepAngularSpeed?: number;
  restitutionThreshold?: number;
  /** Experimental throw controls: include linear or angular surface slip in sphere friction. */
  cutInducedThrow?: boolean;
  spinInducedThrow?: boolean;
};

export type GPUSphereWorldProps = GPUSphereWorldParameters & {
  id?: string;
  count: number;
  /** xyz center and radius. Caller owns all supplied buffers. */
  positions: Buffer;
  /** xyz linear velocity and inverse mass; inverse mass zero is static. */
  velocities: Buffer;
  /** xyzw unit quaternions; zero quaternions initialize to identity on the GPU. */
  orientations?: Buffer;
  /** xyz world angular velocity, w reserved. */
  angularVelocities?: Buffer;
  /** vec4f: quiet time, settings revision, reserved, reserved; zero to wake/reset a body. */
  sleepStates?: Buffer;
  /** Eight uint32 counters; see GPUSphereWorldDiagnostics. */
  diagnostics?: Buffer;
  /** Bounded global time-of-impact steps; small scenes only (at most 256 bodies). */
  continuous?: boolean;
  maximumImpactSteps?: number;
  /** Accumulated sphere/surface impulses and persistent pair cache; at most 256 bodies. */
  warmStarting?: boolean;
  /** Persistent event ring capacity; zero disables events. */
  eventCapacity?: number;
  /** Spherical center-crossing triggers; capture disables the body on the GPU. */
  triggers?: readonly GPUSphereTrigger[];
  timeStep?: number;
  substeps?: number;
  iterations?: number;
  maximumRadius?: number;
  maximumContacts?: number;
  contactSkin?: number;
  /** Per-body candidate budget; zero retains unbounded reference traversal. */
  maximumCandidateTests?: number;
  /** All-pairs is a bounded numerical reference, limited to 256 bodies. */
  broadPhase?: 'grid' | 'all-pairs';
  /** Legacy horizontal-plane offset. Prefer plane.offset. */
  floor?: number;
  /** @deprecated Legacy tangential retention; dynamicFriction defaults to 1 - friction. */
  friction?: number;
};

/** Last substep's counters. Contacts count directed neighbors; candidates count inspected entries. */
export type GPUSphereWorldDiagnostics = {
  droppedContacts: number;
  invalidBodies: number;
  contacts: number;
  awakeBodies: number;
  sleepingBodies: number;
  candidateTests: number;
  maximumContacts: number;
  exhaustedImpactSteps: number;
  exhaustedCandidateBodies: number;
};

/** Decode a sampled diagnostics readback; the simulation itself requires no CPU readback. */
export function decodeGPUSphereWorldDiagnostics(data: Uint32Array): GPUSphereWorldDiagnostics {
  return {
    droppedContacts: data[0],
    invalidBodies: data[1],
    contacts: data[2],
    awakeBodies: data[3],
    sleepingBodies: data[4],
    candidateTests: data[5],
    maximumContacts: data[6],
    exhaustedImpactSteps: data[7] & 1,
    exhaustedCandidateBodies: data[7] >>> 1
  };
}

/** CPU snapshot for interaction; disabled bodies have positive radius here and negative radius in the GPU buffer. */
export type GPUSphereBodyState = {
  index: number;
  position: [number, number, number];
  radius: number;
  enabled: boolean;
  velocity: [number, number, number];
  inverseMass: number;
  angularVelocity: [number, number, number];
  orientation: [number, number, number, number];
  sleeping: boolean;
};

/** Return enabled bodies whose centers are inside a spherical trigger. No implicit GPU readback. */
export function getSphereTriggerBodies(
  states: readonly GPUSphereBodyState[],
  center: Vector3,
  radius: number
): GPUSphereBodyState[] {
  return states.filter(
    body =>
      body.enabled &&
      Math.hypot(...body.position.map((value, axis) => value - center[axis])) <= radius
  );
}

type StateViews = {
  positions: GraphDataView<'float32x4'>;
  velocities: GraphDataView<'float32x4'>;
  angularVelocities: GraphDataView<'float32x4'>;
};
type PassBinding = {
  name: string;
  view: GraphDataView;
  access: 'read' | 'write' | 'uniform';
  location: number;
};

/** GPU-resident, bounded-contact sphere dynamics composed from sort, scan and Jacobi passes. */
export class GPUSphereWorld {
  readonly id: string;
  readonly count: number;
  readonly positions: Buffer;
  readonly velocities: Buffer;
  orientations?: Buffer;
  angularVelocities?: Buffer;
  sleepStates?: Buffer;
  diagnostics?: Buffer;
  readonly timeStep: number;
  readonly substeps: number;
  readonly iterations: number;
  readonly maximumRadius: number;
  readonly maximumContacts: number;
  readonly contactSkin: number;
  readonly maximumCandidateTests: number;
  readonly broadPhase: 'grid' | 'all-pairs';
  private parameters: Required<Omit<GPUSphereWorldParameters, 'plane' | 'planes'>> & {
    plane: GPUSpherePlane;
    planes?: readonly GPUSpherePlane[];
  };
  readonly continuous: boolean;
  readonly maximumImpactSteps: number;
  readonly warmStarting: boolean;
  private contactCache?: Buffer;
  readonly eventCapacity: number;
  readonly triggers: readonly GPUSphereTrigger[];
  events?: Buffer;
  private eventCursor = 0;
  private eventRead?: Promise<GPUSphereEventBatch>;
  private settings?: Buffer;
  private commandSettings?: Buffer;
  private bodyControl?: BoundKernel;
  private ownedBuffers: Buffer[] = [];
  private added = false;
  private wakeRevision = 1;

  constructor(props: GPUSphereWorldProps) {
    this.id = props.id ?? 'gpu-sphere-world';
    this.count = props.count;
    this.positions = props.positions;
    this.velocities = props.velocities;
    this.orientations = props.orientations;
    this.angularVelocities = props.angularVelocities;
    this.sleepStates = props.sleepStates;
    this.diagnostics = props.diagnostics;
    this.timeStep = props.timeStep ?? 1 / 120;
    this.substeps = props.substeps ?? 1;
    this.iterations = props.iterations ?? 8;
    this.maximumRadius = props.maximumRadius ?? 1;
    this.maximumContacts = props.maximumContacts ?? 32;
    this.contactSkin = props.contactSkin ?? this.maximumRadius * 0.01;
    this.maximumCandidateTests = props.maximumCandidateTests ?? 0;
    if (
      !Number.isInteger(this.maximumCandidateTests) ||
      this.maximumCandidateTests < 0 ||
      this.maximumCandidateTests > 1000000
    )
      throw new Error('Invalid sphere candidate budget');
    this.broadPhase = props.broadPhase ?? 'grid';
    this.continuous = props.continuous ?? false;
    this.warmStarting = props.warmStarting ?? false;
    this.maximumImpactSteps = props.maximumImpactSteps ?? 4;
    this.eventCapacity = props.eventCapacity ?? 0;
    this.triggers = props.triggers ?? [];
    if (
      ((this.continuous || this.warmStarting || this.eventCapacity > 0) && this.count > 256) ||
      !Number.isInteger(this.maximumImpactSteps) ||
      this.maximumImpactSteps < 1 ||
      this.maximumImpactSteps > 16 ||
      !Number.isInteger(this.eventCapacity) ||
      this.eventCapacity < 0 ||
      this.eventCapacity > 65536 ||
      (this.eventCapacity > 0 && (this.eventCapacity & (this.eventCapacity - 1)) !== 0) ||
      this.triggers.length > 32 ||
      (this.triggers.length > 0 && !this.eventCapacity) ||
      this.triggers.some(
        trigger =>
          ![...trigger.center, trigger.radius].every(Number.isFinite) || trigger.radius <= 0
      )
    ) {
      throw new Error('Invalid sphere sweep or event capacity');
    }
    for (const [value, maximum] of [
      [this.count, 1_000_000],
      [this.substeps, 64],
      [this.iterations, 64],
      [this.maximumContacts, 256]
    ]) {
      if (!Number.isSafeInteger(value) || value < 1 || value > maximum)
        throw new Error('Invalid sphere world capacity');
    }
    if (
      !(this.timeStep > 0) ||
      !Number.isFinite(this.timeStep) ||
      !(this.maximumRadius > 0) ||
      !Number.isFinite(this.maximumRadius) ||
      !(this.contactSkin >= 0) ||
      !Number.isFinite(this.contactSkin)
    )
      throw new Error('Invalid sphere world step or radius');
    if (
      !['grid', 'all-pairs'].includes(this.broadPhase) ||
      (this.broadPhase === 'all-pairs' && this.count > 256)
    )
      throw new Error('Invalid sphere broad phase');
    this.parameters = {
      gravity: props.gravity ?? [0, 0, -9.81],
      plane: props.plane ?? {offset: props.floor ?? 0},
      planes: props.planes,
      restitution: props.restitution ?? 0.45,
      staticFriction:
        props.staticFriction ??
        Math.max(
          0.5,
          props.dynamicFriction ?? (props.friction === undefined ? 0.35 : 1 - props.friction)
        ),
      dynamicFriction:
        props.dynamicFriction ??
        (props.friction === undefined
          ? Math.min(0.35, props.staticFriction ?? 0.5)
          : 1 - props.friction),
      rollingResistance: props.rollingResistance ?? 0.025,
      sleepAfter: props.sleepAfter ?? 0.75,
      sleepLinearSpeed: props.sleepLinearSpeed ?? 0.025,
      sleepAngularSpeed: props.sleepAngularSpeed ?? 0.05,
      restitutionThreshold: props.restitutionThreshold ?? 0.5,
      cutInducedThrow: props.cutInducedThrow ?? true,
      spinInducedThrow: props.spinInducedThrow ?? true
    };
    this.update({});
    const buffers = [
      props.positions,
      props.velocities,
      props.orientations,
      props.angularVelocities,
      props.sleepStates,
      props.diagnostics
    ].filter((buffer): buffer is Buffer => Boolean(buffer));
    if (new Set(buffers).size !== buffers.length)
      throw new Error('Sphere state buffers must not alias');
    for (const buffer of buffers) {
      const size = buffer === props.diagnostics ? 32 : this.count * 16;
      if (buffer.byteLength < size || !(buffer.usage & Buffer.STORAGE))
        throw new Error('Sphere state requires packed STORAGE buffers');
    }
  }

  get gravity(): Vector3 {
    return this.parameters.gravity;
  }
  get restitution(): number {
    return this.parameters.restitution;
  }
  get floor(): number {
    return this.parameters.plane.offset ?? 0;
  }
  /** @deprecated Prefer dynamicFriction in update(). */
  get friction(): number {
    return 1 - this.parameters.dynamicFriction;
  }

  /** Change gravity/material/plane without recompiling. Gravity changes wake sleeping bodies. */
  update(parameters: GPUSphereWorldParameters): void {
    const next = {
      ...this.parameters,
      ...parameters,
      plane: {...this.parameters.plane, ...parameters.plane}
    };
    const normal = next.plane.normal ?? [0, 0, 1];
    if (
      ![
        ...next.gravity,
        ...normal,
        next.plane.offset ?? 0,
        ...(next.plane.halfExtents ?? [1, 1])
      ].every(Number.isFinite) ||
      Math.hypot(...normal) < 0.000001
    )
      throw new Error('Invalid sphere plane or gravity');
    if (next.plane.halfExtents?.some(value => value <= 0))
      throw new Error('Plane half extents must be positive');
    for (const value of [
      next.restitution,
      next.staticFriction,
      next.dynamicFriction,
      next.rollingResistance,
      next.sleepAfter,
      next.sleepLinearSpeed,
      next.sleepAngularSpeed,
      next.restitutionThreshold
    ]) {
      if (!Number.isFinite(value) || value < 0) throw new Error('Invalid sphere material');
    }
    if (next.restitution > 1 || next.dynamicFriction > next.staticFriction)
      throw new Error('Invalid sphere friction or restitution');
    const planes = next.planes ?? [next.plane];
    if (planes.length > 32) throw new Error('Too many sphere planes');
    for (const plane of planes) {
      const normal = plane.normal ?? [0, 0, 1];
      const material = [
        plane.restitution ?? next.restitution,
        plane.staticFriction ?? next.staticFriction,
        plane.dynamicFriction ?? next.dynamicFriction,
        plane.rollingResistance ?? next.rollingResistance,
        plane.spinningResistance ?? 0,
        plane.contactHeightRatio ?? 0,
        plane.restitutionVelocityScale ?? 0
      ];
      if (
        ![
          ...normal,
          ...(plane.center ?? [0, 0, 0]),
          plane.offset ?? 0,
          ...(plane.halfExtents ?? [1, 1]),
          ...material
        ].every(Number.isFinite) ||
        Math.hypot(...normal) < 0.000001 ||
        plane.halfExtents?.some(value => value <= 0) ||
        material.some(value => value < 0) ||
        material[0] > 1 ||
        material[5] >= 1 ||
        material[2] > material[1]
      )
        throw new Error('Invalid sphere plane material or geometry');
    }
    const previous = this.parameters;
    const flatten = (values: typeof next): number[] => [
      ...values.gravity,
      ...(values.plane.normal ?? [0, 0, 1]),
      values.plane.offset ?? 0,
      ...(values.plane.halfExtents ?? [1e10, 1e10]),
      values.staticFriction,
      values.dynamicFriction,
      values.rollingResistance,
      Number(values.cutInducedThrow),
      Number(values.spinInducedThrow),
      ...(values.planes ?? [values.plane]).flatMap(plane => [
        ...(plane.normal ?? [0, 0, 1]),
        ...getPlaneCenter(plane),
        plane.offset ?? 0,
        ...(plane.halfExtents ?? [1e10, 1e10]),
        plane.restitution ?? values.restitution,
        plane.staticFriction ?? values.staticFriction,
        plane.dynamicFriction ?? values.dynamicFriction,
        plane.rollingResistance ?? values.rollingResistance,
        plane.spinningResistance ?? 0,
        plane.contactHeightRatio ?? 0,
        plane.restitutionVelocityScale ?? 0
      ])
    ];
    const previousValues = flatten(previous);
    if (
      flatten(next).length !== previousValues.length ||
      flatten(next).some((value, index) => Math.abs(value - previousValues[index]) > 0.00001)
    )
      this.wakeRevision = (this.wakeRevision % 16_000_000) + 1;
    this.parameters = {
      ...next,
      gravity: [...next.gravity],
      planes: next.planes?.map(plane => ({
        ...plane,
        normal: plane.normal ? [...plane.normal] : undefined,
        center: plane.center ? [...plane.center] : undefined,
        halfExtents: plane.halfExtents ? [...plane.halfExtents] : undefined
      })),
      plane: {
        ...next.plane,
        center: next.plane.center ? [...next.plane.center] : undefined,
        normal: [...normal],
        halfExtents: next.plane.halfExtents ? [...next.plane.halfExtents] : undefined
      }
    };
    this.writeSettings();
  }

  /** Adds one world to one graph. Scratch belongs to the graph; omitted state belongs to this world. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.added) throw new Error('Sphere world has already been added to a graph');
    if (Math.ceil(this.count / 64) > graph.device.limits.maxComputeWorkgroupsPerDimension)
      throw new Error('Sphere world exceeds device dispatch limits');
    if (
      Math.max(
        this.count * 16,
        this.count *
          (this.warmStarting ? (this.maximumContacts + 32) * 48 : this.maximumContacts * 8),
        this.warmStarting ? this.count * (this.count + 32) * 48 : 0,
        32,
        this.eventCapacity ? 16 + this.eventCapacity * 32 : 0,
        this.eventCapacity ? this.count * (this.count + 32) * 4 : 0
      ) > graph.device.limits.maxStorageBufferBindingSize
    )
      throw new Error('Sphere world exceeds maxStorageBufferBindingSize');
    const allocate = (id: string, byteLength: number, uniform = false): Buffer => {
      const buffer = graph.device.createBuffer({
        id: `${this.id}-${id}`,
        byteLength,
        usage: (uniform ? Buffer.UNIFORM : Buffer.STORAGE | Buffer.COPY_SRC) | Buffer.COPY_DST
      });
      this.ownedBuffers.push(buffer);
      return buffer;
    };
    this.settings = allocate('settings', 128 + 32 * 96, true);
    this.orientations ??= allocate('orientations', this.count * 16);
    this.angularVelocities ??= allocate('angular-velocities', this.count * 16);
    this.sleepStates ??= allocate('sleep-states', this.count * 16);
    this.diagnostics ??= allocate('diagnostics', 32);
    const importView = (
      name: string,
      buffer: Buffer,
      length: number,
      uniform = false
    ): GraphDataView<'float32x4'> =>
      graph.createDataView(
        graph.importBuffer(
          {
            id: `${this.id}-${name}`,
            byteLength: length * 16,
            usage: uniform ? Buffer.UNIFORM : Buffer.STORAGE
          },
          buffer
        ),
        {format: 'float32x4', length}
      );
    const settings = importView('settings', this.settings, 8 + 32 * 6, true);
    const state: StateViews = {
      positions: importView('positions', this.positions, this.count),
      velocities: importView('velocities', this.velocities, this.count),
      angularVelocities: importView('angular-velocities', this.angularVelocities, this.count)
    };
    const orientations = importView('orientations', this.orientations, this.count);
    const sleepStates = importView('sleep-states', this.sleepStates, this.count);
    const diagnostics = graph.createDataView(
      graph.importBuffer(
        {id: `${this.id}-diagnostics`, byteLength: 32, usage: Buffer.STORAGE},
        this.diagnostics
      ),
      {format: 'uint32', length: 8}
    );
    const scratch: StateViews = {
      positions: createTransientView(
        graph,
        `${this.id}-predicted-positions`,
        'float32x4',
        this.count
      ),
      velocities: createTransientView(
        graph,
        `${this.id}-predicted-velocities`,
        'float32x4',
        this.count
      ),
      angularVelocities: createTransientView(
        graph,
        `${this.id}-predicted-angular`,
        'float32x4',
        this.count
      )
    };
    const keys = createTransientView(graph, `${this.id}-keys`, 'uint32', this.count);
    const values = createTransientView(graph, `${this.id}-values`, 'uint32', this.count);
    const sortedKeys = createTransientView(graph, `${this.id}-sorted-keys`, 'uint32', this.count);
    const sortedBodies = createTransientView(
      graph,
      `${this.id}-sorted-bodies`,
      'uint32',
      this.count
    );
    const counts = createTransientView(graph, `${this.id}-counts`, 'uint32', this.count);
    const offsets = createTransientView(graph, `${this.id}-offsets`, 'uint32', this.count + 1);
    const contacts = createTransientView(
      graph,
      `${this.id}-contacts`,
      'uint32x2',
      this.count * (this.warmStarting ? (this.maximumContacts + 32) * 6 : this.maximumContacts)
    );
    let contactCache: GraphDataView | undefined;
    if (this.warmStarting) {
      this.contactCache = allocate('contact-cache', this.count * (this.count + 32) * 48);
      contactCache = importView(
        'contact-cache',
        this.contactCache,
        this.count * (this.count + 32) * 3
      );
    }
    const clockBuffer = graph.device.createBuffer({
      id: `${this.id}-clock`,
      byteLength: 16,
      usage: Buffer.UNIFORM | Buffer.STORAGE | Buffer.COPY_DST
    });
    this.ownedBuffers.push(clockBuffer);
    const clock = graph.createDataView(
      graph.importBuffer(
        {id: `${this.id}-clock`, byteLength: 16, usage: Buffer.STORAGE | Buffer.UNIFORM},
        clockBuffer
      ),
      {format: 'float32x4', length: 1}
    );
    const previousPositions = createTransientView(
      graph,
      `${this.id}-previous-positions`,
      'float32x4',
      this.count
    );
    const previousVelocities = createTransientView(
      graph,
      `${this.id}-previous-velocities`,
      'float32x4',
      this.count
    );
    let eventView: GraphDataView | undefined;
    let contactStates: GraphDataView | undefined;
    if (this.eventCapacity) {
      const contactBuffer = allocate('contact-states', this.count * (this.count + 32) * 4);
      contactStates = graph.createDataView(
        graph.importBuffer(
          {
            id: `${this.id}-contact-states`,
            byteLength: contactBuffer.byteLength,
            usage: Buffer.STORAGE
          },
          contactBuffer
        ),
        {format: 'uint32', length: this.count * (this.count + 32)}
      );
      this.events = allocate('events', 16 + this.eventCapacity * 32);
      eventView = graph.createDataView(
        graph.importBuffer(
          {
            id: `${this.id}-events`,
            byteLength: this.events.byteLength,
            usage: Buffer.STORAGE
          },
          this.events
        ),
        {format: 'uint32', length: this.events.byteLength / 4}
      );
    }
    const header = getSphereWorldShaderHeader(
      this.count,
      this.maximumRadius,
      this.maximumContacts,
      this.contactSkin,
      this.maximumCandidateTests
    );
    const bind = (
      name: string,
      view: GraphDataView,
      location: number,
      access: PassBinding['access'] = 'read'
    ): PassBinding => ({name, view, location, access});
    const passDescriptions: Record<string, string> = {
      clear: 'Reset diagnostics for this simulation substep.',
      begin: 'Initialize the substep clock and remaining simulation time.',
      sweep: 'Find the earliest swept-sphere impact to avoid tunneling.',
      remember: 'Save sphere state before speculative integration.',
      integrate: 'Apply gravity and advance sphere positions.',
      cells: 'Assign spheres to spatial grid cells for collision detection.',
      count: 'Count candidate sphere pairs in neighboring cells.',
      sentinel: 'Write the final candidate-pair offset.',
      emit: 'Emit candidate sphere pairs from neighboring grid cells.',
      restore: 'Restore cached contact data to initialize persistent contact constraints.',
      warm: 'Warm start contacts using impulses from the previous step.',
      solve: 'Resolve sphere contacts and friction for this solver iteration.',
      publish: 'Copy solved sphere positions and velocities into the public simulation state.',
      store: 'Store solved contact impulses for the next step.',
      events: 'Publish contact events for the application.',
      'state-counts': 'Count active and sleeping sphere states.',
      finalize: 'Finalize sphere positions and velocities after contact solving.',
      budget: 'Record whether the continuous collision impact budget was exhausted.'
    };
    const addPass = (
      name: string,
      source: string,
      bindings: PassBinding[],
      workgroups = Math.ceil(this.count / 64),
      usesSettings = true
    ): void => {
      const usesClock = usesSettings && /\bclock\./.test(source);
      const allBindings = usesSettings
        ? [
            ...(/\bsettings\./.test(source) ? [bind('settings', settings, 0, 'uniform')] : []),
            ...(usesClock ? [bind('clock', clock, 9, 'uniform')] : []),
            ...bindings
          ]
        : bindings;
      const resources: GraphBufferUse[] = allBindings.map(binding => ({
        buffer: binding.view,
        usage:
          binding.access === 'uniform'
            ? 'uniform'
            : binding.access === 'read'
              ? 'storage-read'
              : 'storage-read-write'
      }));
      const shaderLayout: ShaderLayout = {
        attributes: [],
        bindings: allBindings.map((binding): BindingDeclaration => {
          const base = {name: binding.name, group: 0, location: binding.location};
          return binding.access === 'uniform'
            ? {...base, type: 'uniform'}
            : {...base, type: binding.access === 'read' ? 'read-only-storage' : 'storage'};
        })
      };
      const props = {
        id: `${this.id}-${name}`,
        source:
          (usesClock
            ? header
            : header.replace('@group(0) @binding(9) var<uniform> clock: Clock;', '')) + source,
        shaderLayout
      };
      const createExecutable = (
        computation: BoundKernel
      ): GPUCommandGraphComputeExecutable<Parameters> => ({
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const binding of allBindings)
            resolved[binding.name] = getViewBinding(binding.view, getBuffer);
          Object.assign(computation.bindings, resolved);
          computation.kernel.dispatch(computePass, {
            bindings: computation.bindings,
            x: workgroups,
            y: 1,
            z: 1
          });
        },
        destroy: () => computation.kernel.destroy()
      });
      graph.addComputePass({
        id: props.id,
        description:
          passDescriptions[name.replace(/^step-\d+-(?:impact-\d+-)?/, '').replace(/-\d+$/, '')],
        resources,
        compile: ({device}) => createExecutable(createBoundKernel(device, props)),
        compileAsync: async ({device}) =>
          createExecutable(await createBoundKernelAsync(device, props))
      });
    };
    for (let substep = 0; substep < this.substeps; substep++) {
      const prefix = `step-${substep}`;
      addPass(
        `${prefix}-clear`,
        '@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>; @compute @workgroup_size(8) fn main(@builtin(local_invocation_index) index:u32) {atomicStore(&diagnostics[index], 0u);}',
        [bind('diagnostics', diagnostics, 1, 'write')],
        1,
        false
      );
      addPass(
        `${prefix}-begin`,
        `
@group(0) @binding(1) var<storage, read_write> outputClock: Clock;
@compute @workgroup_size(1) fn main() {
 outputClock = Clock(settings.material.x, settings.material.x, outputClock.step + 1u, 0u);
}`,
        [bind('settings', settings, 0, 'uniform'), bind('outputClock', clock, 1, 'write')],
        1,
        false
      );
      for (
        let impactStep = 0;
        impactStep < (this.continuous ? this.maximumImpactSteps : 1);
        impactStep++
      ) {
        const impactPrefix = `${prefix}-impact-${impactStep}`;
        if (this.continuous)
          addPass(
            `${impactPrefix}-sweep`,
            getSweepShader(),
            [
              bind('positions', state.positions, 1),
              bind('velocities', state.velocities, 2),
              bind('settings', settings, 0, 'uniform'),
              bind('outputClock', clock, 3, 'write')
            ],
            1,
            false
          );
        if (eventView)
          addPass(
            `${impactPrefix}-remember`,
            `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> previousPositions: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> previousVelocities: array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT) {return;}
 previousPositions[index] = positions[index]; previousVelocities[index] = velocities[index];
}`,
            [
              bind('positions', state.positions, 1),
              bind('velocities', state.velocities, 2),
              bind('previousPositions', previousPositions, 3, 'write'),
              bind('previousVelocities', previousVelocities, 4, 'write')
            ],
            Math.ceil(this.count / 64),
            false
          );
        addPass(`${impactPrefix}-integrate`, INTEGRATE_SPHERES, [
          bind('positions', state.positions, 1),
          bind('velocities', state.velocities, 2),
          bind('angularVelocities', state.angularVelocities, 3),
          bind('sleepStates', sleepStates, 4, 'write'),
          bind('predictedPositions', scratch.positions, 5, 'write'),
          bind('predictedVelocities', scratch.velocities, 6, 'write'),
          bind('predictedAngularVelocities', scratch.angularVelocities, 7, 'write')
        ]);
        addPass(
          `${impactPrefix}-cells`,
          ASSIGN_SPHERE_CELLS,
          [
            bind('positions', scratch.positions, 1),
            bind('keys', keys, 2, 'write'),
            bind('values', values, 3, 'write'),
            bind('diagnostics', diagnostics, 4, 'write')
          ],
          Math.ceil(this.count / 64),
          false
        );
        if (this.broadPhase === 'grid')
          addGPUCommandNodes(
            graph,
            new GPUSort({
              id: `${this.id}-${impactPrefix}-sort`,
              keys,
              values,
              outputKeys: sortedKeys,
              outputValues: sortedBodies
            }).getCommandNodes(graph)
          );
        const commonContacts = [
          bind('positions', scratch.positions, 1),
          bind('velocities', scratch.velocities, 2),
          ...(this.broadPhase === 'grid'
            ? [bind('sortedKeys', sortedKeys, 3), bind('sortedBodies', sortedBodies, 4)]
            : []),
          bind('diagnostics', diagnostics, 8, 'write')
        ];
        addPass(
          `${impactPrefix}-count`,
          getSphereContactShader('count', this.broadPhase === 'all-pairs'),
          [...commonContacts, bind('counts', counts, 5, 'write')]
        );
        addGPUCommandNodes(
          graph,
          new GPUScan({
            id: `${this.id}-${impactPrefix}-scan`,
            input: counts,
            output: offsets
          }).getCommandNodes(graph)
        );
        addPass(
          `${impactPrefix}-sentinel`,
          '@group(0) @binding(1) var<storage, read> counts: array<u32>; @group(0) @binding(2) var<storage, read_write> offsets: array<u32>; @compute @workgroup_size(1) fn main() {offsets[BODY_COUNT] = offsets[BODY_COUNT - 1u] + counts[BODY_COUNT - 1u];}',
          [bind('counts', counts, 1), bind('offsets', offsets, 2, 'write')],
          1,
          false
        );
        addPass(
          `${impactPrefix}-emit`,
          this.warmStarting
            ? makePersistentContactShader(
                getSphereContactShader('emit', this.broadPhase === 'all-pairs'),
                true
              )
            : getSphereContactShader('emit', this.broadPhase === 'all-pairs'),
          [...commonContacts, bind('offsets', offsets, 6), bind('contacts', contacts, 7, 'write')]
        );
        if (contactCache) {
          // Later impact intervals initialize constraints without reusing prior-frame impulses.
          addPass(
            `${impactPrefix}-restore`,
            PERSISTENT_CONTACT_HEADER +
              `const ALLOW_WARM = ${impactStep === 0};` +
              RESTORE_SPHERE_CONTACTS,
            [
              bind('positions', scratch.positions, 1),
              bind('offsets', offsets, 2),
              bind('contacts', contacts, 3, 'write'),
              bind('cache', contactCache, 4),
              bind('velocities', scratch.velocities, 5),
              bind('angularVelocities', scratch.angularVelocities, 6)
            ]
          );
          addPass(`${impactPrefix}-warm`, PERSISTENT_CONTACT_HEADER + WARM_SPHERE_CONTACTS, [
            bind('positions', scratch.positions, 1),
            bind('velocities', scratch.velocities, 2, 'write'),
            bind('angularVelocities', scratch.angularVelocities, 3, 'write'),
            bind('offsets', offsets, 4),
            bind('contacts', contacts, 5)
          ]);
        }
        const iterations = this.iterations;
        for (let iteration = 0; iteration < iterations; iteration++) {
          const input = iteration % 2 === 0 ? scratch : state;
          const output = iteration % 2 === 0 ? state : scratch;
          addPass(
            `${impactPrefix}-solve-${iteration}`,
            this.warmStarting
              ? makeAccumulatedSphereSolver(SOLVE_SPHERE_CONTACTS)
              : SOLVE_SPHERE_CONTACTS,
            [
              bind('positions', input.positions, 1),
              bind('velocities', input.velocities, 2),
              bind('angularVelocities', input.angularVelocities, 3),
              bind('offsets', offsets, 4),
              bind('contacts', contacts, 5, this.warmStarting ? 'write' : 'read'),
              bind('outputPositions', output.positions, 6, 'write'),
              bind('outputVelocities', output.velocities, 7, 'write'),
              bind('outputAngularVelocities', output.angularVelocities, 8, 'write')
            ]
          );
        }
        if (iterations % 2 === 0)
          addPass(
            `${impactPrefix}-publish`,
            `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> outputPositions: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> outputVelocities: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> outputAngularVelocities: array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT) {return;}
 outputPositions[index] = positions[index]; outputVelocities[index] = velocities[index]; outputAngularVelocities[index] = angularVelocities[index];
}`,
            [
              bind('positions', scratch.positions, 1),
              bind('velocities', scratch.velocities, 2),
              bind('angularVelocities', scratch.angularVelocities, 3),
              bind('outputPositions', state.positions, 4, 'write'),
              bind('outputVelocities', state.velocities, 5, 'write'),
              bind('outputAngularVelocities', state.angularVelocities, 6, 'write')
            ],
            Math.ceil(this.count / 64),
            false
          );
        if (contactCache)
          addPass(`${impactPrefix}-store`, PERSISTENT_CONTACT_HEADER + STORE_SPHERE_CONTACTS, [
            bind('offsets', offsets, 1),
            bind('contacts', contacts, 2),
            bind('cache', contactCache, 3, 'write')
          ]);
        if (eventView)
          addPass(
            `${impactPrefix}-events`,
            this.warmStarting
              ? makePersistentContactShader(getEventShader(this.eventCapacity, this.triggers))
              : getEventShader(this.eventCapacity, this.triggers),
            [
              bind('positions', state.positions, 1, 'write'),
              ...(this.triggers.some(trigger => trigger.capture)
                ? [bind('velocities', state.velocities, 2, 'write')]
                : []),
              bind('previousPositions', previousPositions, 3),
              bind('previousVelocities', previousVelocities, 4),
              bind('offsets', offsets, 5),
              bind('contacts', contacts, 6),
              bind('events', eventView, 7, 'write'),
              bind('contactStates', contactStates!, 8, 'write')
            ],
            1
          );
        addPass(
          `${impactPrefix}-state-counts`,
          `
@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>;
@compute @workgroup_size(1) fn main() {
 if(clock.timeStep > 0.0) {atomicStore(&diagnostics[3], 0u); atomicStore(&diagnostics[4], 0u);}
}`,
          [bind('diagnostics', diagnostics, 1, 'write')],
          1
        );
        addPass(`${impactPrefix}-finalize`, FINALIZE_SPHERES, [
          bind('positions', state.positions, 1),
          bind('velocities', state.velocities, 2, 'write'),
          bind('angularVelocities', state.angularVelocities, 3, 'write'),
          bind('orientations', orientations, 4, 'write'),
          bind('sleepStates', sleepStates, 5, 'write'),
          bind('diagnostics', diagnostics, 6, 'write')
        ]);
      }
      if (this.continuous)
        addPass(
          `${prefix}-budget`,
          `
@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>;
${eventView ? '@group(0) @binding(2) var<storage, read_write> events: array<atomic<u32>>;' : ''}
@compute @workgroup_size(1) fn main() {if(clock.remaining > 0.0) {
 atomicOr(&diagnostics[7], 1u); ${eventView ? 'atomicAdd(&events[1], 1u); atomicStore(&events[2], bitcast<u32>(bitcast<f32>(atomicLoad(&events[2])) + clock.remaining));' : ''}
}}
`,
          [
            bind('diagnostics', diagnostics, 1, 'write'),
            ...(eventView ? [bind('events', eventView, 2, 'write')] : [])
          ],
          1
        );
    }
    this.commandSettings = allocate('body-command', 80, true);
    this.bodyControl = createBoundKernel(graph.device, {
      id: `${this.id}-body-control`,
      source: CONTROL_SPHERE,
      bindings: {
        command: this.commandSettings,
        positions: this.positions,
        velocities: this.velocities,
        angularVelocities: this.angularVelocities,
        orientations: this.orientations,
        sleepStates: this.sleepStates
      },
      shaderLayout: {
        bindings: [
          {name: 'command', type: 'uniform', group: 0, location: 0},
          ...['positions', 'velocities', 'angularVelocities', 'orientations', 'sleepStates'].map(
            (name, index): BindingDeclaration => ({
              name,
              type: 'storage',
              group: 0,
              location: index + 1
            })
          )
        ]
      }
    });
    this.added = true;
    this.writeSettings();
  }

  /** Submit a world-space impulse, optionally at a world-space point, and wake the body. */
  applyImpulse(index: number, impulse: Vector3, point?: Vector3): void {
    this.submitBodyCommand(index, 1, impulse, point ?? [0, 0, 0], point ? 1 : 0);
  }

  /** Submit a world-space angular impulse (torque integrated over time). */
  applyAngularImpulse(index: number, impulse: Vector3): void {
    this.submitBodyCommand(index, 2, impulse);
  }

  wakeBody(index: number): void {
    this.submitBodyCommand(index, 3);
  }

  /** Move a body, clear its velocities, set its orientation and wake it. Preserves enabled state. */
  teleportBody(
    index: number,
    position: Vector3,
    orientation: readonly [number, number, number, number] = [0, 0, 0, 1]
  ): void {
    if (!orientation.every(Number.isFinite) || Math.hypot(...orientation) < 0.000001)
      throw new Error('Invalid sphere orientation');
    this.submitBodyCommand(index, 4, position, [0, 0, 0], 0, orientation);
  }

  /** Disabled bodies retain radius/mass but do not integrate or collide. Clears velocities. */
  setBodyEnabled(index: number, enabled: boolean): void {
    this.submitBodyCommand(index, 5, [enabled ? 1 : -1, 0, 0]);
  }

  /** Explicit small-scene snapshot. Queue copies together before awaiting the GPU. */
  async readState(): Promise<GPUSphereBodyState[]> {
    if (!this.bodyControl) throw new Error('Add sphere world to a graph first');
    const buffers = [
      this.positions,
      this.velocities,
      this.angularVelocities!,
      this.orientations!,
      this.sleepStates!
    ];
    const sleepAfter = this.parameters.sleepAfter;
    const data = await Promise.all(
      buffers.map(
        async buffer => new Float32Array((await buffer.readAsync(0, this.count * 16)).buffer)
      )
    );
    const vector = (values: Float32Array, offset: number): [number, number, number] => [
      values[offset],
      values[offset + 1],
      values[offset + 2]
    ];
    return Array.from({length: this.count}, (_, index) => {
      const offset = index * 4;
      return {
        index,
        position: vector(data[0], offset),
        radius: Math.abs(data[0][offset + 3]),
        enabled: data[0][offset + 3] > 0,
        velocity: vector(data[1], offset),
        inverseMass: data[1][offset + 3],
        angularVelocity: vector(data[2], offset),
        orientation: [...vector(data[3], offset), data[3][offset + 3]],
        sleeping: sleepAfter > 0 && data[4][offset] >= sleepAfter
      };
    });
  }

  private submitBodyCommand(
    index: number,
    operation: number,
    value: Vector3 = [0, 0, 0],
    point: Vector3 = [0, 0, 0],
    atPoint = 0,
    orientation: readonly number[] = [0, 0, 0, 1]
  ): void {
    if (!this.bodyControl || !this.commandSettings)
      throw new Error('Add sphere world to a graph first');
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.count ||
      ![...value, ...point].every(Number.isFinite)
    )
      throw new Error('Invalid sphere body command');
    this.clearContactCache();
    this.commandSettings.write(
      new Float32Array([
        index,
        operation,
        atPoint,
        0,
        ...value,
        0,
        ...point,
        0,
        ...orientation,
        0,
        0,
        0,
        0
      ])
    );
    const device = this.positions.device;
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.bodyControl.kernel.dispatch(pass, {bindings: this.bodyControl.bindings, x: 1, y: 1, z: 1});
    pass.end();
    device.submit(encoder.finish());
  }

  /** Snapshot the ring once; concurrent readers share a cursor and one readback. */
  readEvents(): Promise<GPUSphereEventBatch> {
    if (!this.events) throw new Error('Sphere events are disabled');
    this.eventRead ??= this.events
      .readAsync()
      .then(bytes => {
        const batch = decodeSphereEvents(
          new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4),
          this.eventCursor
        );
        this.eventCursor = batch.sequence;
        return batch;
      })
      .finally(() => {
        this.eventRead = undefined;
      });
    return this.eventRead;
  }

  /** Destroy the compiled graph first. Never destroys caller-supplied state. */
  destroy(): void {
    this.bodyControl?.kernel.destroy();
    this.bodyControl = undefined;
    for (const buffer of this.ownedBuffers) buffer.destroy();
    this.ownedBuffers = [];
  }

  /** Call after direct writes to caller-owned state. Commands and material updates invalidate automatically. */
  clearContactCache(): void {
    if (this.contactCache) this.contactCache.write(new Uint8Array(this.contactCache.byteLength));
  }

  private writeSettings(): void {
    this.clearContactCache();
    if (!this.settings) return;
    const parameters = this.parameters;
    const source = parameters.plane.normal ?? [0, 0, 1];
    const length = Math.hypot(...source);
    const normal = source.map(value => value / length);
    const right =
      Math.abs(normal[1]) < 0.9 ? [normal[2], 0, -normal[0]] : [0, -normal[2], normal[1]];
    const rightLength = Math.hypot(...right);
    for (let index = 0; index < 3; index++) right[index] /= rightLength;
    const forward = [
      normal[1] * right[2] - normal[2] * right[1],
      normal[2] * right[0] - normal[0] * right[2],
      normal[0] * right[1] - normal[1] * right[0]
    ];
    const data = new Float32Array(32 + 32 * 24);
    data.set([
      ...parameters.gravity,
      this.wakeRevision,
      ...normal,
      parameters.plane.offset ?? 0,
      ...right,
      parameters.plane.halfExtents?.[0] ?? 1e10,
      ...forward,
      parameters.plane.halfExtents?.[1] ?? 1e10,
      this.timeStep,
      parameters.restitution,
      parameters.staticFriction,
      parameters.dynamicFriction,
      parameters.rollingResistance,
      parameters.sleepLinearSpeed,
      parameters.sleepAngularSpeed,
      (parameters.planes ?? [parameters.plane]).length,
      parameters.sleepAfter,
      parameters.restitutionThreshold,
      this.contactSkin,
      0.8,
      Number(parameters.cutInducedThrow),
      Number(parameters.spinInducedThrow),
      0,
      0
    ]);
    for (const [index, plane] of (parameters.planes ?? [parameters.plane]).entries()) {
      const source = plane.normal ?? [0, 0, 1];
      const length = Math.hypot(...source);
      const normal = source.map(value => value / length);
      const right =
        Math.abs(normal[1]) < 0.9 ? [normal[2], 0, -normal[0]] : [0, -normal[2], normal[1]];
      const rightLength = Math.hypot(...right);
      for (let axis = 0; axis < 3; axis++) right[axis] /= rightLength;
      const forward = [
        normal[1] * right[2] - normal[2] * right[1],
        normal[2] * right[0] - normal[0] * right[2],
        normal[0] * right[1] - normal[1] * right[0]
      ];
      const center = getPlaneCenter(plane);
      data.set(
        [
          ...normal,
          center.reduce((sum, value, axis) => sum + value * normal[axis], 0),
          ...right,
          plane.halfExtents?.[0] ?? 1e10,
          ...forward,
          plane.halfExtents?.[1] ?? 1e10,
          ...center,
          plane.spinningResistance ?? 0,
          plane.restitution ?? parameters.restitution,
          plane.staticFriction ?? parameters.staticFriction,
          plane.dynamicFriction ?? parameters.dynamicFriction,
          plane.rollingResistance ?? parameters.rollingResistance,
          plane.contactHeightRatio ?? 0,
          plane.restitutionVelocityScale ?? 0,
          0,
          0
        ],
        32 + index * 24
      );
    }
    this.settings.write(data);
  }
}

/** Keep wake comparisons and GPU plane placement on the same normalized geometry. */
function getPlaneCenter(plane: GPUSpherePlane): Vector3 {
  if (plane.center) return plane.center;
  const normal = plane.normal ?? [0, 0, 1];
  const scale = (plane.offset ?? 0) / Math.hypot(...normal);
  return [normal[0] * scale, normal[1] * scale, normal[2] * scale];
}
