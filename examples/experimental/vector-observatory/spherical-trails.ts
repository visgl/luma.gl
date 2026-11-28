// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {assert, Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {FlowTrajectoryHistory} from '@luma.gl/graph/experimental-simulation';

/** Camera-independent spherical ribbons, interpolated along short great-circle arcs. */
const SOURCE = /* wgsl */ `
struct Settings {viewport: vec4f, orbit: vec4f, history: vec4u, style: vec4f};
@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var<storage, read> frames: array<vec4f>;
const CORNERS = array<vec2f, 6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
struct Vertex {
  @builtin(position) position: vec4f,
  @location(0) depth: f32,
  @location(1) edge: f32,
  @location(2) opacity: f32,
  @location(3) color: vec3f
};
fn camera(position: vec3f) -> vec3f {
  let longitude = settings.orbit.x;
  let pitch = settings.orbit.y;
  let horizontal = position.y * cos(longitude) - position.x * sin(longitude);
  let forward = position.x * cos(longitude) + position.y * sin(longitude);
  return vec3f(horizontal, position.z * cos(pitch) - forward * sin(pitch),
    position.z * sin(pitch) + forward * cos(pitch));
}
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> Vertex {
  let selected = instance % settings.history.w;
  var seed = selected * 747796405u + 2891336453u;
  seed = ((seed >> ((seed >> 28u) + 4u)) ^ seed) * 277803737u;
  seed = (seed >> 22u) ^ seed;
  let stride = u32(settings.style.w);
  let particle = min(selected * stride + seed % stride, settings.history.x - 1u);
  let segment = instance / settings.history.w;
  let firstSlot = (settings.history.y + segment) % settings.history.z;
  let secondSlot = (firstSlot + 1u) % settings.history.z;
  let first = frames[firstSlot * settings.history.x + particle];
  let second = frames[secondSlot * settings.history.x + particle];
  let corner = CORNERS[vertex % 6u];
  let lower = f32(vertex / 6u) / 4.0;
  let upper = lower + 0.25;
  // Normalized linear interpolation stays on the short great circle; subdivision
  // avoids a straight screen-space chord and does not introduce a longitude seam.
  let start = camera(normalize(mix(first.xyz, second.xyz, lower)));
  let end = camera(normalize(mix(first.xyz, second.xyz, upper)));
  let center = mix(start, end, corner.x);
  let direction = end.xy - start.xy;
  let normal = vec2f(-direction.y, direction.x) / max(length(direction), 1e-8);
  let scale = min(settings.viewport.x, settings.viewport.y) * 0.82;
  var output: Vertex;
  output.position = vec4f(center.xy * scale / settings.viewport.xy + normal * corner.y * settings.viewport.z / settings.viewport.xy, 0, 1);
  output.depth = center.z;
  output.edge = corner.y;
  let age = settings.orbit.z - mix(first.w, second.w, mix(lower, upper, corner.x));
  output.opacity = exp(-3.0 * age / max(settings.orbit.w, 1e-6)) * settings.viewport.w;
  // Undefined antipodal arcs and stationary samples must not produce ribbons.
  if (dot(first.xyz, second.xyz) < 0.0 || length(direction) < 1e-8) {output.opacity = 0.0;}
  let speed = length(second.xyz - first.xyz) / max(second.w - first.w, 1e-6);
  let cold = mix(vec3f(0.05,0.16,0.42),vec3f(0.07,0.8,0.85),smoothstep(0.0,0.15,speed));
  output.color = mix(cold,vec3f(1.0,0.68,0.3),smoothstep(0.15,0.3,speed));
  return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  if (input.depth < 0.0) {discard;}
  return vec4f(input.color, clamp(input.opacity * (1.0 - abs(input.edge)), 0.0, 0.85));
}`;

/** Bounded GPU snapshots and a borrowed-buffer ribbon renderer; no particle readback. */
export class SphericalTrails {
  /** Owned ring of Cartesian xyz/age samples. */
  private readonly history: FlowTrajectoryHistory;
  /** Owned rendering model. */
  private readonly model: Model;
  /** Owned camera and ring metadata. */
  private readonly settings: Buffer;
  /** Stable subsampling stride limits rendering work without changing the simulation. */
  private readonly stride: number;
  /** Number of stable particle slots rendered. */
  private readonly renderedCount: number;

  /** Keep at most 24 snapshots and render at most 8192 stable particle slots. */
  constructor(
    private readonly device: Device,
    private readonly particleCount: number
  ) {
    assert(Number.isSafeInteger(particleCount) && particleCount > 0);
    this.stride = Math.ceil(particleCount / 8192);
    this.renderedCount = Math.ceil(particleCount / this.stride);
    this.history = new FlowTrajectoryHistory(device, {
      particleCount,
      capacity: Math.min(
        24,
        Math.floor(device.limits.maxStorageBufferBindingSize / (particleCount * 16))
      )
    });
    this.settings = device.createBuffer({byteLength: 64, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    this.model = new Model(device, {
      id: 'spherical-geodesic-trails',
      source: SOURCE,
      vertexCount: 24,
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'settings', type: 'uniform', group: 0, location: 0},
          {name: 'frames', type: 'read-only-storage', group: 0, location: 1, visibility: 1}
        ]
      },
      bindings: {settings: this.settings, frames: this.history.buffer},
      parameters: {
        blend: true,
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        depthWriteEnabled: false
      }
    });
  }

  /** Capture at a bounded cadence in simulation seconds, including the initial release. */
  capture(source: Buffer, time: number, duration: number): void {
    const last = this.history.frames.at(-1);
    if (last && time - last.time < duration / (this.history.capacity - 1)) return;
    const encoder = this.device.createCommandEncoder();
    this.history.record(encoder, source, time);
    this.device.submit(encoder.finish());
  }

  /** Reproject retained world-space samples when orbiting, even while paused. */
  draw(
    pass: RenderPass,
    props: {
      width: number;
      height: number;
      longitude: number;
      latitude: number;
      time: number;
      duration: number;
      widthPixels: number;
      exposure: number;
    }
  ): void {
    const frames = this.history.frames;
    if (frames.length < 2) return;
    const data = new Float32Array(16);
    data.set([
      props.width,
      props.height,
      props.widthPixels,
      props.exposure,
      props.longitude,
      props.latitude,
      props.time,
      props.duration
    ]);
    new Uint32Array(data.buffer).set(
      [
        this.particleCount,
        frames[0].byteOffset / this.history.frameByteLength,
        this.history.capacity,
        this.renderedCount
      ],
      8
    );
    data[15] = this.stride;
    this.settings.write(data);
    this.model.setInstanceCount(this.renderedCount * (frames.length - 1));
    this.model.draw(pass);
  }

  /** Release only owned resources; simulation state remains caller-owned. */
  destroy(): void {
    this.model.destroy();
    this.settings.destroy();
    this.history.destroy();
  }
}
