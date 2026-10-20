// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type Binding,
  type BindingDeclaration,
  type Device,
  type ShaderLayout
} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GPUCommandGraphComputeExecutable
} from '../gpu-core/gpu-command-graph';
import {getRigidBodyShapeProperties} from './rigid-body-shape-properties';
import {packRigidBodyShapes, areFixedMeshesSeparated} from './rigid-body-geometry';
import {
  getCompoundBodyInertia,
  normalizeRigidBodyRotation,
  rotateRigidBodyVector,
  type GPURigidBody,
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
import {getRigidBodyShader} from './rigid-body-shaders';

type Vector3 = readonly [number, number, number];
export type GPURigidBodyWorldProps = {
  id?: string;
  bodies: readonly GPURigidBody[];
  gravity?: Vector3;
  timeStep?: number;
  iterations?: number;
  contactSlop?: number;
  /** Small worlds retain the all-pairs numerical oracle; larger worlds use sparse discovery. */
  broadPhase?: 'all-pairs' | 'hierarchical-grid';
  /** Power-of-two persistent contact-pair cache capacity, for hierarchical discovery. */
  maximumPairs?: number;
  /** Maximum hash-bucket candidate tests per collider; incomplete traversal is reported. */
  maximumCandidateTestsPerCollider?: number;
  contactMatchDistance?: number;
  restitutionThreshold?: number;
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
 * ordered GPU impulse solver. Small worlds retain a bounded all-pairs oracle; larger
 * worlds use hierarchical discovery and sparse persistent manifolds. Buffers are world-owned.
 */
export class GPURigidBodyWorld {
  readonly id: string;
  readonly count: number;
  readonly timeStep: number;
  readonly colliderCount: number;
  readonly broadPhase: 'all-pairs' | 'hierarchical-grid';
  readonly maximumPairs: number;
  positions: Buffer | null = null;
  orientations: Buffer | null = null;
  velocities: Buffer | null = null;
  angularVelocities: Buffer | null = null;
  sleepStates: Buffer | null = null;
  private targets: Buffer | null = null;
  private readonly colliders: readonly (GPURigidBodyCollider & {body: number})[];
  private readonly props: GPURigidBodyWorldProps;
  private readonly ownedBuffers: Buffer[] = [];
  private manifolds: Buffer | null = null;
  private meshTasks: Buffer | null = null;
  private device: Device | null = null;
  private control: Computation | null = null;
  private controlSettings: Buffer | null = null;
  private destroyed = false;
  private broadPhaseCounters: {buffer: Buffer; byteOffset: number} | null = null;
  /** Bodies whose immutable pose envelope is required by a mesh/mesh separation proof. */
  private readonly anchoredBodies = new Set<number>();

  constructor(props: GPURigidBodyWorldProps) {
    this.id = props.id ?? 'gpu-rigid-body-world';
    this.count = props.bodies.length;
    this.broadPhase = props.broadPhase ?? (this.count > 128 ? 'hierarchical-grid' : 'all-pairs');
    this.timeStep = props.timeStep ?? 1 / 120;
    const iterations = props.iterations ?? 16;
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
      if (body.shape ? body.colliders !== undefined : !body.colliders?.length)
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
    this.colliderCount = colliders.length;
    this.maximumPairs =
      this.broadPhase === 'all-pairs'
        ? this.colliderCount * this.colliderCount
        : (props.maximumPairs ?? 2 ** Math.ceil(Math.log2(Math.max(64, this.colliderCount * 16))));
    if (
      !['all-pairs', 'hierarchical-grid'].includes(this.broadPhase) ||
      !Number.isSafeInteger(this.maximumPairs) ||
      this.maximumPairs < 1 ||
      this.maximumPairs > 0x40000000 ||
      (this.broadPhase === 'hierarchical-grid' &&
        (this.maximumPairs & (this.maximumPairs - 1)) !== 0)
    )
      throw new Error('Invalid rigid-body pair capacity');
    const meshes = colliders
      .map((collider, index) => ({collider, index}))
      .filter(({collider}) => collider.shape.type === 'triangle-mesh');
    for (let first = 0; first < meshes.length; first++)
      for (let second = first + 1; second < meshes.length; second++) {
        const firstCollider = meshes[first].collider,
          secondCollider = meshes[second].collider;
        if (
          firstCollider.shape.type !== 'triangle-mesh' ||
          secondCollider.shape.type !== 'triangle-mesh' ||
          firstCollider.body === secondCollider.body ||
          firstCollider.excludedColliders?.includes(meshes[second].index) ||
          secondCollider.excludedColliders?.includes(meshes[first].index)
        )
          continue;
        const firstBody = props.bodies[firstCollider.body],
          secondBody = props.bodies[secondCollider.body];
        const staticBody = (body: GPURigidBody) =>
          (body.mode ?? (body.mass === 0 ? 'static' : 'dynamic')) === 'static';
        if (
          !(staticBody(firstBody) && staticBody(secondBody)) &&
          !areFixedMeshesSeparated(firstCollider, firstBody, secondCollider, secondBody)
        )
          throw new Error('Potential mesh/mesh contact is unsupported');
        if (!(staticBody(firstBody) && staticBody(secondBody))) {
          this.anchoredBodies.add(firstCollider.body);
          this.anchoredBodies.add(secondCollider.body);
        }
      }
    this.colliders = structuredClone(colliders);
    this.props = structuredClone(props);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.device || this.destroyed)
      throw new Error('Rigid-body world already attached or destroyed');
    if (Math.ceil(this.maximumPairs / 64) > graph.device.limits.maxComputeWorkgroupsPerDimension)
      throw new Error('Rigid-body pair dispatch exceeds device limits');
    if (this.maximumPairs * 288 > graph.device.limits.maxStorageBufferBindingSize)
      throw new Error('Rigid-body pair storage exceeds device limits');
    this.device = graph.device;
    const allocate = (name: string, data: Float32Array | Uint32Array | number, uniform = false) => {
      const buffer = graph.device.createBuffer({
        id: `${this.id}-${name}`,
        ...(typeof data === 'number' ? {byteLength: data} : {data}),
        usage:
          (uniform ? Buffer.UNIFORM : Buffer.STORAGE) |
          Buffer.COPY_DST |
          Buffer.COPY_SRC |
          (name === 'targets' ? Buffer.INDIRECT : 0)
      });
      this.ownedBuffers.push(buffer);
      return buffer;
    };
    const positions = new Float32Array(this.count * 4);
    const orientations = new Float32Array(this.count * 4);
    const velocities = new Float32Array(this.count * 4);
    const angular = new Float32Array(this.count * 4);
    // Three vec4s per body, six per collider and one sparse filter range per collider.
    const packed = packRigidBodyShapes(this.colliders);
    const geometryOffset =
      Math.ceil((this.count * 12 + this.colliderCount * 24 + this.colliderCount * 2) / 4) * 4;
    const sparse = this.broadPhase === 'hierarchical-grid';
    const pairOffset = Math.ceil((geometryOffset + packed.geometry.length) / 64) * 64;
    const diagnosticOffset = Math.ceil((pairOffset + this.maximumPairs * 2) / 64) * 64;
    const sparseLayout: RigidBodySparseShaderLayout | undefined = sparse
      ? {
          maximumPairs: this.maximumPairs,
          pairOffset: pairOffset - geometryOffset,
          diagnosticOffset: diagnosticOffset - geometryOffset
        }
      : undefined;
    const metadataLength = sparse
      ? diagnosticOffset + 8
      : geometryOffset + Math.max(4, packed.geometry.length);
    if (metadataLength * 4 > graph.device.limits.maxStorageBufferBindingSize)
      throw new Error('Rigid-body metadata exceeds device limits');
    const metadata = new Float32Array(metadataLength);
    metadata.set(packed.geometry, geometryOffset);
    const bodyColliders: GPURigidBodyCollider[][] = Array.from({length: this.count}, () => []);
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
          0,
          ...inertiaRotation,
          mode === 'static' ? 0 : mode === 'dynamic' ? 1 : 2,
          body.gravityFactor ?? 1,
          this.anchoredBodies.has(index) ? (mode === 'static' ? 2 : 1) : 0,
          0
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
          0,
          material?.restitutionCombine ? policies.indexOf(material.restitutionCombine) : 4,
          material?.frictionCombine ? policies.indexOf(material.frictionCombine) : 4,
          ...shape.policies,
          ...shape.padding
        ],
        this.count * 12 + index * 24
      );
    }
    const exclusionOffset = this.count * 12 + this.colliderCount * 24;
    for (const [index, filter] of packed.filters.entries())
      metadata.set(filter, exclusionOffset + index * 2);
    this.positions = allocate('positions', positions);
    this.orientations = allocate('orientations', orientations);
    this.velocities = allocate('velocities', velocities);
    this.angularVelocities = allocate('angular-velocities', angular);
    this.sleepStates = allocate('sleep', this.count * 16);
    this.targets = allocate(
      'targets',
      this.count * 32 + (sparse ? 32 + this.maximumPairs * 8 : 16)
    );
    for (const index of this.anchoredBodies) {
      // These bodies cannot be kinematic: preserve the construction-time COM envelope.
      this.targets.write(positions.subarray(index * 4, index * 4 + 4), index * 32);
      this.targets.write(orientations.subarray(index * 4, index * 4 + 4), index * 32 + 16);
    }
    // Four 64-byte contacts followed by a 32-byte aligned manifold header.
    this.manifolds = allocate('manifolds', this.maximumPairs * 288);
    const extended = this.colliders.some(
      collider => collider.shape.type !== 'sphere' && collider.shape.type !== 'box'
    );
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
        0
      ]),
      true
    );
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
      ...(sparse
        ? {
            minima: allocate('minima', this.colliderCount * 12),
            maxima: allocate('maxima', this.colliderCount * 12)
          }
        : {})
    };
    const bindings = Object.entries(buffers).map(([name, buffer], location) => ({
      name,
      buffer,
      location:
        name === 'minima' ? 24 : name === 'maxima' ? 25 : location >= 8 ? location + 1 : location,
      resource: graph.importBuffer(
        {
          id: `${this.id}-${name}`,
          byteLength: buffer.byteLength,
          usage:
            location === 0
              ? Buffer.UNIFORM
              : Buffer.STORAGE | (name === 'targets' ? Buffer.INDIRECT : 0)
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
          {format: 'uint32', length: this.colliderCount}
        )
      : undefined;
    const source = getRigidBodyShader(
      this.count,
      this.props.iterations ?? 16,
      this.colliderCount,
      this.colliders.some(
        collider => collider.shape.type !== 'sphere' && collider.shape.type !== 'box'
      ),
      sparseLayout
    );
    for (const entryPoint of [
      'integrate',
      ...(sparse ? ['prepare', 'bounds'] : []),
      'collide',
      ...(extended ? ['meshCollide'] : []),
      'solve',
      'finish'
    ]) {
      if (sparse && entryPoint === 'collide') {
        const bodyBinding = bindings.find(binding => binding.name === 'bodies')!;
        const minimumBinding = bindings.find(binding => binding.name === 'minima')!;
        const maximumBinding = bindings.find(binding => binding.name === 'maxima')!;
        const broadPhase = new GPURigidBodyBroadPhase({
          id: `${this.id}-broad-phase`,
          objectMetadata: objectAttributeView,
          maximumCandidateTestsPerQuery: this.props.maximumCandidateTestsPerCollider,
          minima: graph.createDataView(minimumBinding.resource, {
            format: 'float32x3',
            length: this.colliderCount
          }),
          maxima: graph.createDataView(maximumBinding.resource, {
            format: 'float32x3',
            length: this.colliderCount
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
      const unusedCore =
        entryPoint === 'prepare'
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
                  ? ['sleepStates', ...(extended || sparse ? [] : ['targets'])]
                  : entryPoint === 'finish'
                    ? ['manifolds', 'meshTasks']
                    : ['targets'];
      const unused = [...unusedCore, ...(entryPoint === 'bounds' ? [] : ['minima', 'maxima'])];
      const activeBindings = bindings.filter(binding => !unused.includes(binding.name));
      const activeLayout: ShaderLayout = {
        attributes: [],
        bindings: shaderLayout.bindings!.filter(binding => !unused.includes(binding.name))
      };
      const createExecutable = (
        computation: Computation
      ): GPUCommandGraphComputeExecutable<Parameters> => ({
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const binding of activeBindings)
            resolved[binding.name] = getBuffer(binding.resource);
          computation.setBindings(resolved);
          if (entryPoint === 'meshCollide') {
            const targetBinding = bindings.find(binding => binding.name === 'targets')!;
            computation.dispatchIndirect(
              computePass,
              getBuffer(targetBinding.resource),
              this.count * 32
            );
          } else {
            computation.dispatch(
              computePass,
              entryPoint === 'collide'
                ? Math.ceil(this.maximumPairs / 64)
                : entryPoint === 'bounds'
                  ? Math.ceil(this.colliderCount / 64)
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
        resources: [
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
    this.controlSettings = allocate('control-settings', 64, true);
    this.control = new Computation(graph.device, {
      id: `${this.id}-impulse`,
      source:
        source +
        /* wgsl */ `
struct Command { impulse: vec4f, point: vec4f, orientation: vec4f, bodyIndex: vec4u }
@group(0) @binding(8) var<uniform> command: Command;
@compute @workgroup_size(1) fn control() {
 if(command.bodyIndex.y==0u) {applyImpulse(command.bodyIndex.x,command.point.xyz,command.impulse.xyz);}
 else {targets.entries[command.bodyIndex.x].position=vec4f(command.point.xyz,1);targets.entries[command.bodyIndex.x].orientation=command.orientation;}
 // Wake and invalidate all connected components conservatively after external changes.
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body]=vec4f(0);}
 for(var pair=0u;pair<PAIR_CAPACITY;pair++) {manifolds[pair].count=0u;}
}`,
      entryPoint: 'control',
      shaderLayout: {
        bindings: [
          ...shaderLayout.bindings!.filter(
            binding => !['settings', 'meshTasks', 'minima', 'maxima'].includes(binding.name)
          ),
          {name: 'command', group: 0, location: 8, type: 'uniform'}
        ]
      },
      bindings: {
        ...Object.fromEntries(
          Object.entries(buffers).filter(
            ([name]) => !['settings', 'meshTasks', 'minima', 'maxima'].includes(name)
          )
        ),
        command: this.controlSettings
      }
    });
  }

  /** Submit an impulse at a world-space point; ordered before later graph submissions. */
  applyImpulse(body: number, impulse: Vector3, point: Vector3): void {
    if (
      !this.control ||
      !this.device ||
      !this.controlSettings ||
      this.destroyed ||
      !Number.isInteger(body) ||
      body < 0 ||
      body >= this.count ||
      ![...impulse, ...point].every(Number.isFinite)
    )
      throw new Error('Invalid rigid-body impulse');
    const data = new ArrayBuffer(64);
    new Float32Array(data).set([...impulse, 0, ...point, 0]);
    new Uint32Array(data)[12] = body;
    this.controlSettings.write(new Uint8Array(data));
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.control.dispatch(pass, 1);
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
    pass.end();
    this.device.submit(encoder.finish());
  }

  /**
   * Clear persistence after direct state writes. Bodies participating in a mesh separation
   * proof have their COM (and static orientation) restored to their immutable anchor next step.
   */
  wake(): void {
    if (this.destroyed) return;
    this.sleepStates?.write(new Float32Array(this.count * 4));
    this.manifolds?.write(new Uint8Array(this.maximumPairs * 288));
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

  /** Optional diagnostics readback; never required to advance simulation. */
  async readCollisionDiagnostics(): Promise<{
    unresolvedQueries: number;
    triangleQueries: number;
    droppedTriangleQueries: number;
    droppedManifolds: number;
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
      droppedManifolds,
      broadPhase
    };
  }

  /** Destroy the compiled graph and finish readbacks before destroying its world. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.control?.destroy();
    for (const buffer of this.ownedBuffers) buffer.destroy();
    this.ownedBuffers.length = 0;
  }
}
