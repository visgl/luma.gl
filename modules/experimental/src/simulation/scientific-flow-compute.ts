// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type ComputePass} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import type {ScientificFlowField} from './scientific-flow-field';

const WGSL = /* wgsl */ `
struct Parameters {
  domain: vec4<f32>,
  simulation: vec4<f32>,
  counters: vec4<u32>
};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read> previous: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> next: array<vec4<f32>>;
@group(0) @binding(3) var velocityField: texture_2d<f32>;

fn velocity(position: vec2<f32>) -> vec3<f32> {
  if (any(position < vec2<f32>(0.0)) || any(position > vec2<f32>(1.0))) {
    return vec3<f32>(0.0);
  }
  let dimensions = vec2<i32>(textureDimensions(velocityField));
  let grid = position * vec2<f32>(dimensions - vec2<i32>(1));
  let low = vec2<i32>(floor(grid));
  let high = min(low + vec2<i32>(1), dimensions - vec2<i32>(1));
  let fraction = fract(grid);
  let a = textureLoad(velocityField, low, 0);
  let b = textureLoad(velocityField, vec2<i32>(high.x, low.y), 0);
  let c = textureLoad(velocityField, vec2<i32>(low.x, high.y), 0);
  let d = textureLoad(velocityField, high, 0);
  if (min(min(a.z, b.z), min(c.z, d.z)) < 0.5) {return vec3<f32>(0.0);}
  var velocityComponents = mix(mix(a.xy, b.xy, fraction.x), mix(c.xy, d.xy, fraction.x), fraction.y);
  if (parameters.counters.y == 1u) {
    let latitude = parameters.domain.y + parameters.domain.w * position.y;
    velocityComponents = velocityComponents / (111195.08 * vec2<f32>(cos(radians(latitude)), 1.0));
  }
  return vec3<f32>(velocityComponents / parameters.domain.zw, 1.0);
}
fn hash(x: u32) -> f32 {
  var value = x;
  value = (value ^ (value >> 16u)) * 2246822519u;
  value = (value ^ (value >> 13u)) * 3266489917u;
  return f32((value ^ (value >> 16u)) >> 8u) / 16777216.0;
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let particleIndex = invocation.x;
  if (particleIndex >= parameters.counters.x) {return;}
  var particle = previous[particleIndex];
  let deltaTime = parameters.simulation.x;
  let first = velocity(particle.xy);
  let midpoint = particle.xy + first.xy * (deltaTime * 0.5);
  let middle = velocity(midpoint);
  var destination = particle.xy + middle.xy * deltaTime;
  var stagesValid = middle.z;
  if (parameters.simulation.z > 0.5) {
    let third = velocity(particle.xy + middle.xy * (deltaTime * 0.5));
    let fourth = velocity(particle.xy + third.xy * deltaTime);
    destination = particle.xy + (first.xy + 2.0 * middle.xy + 2.0 * third.xy + fourth.xy) * (deltaTime / 6.0);
    stagesValid = min(stagesValid, min(third.z, fourth.z));
  }
  let last = velocity(destination);
  if (particle.z < 0.0 || particle.z + deltaTime >= parameters.simulation.y ||
      first.z < 0.5 || stagesValid < 0.5 || last.z < 0.5) {
    let seed = particleIndex * 747796405u + parameters.counters.z * 2891336453u + parameters.counters.w;
    let location = vec2<f32>(hash(seed), hash(seed + 1013904223u));
    let valid = velocity(location).z > 0.5;
    particle = vec4<f32>(location, select(-1.0, select(0.0, hash(seed + 1664525u) * parameters.simulation.y, particle.w == 0.0), valid), (particle.w + 1.0) % 65536.0);
  } else {
    particle = vec4<f32>(destination, particle.z + deltaTime, particle.w);
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
  private readonly field: ScientificFlowField;
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
      byteLength: 48,
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
          }
        ]
      }
    });
  }
  /** Record into an existing compute pass; caller owns submission. */
  encode(pass: ComputePass, deltaTime: number): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0 || deltaTime > 1 / 30) {
      throw new Error('ScientificFlowCompute requires a bounded timestep');
    }
    const [west, south, east, north] = this.field.field.bounds;
    const bytes = new ArrayBuffer(48);
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
      this.field.field.coordinates === 'lnglat' ? 1 : 0,
      this.seed,
      this.frame
    ].forEach((value, index) => view.setUint32(32 + index * 4, value, true));
    this.uniforms.write(new Uint8Array(bytes));
    this.kernel.dispatch(pass, {
      x: Math.ceil(this.particleCount / 128),
      bindings: {
        parameters: this.uniforms,
        previous: this.state[this.current],
        next: this.state[1 - this.current],
        velocityField: this.field.texture
      }
    });
    this.current = 1 - this.current;
    this.frame++;
  }
  get output(): Buffer {
    return this.state[this.current];
  }
  get previous(): Buffer {
    return this.state[1 - this.current];
  }
  step(deltaTime: number): Buffer {
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
