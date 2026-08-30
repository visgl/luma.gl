// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device, type Framebuffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {VolumeLabEngine} from './volume-lab-engine';

export type VolumeLabDisplayMode = 'anatomy' | 'threshold' | 'components';

export type VolumeLabDisplaySettings = {
  mode: VolumeLabDisplayMode;
  slices: readonly [number, number, number];
  windowCenter: number;
  windowWidth: number;
  overlayOpacity: number;
};

const VOLUME_LAB_DISPLAY_SHADER = /* wgsl */ `
struct DisplayUniforms {
  dimensions: vec4f,
  slices: vec4f,
  windowing: vec4f,
};

@group(0) @binding(0) var<storage, read> sourceValues: array<f32>;
@group(0) @binding(1) var<storage, read> sourceValidity: array<u32>;
@group(0) @binding(2) var<storage, read> thresholdMask: array<u32>;
@group(0) @binding(3) var<storage, read> morphologyMask: array<u32>;
@group(0) @binding(4) var<storage, read> componentLabels: array<u32>;
@group(0) @binding(5) var<storage, read> componentValidity: array<u32>;
@group(0) @binding(6) var<uniform> uniforms: DisplayUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) coordinates: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let coordinates = vec2f(f32((vertexIndex << 1u) & 2u), f32(vertexIndex & 2u));
  var output: VertexOutput;
  output.position = vec4f(coordinates.x * 2.0 - 1.0, 1.0 - coordinates.y * 2.0, 0.0, 1.0);
  output.coordinates = coordinates;
  return output;
}

fn getComponentColor(label: u32) -> vec3f {
  let mixed = label * 1664525u + 1013904223u;
  let paletteIndex = mixed % 6u;
  if (paletteIndex == 0u) { return vec3f(0.11, 0.83, 0.92); }
  if (paletteIndex == 1u) { return vec3f(1.0, 0.42, 0.24); }
  if (paletteIndex == 2u) { return vec3f(0.72, 0.47, 1.0); }
  if (paletteIndex == 3u) { return vec3f(0.27, 0.91, 0.56); }
  if (paletteIndex == 4u) { return vec3f(1.0, 0.76, 0.2); }
  return vec3f(0.95, 0.31, 0.68);
}

fn getVoxelCoordinates(panel: u32, coordinates: vec2f) -> vec3u {
  let width = u32(uniforms.dimensions.x);
  let height = u32(uniforms.dimensions.y);
  let depth = u32(uniforms.dimensions.z);
  let horizontalX = min(u32(coordinates.x * f32(width)), width - 1u);
  let horizontalY = min(u32(coordinates.x * f32(height)), height - 1u);
  let row = min(u32(coordinates.y * f32(height)), height - 1u);
  let layer = min(u32(coordinates.y * f32(depth)), depth - 1u);
  if (panel == 0u) {
    return vec3u(horizontalX, row, u32(uniforms.slices.z));
  }
  if (panel == 1u) {
    return vec3u(horizontalX, u32(uniforms.slices.y), layer);
  }
  return vec3u(u32(uniforms.slices.x), horizontalY, layer);
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let panelCoordinate = input.coordinates.x * 3.0;
  let panel = min(u32(panelCoordinate), 2u);
  let panelCoordinates = vec2f(fract(panelCoordinate), input.coordinates.y);
  if (panelCoordinates.x < 0.008 || panelCoordinates.x > 0.992) {
    return vec4f(0.09, 0.22, 0.3, 1.0);
  }

  let voxel = getVoxelCoordinates(panel, panelCoordinates);
  let width = u32(uniforms.dimensions.x);
  let height = u32(uniforms.dimensions.y);
  let voxelIndex = (voxel.z * height + voxel.y) * width + voxel.x;
  let displayMode = uniforms.dimensions.w;
  if (
    sourceValidity[voxelIndex] == 0u ||
    (displayMode >= 1.5 && componentValidity[voxelIndex] == 0u)
  ) {
    let hatch = step(0.52, fract((input.position.x + input.position.y) / 11.0));
    return vec4f(mix(vec3f(0.06, 0.09, 0.13), vec3f(0.2, 0.26, 0.3), hatch), 1.0);
  }

  let density = sourceValues[voxelIndex];
  let windowMinimum = uniforms.windowing.x - uniforms.windowing.y * 0.5;
  let intensity = clamp((density - windowMinimum) / uniforms.windowing.y, 0.0, 1.0);
  var color = mix(vec3f(0.012, 0.025, 0.045), vec3f(intensity), pow(intensity, 0.82));
  let overlayOpacity = uniforms.windowing.z;
  if (displayMode > 0.5 && displayMode < 1.5) {
    if (thresholdMask[voxelIndex] != 0u) {
      color = mix(color, vec3f(1.0, 0.48, 0.12), overlayOpacity);
    } else {
      color *= 0.42;
    }
  } else if (displayMode >= 1.5) {
    let label = componentLabels[voxelIndex];
    if (label != 0u && morphologyMask[voxelIndex] != 0u) {
      color = mix(color, getComponentColor(label), overlayOpacity);
    } else {
      color *= 0.34;
    }
  }

  let sliceLine =
    (panel == 0u && (
      abs(f32(voxel.x) - uniforms.slices.x) < 0.75 ||
      abs(f32(voxel.y) - uniforms.slices.y) < 0.75
    )) ||
    (panel == 1u && (
      abs(f32(voxel.x) - uniforms.slices.x) < 0.75 ||
      abs(f32(voxel.z) - uniforms.slices.z) < 0.75
    )) ||
    (panel == 2u && (
      abs(f32(voxel.y) - uniforms.slices.y) < 0.75 ||
      abs(f32(voxel.z) - uniforms.slices.z) < 0.75
    ));
  if (sliceLine) {
    color = mix(color, vec3f(0.16, 0.88, 0.96), 0.32);
  }
  return vec4f(color, 1.0);
}
`;

