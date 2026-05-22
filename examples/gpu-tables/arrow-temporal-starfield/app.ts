// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowModel,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector,
  prepareArrowTemporalGPUVectors,
  type PreparedArrowTemporalGPUVector
} from '@luma.gl/arrow';
import {type Device, type ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, ShaderInputs} from '@luma.gl/engine';
import {GPUTable, type GPUVector} from '@luma.gl/tables';
import {type ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';

export const title = 'Time: Blinking Stars';
export const description =
  'Scalar Arrow Timestamp and Duration columns normalized to relative Float32 GPU rows for blinking star instances.';

const RENDER_MODE_SELECTOR_ID = 'arrow-temporal-starfield-render-mode';
const PREPARATION_PATH_ID = 'arrow-temporal-starfield-preparation-path';
const CURRENT_TIMESTAMP_ID = 'arrow-temporal-starfield-current-timestamp';
const TIMESTAMP_ORIGIN_ID = 'arrow-temporal-starfield-timestamp-origin';
const DURATION_ORIGIN_ID = 'arrow-temporal-starfield-duration-origin';
const PULSE_PERIOD_ORIGIN_ID = 'arrow-temporal-starfield-pulse-period-origin';

const STAR_COUNT = 720;
const STARFIELD_CYCLE_MILLISECONDS = 72_000;
const CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND = 6_000;
const SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS = Date.UTC(2026, 4, 22, 21);
const TAU = Math.PI * 2;

type TemporalStarfieldRenderMode = 'attributes' | 'storage';
type TemporalColumnName = 'eventStarts' | 'eventDurations' | 'pulsePeriods';
type TemporalSourceVectors = {
  eventStarts: arrow.Vector<arrow.TimestampMillisecond>;
  eventDurations: arrow.Vector<arrow.DurationMillisecond>;
  pulsePeriods: arrow.Vector<arrow.DurationMillisecond>;
};
type PreparedTemporalColumns = Record<TemporalColumnName, PreparedArrowTemporalGPUVector>;
type TemporalStarfieldTableInput = {
  table: GPUTable;
  temporalColumns: PreparedTemporalColumns;
  timestampOriginMilliseconds: number;
  destroy: () => void;
};
type ActiveTemporalStarfieldModel = ArrowModel | Model;
type StarRows = {
  positions: Float32Array;
  eventStarts: BigInt64Array;
  eventDurations: BigInt64Array;
  pulsePeriods: BigInt64Array;
  starSizes: Float32Array;
  eventColors: Uint8Array;
};
type TemporalStarfieldUniforms = {
  currentTimestamp: number;
};

const STAR_COLORS: readonly [number, number, number, number][] = [
  [255, 244, 214, 255],
  [165, 214, 255, 255],
  [236, 244, 255, 255],
  [255, 198, 144, 255],
  [201, 182, 255, 255],
  [156, 255, 235, 255]
];

const temporalStarfield: ShaderModule<TemporalStarfieldUniforms> = {
  name: 'temporalStarfield',
  uniformTypes: {
    currentTimestamp: 'f32'
  }
};

const STAR_ATTRIBUTE_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'eventStarts', location: 1, type: 'f32', stepMode: 'instance'},
    {name: 'eventDurations', location: 2, type: 'f32', stepMode: 'instance'},
    {name: 'pulsePeriods', location: 3, type: 'f32', stepMode: 'instance'},
    {name: 'starSizes', location: 4, type: 'f32', stepMode: 'instance'},
    {name: 'eventColors', location: 5, type: 'vec4<u32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const STAR_STORAGE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'positions', type: 'read-only-storage', group: 1, location: 0},
    {name: 'eventStarts', type: 'read-only-storage', group: 1, location: 1},
    {name: 'eventDurations', type: 'read-only-storage', group: 1, location: 2},
    {name: 'pulsePeriods', type: 'read-only-storage', group: 1, location: 3},
    {name: 'starSizes', type: 'read-only-storage', group: 1, location: 4},
    {name: 'eventColors', type: 'read-only-storage', group: 1, location: 5}
  ]
} satisfies ShaderLayout;

const RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

