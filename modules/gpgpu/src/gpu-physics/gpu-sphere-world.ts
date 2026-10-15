// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {getViewBinding} from '../gpu-core/graph-data-view-utils';

/** Caller-owned GPU-resident sphere state: xyz position + radius; xyz velocity + inverse mass. */
export type GPUSphereWorldProps = {
  id?: string;
  count: number;
  positions: Buffer;
  velocities: Buffer;
  /** Fixed simulation step in seconds. Default 1/120. */
  timeStep?: number;
  /** Number of fixed steps encoded in one command graph. Default 1. */
  substeps?: number;
  gravity?: readonly [number, number, number];
  /** Static floor height. */
  floor?: number;
  /** Coefficient of restitution, 0..1. */
  restitution?: number;
  /** Tangential velocity retention after floor impact, 0..1. */
  friction?: number;
};

const WORKGROUP_SIZE = 256;

/**
 * GPU command-graph proof of concept: semi-implicit Euler sphere integration with
 * static-plane contact. No sphere-sphere collisions, rotation, joints or sleeping yet.
 *
 * Storage stays GPU-resident and may also be bound as vertex/instance data by the renderer.
 * Each substep is an ordered compute node. This is intentionally not a full rigid-body solver.
 */
export class GPUSphereWorld {
  readonly id: string;
  readonly count: number;
  readonly positions: Buffer;
  readonly velocities: Buffer;
  readonly timeStep: number;
  readonly substeps: number;
  readonly gravity: readonly [number, number, number];
  readonly floor: number;
  readonly restitution: number;
  readonly friction: number;

  constructor(props: GPUSphereWorldProps) {
    this.id = props.id ?? 'gpu-sphere-world';
    this.count = props.count;
    this.positions = props.positions;
    this.velocities = props.velocities;
    this.timeStep = props.timeStep ?? 1 / 120;
    this.substeps = props.substeps ?? 1;
    this.gravity = props.gravity ?? [0, 0, -9.81];
    this.floor = props.floor ?? 0;
    this.restitution = props.restitution ?? 0.45;
    this.friction = props.friction ?? 0.9;
    if (!Number.isSafeInteger(this.count) || this.count < 1) {
      throw new Error('GPUSphereWorld count must be a positive integer');
    }
    if (!Number.isSafeInteger(this.substeps) || this.substeps < 1 || this.substeps > 64) {
      throw new Error('GPUSphereWorld substeps must be between 1 and 64');
    }
    if (!(this.timeStep > 0) || !Number.isFinite(this.timeStep)) {
      throw new Error('GPUSphereWorld timeStep must be finite and positive');
    }
    if (
      ![...this.gravity, this.floor, this.restitution, this.friction].every(Number.isFinite) ||
      this.restitution < 0 ||
      this.restitution > 1 ||
      this.friction < 0 ||
      this.friction > 1
    ) {
      throw new Error(
        'GPUSphereWorld requires finite gravity and floor, and contact coefficients in [0,1]'
      );
    }
    if (this.positions === this.velocities) {
      throw new Error('GPUSphereWorld positions and velocities must not alias');
    }
    for (const buffer of [this.positions, this.velocities]) {
      if (buffer.byteLength < this.count * 16 || (buffer.usage & Buffer.STORAGE) === 0) {
        throw new Error('GPUSphereWorld requires STORAGE vec4f buffers with count * 16 bytes');
      }
    }
  }

  /** Declare synchronized fixed-timestep simulation passes; does not submit GPU work. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const limit = graph.device.limits.maxComputeWorkgroupsPerDimension;
    const workgroups = Math.ceil(this.count / WORKGROUP_SIZE);
    if (workgroups > limit) {
      throw new Error('GPUSphereWorld count exceeds single-dimension compute dispatch limit');
    }
    const positions = graph.createDataView(
      graph.importBuffer(
        {
          id: `${this.id}-positions`,
          byteLength: this.count * 16,
          usage: Buffer.STORAGE
        },
        this.positions
      ),
      {format: 'float32x4', length: this.count}
    );
    const velocities = graph.createDataView(
      graph.importBuffer(
        {
          id: `${this.id}-velocities`,
          byteLength: this.count * 16,
          usage: Buffer.STORAGE
        },
        this.velocities
      ),
      {format: 'float32x4', length: this.count}
    );
    const source = /* wgsl */ `
const COUNT: u32 = ${this.count}u;
const DT: f32 = ${this.timeStep};
const GRAVITY: vec3f = vec3f(${this.gravity.join(', ')});
const FLOOR: f32 = ${this.floor};
const RESTITUTION: f32 = ${this.restitution};
const FRICTION: f32 = ${this.friction};

@group(0) @binding(0) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> velocities: array<vec4f>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let i = invocation.x;
  if (i >= COUNT) { return; }
  var p = positions[i];
  var v = velocities[i];
  // Inverse mass zero marks a static body.
  if (v.w <= 0.0) { return; }
  v.xyz += GRAVITY * DT;
  p.xyz += v.xyz * DT;
  let minZ = FLOOR + max(p.w, 0.0);
  if (p.z < minZ) {
    p.z = minZ;
    if (v.z < 0.0) {
      v.z = -v.z * RESTITUTION;
      v.xy *= FRICTION;
    }
  }
  positions[i] = p;
  velocities[i] = v;
}`;
    for (let step = 0; step < this.substeps; step++) {
      const id = `${this.id}-integrate-${step}`;
      graph.addComputePass({
        id,
        resources: [
          {buffer: positions, usage: 'storage-read-write'},
          {buffer: velocities, usage: 'storage-read-write'}
        ],
        compile: ({device}) => {
          const computation = new Computation(device, {
            id,
            source,
            shaderLayout: {
              bindings: [
                {name: 'positions', type: 'storage', group: 0, location: 0},
                {name: 'velocities', type: 'storage', group: 0, location: 1}
              ]
            }
          });
          return {
            encode: ({computePass, getBuffer}) => {
              const bindings: Record<string, Binding> = {
                positions: getViewBinding(positions, getBuffer),
                velocities: getViewBinding(velocities, getBuffer)
              };
              computation.setBindings(bindings);
              computation.dispatch(computePass, workgroups, 1, 1);
            },
            destroy: () => computation.destroy()
          };
        }
      });
    }
  }
}
