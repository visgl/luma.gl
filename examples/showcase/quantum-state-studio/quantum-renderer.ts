// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CanvasContext, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {QuantumStateEngine} from './quantum-engine';

const QUANTUM_VISUALIZATION_SHADER = /* wgsl */ `
struct RenderControls {
  step: u32,
  qubitCount: u32,
  selectedQubit: u32,
  stateCount: u32,
  resolution: vec2f,
  time: f32,
  snapshotCount: f32,
};
@group(0) @binding(0) var<storage, read> probabilityPhase: array<vec2f>;
@group(0) @binding(1) var<storage, read> normalization: array<f32>;
@group(0) @binding(2) var<storage, read> blochVector: array<vec4f>;
@group(0) @binding(3) var<storage, read> correlations: array<f32>;
@group(0) @binding(4) var<uniform> controls: RenderControls;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let position = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: VertexOutput;
  output.position = vec4f(position[vertexIndex], 0.0, 1.0);
  output.uv = position[vertexIndex] * 0.5 + 0.5;
  return output;
}

fn phaseColor(phase: f32) -> vec3f {
  let angle = phase + vec3f(0.0, 4.1887902, 2.0943951);
  return 0.58 + 0.42 * cos(angle);
}

fn roundedBox(point: vec2f, halfSize: vec2f, radius: f32) -> f32 {
  let delta = abs(point) - halfSize + radius;
  return length(max(delta, vec2f(0.0))) + min(max(delta.x, delta.y), 0.0) - radius;
}

fn lineDistance(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let segment = end - start;
  let amount = clamp(dot(point - start, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
  return length(point - (start + amount * segment));
}

fn sampleBasisRange(normalizedX: f32, step: u32) -> vec2f {
  let sourceWidth = max(controls.resolution.x * 0.70, 1.0);
  let statesPerPixel = max(1u, u32(ceil(f32(controls.stateCount) / sourceWidth)));
  let first = min(u32(normalizedX * f32(controls.stateCount)), controls.stateCount - 1u);
  let last = min(first + statesPerPixel, controls.stateCount);
  var strongest = vec2f(0.0);
  var index = first;
  var iteration = 0u;
  while (index < last && iteration < 128u) {
    let value = probabilityPhase[step * controls.stateCount + index];
    if (value.x > strongest.x) { strongest = value; }
    index++;
    iteration++;
  }
  return strongest;
}

fn renderLandscape(uv: vec2f) -> vec3f {
  let compact = controls.resolution.x < 700.0;
  let origin = select(vec2f(0.285, 0.315), vec2f(0.04, 0.47), compact);
  let size = select(vec2f(0.685, 0.59), vec2f(0.92, 0.35), compact);
  let local = (uv - origin) / size;
  let value = sampleBasisRange(clamp(local.x, 0.0, 0.999999), controls.step);
  let total = max(normalization[controls.step], 0.000001);
  let height = pow(clamp(value.x / total, 0.0, 1.0), 0.34) * 0.78;
  let hue = phaseColor(value.y);
  let topDistance = abs(local.y - (0.10 + height));
  let inside = select(0.0, 1.0, local.y > 0.10 && local.y < 0.10 + height);
  let barPattern = 0.68 + 0.32 * smoothstep(0.06, 0.0, abs(fract(local.x * min(f32(controls.stateCount), 160.0)) - 0.5));
  let body = hue * inside * barPattern * (0.18 + 0.82 * local.y / max(height + 0.10, 0.1));
  let crest = hue * exp(-topDistance * 145.0) * (1.7 + 0.35 * sin(controls.time * 2.0 + local.x * 22.0));
  // Rare, phase-tinted crest glints intentionally exceed display white. Their tiny footprint keeps
  // SDR presentation clean while an HDR canvas preserves a restrained specular sparkle.
  let sparkleCell = floor(local.x * 47.0);
  let sparkleSeed = fract(sin(sparkleCell * 91.173) * 43758.5453);
  let sparklePulse = pow(max(0.0, sin(controls.time * 2.7 + sparkleSeed * 31.0)), 18.0);
  let sparkle = step(0.91, sparkleSeed) * sparklePulse *
    exp(-abs(fract(local.x * 47.0) - 0.5) * 190.0) *
    exp(-abs(local.y - (0.105 + height)) * 260.0);
  let baseline = vec3f(0.08, 0.48, 0.72) * exp(-abs(local.y - 0.10) * 80.0) * 0.34;
  let gridX = exp(-abs(fract(local.x * 12.0) - 0.5) * 80.0) * 0.04;
  let gridY = exp(-abs(fract(local.y * 8.0) - 0.5) * 90.0) * 0.04;
  return body + crest + baseline + vec3f(0.18, 0.34, 0.55) * (gridX + gridY) +
    mix(vec3f(3.8), hue * 4.8, 0.38) * sparkle;
}

fn renderHistory(uv: vec2f) -> vec3f {
  let compact = controls.resolution.x < 700.0;
  let origin = select(vec2f(0.285, 0.06), vec2f(0.04, 0.185), compact);
  let size = select(vec2f(0.685, 0.205), vec2f(0.92, 0.075), compact);
  let local = (uv - origin) / size;
  let snapshot = min(u32(local.y * controls.snapshotCount), u32(controls.snapshotCount) - 1u);
  let value = sampleBasisRange(clamp(local.x, 0.0, 0.999999), snapshot);
  let probability = value.x / max(normalization[snapshot], 0.000001);
  let color = phaseColor(value.y) * pow(probability, 0.28) * 1.35;
  let selected = exp(-abs(local.y - (f32(controls.step) + 0.5) / controls.snapshotCount) * controls.snapshotCount * 16.0);
  let gateLine = exp(-abs(fract(local.y * controls.snapshotCount) - 0.5) * 30.0) * 0.06;
  return color + vec3f(0.28, 0.78, 1.0) * selected + vec3f(gateLine);
}

fn renderBloch(uv: vec2f) -> vec3f {
  let compact = controls.resolution.x < 700.0;
  let center = select(vec2f(0.137, 0.69), vec2f(0.24, 0.335), compact);
  let scale = select(0.18, 0.125, compact);
  let aspect = controls.resolution.x / max(controls.resolution.y, 1.0);
  let point = (uv - center) * vec2f(aspect, 1.0) / scale;
  let radius = length(point);
  let sphere = smoothstep(0.035, 0.0, abs(radius - 1.0));
  let latitude = smoothstep(0.024, 0.0, abs(point.y * 0.38)) * smoothstep(1.0, 0.92, radius);
  let longitude = smoothstep(0.025, 0.0, abs(point.x * 0.42)) * smoothstep(1.0, 0.92, radius);
  let vector = blochVector[0];
  let projected = vec2f(vector.x * 0.78 + vector.z * 0.22, vector.y * 0.88 - vector.z * 0.20);
  let arrow = exp(-lineDistance(point, vec2f(0.0), projected) * 62.0);
  let tip = exp(-length(point - projected) * 38.0);
  let purityGlow = exp(-abs(radius - 0.96) * 7.0) * vector.w * 0.12;
  return vec3f(0.12, 0.42, 0.66) * (sphere + latitude + longitude) +
    vec3f(0.98, 0.32, 0.68) * (arrow * 1.7 + tip * 2.5) +
    vec3f(0.28, 0.83, 1.0) * purityGlow;
}

fn renderCorrelations(uv: vec2f) -> vec3f {
  let compact = controls.resolution.x < 700.0;
  let origin = select(vec2f(0.045, 0.075), vec2f(0.57, 0.235), compact);
  let size = select(vec2f(0.185, 0.31), vec2f(0.36, 0.20), compact);
  let local = (uv - origin) / size;
  let dimension = f32(controls.qubitCount);
  let column = min(u32(local.x * dimension), controls.qubitCount - 1u);
  let row = min(u32(local.y * dimension), controls.qubitCount - 1u);
  let value = correlations[row * 16u + column];
  let positive = vec3f(0.15, 0.82, 1.0);
  let negative = vec3f(1.0, 0.20, 0.56);
  let cellColor = mix(negative, positive, step(0.0, value)) * pow(abs(value), 0.55);
  let cell = fract(local * dimension);
  let border = smoothstep(0.0, 0.055, min(min(cell.x, cell.y), min(1.0 - cell.x, 1.0 - cell.y)));
  return cellColor * border * 1.45 + vec3f(0.025, 0.055, 0.10);
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let uv = input.uv;
  let compact = controls.resolution.x < 700.0;
  let radial = exp(-length((uv - vec2f(0.72, 0.68)) * vec2f(0.8, 1.0)) * 2.8);
  var color = vec3f(0.004, 0.009, 0.025) + vec3f(0.018, 0.055, 0.10) * radial;
  let star = pow(max(0.0, sin(dot(floor(uv * controls.resolution / 5.0), vec2f(12.9898, 78.233)) * 43758.5453)), 42.0);
  color += vec3f(0.28, 0.52, 0.9) * star * 0.16;

  if (compact) {
    if (uv.x > 0.03 && uv.x < 0.97 && uv.y > 0.46 && uv.y < 0.83) { color += renderLandscape(uv); }
    if (uv.x > 0.03 && uv.x < 0.97 && uv.y > 0.175 && uv.y < 0.27) { color += renderHistory(uv); }
    if (uv.x < 0.54 && uv.y > 0.20 && uv.y < 0.46) { color += renderBloch(uv); }
    if (uv.x > 0.55 && uv.x < 0.95 && uv.y > 0.22 && uv.y < 0.45) { color += renderCorrelations(uv); }
  } else {
    if (uv.x > 0.275 && uv.x < 0.98 && uv.y > 0.30 && uv.y < 0.92) { color += renderLandscape(uv); }
    if (uv.x > 0.275 && uv.x < 0.98 && uv.y > 0.05 && uv.y < 0.28) { color += renderHistory(uv); }
    if (uv.x < 0.265 && uv.y > 0.43) { color += renderBloch(uv); }
    if (uv.x > 0.035 && uv.x < 0.24 && uv.y > 0.06 && uv.y < 0.40) { color += renderCorrelations(uv); }
  }

  let aspect = controls.resolution.x / controls.resolution.y;
  let leftCenter = select(vec2f(0.137, 0.49), vec2f(0.50, 0.33), compact);
  let leftHalfSize = select(vec2f(0.21, 0.44), vec2f(0.46 * aspect, 0.13), compact);
  let landscapeCenter = select(vec2f(0.628, 0.61), vec2f(0.50, 0.645), compact);
  let landscapeHalfSize = select(vec2f(0.61, 0.31), vec2f(0.46 * aspect, 0.18), compact);
  let leftPanel = roundedBox((uv - leftCenter) * vec2f(aspect, 1.0), leftHalfSize, 0.025);
  let landscapePanel = roundedBox((uv - landscapeCenter) * vec2f(aspect, 1.0), landscapeHalfSize, 0.025);
  color += vec3f(0.18, 0.45, 0.78) * (exp(-abs(leftPanel) * 180.0) + exp(-abs(landscapePanel) * 180.0)) * 0.16;
  return vec4f(pow(max(color, vec3f(0.0)), vec3f(0.84)), 1.0);
}`;