const STAR_ATTRIBUTE_WGSL_SHADER = /* wgsl */ `\
struct TemporalStarfieldUniforms {
  currentTimestamp : f32,
};

@group(0) @binding(auto) var<uniform> temporalStarfield : TemporalStarfieldUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions : vec2<f32>,
  @location(1) eventStarts : f32,
  @location(2) eventDurations : f32,
  @location(3) pulsePeriods : f32,
  @location(4) starSizes : f32,
  @location(5) eventColors : vec4<u32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) localPosition : vec2<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

fn unpackEventColor(eventColor : vec4<u32>) -> vec4<f32> {
  return vec4<f32>(eventColor) / 255.0;
}

fn getStarVisibility(currentTimestamp : f32, eventStart : f32, eventDuration : f32) -> f32 {
  let eventElapsed = currentTimestamp - eventStart;
  if (eventElapsed < 0.0) {
    return 0.0;
  }

  let eventRemaining = eventStart + eventDuration - currentTimestamp;
  if (eventRemaining < 0.0) {
    return 0.06;
  }

  let fadeIn = smoothstep(0.0, 2800.0, eventElapsed);
  let fadeOut = smoothstep(0.0, 4200.0, eventRemaining);
  return max(fadeIn * fadeOut, 0.12);
}

fn getStarPulse(currentTimestamp : f32, eventStart : f32, pulsePeriod : f32) -> f32 {
  let pulsePhase = fract(max(currentTimestamp - eventStart, 0.0) / max(pulsePeriod, 1.0));
  let pulse = 0.5 + 0.5 * sin(pulsePhase * ${TAU} - 1.5707963267948966);
  return pow(pulse, 1.7);
}

fn getStarPosition(position : vec2<f32>, currentTimestamp : f32) -> vec2<f32> {
  let drift = vec2<f32>(
    sin(currentTimestamp * 0.00016 + position.y * 8.0),
    cos(currentTimestamp * 0.00013 + position.x * 7.0)
  ) * 0.012;
  return position + drift;
}

fn getStarColor(eventColor : vec4<f32>, visibility : f32, pulse : f32) -> vec4<f32> {
  let brightness = mix(0.42, 1.42, pulse);
  let color = min(eventColor.rgb * brightness + vec3<f32>(pulse * 0.1), vec3<f32>(1.0));
  let alpha = visibility * mix(0.42, 1.0, pulse);
  return vec4<f32>(color, alpha);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let eventColor = unpackEventColor(inputs.eventColors);
  let visibility = getStarVisibility(
    temporalStarfield.currentTimestamp,
    inputs.eventStarts,
    inputs.eventDurations
  );
  let pulse = getStarPulse(
    temporalStarfield.currentTimestamp,
    inputs.eventStarts,
    inputs.pulsePeriods
  );
  let starSize = inputs.starSizes * max(visibility, 0.0) * mix(0.72, 2.4, pulse);
  let starPosition = getStarPosition(inputs.positions, temporalStarfield.currentTimestamp);

  outputs.Position = vec4<f32>(starPosition + corner * starSize, 0.0, 1.0);
  outputs.color = getStarColor(eventColor, visibility, pulse);
  outputs.localPosition = corner;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let radius = length(inputs.localPosition);
  if (radius > 1.0) {
    discard;
  }

  let glow = 1.0 - smoothstep(0.18, 1.0, radius);
  let core = 1.0 - smoothstep(0.0, 0.44, radius);
  let alpha = inputs.color.a * (glow * 0.62 + core * 0.38);
  return vec4<f32>(inputs.color.rgb * (0.74 + core * 0.34), alpha);
}
`;

