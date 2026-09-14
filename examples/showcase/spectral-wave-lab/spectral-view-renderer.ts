// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

/** Full-screen Fourier-space view of the same evolving spectrum used to reconstruct the wave. */
export class SpectralViewRenderer {
  readonly model: Model;
  readonly uniforms: Buffer;
  constructor(
    readonly device: Device,
    readonly spectrum: Buffer,
    readonly resolution: number
  ) {
    this.uniforms = device.createBuffer({
      id: 'spectral-view-uniforms',
      byteLength: 16,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'spectral-view',
      source: SHADER,
      topology: 'triangle-list',
      vertexCount: 3,
      bindings: {spectrum, uniforms: this.uniforms},
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'spectrum', type: 'read-only-storage', group: 0, location: 0},
          {name: 'uniforms', type: 'uniform', group: 0, location: 1}
        ]
      }
    });
  }
  draw(
    renderPass: RenderPass,
    viewport: readonly [number, number, number, number],
    time: number
  ): void {
    const data = new ArrayBuffer(16),
      f = new Float32Array(data),
      u = new Uint32Array(data);
    u[0] = this.resolution;
    f[1] = time;
    this.uniforms.write(data);
    const rectangle: [number, number, number, number] = [...viewport];
    renderPass.setParameters({viewport: rectangle, scissorRect: rectangle});
    this.model.draw(renderPass);
  }
  destroy(): void {
    this.model.destroy();
    this.uniforms.destroy();
  }
}

const SHADER = `
struct Uniforms {
  resolution: u32,
  time: f32,
  pad0: f32,
  pad1: f32,
};

@group(0) @binding(0) var<storage, read> spectrum: array<vec2f>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: VertexOutput;
  output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
  output.uv = positions[vertexIndex] * 0.5 + 0.5;
  return output;
}

fn getShiftedIndex(index: u32, resolution: u32) -> u32 {
  return (index + resolution / 2u) % resolution;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let resolution = uniforms.resolution;
  let x = min(
    u32(clamp(input.uv.x, 0.0, 0.999999) * f32(resolution)),
    resolution - 1u
  );
  let y = min(
    u32(clamp(input.uv.y, 0.0, 0.999999) * f32(resolution)),
    resolution - 1u
  );
  let value = spectrum[
    getShiftedIndex(y, resolution) * resolution + getShiftedIndex(x, resolution)
  ];
  let energy = dot(value, value);
  let level = clamp(log2(1.0 + energy) * 0.11, 0.0, 1.0);
  let center = length(input.uv - 0.5);
  let grid = 0.93 + 0.07 * cos(center * 120.0);
  let cold = vec3f(0.015, 0.035, 0.09);
  let hot = vec3f(1.0, 0.38, 0.08);
  let color = mix(cold, hot, pow(level, 0.58)) * grid;
  return vec4f(color, 1.0);
}
`;
