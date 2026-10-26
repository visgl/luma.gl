// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type ComputePass} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {SCIENTIFIC_FLOW_SAMPLING} from './scientific-flow-sampling-shaders';
import type {ScientificFlowField} from './scientific-flow-field';

const WGSL = /* wgsl */ `
struct Parameters {
  domain: vec4<f32>,
  simulation: vec4<f32>,
  counters: vec4<u32>,
  temporal: vec4<f32>
};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read> previous: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> next: array<vec4<f32>>;
@group(0) @binding(3) var velocityField: texture_2d<f32>;
@group(0) @binding(4) var nextVelocityField: texture_2d<f32>;

${SCIENTIFIC_FLOW_SAMPLING}
fn hash(x: u32) -> f32 {
  var value = x;
  value = (value ^ (value >> 16u)) * 2246822519u;
  value = (value ^ (value >> 13u)) * 3266489917u;
  return f32((value ^ (value >> 16u)) >> 8u) / 16777216.0;
}
fn advect(initial: vec4<f32>, particleIndex: u32, substep: u32) -> vec4<f32> {
  var particle = initial;
  // Interpolate between batch endpoints so the final stage lands exactly on its snapshot.
  let fraction = mix(parameters.temporal.x, parameters.temporal.y, f32(substep) / parameters.temporal.z);
  let middleFraction = mix(parameters.temporal.x, parameters.temporal.y, (f32(substep) + 0.5) / parameters.temporal.z);
  let endFraction = mix(parameters.temporal.x, parameters.temporal.y, f32(substep + 1u) / parameters.temporal.z);
  let deltaTime = parameters.simulation.x;
  let first = velocity(particle.xy, fraction);
  let midpoint = particle.xy + first.xy * (deltaTime * 0.5);
  let middle = velocity(midpoint, middleFraction);
  var destination = particle.xy + middle.xy * deltaTime;
  var stagesValid = middle.z;
  if (parameters.simulation.z > 0.5) {
    let third = velocity(particle.xy + middle.xy * (deltaTime * 0.5), middleFraction);
    let fourth = velocity(particle.xy + third.xy * deltaTime, endFraction);
    destination = particle.xy + (first.xy + 2.0 * middle.xy + 2.0 * third.xy + fourth.xy) * (deltaTime / 6.0);
    stagesValid = min(stagesValid, min(third.z, fourth.z));
  }
  let last = velocity(destination, endFraction);
  if (particle.z < 0.0 || particle.z + deltaTime >= parameters.simulation.y ||
      first.z < 0.5 || stagesValid < 0.5 || last.z < 0.5) {
    let seed = particleIndex * 747796405u + parameters.counters.z * 2891336453u + parameters.counters.w + substep;
    let location = vec2<f32>(hash(seed), hash(seed + 1013904223u));
    let valid = velocity(location, endFraction).z > 0.5;
    particle = vec4<f32>(location, select(-1.0, select(0.0, hash(seed + 1664525u) * parameters.simulation.y, particle.w == 0.0), valid), (particle.w + 1.0) % 65536.0);
  } else {
    particle = vec4<f32>(wrapPosition(destination), particle.z + deltaTime, particle.w);
  }
  return particle;
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let particleIndex = invocation.x;
  if (particleIndex >= parameters.counters.x) {return;}
  var particle = previous[particleIndex];
  for (var substep = 0u; substep < u32(parameters.temporal.z); substep++) {
    particle = advect(particle, particleIndex, substep);
  }
  next[particleIndex] = particle;
}
`;

