// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type ShaderLayout, type Binding, type BindingDeclaration} from '@luma.gl/core';
import type {
  GPUCommandGraph,
  GraphBufferUse,
  GraphBufferHandle
} from '../gpu-core/gpu-command-graph';
import type {GPUCommandGraphComputeExecutable} from '../gpu-core/gpu-command-graph-types';
import {
  createBoundKernel,
  createBoundKernelAsync,
  type BoundKernel
} from '../gpu-core/utils/bound-kernel';
import type {GPUArticulationCollider} from './articulation-world-contacts';
import {getArticulationTreeShader} from './articulation-tree-shader';

type Vector = readonly [number, number, number];
/** Link origins are centers of mass. Both anchor offsets use their respective local frames. */
export type GPUArticulationLink = {
  id: string;
  /** Parent link index, or -1 for the fixed base. Parents precede children. */
  parent: number;
  parentAnchor: Vector;
  childAnchor: Vector;
  /** A slider translates along its axis. The default is a revolute joint. */
  jointType?: 'revolute' | 'prismatic';
  /** Unit joint axis in the parent frame. Omit for a welded attachment. */
  axis?: Vector;
  /** Child-to-parent orientation at zero angle. */
  restOrientation?: readonly [number, number, number, number];
  mass: number;
  /** Principal moments about the COM in the child frame. */
  inertia: Vector;
  /** Initial joint coordinate in radians for a hinge or meters for a slider. */
  angle?: number;
  speed?: number;
};

/** Position control in radians, N·m/rad, N·m·s/rad and N·m respectively. */
export type GPUArticulationDrive = {
  angle: number;
  stiffness: number;
  damping: number;
  maximumTorque: number;
};

/** Frictionless unilateral contact between a link-centered sphere and a static world-space box. */
export type GPUArticulationContact = {
  link: string;
  radius: number;
  center: Vector;
  halfExtents: Vector;
};

/** One unconstrained rigid box with two spherical link contacts and a horizontal support. */
export type GPUArticulationPayload = {
  position: Vector;
  halfExtents: Vector;
  mass: number;
  pads: readonly [{link: string; radius: number}, {link: string; radius: number}];
  friction: number;
  supportHeight: number;
  supportFriction: number;
};

/** Small fixed-base trees. The graph owns the kernel and the tree owns the buffers. */
export class GPUArticulationTree {
  readonly timeStep: number;
  readonly id: string;
  private readonly links: GPUArticulationLink[];
  private readonly indices = new Map<string, number>();
  private readonly buffers: Buffer[] = [];
  private readonly base: Vector;
  private readonly gravity: Vector;
  private readonly contact?: GPUArticulationContact;
  private readonly payload?: GPUArticulationPayload;
  private readonly publishMatrices: boolean;
  /** Column-major world transforms in link order followed by the optional free payload, available after registration with publishMatrices. */
  get poseMatrices() {
    return this.buffers[6] ?? null;
  }
  private initialState?: () => void;
  private worldContacts = false;
  private destroyed = false;

