// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Buffer, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';
const UNIFORM_BYTES = 80;
/** Illuminated physical-space view sampling the inverse-FFT buffer directly. */
export class SpectralWaveRenderer {
  readonly device: Device;
  readonly model: Model;
  readonly uniforms: Buffer;
  constructor(
    device: Device,
    readonly field: Buffer,
    readonly resolution: number
  ) {
    this.device = device;
    this.uniforms = device.createBuffer({
      id: 'spectral-wave-render-uniforms',
      byteLength: UNIFORM_BYTES,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'spectral-wave-surface',
      source: SHADER,
      topology: 'triangle-list',
      vertexCount: (resolution - 1) * (resolution - 1) * 6,
      bindings: {field, uniforms: this.uniforms},
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'field', type: 'read-only-storage', group: 0, location: 0},
          {name: 'uniforms', type: 'uniform', group: 0, location: 1}
        ]
      }
    });
  }
  render(timeSeconds: number, viewport?: readonly [number, number, number, number]): void {
    const canvas = this.device.getDefaultCanvasContext();
    const [width, height] = canvas.getDrawingBufferSize();
    const vp: [number, number, number, number] = viewport ? [...viewport] : [0, 0, width, height];
    const eye: [number, number, number] = [
      5.6 * Math.cos(timeSeconds * 0.08),
      4.4,
      5.6 * Math.sin(timeSeconds * 0.08)
    ];
    const projection = new Matrix4().perspective({
      fovy: radians(44),
      aspect: vp[2] / Math.max(vp[3], 1),
      near: 0.1,
      far: 30
    });
    const view = new Matrix4().lookAt({eye, center: [0, 0, 0], up: [0, 1, 0]});
    const matrix = new Matrix4(projection).multiplyRight(view);
    const data = new Float32Array(UNIFORM_BYTES / 4);
    data.set(matrix, 0);
    data[16] = this.resolution;
    data[17] = 2;
    data[18] = 1 / this.resolution;
    this.uniforms.write(data);
    const pass = this.device.beginRenderPass({
      id: 'spectral-wave-physical',
      framebuffer: canvas.getCurrentFramebuffer(),
      clearColor: false
    });
    pass.setParameters({viewport: vp, scissorRect: vp});
    this.model.draw(pass);
    pass.end();
  }
  destroy(): void {
    this.model.destroy();
    this.uniforms.destroy();
  }
}
const SHADER = `
struct Uniforms {
  viewProjection: mat4x4f,
  resolution: f32,
  heightScale: f32,
  texel: f32,
  pad: f32,
};

@group(0) @binding(0) var<storage, read> field: array<vec2f>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) height: f32,
  @location(1) normal: vec3f,
};

fn getValue(x: u32, y: u32) -> f32 {
  return field[y * u32(uniforms.resolution) + x].x;
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let resolution = u32(uniforms.resolution);
  let cell = vertexIndex / 6u;
  let corner = vertexIndex % 6u;
  let cellX = cell % (resolution - 1u);
  let cellY = cell / (resolution - 1u);
  var offsetX = 0u;
  var offsetY = 0u;
  switch corner {
    case 0u: { offsetX = 0u; offsetY = 0u; }
    case 1u: { offsetX = 1u; offsetY = 0u; }
    case 2u: { offsetX = 1u; offsetY = 1u; }
    case 3u: { offsetX = 0u; offsetY = 0u; }
    case 4u: { offsetX = 1u; offsetY = 1u; }
    default: { offsetX = 0u; offsetY = 1u; }
  }
  let x = cellX + offsetX;
  let y = cellY + offsetY;
  let height = getValue(x, y);
  let previousX = select(x - 1u, x, x == 0u);
  let nextX = min(x + 1u, resolution - 1u);
  let previousY = select(y - 1u, y, y == 0u);
  let nextY = min(y + 1u, resolution - 1u);
  let deltaX = (getValue(nextX, y) - getValue(previousX, y)) * uniforms.heightScale;
  let deltaZ = (getValue(x, nextY) - getValue(x, previousY)) * uniforms.heightScale;
  let normal = normalize(vec3f(-deltaX, 2.0, -deltaZ));
  let uv = vec2f(f32(x), f32(y)) / f32(resolution - 1u);
  let world = vec3f(
    (uv.x - 0.5) * 7.5,
    height * uniforms.heightScale,
    (uv.y - 0.5) * 7.5
  );
  var output: VertexOutput;
  output.position = uniforms.viewProjection * vec4f(world, 1.0);
  output.height = height;
  output.normal = normal;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let light = normalize(vec3f(-0.35, 0.8, 0.45));
  let diffuse = 0.22 + 0.78 * max(dot(input.normal, light), 0.0);
  let magnitude = clamp(abs(input.height) * 1.7, 0.0, 1.0);
  let base = mix(
    vec3f(0.015, 0.025, 0.07),
    select(vec3f(1.0, 0.18, 0.52), vec3f(0.12, 0.62, 1.0), input.height >= 0.0),
    magnitude
  );
  let contour = 0.72 + 0.28 * smoothstep(0.1, 0.55, abs(fract(input.height * 9.0) - 0.5));
  return vec4f(base * diffuse * contour, 1.0);
}
`;
