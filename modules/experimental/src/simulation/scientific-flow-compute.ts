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
  let dims = vec2<i32>(textureDimensions(velocityField));
  let grid = position * vec2<f32>(dims - vec2<i32>(1));
  let low = vec2<i32>(floor(grid));
  let high = min(low + vec2<i32>(1), dims - vec2<i32>(1));
  let fraction = fract(grid);
  let a = textureLoad(velocityField, low, 0);
  let b = textureLoad(velocityField, vec2<i32>(high.x, low.y), 0);
  let c = textureLoad(velocityField, vec2<i32>(low.x, high.y), 0);
  let d = textureLoad(velocityField, high, 0);
  if (min(min(a.z, b.z), min(c.z, d.z)) < 0.5) {return vec3<f32>(0.0);}
  let uv = mix(mix(a.xy, b.xy, fraction.x), mix(c.xy, d.xy, fraction.x), fraction.y);
  if (parameters.counters.y == 1u) {
    let latitude = parameters.domain.y + parameters.domain.w * position.y;
    uv = uv / (111195.08 * vec2<f32>(cos(radians(latitude)), 1.0));
  }
  return vec3<f32>(uv / parameters.domain.zw, 1.0);
}
fn hash(x: u32) -> f32 {
  var v = x;
  v = (v ^ (v >> 16u)) * 2246822519u;
  v = (v ^ (v >> 13u)) * 3266489917u;
  return f32((v ^ (v >> 16u)) >> 8u) / 16777216.0;
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let id = invocation.x;
  if (id >= parameters.counters.x) {return;}
  var p = previous[id];
  let dt = parameters.simulation.x;
  let first = velocity(p.xy);
  let midpoint = p.xy + first.xy * (dt * 0.5);
  let middle = velocity(midpoint);
  let destination = p.xy + middle.xy * dt;
  let last = velocity(destination);
  if (p.z < 0.0 || p.z + dt >= parameters.simulation.y ||
      first.z < 0.5 || middle.z < 0.5 || last.z < 0.5) {
    let seed = id * 747796405u + parameters.counters.z * 2891336453u + parameters.counters.w;
    let location = vec2<f32>(hash(seed), hash(seed + 1013904223u));
    let valid = velocity(location).z > 0.5;
    p = vec4<f32>(location, select(-1.0, 0.0, valid), (p.w + 1.0) % 65536.0);
  } else {
    p = vec4<f32>(destination, p.z + dt, p.w);
  }
  next[id] = p;
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
  constructor(device: Device, field: ScientificFlowField, options: {
    particleCount: number; lifetime: number; seed: number;
  }) {
    if (device.type !== 'webgpu') throw new Error('ScientificFlowCompute requires WebGPU');
    this.device = device;
    this.field = field;
    this.particleCount = options.particleCount;
    this.lifetime = options.lifetime;
    this.seed = options.seed;
    if (!Number.isSafeInteger(this.particleCount) || this.particleCount < 1 ||
      this.particleCount > 1048576 || !Number.isFinite(this.lifetime) || this.lifetime <= 0 ||
      !Number.isInteger(this.seed) || this.seed < 0) throw new Error('Invalid flow parameters');
    const initial = new Float32Array(this.particleCount * 4);
    for (let i = 0; i < this.particleCount; i++) initial[4 * i + 2] = -1;
    this.state = [0, 1].map(index => device.createBuffer({
      id: 'scientific-flow-state-' + index,
      byteLength: initial.byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: initial
    })) as [Buffer, Buffer];
    this.uniforms = device.createBuffer({
      id: 'scientific-flow-parameters', byteLength: 48,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.kernel = new Kernel(device, {
      id: 'scientific-flow-advection',
      source: WGSL,
      shaderLayout: {bindings: [
        {name: 'parameters', type: 'uniform', group: 0, location: 0},
        {name: 'previous', type: 'storage', group: 0, location: 1},
        {name: 'next', type: 'storage', group: 0, location: 2},
        {name: 'velocityField', type: 'texture', group: 0, location: 3,
          sampleType: 'unfilterable-float'}
      ]}
    });
  }
  /** Record into an existing compute pass; caller owns submission. */
  encode(pass: ComputePass, dt: number): void {
    if (!Number.isFinite(dt) || dt < 0 || dt > 1 / 30) {
      throw new Error('ScientificFlowCompute requires a bounded timestep');
    }
    const [west, south, east, north] = this.field.field.bounds;
    const bytes = new ArrayBuffer(48);
    const view = new DataView(bytes);
    [west, south, east - west, north - south, dt, this.lifetime, 0, 0]
      .forEach((value, i) => view.setFloat32(i * 4, value, true));
    [this.particleCount, this.field.field.coordinates === 'lnglat' ? 1 : 0,
      this.seed, this.frame].forEach((value, i) => view.setUint32(32 + i * 4, value, true));
    this.uniforms.write(new Uint8Array(bytes));
    this.kernel.dispatch(pass, {x: Math.ceil(this.particleCount / 128), bindings: {
      parameters: this.uniforms,
      previous: this.state[this.current],
      next: this.state[1 - this.current],
      velocityField: this.field.texture
    }});
    this.current = 1 - this.current;
    this.frame++;
  }
  get output(): Buffer {return this.state[this.current];}
  get previous(): Buffer {return this.state[1 - this.current];}
  step(dt: number): Buffer {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    this.encode(pass, dt);
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