/** Full-canvas luma.gl renderer that consumes simulation and analysis buffers without readback. */
export class QuantumStateRenderer {
  private readonly device: Device;
  private readonly engine: QuantumStateEngine;
  private readonly renderControls: Buffer;
  private readonly model: Model;
  private selectedStep = 0;
  private selectedQubit = 0;

  constructor(device: Device, engine: QuantumStateEngine) {
    this.device = device;
    this.engine = engine;
    this.renderControls = device.createBuffer({
      id: 'quantum-render-controls',
      byteLength: 32,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'quantum-state-linked-views',
      source: QUANTUM_VISUALIZATION_SHADER,
      vertexCount: 3,
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'probabilityPhase', type: 'read-only-storage', group: 0, location: 0},
          {name: 'normalization', type: 'read-only-storage', group: 0, location: 1},
          {name: 'blochVector', type: 'read-only-storage', group: 0, location: 2},
          {name: 'correlations', type: 'read-only-storage', group: 0, location: 3},
          {name: 'controls', type: 'uniform', group: 0, location: 4}
        ]
      },
      bindings: {
        probabilityPhase: engine.probabilityPhase,
        normalization: engine.normalization,
        blochVector: engine.blochVector,
        correlations: engine.correlations,
        controls: this.renderControls
      },
      parameters: {depthCompare: 'always', depthWriteEnabled: false}
    });
  }

  setSelection(step: number, qubit: number): void {
    this.selectedStep = step;
    this.selectedQubit = qubit;
  }

  render(canvasContext: CanvasContext, timeMilliseconds: number): void {
    const framebuffer = canvasContext.getCurrentFramebuffer();
    const [width, height] = canvasContext.getDrawingBufferSize();
    const bytes = new ArrayBuffer(32);
    new Uint32Array(bytes, 0, 4).set([
      this.selectedStep,
      this.engine.circuit.qubitCount,
      this.selectedQubit,
      this.engine.stateCount
    ]);
    new Float32Array(bytes, 16, 4).set([
      width,
      height,
      timeMilliseconds / 1000,
      this.engine.snapshotCount
    ]);
    this.renderControls.write(new Uint8Array(bytes));
    const commandEncoder = this.device.createCommandEncoder({id: 'quantum-state-render'});
    this.model.predraw(commandEncoder);
    const renderPass = commandEncoder.beginRenderPass({
      id: 'quantum-state-linked-views',
      framebuffer,
      clearColor: [0.004, 0.008, 0.02, 1],
      clearDepth: 1,
      clearStencil: false
    });
    this.model.draw(renderPass);
    renderPass.end();
    this.device.submit(commandEncoder.finish());
  }

  destroy(): void {
    this.model.destroy();
    this.renderControls.destroy();
  }
}