  constructor(props: {
    id?: string;
    links: readonly GPUArticulationLink[];
    base?: Vector;
    gravity?: Vector;
    timeStep?: number;
    contact?: GPUArticulationContact;
    payload?: GPUArticulationPayload;
    publishMatrices?: boolean;
  }) {
    this.id = props.id ?? 'articulation-tree';
    this.timeStep = props.timeStep ?? 1 / 120;
    this.payload = structuredClone(props.payload);
    this.contact = structuredClone(props.contact);
    this.publishMatrices = Boolean(props.publishMatrices);
    this.links = structuredClone([...props.links]);
    this.base = [...(props.base ?? [0, 0, 0])];
    this.gravity = [...(props.gravity ?? [0, 0, -9.81])];
    const finite = (x: number) => Number.isFinite(Math.fround(x));
    if (
      !this.links.length ||
      this.links.length > 16 ||
      !finite(this.timeStep) ||
      Math.fround(this.timeStep) <= 0 ||
      ![...this.base, ...this.gravity].every(finite)
    )
      throw new Error('Invalid articulation settings');
    for (const [index, link] of this.links.entries()) {
      if (
        !link.id ||
        (link.jointType === 'prismatic' && !link.axis) ||
        this.indices.has(link.id) ||
        !Number.isInteger(link.parent) ||
        link.parent < -1 ||
        link.parent >= index ||
        !finite(link.mass) ||
        Math.fround(link.mass) <= 0 ||
        !link.inertia.every(value => finite(value) && Math.fround(value) > 0) ||
        ![...link.parentAnchor, ...link.childAnchor, link.angle ?? 0, link.speed ?? 0].every(
          finite
        ) ||
        (link.axis
          ? !(Math.abs(Math.hypot(...link.axis) - 1) < 1e-6)
          : Boolean(link.angle || link.speed)) ||
        (link.restOrientation && !(Math.abs(Math.hypot(...link.restOrientation) - 1) < 1e-6))
      )
        throw new Error('Invalid articulation link');
      this.indices.set(link.id, index);
    }
    const payload = this.payload;
    if (
      payload &&
      (payload.pads.length !== 2 ||
        payload.pads[0].link === payload.pads[1].link ||
        !payload.pads.every(pad => this.indices.has(pad.link)) ||
        ![...payload.position, payload.supportHeight].every(finite) ||
        ![payload.mass, ...payload.halfExtents, ...payload.pads.map(pad => pad.radius)].every(
          value => finite(value) && Math.fround(value) > 0
        ) ||
        ![payload.friction, payload.supportFriction].every(value => finite(value) && value >= 0))
    )
      throw new Error('Invalid articulation payload');
    const contact = this.contact;
    if (
      contact &&
      (!this.indices.has(contact.link) ||
        !contact.center.every(finite) ||
        ![contact.radius, ...contact.halfExtents].every(
          value => finite(value) && Math.fround(value) > 0
        ))
    )
      throw new Error('Invalid articulation contact');
  }