export class ScientificFlowCompute {
  readonly particleCount: number;
  readonly state: readonly [Buffer, Buffer];
  readonly uniforms: Buffer;
  readonly kernel: Kernel;
  private current = 0;
  private frame = 0;
  private readonly device: Device;
  private field: ScientificFlowField;
  private nextField: ScientificFlowField;
  private timeRange: readonly [number, number] | undefined;
  private elapsedTime = 0;
  private timeCompensation = 0;
  private readonly lifetime: number;
  private readonly seed: number;
  readonly integrator: 'rk2' | 'rk4';
  constructor(
    device: Device,
    field: ScientificFlowField,
    options: {
      particleCount: number;
      lifetime: number;
      seed: number;
      integrator?: 'rk2' | 'rk4';
    }
  ) {
    if (device.type !== 'webgpu') throw new Error('ScientificFlowCompute requires WebGPU');
    this.device = device;
    this.field = field;
    this.nextField = field;
    this.particleCount = options.particleCount;
    this.lifetime = options.lifetime;
    this.seed = options.seed;
    this.integrator = options.integrator ?? 'rk4';
    if (
      !Number.isSafeInteger(this.particleCount) ||
      this.particleCount < 1 ||
      this.particleCount > 1048576 ||
      !Number.isFinite(this.lifetime) ||
      this.lifetime <= 0 ||
      !Number.isInteger(this.seed) ||
      this.seed < 0 ||
      this.seed > 0xffffffff
    )
      throw new Error('Invalid flow parameters');
    const initial = new Float32Array(this.particleCount * 4);
    for (let index = 0; index < this.particleCount; index++) initial[4 * index + 2] = -1;
    const createState = (index: number) =>
      device.createBuffer({
        id: 'scientific-flow-state-' + index,
        byteLength: initial.byteLength,
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        data: initial
      });
    this.state = [createState(0), createState(1)];
    this.uniforms = device.createBuffer({
      id: 'scientific-flow-parameters',
      byteLength: 64,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.kernel = new Kernel(device, {
      id: 'scientific-flow-advection',
      source: WGSL,
      shaderLayout: {
        bindings: [
          {name: 'parameters', type: 'uniform', group: 0, location: 0},
          {name: 'previous', type: 'read-only-storage', group: 0, location: 1},
          {name: 'next', type: 'storage', group: 0, location: 2},
          {
            name: 'velocityField',
            type: 'texture',
            group: 0,
            location: 3,
            sampleType: 'unfilterable-float'
          },
          {
            name: 'nextVelocityField',
            type: 'texture',
            group: 0,
            location: 4,
            sampleType: 'unfilterable-float'
          }
        ]
      }
    });
  }
  /** Bind a collocated timestamp pair. The graph owns and validates these fields. */
  setTimeInterval(
    field: ScientificFlowField,
    nextField: ScientificFlowField,
    timeRange: readonly [number, number]
  ): void {
    if (
      !timeRange.every(Number.isFinite) ||
      timeRange[1] <= timeRange[0] ||
      field.texture.width !== nextField.texture.width ||
      field.texture.height !== nextField.texture.height ||
      field.field.coordinates !== nextField.field.coordinates ||
      field.periodicLongitude !== nextField.periodicLongitude ||
      !field.field.bounds.every((value, index) => value === nextField.field.bounds[index]) ||
      (this.timeRange && (timeRange[0] !== this.time || this.remainingTime !== 0))
    ) {
      throw new Error('Invalid scientific flow interval');
    }
    if (!this.timeRange && this.frame > 0) throw new Error('Initialize time before stepping');
    this.field = field;
    this.nextField = nextField;
    this.timeRange = [timeRange[0], timeRange[1]];
    this.elapsedTime = 0;
    this.timeCompensation = 0;
  }

  get time(): number {
    return (this.timeRange?.[0] ?? 0) + this.elapsedTime;
  }

  /** Seconds to the next snapshot; infinity for steady fields. Avoid epoch subtraction. */
  get remainingTime(): number {
    return this.timeRange ? this.timeRange[1] - this.timeRange[0] - this.elapsedTime : Infinity;
  }

  /** Half-cell travel bound for either snapshot, also capped at 1/30 second. */
  get maximumTimeStep(): number {
    return Math.min(
      1 / 30,
      0.5 / Math.max(this.field.maximumCellSpeed, this.nextField.maximumCellSpeed)
    );
  }

  validateStep(deltaTime: number, substeps = 1): void {
    const endTime = this.elapsedTime + deltaTime * substeps;
    if (
      !Number.isFinite(deltaTime) ||
      deltaTime < 0 ||
      deltaTime > 1 / 30 ||
      !Number.isInteger(substeps) ||
      substeps < 1 ||
      substeps > 4096 ||
      !Number.isFinite(endTime) ||
      (this.timeRange && endTime > (this.timeRange[1] - this.timeRange[0]) * (1 + 1e-12))
    ) {
      throw new Error('ScientificFlowCompute requires a bounded timestep within its interval');
    }
  }

  /** Substeps execute in one dispatch with immutable parameters. Submit before recording again. */
  encode(pass: ComputePass, deltaTime: number, substeps = 1): void {
    this.validateStep(deltaTime, substeps);
    const [west, south, east, north] = this.field.field.bounds;
    const bytes = new ArrayBuffer(64);
    const view = new DataView(bytes);
    [
      west,
      south,
      east - west,
      north - south,
      deltaTime,
      this.lifetime,
      this.integrator === 'rk4' ? 1 : 0,
      0
    ].forEach((value, index) => view.setFloat32(index * 4, value, true));
    [
      this.particleCount,
      (this.field.field.coordinates === 'lnglat' ? 1 : 0) | (this.field.periodicLongitude ? 2 : 0),
      this.seed,
      this.frame
    ].forEach((value, index) => view.setUint32(32 + index * 4, value, true));
    const duration = this.timeRange ? this.timeRange[1] - this.timeRange[0] : 1;
    [
      this.timeRange ? this.elapsedTime / duration : 0,
      this.timeRange ? Math.min(1, (this.elapsedTime + deltaTime * substeps) / duration) : 0,
      substeps,
      0
    ].forEach((value, index) => view.setFloat32(48 + index * 4, value, true));
    this.uniforms.write(new Uint8Array(bytes));
    this.kernel.dispatch(pass, {
      x: Math.ceil(this.particleCount / 128),
      bindings: {
        parameters: this.uniforms,
        previous: this.state[this.current],
        next: this.state[1 - this.current],
        velocityField: this.field.texture,
        nextVelocityField: this.nextField.texture
      }
    });
    this.current = 1 - this.current;
    this.frame = (this.frame + substeps) >>> 0;
    // Compensated, interval-relative accumulation avoids adding frame durations to an epoch.
    const increment = deltaTime * substeps - this.timeCompensation;
    const endTime = this.elapsedTime + increment;
    this.timeCompensation = endTime - this.elapsedTime - increment;
    this.elapsedTime = endTime;
    if (this.timeRange && Math.abs(this.elapsedTime - duration) <= 1e-12 * duration) {
      this.elapsedTime = duration;
      this.timeCompensation = 0;
    }
  }
  get output(): Buffer {
    return this.state[this.current];
  }
  get previous(): Buffer {
    return this.state[1 - this.current];
  }
  step(deltaTime: number): Buffer {
    this.validateStep(deltaTime);
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.encode(pass, deltaTime);
    pass.end();
    this.device.submit(encoder.finish());
    return this.output;
  }
  destroy(): void {
    this.kernel.destroy();
    this.uniforms.destroy();
    for (const buffer of this.state) buffer.destroy();
  }
}