const STAR_STORAGE_WGSL_SHADER = /* wgsl */ `\
struct TemporalStarfieldUniforms {
  currentTimestamp : f32,
};

@group(0) @binding(auto) var<uniform> temporalStarfield : TemporalStarfieldUniforms;
@group(1) @binding(0) var<storage, read> positions : array<vec2<f32>>;
@group(1) @binding(1) var<storage, read> eventStarts : array<f32>;
@group(1) @binding(2) var<storage, read> eventDurations : array<f32>;
@group(1) @binding(3) var<storage, read> pulsePeriods : array<f32>;
@group(1) @binding(4) var<storage, read> starSizes : array<f32>;
@group(1) @binding(5) var<storage, read> eventColors : array<u32>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) localPosition : vec2<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

fn getStarVisibility(currentTimestamp : f32, eventStart : f32, eventDuration : f32) -> f32 {
  let eventElapsed = currentTimestamp - eventStart;
  if (eventElapsed < 0.0) {
    return 0.0;
  }

  let eventRemaining = eventStart + eventDuration - currentTimestamp;
  if (eventRemaining < 0.0) {
    return 0.06;
  }

  let fadeIn = smoothstep(0.0, 2800.0, eventElapsed);
  let fadeOut = smoothstep(0.0, 4200.0, eventRemaining);
  return max(fadeIn * fadeOut, 0.12);
}

fn getStarPulse(currentTimestamp : f32, eventStart : f32, pulsePeriod : f32) -> f32 {
  let pulsePhase = fract(max(currentTimestamp - eventStart, 0.0) / max(pulsePeriod, 1.0));
  let pulse = 0.5 + 0.5 * sin(pulsePhase * ${TAU} - 1.5707963267948966);
  return pow(pulse, 1.7);
}

fn getStarPosition(position : vec2<f32>, currentTimestamp : f32) -> vec2<f32> {
  let drift = vec2<f32>(
    sin(currentTimestamp * 0.00016 + position.y * 8.0),
    cos(currentTimestamp * 0.00013 + position.x * 7.0)
  ) * 0.012;
  return position + drift;
}

fn getStarColor(eventColor : vec4<f32>, visibility : f32, pulse : f32) -> vec4<f32> {
  let brightness = mix(0.42, 1.42, pulse);
  let color = min(eventColor.rgb * brightness + vec3<f32>(pulse * 0.1), vec3<f32>(1.0));
  let alpha = visibility * mix(0.42, 1.0, pulse);
  return vec4<f32>(color, alpha);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let starIndex = inputs.instanceIndex;
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let eventStart = eventStarts[starIndex];
  let eventDuration = eventDurations[starIndex];
  let pulsePeriod = pulsePeriods[starIndex];
  let eventColor = unpack4x8unorm(eventColors[starIndex]);
  let visibility = getStarVisibility(
    temporalStarfield.currentTimestamp,
    eventStart,
    eventDuration
  );
  let pulse = getStarPulse(temporalStarfield.currentTimestamp, eventStart, pulsePeriod);
  let starSize = starSizes[starIndex] * max(visibility, 0.0) * mix(0.72, 2.4, pulse);
  let starPosition = getStarPosition(positions[starIndex], temporalStarfield.currentTimestamp);

  outputs.Position = vec4<f32>(starPosition + corner * starSize, 0.0, 1.0);
  outputs.color = getStarColor(eventColor, visibility, pulse);
  outputs.localPosition = corner;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let radius = length(inputs.localPosition);
  if (radius > 1.0) {
    discard;
  }

  let glow = 1.0 - smoothstep(0.18, 1.0, radius);
  let core = 1.0 - smoothstep(0.0, 0.44, radius);
  let alpha = inputs.color.a * (glow * 0.62 + core * 0.38);
  return vec4<f32>(inputs.color.rgb * (0.74 + core * 0.34), alpha);
}
`;

const STAR_VERTEX_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in float eventStarts;
in float eventDurations;
in float pulsePeriods;
in float starSizes;
in uvec4 eventColors;

uniform temporalStarfieldUniforms {
  float currentTimestamp;
} temporalStarfield;

out vec4 vColor;
out vec2 vLocalPosition;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

vec4 unpackEventColor(uvec4 eventColor) {
  return vec4(eventColor) / 255.0;
}

float getStarVisibility(float currentTimestamp, float eventStart, float eventDuration) {
  float eventElapsed = currentTimestamp - eventStart;
  if (eventElapsed < 0.0) {
    return 0.0;
  }

  float eventRemaining = eventStart + eventDuration - currentTimestamp;
  if (eventRemaining < 0.0) {
    return 0.06;
  }

  float fadeIn = smoothstep(0.0, 2800.0, eventElapsed);
  float fadeOut = smoothstep(0.0, 4200.0, eventRemaining);
  return max(fadeIn * fadeOut, 0.12);
}

float getStarPulse(float currentTimestamp, float eventStart, float pulsePeriod) {
  float pulsePhase = fract(max(currentTimestamp - eventStart, 0.0) / max(pulsePeriod, 1.0));
  float pulse = 0.5 + 0.5 * sin(pulsePhase * ${TAU} - 1.5707963267948966);
  return pow(pulse, 1.7);
}