  /** Register one simulation step. The output pose buffer uses four vec4s per link: COM, quaternion, velocity, spin. */
  addToGraph<P>(
    graph: GPUCommandGraph<P>,
    coupling?: {
      boxes: GraphBufferHandle;
      count: number;
      pads?: GPUArticulationPayload['pads'];
      colliders?: readonly GPUArticulationCollider[];
      friction: number;
    }
  ) {
    const colliders = coupling?.colliders;
    const packedColliders = colliders?.flatMap(
      ({link, shape, position = [0, 0, 0], orientation = [0, 0, 0, 1]}) => {
        const dimensions =
          shape.type === 'box'
            ? [...shape.halfExtents]
            : shape.type === 'capsule'
              ? [shape.radiusTop, shape.height / 2, 0]
              : [shape.radius, 0, 0];
        if (
          !this.indices.has(link) ||
          (shape.type === 'capsule' && shape.radiusTop !== shape.radiusBottom) ||
          ![...position, ...orientation, ...dimensions].every(Number.isFinite) ||
          Math.abs(Math.hypot(...orientation) - 1) > 1e-5 ||
          dimensions[0] <= 0 ||
          dimensions[1] < 0 ||
          (shape.type === 'box' && (dimensions[1] <= 0 || dimensions[2] <= 0))
        )
          throw new Error('Invalid link collider');
        return [
          ...position,
          this.indices.get(link)!,
          ...orientation,
          ...dimensions,
          shape.type === 'sphere' ? 0 : shape.type === 'capsule' ? 1 : 2
        ];
      }
    );
    if (
      coupling &&
      (this.payload ||
        this.contact ||
        (colliders
          ? colliders.length === 0 || colliders.length > 16
          : !coupling.pads ||
            coupling.pads.length !== 2 ||
            coupling.pads[0].link === coupling.pads[1].link) ||
        !Number.isFinite(coupling.friction) ||
        coupling.friction < 0 ||
        coupling.pads?.some(
          pad => !this.indices.has(pad.link) || !Number.isFinite(pad.radius) || pad.radius <= 0
        ))
    )
      throw new Error('Invalid world contact pads');
    if (this.destroyed || this.buffers.length)
      throw new Error('Inactive or already registered articulation');
    const names = ['links', 'drives', 'coordinates', 'poses', 'counters', 'settings'];
    const poseCount = this.links.length + Number(Boolean(this.payload));
    const poses = new Float32Array(poseCount * 16);
    if (this.payload) poses.set([...this.payload.position, 1, 0, 0, 0, 1], this.links.length * 16);
    const data = [
      new Float32Array(
        this.links.flatMap(link => [
          ...link.parentAnchor,
          link.parent,
          ...link.childAnchor,
          Number(link.jointType === 'prismatic'),
          ...(link.axis ?? [0, 0, 0]),
          link.mass,
          ...link.inertia,
          0,
          ...(link.restOrientation ?? [0, 0, 0, 1])
        ])
      ),
      new Float32Array(this.links.length * 4),
      new Float32Array(this.links.flatMap(link => [link.angle ?? 0, link.speed ?? 0, 0, 0])),
      poses,
      new Uint32Array(colliders ? 8 + 24 * 12 : 4),
      new Float32Array([
        ...this.base,
        0,
        ...this.gravity,
        this.timeStep,
        ...(this.contact?.center ?? [0, 0, 0]),
        this.contact?.radius ?? 0,
        ...(this.contact?.halfExtents ?? [0, 0, 0]),
        this.contact ? this.indices.get(this.contact.link)! : 0,
        ...(this.payload
          ? [
              ...this.payload.halfExtents,
              this.payload.mass,
              this.payload.supportHeight,
              this.payload.friction,
              this.payload.supportFriction,
              0,
              ...this.payload.pads.flatMap(pad => [this.indices.get(pad.link)!, pad.radius, 0, 0])
            ]
          : coupling
            ? [
                0,
                0,
                0,
                0,
                0,
                coupling.friction,
                0,
                0,
                ...(packedColliders ??
                  coupling.pads!.flatMap(pad => [this.indices.get(pad.link)!, pad.radius, 0, 0]))
              ]
            : [])
      ])
    ];
    if (this.publishMatrices) {
      names.push('matrices');
      data.push(new Float32Array(poseCount * 16));
    }
    try {
      const handles = data.map((values, index) => {
        const usage =
          (index === 5 ? Buffer.UNIFORM : Buffer.STORAGE) | Buffer.COPY_SRC | Buffer.COPY_DST;
        const buffer = graph.device.createBuffer({
          id: this.id + '-' + names[index],
          data: values,
          usage
        });
        this.buffers.push(buffer);
        return graph.importBuffer({id: buffer.id, byteLength: buffer.byteLength, usage}, buffer);
      });
      this.initialState = () => {
        for (const index of [1, 2, 3, 4]) this.buffers[index].write(data[index]);
        if (this.publishMatrices) this.buffers[6].write(data[6]);
      };
      if (coupling) {
        this.worldContacts = true;
        names.push('boxes');
        handles.push(coupling.boxes);
      }
      const resources: GraphBufferUse[] = handles.map((buffer, index) => ({
        buffer,
        usage: index === 5 ? 'uniform' : index < 2 ? 'storage-read' : 'storage-read-write'
      }));
      const shaderLayout: ShaderLayout = {
        attributes: [],
        bindings: names.map(
          (name, location): BindingDeclaration =>
            location === 5
              ? {name, location, group: 0, type: 'uniform'}
              : {name, location, group: 0, type: location < 2 ? 'read-only-storage' : 'storage'}
        )
      };
      const props = {
        source: getArticulationTreeShader(
          this.links.length,
          Boolean(this.contact),
          this.publishMatrices,
          Boolean(this.payload),
          coupling?.count ?? 0,
          colliders?.length ?? 0,
          this.links.some(link => link.jointType === 'prismatic')
        ),
        shaderLayout
      };
      const executable = (bound: BoundKernel): GPUCommandGraphComputeExecutable<P> => ({
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          names.forEach((name, index) => {
            bindings[name] = getBuffer(handles[index]);
          });
          bound.kernel.dispatch(computePass, {bindings, x: 1});
        },
        destroy: () => bound.kernel.destroy()
      });
      graph.addComputePass({
        id: handles[0].id + '-joint-space',
        description: 'Integrate joint-space dynamics and publish articulated link poses.',
        resources,
        compile: ({device}) => executable(createBoundKernel(device, props)),
        compileAsync: async ({device}) => executable(await createBoundKernelAsync(device, props))
      });
      return handles[3];
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  /** Restore initial drives, joint coordinates, payload and diagnostics between steps. */
  reset(): void {
    if (!this.initialState) throw new Error('Inactive articulation');
    this.initialState();
  }

  private driveIndex(id: string, kind: 'revolute' | 'prismatic' = 'revolute') {
    const index = this.indices.get(id);
    if (this.destroyed || !this.buffers.length || index === undefined || !this.links[index].axis)
      throw new Error('Inactive or missing joint drive');
    if ((this.links[index].jointType ?? 'revolute') !== kind)
      throw new Error('Unexpected joint type');
    return index;
  }

  /** Update the named revolute drive between submitted steps. */
  setDrive(id: string, drive: GPUArticulationDrive) {
    const index = this.driveIndex(id);
    this.writeDrive(index, drive.angle, drive.stiffness, drive.damping, drive.maximumTorque);
  }

  /** Drive a slider in meters with a spring in N/m, damping in N·s/m and a force limit in newtons. */
  setLinearDrive(
    id: string,
    drive: {position: number; stiffness: number; damping: number; maximumForce: number}
  ) {
    const index = this.driveIndex(id, 'prismatic');
    this.writeDrive(index, drive.position, drive.stiffness, drive.damping, drive.maximumForce);
  }

  private writeDrive(
    index: number,
    target: number,
    stiffness: number,
    damping: number,
    maximum: number
  ) {
    const values = new Float32Array([target, stiffness, damping, maximum]);
    if (!values.every(Number.isFinite) || values.slice(1).some(value => value < 0))
      throw new Error('Invalid articulation drive');
    this.buffers[1].write(values, index * 16);
  }

  /** Signed motor torque during the most recently accepted step. */
  async readTorque(id: string) {
    return this.readEffort(this.driveIndex(id));
  }

  /** Signed slider motor force in newtons during the most recently accepted step. */
  async readForce(id: string) {
    return this.readEffort(this.driveIndex(id, 'prismatic'));
  }

  private async readEffort(index: number) {
    const bytes = await this.buffers[2].readAsync(index * 16 + 8, 4);
    return new DataView(bytes.buffer, bytes.byteOffset, 4).getFloat32(0, true);
  }

  /** Read COM poses and world-space velocities in link order followed by the optional free payload after stepping. */
  async readState() {
    const bytes = await this.buffers[3].readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    return Array.from({length: values.length / 16}, (_, index) => {
      const start = index * 16;
      return {
        position: Array.from(values.subarray(start, start + 3)),
        orientation: Array.from(values.subarray(start + 4, start + 8)),
        velocity: Array.from(values.subarray(start + 8, start + 11)),
        angularVelocity: Array.from(values.subarray(start + 12, start + 15))
      };
    });
  }
  /** Numerical failure latches and preserves the last accepted state. */
  async readSimulationDiagnostics() {
    const bytes = await this.buffers[4].readAsync();
    const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    return {
      steps: values[0],
      complete: values[1] === 0,
      ...(values.length > 4
        ? {
            candidatePairs: values[4],
            activeContacts: values[5],
            contactPairs: Array.from({length: values[5]}, (_, index) => ({
              body: values[8 + index * 12],
              collider: values[9 + index * 12]
            })),
            contactOverflow: values[6] !== 0,
            reusedContacts: values[7]
          }
        : {}),
      ...(this.worldContacts ? {padContactMasks: [values[2], values[3]]} : {}),
      ...(this.contact
        ? {normalForce: new DataView(bytes.buffer, bytes.byteOffset).getFloat32(8, true)}
        : {})
    };
  }
  destroy() {
    this.initialState = undefined;
    this.destroyed = true;
    for (const buffer of this.buffers) buffer.destroy();
    this.buffers.length = 0;
  }
}