/** Example-local tri-planar renderer that samples LuCIM's resident buffers directly. */
export class VolumeLabRenderer {
  readonly device: Device;
  readonly uniformBuffer: Buffer;
  readonly model: Model;

  private destroyed = false;

  constructor(device: Device, engine: VolumeLabEngine) {
    this.device = device;
    this.uniformBuffer = device.createBuffer({
      id: 'lucim-volume-lab-display-uniforms',
      byteLength: 12 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    let model: Model | undefined;
    try {
      model = new Model(device, {
        id: 'lucim-volume-lab-slices',
        source: VOLUME_LAB_DISPLAY_SHADER,
        topology: 'triangle-list',
        vertexCount: 3,
        colorAttachmentFormats: [device.preferredColorFormat],
        shaderLayout: {
          attributes: [],
          bindings: [
            {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
            {name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 1},
            {name: 'thresholdMask', type: 'read-only-storage', group: 0, location: 2},
            {name: 'morphologyMask', type: 'read-only-storage', group: 0, location: 3},
            {name: 'componentLabels', type: 'read-only-storage', group: 0, location: 4},
            {name: 'componentValidity', type: 'read-only-storage', group: 0, location: 5},
            {name: 'uniforms', type: 'uniform', group: 0, location: 6}
          ]
        },
        bindings: {
          sourceValues: engine.sourceValues,
          sourceValidity: engine.sourceValidity,
          thresholdMask: engine.thresholdMask,
          morphologyMask: engine.morphologyMask,
          componentLabels: engine.componentLabels,
          componentValidity: engine.componentValidity,
          uniforms: this.uniformBuffer
        },
        parameters: {depthCompare: 'always', depthWriteEnabled: false}
      });
      this.model = model;
    } catch (error) {
      model?.destroy();
      this.uniformBuffer.destroy();
      throw error;
    }
  }

  render(
    commandEncoder: CommandEncoder,
    framebuffer: Framebuffer,
    engine: VolumeLabEngine,
    settings: VolumeLabDisplaySettings
  ): void {
    if (this.destroyed) return;
    const metadata = engine.dataset.metadata;
    this.uniformBuffer.write(
      new Float32Array([
        metadata.width,
        metadata.height,
        metadata.depth,
        getDisplayMode(settings.mode),
        settings.slices[0],
        settings.slices[1],
        settings.slices[2],
        engine.threshold,
        settings.windowCenter,
        Math.max(settings.windowWidth, 1),
        settings.overlayOpacity,
        0
      ])
    );
    this.model.predraw(commandEncoder);
    const renderPass = commandEncoder.beginRenderPass({
      id: 'lucim-volume-lab-slice-pass',
      framebuffer,
      clearColor: [0.006, 0.014, 0.027, 1]
    });
    this.model.draw(renderPass);
    renderPass.end();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.model.destroy();
    this.uniformBuffer.destroy();
  }
}

function getDisplayMode(mode: VolumeLabDisplayMode): number {
  return mode === 'anatomy' ? 0 : mode === 'threshold' ? 1 : 2;
}
