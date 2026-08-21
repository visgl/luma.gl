// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CanvasContext, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

const LLM_NETWORK_SHADER = /* wgsl */ `
struct NetworkControls {
  viewport: vec4f,
  selection: vec4f,
  pointer: vec4f,
  orbit: vec4f,
};

@group(0) @binding(0) var<uniform> controls: NetworkControls;

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

fn hash(value: f32) -> f32 {
  return fract(sin(value * 91.173 + 17.71) * 43758.5453);
}

fn aspectPoint(point: vec2f) -> vec2f {
  return point * vec2f(controls.viewport.x / max(controls.viewport.y, 1.0), 1.0);
}

fn lineDistance(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let segment = end - start;
  let amount = clamp(dot(point - start, segment) / max(dot(segment, segment), 0.00001), 0.0, 1.0);
  return length(point - (start + amount * segment));
}

fn roundedBoxDistance(point: vec2f, halfSize: vec2f, radius: f32) -> f32 {
  let offset = abs(point) - halfSize + radius;
  return length(max(offset, vec2f(0.0))) + min(max(offset.x, offset.y), 0.0) - radius;
}

fn stageEnergy(stage: f32) -> f32 {
  let forward = 0.14 + 0.86 * exp(-abs(controls.viewport.w - stage) * 1.6);
  return mix(forward, 0.72, step(5.5, controls.viewport.w));
}

fn networkLine(
  uv: vec2f,
  start: vec2f,
  end: vec2f,
  color: vec3f,
  energy: f32,
  seed: f32
) -> vec3f {
  let point = aspectPoint(uv);
  let first = aspectPoint(start);
  let last = aspectPoint(end);
  let distance = lineDistance(point, first, last);
  let core = smoothstep(0.0022, 0.00045, distance);
  let glow = exp(-distance * 235.0) * 0.48;
  let forwardPhase = controls.viewport.z * controls.selection.z * 0.18 + seed;
  let pulsePhase = mix(forwardPhase, -forwardPhase, step(5.5, controls.viewport.w));
  let pulsePosition = mix(first, last, fract(pulsePhase));
  let pulse = exp(-length(point - pulsePosition) * 180.0) * energy;
  return color * ((core + glow) * energy + pulse * 2.0);
}

fn networkNode(
  uv: vec2f,
  center: vec2f,
  radius: f32,
  color: vec3f,
  energy: f32,
  seed: f32
) -> vec3f {
  let distance = length(aspectPoint(uv) - aspectPoint(center));
  let ring = smoothstep(0.0026, 0.0005, abs(distance - radius));
  let fill = smoothstep(radius, radius * 0.22, distance) * 0.30;
  let breathe = 0.88 + 0.12 * sin(controls.viewport.z * 1.7 + seed * 9.0);
  let glow = exp(-abs(distance - radius) * 92.0) * 0.32 + exp(-distance * 58.0) * 0.12;
  return color * (ring * breathe + fill + glow) * energy;
}

fn tokenPosition(index: u32) -> vec2f {
  return vec2f(0.315, 0.75 - f32(index) * 0.10);
}

fn embeddingPosition(index: u32) -> vec2f {
  let column = index % 2u;
  let row = index / 2u;
  return vec2f(0.405 + f32(column) * 0.030, 0.255 + f32(row) * 0.071);
}

fn headPosition(index: u32) -> vec2f {
  return vec2f(0.555, 0.305 + f32(index) * 0.13);
}

fn hiddenPosition(index: u32, secondColumn: bool) -> vec2f {
  return vec2f(select(0.67, 0.735, secondColumn), 0.255 + f32(index) * 0.082);
}

fn outputProbability(index: u32) -> f32 {
  let prompt = controls.selection.w;
  let values = array<f32, 5>(0.84, 0.61, 0.43, 0.28, 0.17);
  let alternate = array<f32, 5>(0.73, 0.67, 0.48, 0.31, 0.20);
  return mix(values[index], alternate[index], prompt / 2.0);
}

fn renderTokenLayer(uv: vec2f) -> vec3f {
  var color = vec3f(0.0);
  let selectedToken = u32(controls.selection.x + 0.5);
  let energy = stageEnergy(0.0);
  for (var token = 0u; token < 6u; token++) {
    let selected = select(0.42, 1.0, token == selectedToken);
    let tint = mix(vec3f(0.30, 0.78, 0.98), vec3f(1.0, 0.82, 0.28), selected);
    color += networkNode(uv, tokenPosition(token), select(0.009, 0.013, token == selectedToken), tint, energy * selected, f32(token));
    color += networkLine(
      uv,
      tokenPosition(token) + vec2f(0.013, 0.0),
      vec2f(0.392, tokenPosition(token).y),
      tint,
      energy * selected * 0.54,
      f32(token) * 0.11
    );
  }
  return color;
}

fn renderEmbeddingLayer(uv: vec2f) -> vec3f {
  var color = vec3f(0.0);
  let energy = stageEnergy(1.0);
  let selected = tokenPosition(u32(controls.selection.x + 0.5));
  for (var component = 0u; component < 12u; component++) {
    let position = embeddingPosition(component);
    let signColor = select(vec3f(0.98, 0.33, 0.48), vec3f(0.22, 0.86, 0.93), hash(f32(component) + controls.selection.w) > 0.45);
    color += networkLine(uv, selected, position, signColor, energy * 0.31, f32(component) * 0.071);
    color += networkNode(uv, position, 0.0065, signColor, energy, f32(component));
  }
  return color;
}

fn renderAttentionLayer(uv: vec2f) -> vec3f {
  var color = vec3f(0.0);
  let energy = stageEnergy(2.0);
  for (var head = 0u; head < 4u; head++) {
    let position = headPosition(head);
    let tint = mix(vec3f(0.30, 0.83, 1.0), vec3f(0.94, 0.36, 0.78), f32(head) / 3.0);
    color += networkNode(uv, position, 0.024, tint, energy, f32(head) + 20.0);
    for (var component = 0u; component < 12u; component += 3u) {
      color += networkLine(
        uv,
        embeddingPosition((component + head) % 12u),
        position,
        tint,
        energy * 0.42,
        f32(head * 4u + component) * 0.057
      );
    }
  }

  // A small causal attention map: row i only sees columns <= i.
  let mapCenter = vec2f(0.555, 0.50);
  let mapPoint = (uv - mapCenter) / vec2f(0.09, 0.52);
  if (abs(mapPoint.x) < 0.5 && abs(mapPoint.y) < 0.5) {
    let cell = floor((mapPoint + vec2f(0.5)) * 6.0);
    let within = fract((mapPoint + vec2f(0.5)) * 6.0);
    let causal = cell.x <= cell.y;
    let value = hash(cell.x * 7.0 + cell.y * 19.0 + controls.selection.w * 5.0);
    let border = smoothstep(0.02, 0.12, min(min(within.x, within.y), min(1.0 - within.x, 1.0 - within.y)));
    let mapEnergy = energy * select(0.025, 0.18 + value * 0.44, causal);
    color += mix(vec3f(0.18, 0.46, 0.84), vec3f(0.95, 0.35, 0.66), value) * mapEnergy * border;
  }
  return color;
}

fn renderHiddenLayer(uv: vec2f) -> vec3f {
  var color = vec3f(0.0);
  let energy = stageEnergy(3.0);
  let depthPhase = controls.selection.y / 12.0;
  for (var hidden = 0u; hidden < 7u; hidden++) {
    let first = hiddenPosition(hidden, false);
    let second = hiddenPosition(hidden, true);
    let activation = hash(f32(hidden) * 13.0 + controls.selection.y * 3.0);
    let tint = mix(vec3f(1.0, 0.40, 0.34), vec3f(1.0, 0.82, 0.24), activation);
    color += networkNode(uv, first, 0.008, tint, energy, f32(hidden) + depthPhase);
    color += networkNode(uv, second, 0.008, tint, energy, f32(hidden) + 10.0);
    color += networkLine(uv, first, second, tint, energy * (0.45 + activation * 0.45), f32(hidden) * 0.13);
    color += networkLine(uv, headPosition(hidden % 4u), first, tint, energy * 0.24, f32(hidden) * 0.09);
  }
  for (var hidden = 0u; hidden < 7u; hidden += 2u) {
    color += networkLine(
      uv,
      hiddenPosition(hidden, false),
      hiddenPosition((hidden + 3u) % 7u, true),
      vec3f(0.96, 0.52, 0.30),
      energy * 0.28,
      f32(hidden) * 0.17
    );
  }
  return color;
}

fn renderOutputLayer(uv: vec2f) -> vec3f {
  var color = vec3f(0.0);
  let energy = stageEnergy(4.0);
  let point = aspectPoint(uv);
  for (var output = 0u; output < 5u; output++) {
    let y = 0.70 - f32(output) * 0.10;
    let probability = outputProbability(output);
    let start = vec2f(0.815, y);
    let end = vec2f(0.815 + probability * 0.105, y);
    let tint = mix(vec3f(0.31, 0.83, 0.98), vec3f(1.0, 0.79, 0.25), select(0.0, 1.0, output == 0u));
    let boxCenter = aspectPoint(mix(start, end, 0.5));
    let boxDistance = roundedBoxDistance(point - boxCenter, vec2f(max(length(aspectPoint(end) - aspectPoint(start)) * 0.5, 0.002), 0.010), 0.004);
    color += tint * (smoothstep(0.002, -0.001, boxDistance) * 0.65 + exp(-abs(boxDistance) * 150.0) * 0.18) * energy;
    color += networkLine(uv, hiddenPosition(output + 1u, true), start, tint, energy * 0.38, f32(output) * 0.19);
  }
  let chosen = vec2f(0.935, 0.70);
  color += networkNode(uv, chosen, 0.014, vec3f(1.0, 0.84, 0.32), energy * (1.0 + 0.15 * sin(controls.viewport.z * 3.0)), 41.0);
  return color;
}

fn renderLearning(uv: vec2f) -> vec3f {
  if (controls.viewport.w < 4.5) { return vec3f(0.0); }
  var color = vec3f(0.0);
  let lossEnergy = stageEnergy(5.0);
  let targetPosition = vec2f(0.935, 0.30);
  let prediction = vec2f(0.935, 0.70);
  color += networkNode(uv, targetPosition, 0.012, vec3f(0.97, 0.38, 0.49), lossEnergy, 52.0);
  color += networkLine(uv, prediction, targetPosition, vec3f(0.97, 0.38, 0.49), lossEnergy * 0.82, 0.32);
  if (controls.viewport.w > 5.5) {
    let gradient = vec3f(1.0, 0.28, 0.42);
    color += networkLine(uv, vec2f(0.915, 0.70), hiddenPosition(1u, true), gradient, 1.0, 0.08);
    if (controls.viewport.w > 6.5) {
      color += networkLine(uv, hiddenPosition(1u, true), hiddenPosition(3u, false), gradient, 0.92, 0.19);
    }
    if (controls.viewport.w > 7.5) {
      color += networkLine(uv, hiddenPosition(3u, false), headPosition(2u), gradient, 0.88, 0.31);
      color += networkLine(uv, headPosition(2u), embeddingPosition(7u), gradient, 0.82, 0.44);
    }
    if (controls.viewport.w > 8.5) {
      color += networkLine(uv, embeddingPosition(7u), tokenPosition(u32(controls.selection.x + 0.5)), gradient, 0.76, 0.57);
    }
  }
  return color;
}

fn lossSurfaceHeight(position: vec2f) -> f32 {
  let firstAxis = 0.90 * position.x + 0.44 * position.y + 0.20;
  let secondAxis = -0.44 * position.x + 0.90 * position.y - 0.10;
  return 0.34 * firstAxis * firstAxis + 0.13 * secondAxis * secondAxis +
    0.035 * sin(position.x * 3.2) * cos(position.y * 2.7);
}

fn lossSurfaceGradient(position: vec2f) -> vec2f {
  let firstAxis = 0.90 * position.x + 0.44 * position.y + 0.20;
  let secondAxis = -0.44 * position.x + 0.90 * position.y - 0.10;
  let rippleX = 0.112 * cos(position.x * 3.2) * cos(position.y * 2.7);
  let rippleY = -0.0945 * sin(position.x * 3.2) * sin(position.y * 2.7);
  return vec2f(
    0.612 * firstAxis - 0.1144 * secondAxis + rippleX,
    0.2992 * firstAxis + 0.234 * secondAxis + rippleY
  );
}

fn projectLossSurface(position: vec2f) -> vec2f {
  let height = lossSurfaceHeight(position);
  let yawCosine = cos(controls.orbit.x);
  let yawSine = sin(controls.orbit.x);
  let rotatedX = yawCosine * position.x - yawSine * position.y;
  let depth = yawSine * position.x + yawCosine * position.y;
  let vertical = height * cos(controls.orbit.y) + depth * sin(controls.orbit.y) * 0.52;
  return vec2f(
    0.59 + rotatedX * 0.145 * controls.orbit.z,
    0.40 + vertical * 0.22 * controls.orbit.z
  );
}

fn surfaceStroke(uv: vec2f, start: vec2f, end: vec2f, color: vec3f, energy: f32) -> vec3f {
  let distance = lineDistance(aspectPoint(uv), aspectPoint(start), aspectPoint(end));
  return color * (smoothstep(0.0018, 0.00045, distance) + exp(-distance * 180.0) * 0.23) * energy;
}

fn renderLossSurface(uv: vec2f) -> vec3f {
  if (controls.viewport.w < 4.5) { return vec3f(0.0); }
  var color = vec3f(0.0);
  let reveal = smoothstep(4.5, 5.1, controls.viewport.w);
  for (var grid = 0u; grid < 8u; grid++) {
    let fixedCoordinate = -1.20 + f32(grid) * 0.343;
    for (var segment = 0u; segment < 7u; segment++) {
      let firstCoordinate = -1.20 + f32(segment) * 0.40;
      let secondCoordinate = firstCoordinate + 0.40;
      let firstAcross = vec2f(fixedCoordinate, firstCoordinate);
      let secondAcross = vec2f(fixedCoordinate, secondCoordinate);
      let firstDepth = vec2f(firstCoordinate, fixedCoordinate);
      let secondDepth = vec2f(secondCoordinate, fixedCoordinate);
      let acrossHeight = lossSurfaceHeight(firstAcross);
      let depthHeight = lossSurfaceHeight(firstDepth);
      color += surfaceStroke(
        uv,
        projectLossSurface(firstAcross),
        projectLossSurface(secondAcross),
        mix(vec3f(0.12, 0.55, 0.68), vec3f(0.74, 0.28, 0.74), clamp(acrossHeight, 0.0, 1.0)),
        reveal * 0.55
      );
      color += surfaceStroke(
        uv,
        projectLossSurface(firstDepth),
        projectLossSurface(secondDepth),
        mix(vec3f(0.10, 0.42, 0.62), vec3f(0.94, 0.40, 0.54), clamp(depthHeight, 0.0, 1.0)),
        reveal * 0.55
      );
    }
  }

  var parameterPosition = vec2f(1.05, 0.90);
  let activeStep = u32(floor(fract(controls.viewport.z * 0.085) * 10.0));
  for (var descentStep = 0u; descentStep < 10u; descentStep++) {
    let nextPosition = parameterPosition - lossSurfaceGradient(parameterPosition) * 0.48;
    let start = projectLossSurface(parameterPosition);
    let end = projectLossSurface(nextPosition);
    color += surfaceStroke(uv, start, end, vec3f(1.0, 0.83, 0.25), reveal * 1.6);
    color += networkNode(
      uv,
      start,
      select(0.004, 0.010, descentStep == activeStep),
      vec3f(1.0, 0.86, 0.31),
      reveal * select(0.55, 1.8, descentStep == activeStep),
      f32(descentStep) + 70.0
    );
    parameterPosition = nextPosition;
  }
  color += networkNode(
    uv,
    projectLossSurface(parameterPosition),
    0.010,
    vec3f(0.35, 1.0, 0.78),
    reveal * 1.4,
    83.0
  );
  return color;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let uv = input.uv;
  let aspect = controls.viewport.x / max(controls.viewport.y, 1.0);
  let centered = (uv - vec2f(0.52, 0.5)) * vec2f(aspect * 0.72, 1.0);
  let vignette = 1.0 - smoothstep(0.25, 0.93, length(centered));
  let paperNoise = hash(floor(uv.x * controls.viewport.x * 0.32) + floor(uv.y * controls.viewport.y * 0.32) * 71.0);
  let gridX = exp(-abs(fract(uv.x * 24.0) - 0.5) * 120.0);
  let gridY = exp(-abs(fract(uv.y * 14.0) - 0.5) * 120.0);
  var color = vec3f(0.012, 0.020, 0.034);
  color += vec3f(0.018, 0.052, 0.073) * vignette;
  color += vec3f(0.06, 0.13, 0.16) * (gridX + gridY) * 0.055;
  color += vec3f(paperNoise - 0.5) * 0.007;
  let learningFade = mix(1.0, 0.34, step(4.5, controls.viewport.w));
  color += renderTokenLayer(uv) * learningFade;
  color += renderEmbeddingLayer(uv) * learningFade;
  color += renderAttentionLayer(uv) * learningFade;
  color += renderHiddenLayer(uv) * learningFade;
  color += renderOutputLayer(uv) * learningFade;
  color += renderLossSurface(uv);
  color += renderLearning(uv);
  let pointerDistance = length(aspectPoint(uv) - aspectPoint(controls.pointer.xy));
  color += vec3f(0.18, 0.55, 0.72) * exp(-pointerDistance * 18.0) * controls.pointer.z * 0.08;
  color *= 0.72 + vignette * 0.38;
  return vec4f(pow(max(color, vec3f(0.0)), vec3f(0.86)), 1.0);
}`;