vec2 getStarPosition(vec2 position, float currentTimestamp) {
  vec2 drift = vec2(
    sin(currentTimestamp * 0.00016 + position.y * 8.0),
    cos(currentTimestamp * 0.00013 + position.x * 7.0)
  ) * 0.012;
  return position + drift;
}

vec4 getStarColor(vec4 eventColor, float visibility, float pulse) {
  float brightness = mix(0.42, 1.42, pulse);
  vec3 color = min(eventColor.rgb * brightness + vec3(pulse * 0.1), vec3(1.0));
  float alpha = visibility * mix(0.42, 1.0, pulse);
  return vec4(color, alpha);
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6);
  vec4 eventColor = unpackEventColor(eventColors);
  float visibility = getStarVisibility(
    temporalStarfield.currentTimestamp,
    eventStarts,
    eventDurations
  );
  float pulse = getStarPulse(
    temporalStarfield.currentTimestamp,
    eventStarts,
    pulsePeriods
  );
  float starSize = starSizes * max(visibility, 0.0) * mix(0.72, 2.4, pulse);
  vec2 starPosition = getStarPosition(positions, temporalStarfield.currentTimestamp);

  gl_Position = vec4(starPosition + corner * starSize, 0.0, 1.0);
  vColor = getStarColor(eventColor, visibility, pulse);
  vLocalPosition = corner;
}
`;

const STAR_FRAGMENT_GLSL_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vLocalPosition;
out vec4 fragColor;

void main() {
  float radius = length(vLocalPosition);
  if (radius > 1.0) {
    discard;
  }

  float glow = 1.0 - smoothstep(0.18, 1.0, radius);
  float core = 1.0 - smoothstep(0.0, 0.44, radius);
  float alpha = vColor.a * (glow * 0.62 + core * 0.38);
  fragColor = vec4(vColor.rgb * (0.74 + core * 0.34), alpha);
}
`;

export default class ArrowTemporalStarfieldAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Prepares Arrow <code>Timestamp</code> and <code>Duration</code> columns as relative <code>Float32</code> GPU rows, then uses them as per-star animation inputs.</p>
<div style="display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.7rem; align-items: center;">
  <label for="${RENDER_MODE_SELECTOR_ID}">Render</label>
  <select id="${RENDER_MODE_SELECTOR_ID}">
    <option value="attributes">Attributes</option>
    <option value="storage">Storage</option>
  </select>
  <span>Prepare</span>
  <strong id="${PREPARATION_PATH_ID}"></strong>
  <span>Current</span>
  <strong id="${CURRENT_TIMESTAMP_ID}"></strong>
