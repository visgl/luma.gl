// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type ShaderLayout, type Binding, type BindingDeclaration} from '@luma.gl/core';
import type {GPUCommandGraph, GraphBufferUse} from '../gpu-core/gpu-command-graph';
import type {GPUCommandGraphComputeExecutable} from '../gpu-core/gpu-command-graph-types';
import {
  createBoundKernel,
  createBoundKernelAsync,
  type BoundKernel
} from '../gpu-core/utils/bound-kernel';
import {getArticulationTreeShader} from './articulation-tree-shader';

type Vector = readonly [number, number, number];
/** Link origins are centers of mass. Both anchor offsets use their respective local frames. */
export type GPUArticulationLink = {
  id: string;
  /** Parent link index, or -1 for the fixed base. Parents precede children. */
  parent: number;
  parentAnchor: Vector;
  childAnchor: Vector;
  /** Unit revolute axis in the parent frame. Omit for a welded attachment. */
  axis?: Vector;
  /** Child-to-parent orientation at zero angle. */
  restOrientation?: readonly [number, number, number, number];
  mass: number;
  /** Principal moments about the COM in the child frame. */
  inertia: Vector;
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
  private readonly publishMatrices: boolean;
  /** Column-major world transforms in link order, available after registration with publishMatrices. */
  get poseMatrices() {
    return this.buffers[6] ?? null;
  }
  private destroyed = false;

  constructor(props: {
    id?: string;
    links: readonly GPUArticulationLink[];
    base?: Vector;
    gravity?: Vector;
    timeStep?: number;
    contact?: GPUArticulationContact;
    publishMatrices?: boolean;
  }) {
    this.id = props.id ?? 'articulation-tree';
    this.timeStep = props.timeStep ?? 1 / 120;
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
  addToGraph<P>(graph: GPUCommandGraph<P>) {
    if (this.destroyed || this.buffers.length)
      throw new Error('Inactive or already registered articulation');
    const names = ['links', 'drives', 'coordinates', 'poses', 'counters', 'settings'];
    const data = [
      new Float32Array(
        this.links.flatMap(link => [
          ...link.parentAnchor,
          link.parent,
          ...link.childAnchor,
          0,
          ...(link.axis ?? [0, 0, 0]),
          link.mass,
          ...link.inertia,
          0,
          ...(link.restOrientation ?? [0, 0, 0, 1])
        ])
      ),
      new Float32Array(this.links.length * 4),
      new Float32Array(this.links.flatMap(link => [link.angle ?? 0, link.speed ?? 0, 0, 0])),
      new Float32Array(this.links.length * 16),
      new Uint32Array(4),
      new Float32Array([
        ...this.base,
        0,
        ...this.gravity,
        this.timeStep,
        ...(this.contact?.center ?? [0, 0, 0]),
        this.contact?.radius ?? 0,
        ...(this.contact?.halfExtents ?? [0, 0, 0]),
        this.contact ? this.indices.get(this.contact.link)! : 0
      ])
    ];
    if (this.publishMatrices) {
      names.push('matrices');
      data.push(new Float32Array(this.links.length * 16));
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
          this.publishMatrices
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

  private driveIndex(id: string) {
    const index = this.indices.get(id);
    if (this.destroyed || !this.buffers.length || index === undefined || !this.links[index].axis)
      throw new Error('Inactive or missing revolute drive');
    return index;
  }

  /** Update the named revolute drive between submitted steps. */
  setDrive(id: string, drive: GPUArticulationDrive) {
    const index = this.driveIndex(id);
    const values = new Float32Array([
      drive.angle,
      drive.stiffness,
      drive.damping,
      drive.maximumTorque
    ]);
    if (!values.every(Number.isFinite) || values.slice(1).some(value => value < 0))
      throw new Error('Invalid articulation drive');
    this.buffers[1].write(values, index * 16);
  }

  /** Signed motor torque during the most recently accepted step. */
  async readTorque(id: string) {
    const index = this.driveIndex(id);
    const bytes = await this.buffers[2].readAsync(index * 16 + 8, 4);
    return new DataView(bytes.buffer, bytes.byteOffset, 4).getFloat32(0, true);
  }

  /** Read COM poses and world-space velocities in link order after stepping. */
  async readState() {
    const bytes = await this.buffers[3].readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    return this.links.map((_, index) => {
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
    const values = new Uint32Array(bytes.buffer, bytes.byteOffset, 2);
    return {
      steps: values[0],
      complete: values[1] === 0,
      ...(this.contact
        ? {normalForce: new DataView(bytes.buffer, bytes.byteOffset).getFloat32(8, true)}
        : {})
    };
  }
  destroy() {
    this.destroyed = true;
    for (const buffer of this.buffers) buffer.destroy();
    this.buffers.length = 0;
  }
}