export type LLMNetworkRenderState = {
  stage: number;
  selectedToken: number;
  layer: number;
  flowSpeed: number;
  prompt: number;
  pointer: readonly [number, number];
  pointerActive: boolean;
  orbit: readonly [number, number];
  orbitZoom: number;
  orbitDragging: boolean;
};

/** Full-canvas luma.gl renderer for the transformer explainer. */
export class LLMNetworkRenderer {
  private readonly device: Device;
  private readonly controls: Buffer;
  private readonly model: Model;

  constructor(device: Device) {
    this.device = device;
    this.controls = device.createBuffer({
      id: 'llm-network-controls',
      byteLength: 64,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'llm-network-explainer',
      source: LLM_NETWORK_SHADER,
      vertexCount: 3,
      shaderLayout: {
        attributes: [],
        bindings: [{name: 'controls', type: 'uniform', group: 0, location: 0}]
      },
      bindings: {controls: this.controls},
      parameters: {depthCompare: 'always', depthWriteEnabled: false}
    });
  }

  render(
    canvasContext: CanvasContext,
    timeMilliseconds: number,
    state: LLMNetworkRenderState
  ): void {
    const framebuffer = canvasContext.getCurrentFramebuffer();
    const [width, height] = canvasContext.getDrawingBufferSize();
    this.controls.write(
      new Float32Array([
        width,
        height,
        timeMilliseconds / 1000,
        state.stage,
        state.selectedToken,
        state.layer,
        state.flowSpeed,
        state.prompt,
        state.pointer[0],
        state.pointer[1],
        state.pointerActive ? 1 : 0,
        0,
        state.orbit[0],
        state.orbit[1],
        state.orbitZoom,
        state.orbitDragging ? 1 : 0
      ])
    );
    const commandEncoder = this.device.createCommandEncoder({id: 'llm-network-render'});
    this.model.predraw(commandEncoder);
    const renderPass = commandEncoder.beginRenderPass({
      id: 'llm-network-pass',
      framebuffer,
      clearColor: [0.008, 0.014, 0.025, 1],
      clearDepth: 1,
      clearStencil: false
    });
    this.model.draw(renderPass);
    renderPass.end();
    this.device.submit(commandEncoder.finish());
  }

  destroy(): void {
    this.model.destroy();
    this.controls.destroy();
  }
}