</div>
<div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.35rem 0.7rem; margin-top: 0.65rem; font-size: 0.78rem;">
  <strong>Column</strong>
  <strong>Prepared / origin</strong>
  <code style="white-space: normal; overflow-wrap: anywhere;">positions: FixedSizeList&lt;Float32, 2&gt;</code>
  <span><code>vec2 Float32</code></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventStarts: TimestampMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${TIMESTAMP_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventDurations: DurationMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${DURATION_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">pulsePeriods: DurationMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${PULSE_PERIOD_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventColors: FixedSizeList&lt;Uint8, 4&gt;</code>
  <span><code>vec4 Uint8</code></span>
</div>
`;

  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{temporalStarfield: typeof temporalStarfield.props}>({
    temporalStarfield
  });
  activeRenderMode: TemporalStarfieldRenderMode;
  temporalStarfieldTableInput: TemporalStarfieldTableInput | null = null;
  starModel: ActiveTemporalStarfieldModel | null = null;
  renderModeSelector: HTMLSelectElement | null = null;
  preparationPathLabel: HTMLElement | null = null;
  currentTimestampLabel: HTMLElement | null = null;
  timestampOriginLabel: HTMLElement | null = null;
  durationOriginLabel: HTMLElement | null = null;
  pulsePeriodOriginLabel: HTMLElement | null = null;
  currentTimestampMilliseconds = 0;
  lastRenderSeconds: number | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.activeRenderMode = this.device.type === 'webgpu' ? 'storage' : 'attributes';
  }

  override async onInitialize(): Promise<void> {
    this.temporalStarfieldTableInput = await makeTemporalStarfieldTableInput(this.device);
    this.starModel = this.createStarModel(this.temporalStarfieldTableInput, this.activeRenderMode);
    this.initializeControls();
    this.initializeLabels();
    this.updateLabels();
  }

  override onRender({device, time}: AnimationProps): void {
    if (!this.starModel || !this.temporalStarfieldTableInput) {
      return;
    }

    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    this.currentTimestampMilliseconds =
      (this.currentTimestampMilliseconds +
        elapsedSeconds * CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND) %
      STARFIELD_CYCLE_MILLISECONDS;

    this.shaderInputs.setProps({
      temporalStarfield: {
        currentTimestamp: this.currentTimestampMilliseconds
      }
    });
    this.updateCurrentTimestampLabel(this.currentTimestampMilliseconds);

    const renderPass = device.beginRenderPass({
      clearColor: [0.005, 0.008, 0.024, 1]
    });
    this.starModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.renderModeSelector?.removeEventListener('change', this.handleRenderModeSelection);
    this.starModel?.destroy();
    this.temporalStarfieldTableInput?.destroy();
  }

  createStarModel(
    temporalStarfieldTableInput: TemporalStarfieldTableInput,
    renderMode: TemporalStarfieldRenderMode
  ): ActiveTemporalStarfieldModel {
    if (renderMode === 'storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('Temporal starfield storage rendering requires WebGPU');
      }

      return new Model(this.device, {
        id: 'arrow-temporal-starfield-storage',
        source: STAR_STORAGE_WGSL_SHADER,
        shaderLayout: STAR_STORAGE_SHADER_LAYOUT,
        shaderInputs: this.shaderInputs,
        bindings: getTemporalStarfieldStorageBindings(temporalStarfieldTableInput.table),
        topology: 'triangle-list',
        isInstanced: true,
        vertexCount: 6,
        instanceCount: STAR_COUNT,
        parameters: RENDER_PARAMETERS
      });
    }

    return new ArrowModel(this.device, {
      id: 'arrow-temporal-starfield-attributes',
      arrowGPUTable: temporalStarfieldTableInput.table,
      arrowCount: 'instance',
      source: STAR_ATTRIBUTE_WGSL_SHADER,
      vs: STAR_VERTEX_GLSL_SHADER,
      fs: STAR_FRAGMENT_GLSL_SHADER,
      shaderLayout: STAR_ATTRIBUTE_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: RENDER_PARAMETERS
    });
  }

  initializeControls(): void {
    this.renderModeSelector = document.getElementById(
      RENDER_MODE_SELECTOR_ID
    ) as HTMLSelectElement | null;
    if (!this.renderModeSelector) {
      return;
    }

    this.renderModeSelector.value = this.activeRenderMode;
    const supportsStorage = this.device.type === 'webgpu';
    this.renderModeSelector.disabled = !supportsStorage;
    const storageOption = this.renderModeSelector.querySelector(
      'option[value="storage"]'
    ) as HTMLOptionElement | null;
    if (storageOption) {
      storageOption.disabled = !supportsStorage;
    }
    this.renderModeSelector.addEventListener('change', this.handleRenderModeSelection);
  }

  initializeLabels(): void {
    this.preparationPathLabel = document.getElementById(PREPARATION_PATH_ID);
    this.currentTimestampLabel = document.getElementById(CURRENT_TIMESTAMP_ID);
    this.timestampOriginLabel = document.getElementById(TIMESTAMP_ORIGIN_ID);
    this.durationOriginLabel = document.getElementById(DURATION_ORIGIN_ID);
    this.pulsePeriodOriginLabel = document.getElementById(PULSE_PERIOD_ORIGIN_ID);
  }

  updateLabels(): void {
    if (!this.temporalStarfieldTableInput) {
      return;
    }

    const {temporalColumns} = this.temporalStarfieldTableInput;
    setTextContent(
      this.preparationPathLabel,
      this.device.type === 'webgpu' ? 'WebGPU compute' : 'CPU fallback'
    );
    setTextContent(
      this.timestampOriginLabel,
      formatTimestampOriginMilliseconds(temporalColumns.eventStarts.temporalInfo.origin)
    );
    setTextContent(
      this.durationOriginLabel,
      formatDurationOriginMilliseconds(temporalColumns.eventDurations.temporalInfo.origin)
    );
    setTextContent(
      this.pulsePeriodOriginLabel,
      formatDurationOriginMilliseconds(temporalColumns.pulsePeriods.temporalInfo.origin)
    );
    this.updateCurrentTimestampLabel(this.currentTimestampMilliseconds);
  }

  updateCurrentTimestampLabel(currentTimestampMilliseconds: number): void {
    if (!this.temporalStarfieldTableInput) {
      return;
    }

    setTextContent(
      this.currentTimestampLabel,
      formatAbsoluteTimestampMilliseconds(
        this.temporalStarfieldTableInput.timestampOriginMilliseconds + currentTimestampMilliseconds
      )
    );
  }

  handleRenderModeSelection = (): void => {
    if (!this.renderModeSelector || !this.temporalStarfieldTableInput) {
      return;
    }

    const requestedRenderMode = this.renderModeSelector.value as TemporalStarfieldRenderMode;
    const nextRenderMode =
      requestedRenderMode === 'storage' && this.device.type !== 'webgpu'
        ? 'attributes'
        : requestedRenderMode;
    this.renderModeSelector.value = nextRenderMode;
    if (nextRenderMode === this.activeRenderMode) {
      return;
    }

    const nextStarModel = this.createStarModel(this.temporalStarfieldTableInput, nextRenderMode);
    this.starModel?.destroy();
    this.starModel = nextStarModel;
    this.activeRenderMode = nextRenderMode;
  };
}

async function makeTemporalStarfieldTableInput(
  device: Device
): Promise<TemporalStarfieldTableInput> {
  const starRows = makeStarRows();
  const temporalColumns = (await prepareArrowTemporalGPUVectors(
    device,
    makeTemporalSourceVectors(starRows),
    {
      columns: {
        eventStarts: {id: 'arrow-temporal-starfield-event-starts'},
        eventDurations: {id: 'arrow-temporal-starfield-event-durations'},
        pulsePeriods: {id: 'arrow-temporal-starfield-pulse-periods'}
      }
    }
  )) as unknown as PreparedTemporalColumns;

  try {
    const positions = makeArrowGPUVector(
      device,
      makeArrowFixedSizeListVector(new arrow.Float32(), 2, starRows.positions),
      {name: 'positions', id: 'arrow-temporal-starfield-positions'}
    );
    const starSizes = makeArrowGPUVector(device, makeFloat32Vector(starRows.starSizes), {
      name: 'starSizes',
      id: 'arrow-temporal-starfield-star-sizes'
    });
    const eventColors = makeArrowGPUVector(
      device,
      makeArrowFixedSizeListVector(new arrow.Uint8(), 4, starRows.eventColors),
      {name: 'eventColors', id: 'arrow-temporal-starfield-event-colors'}
    );
    const table = new GPUTable({
      vectors: {
        positions,
        eventStarts: getPreparedScalarTemporalVector(temporalColumns.eventStarts),
        eventDurations: getPreparedScalarTemporalVector(temporalColumns.eventDurations),
        pulsePeriods: getPreparedScalarTemporalVector(temporalColumns.pulsePeriods),
        starSizes,
        eventColors
      }
    });
    const timestampOriginMilliseconds = Number(temporalColumns.eventStarts.temporalInfo.origin);

    return {
      table,
      temporalColumns,
      timestampOriginMilliseconds,
      destroy: () => table.destroy()
    };
  } catch (error) {
    for (const temporalColumn of Object.values(temporalColumns)) {
      temporalColumn.destroy();
    }
    throw error;
  }
}

function makeStarRows(): StarRows {
  const positions = new Float32Array(STAR_COUNT * 2);
  const eventStarts = new BigInt64Array(STAR_COUNT);
  const eventDurations = new BigInt64Array(STAR_COUNT);
  const pulsePeriods = new BigInt64Array(STAR_COUNT);
  const starSizes = new Float32Array(STAR_COUNT);
  const eventColors = new Uint8Array(STAR_COUNT * 4);

  for (let starIndex = 0; starIndex < STAR_COUNT; starIndex++) {
    const angle = getDeterministicUnit(starIndex, 0) * TAU;
    const radius = Math.sqrt(getDeterministicUnit(starIndex, 1));
    positions[starIndex * 2] =
      Math.cos(angle) * radius * 0.94 + (getDeterministicUnit(starIndex, 2) - 0.5) * 0.08;
    positions[starIndex * 2 + 1] =
      Math.sin(angle) * radius * 0.9 + (getDeterministicUnit(starIndex, 3) - 0.5) * 0.08;

    const eventStartOffsetMilliseconds =
      starIndex === 0
        ? 0
        : Math.floor(getDeterministicUnit(starIndex, 4) * (STARFIELD_CYCLE_MILLISECONDS - 18_000));
    eventStarts[starIndex] = BigInt(
      SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS + eventStartOffsetMilliseconds
    );
    eventDurations[starIndex] = BigInt(
      14_000 + Math.floor(getDeterministicUnit(starIndex, 5) * 28_000)
    );
    pulsePeriods[starIndex] = BigInt(900 + Math.floor(getDeterministicUnit(starIndex, 6) * 3_700));
    starSizes[starIndex] = 0.005 + getDeterministicUnit(starIndex, 7) * 0.012;

    const eventColor =
      STAR_COLORS[Math.floor(getDeterministicUnit(starIndex, 8) * STAR_COLORS.length)];
    eventColors.set(eventColor, starIndex * 4);
  }

  return {
    positions,
    eventStarts,
    eventDurations,
    pulsePeriods,
    starSizes,
    eventColors
  };
}

function makeTemporalSourceVectors(starRows: StarRows): TemporalSourceVectors {
  return {
    eventStarts: makeTemporalVector(new arrow.TimestampMillisecond(), starRows.eventStarts),
    eventDurations: makeTemporalVector(new arrow.DurationMillisecond(), starRows.eventDurations),
    pulsePeriods: makeTemporalVector(new arrow.DurationMillisecond(), starRows.pulsePeriods)
  };
}

function makeTemporalVector<T extends arrow.Timestamp | arrow.Duration>(
  type: T,
  values: BigInt64Array
): arrow.Vector<T> {
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<T>;
  return new arrow.Vector([data]);
}

function makeFloat32Vector(values: Float32Array): arrow.Vector<arrow.Float32> {
  const data = new arrow.Data(new arrow.Float32(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.Float32>;
  return new arrow.Vector([data]);
}

function getPreparedScalarTemporalVector(
  preparedTemporalColumn: PreparedArrowTemporalGPUVector
): GPUVector<arrow.Float32> {
  if (!(preparedTemporalColumn.temporal.type instanceof arrow.Float32)) {
    throw new Error('Temporal starfield requires scalar prepared Float32 temporal rows');
  }
  return preparedTemporalColumn.temporal as GPUVector<arrow.Float32>;
}

function getTemporalStarfieldStorageBindings(
  temporalStarfieldTable: GPUTable
): Record<string, GPUVector['buffer']> {
  return {
    positions: getRequiredTableVector(temporalStarfieldTable, 'positions').buffer,
    eventStarts: getRequiredTableVector(temporalStarfieldTable, 'eventStarts').buffer,
    eventDurations: getRequiredTableVector(temporalStarfieldTable, 'eventDurations').buffer,
    pulsePeriods: getRequiredTableVector(temporalStarfieldTable, 'pulsePeriods').buffer,
    starSizes: getRequiredTableVector(temporalStarfieldTable, 'starSizes').buffer,
    eventColors: getRequiredTableVector(temporalStarfieldTable, 'eventColors').buffer
  };
}

function getRequiredTableVector(temporalStarfieldTable: GPUTable, columnName: string): GPUVector {
  const gpuVector = temporalStarfieldTable.gpuVectors[columnName];
  if (!gpuVector) {
    throw new Error(`Temporal starfield table is missing ${columnName}`);
  }
  return gpuVector;
}

function getDeterministicUnit(starIndex: number, salt: number): number {
  const value = Math.sin(starIndex * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

function formatTimestampOriginMilliseconds(origin: number | bigint): string {
  return `${formatAbsoluteTimestampMilliseconds(Number(origin))} (${origin} ms)`;
}

function formatDurationOriginMilliseconds(origin: number | bigint): string {
  return `${origin} ms`;
}

function formatAbsoluteTimestampMilliseconds(timestampMilliseconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  }).format(timestampMilliseconds);
}

function setTextContent(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}
