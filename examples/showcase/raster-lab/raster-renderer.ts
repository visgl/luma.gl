// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CanvasContext, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

export type RasterLabDisplayMode = 'ndvi' | 'red' | 'near-infrared';
export type RasterLabSmoothingMode = 'none' | 'gaussian' | 'box';

/** Canvas-backed rectangle in physical pixels, measured from the upper-left corner. */
export type RasterLabViewport = {x: number; y: number; width: number; height: number};

export type RasterLabRendererSources = {
  width: number;
  height: number;
  red: Buffer;
  nearInfrared: Buffer;
  vegetationIndex: Buffer;
  analyzedValues: Buffer;
  validity: Buffer;
  thresholdValidity: Buffer;
};

export type RasterLabDisplaySettings = {
  mode: RasterLabDisplayMode;
  smoothingMode: RasterLabSmoothingMode;
  smoothingRadius: number;
  smoothingSigma: number;
  contrast: number;
  gamma: number;
  threshold: number;
  thresholdEnabled: boolean;
  automaticThreshold: boolean;
};

const RASTER_LAB_SHADER = /* wgsl */ `
struct DisplayUniforms {
  raster: vec4f,
  presentation: vec4f,
};

@group(0) @binding(0) var<storage, read> redValues: array<f32>;
@group(0) @binding(1) var<storage, read> nearInfraredValues: array<f32>;
@group(0) @binding(2) var<storage, read> vegetationIndexValues: array<f32>;
@group(0) @binding(3) var<storage, read> analyzedValues: array<f32>;
@group(0) @binding(4) var<storage, read> validityValues: array<u32>;
@group(0) @binding(5) var<storage, read> thresholdValidityValues: array<u32>;
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

fn getVegetationColor(value: f32) -> vec3f {
  let water = vec3f(0.032, 0.19, 0.32);
  let shore = vec3f(0.56, 0.34, 0.2);
  let dryland = vec3f(0.84, 0.53, 0.23);
  let grassland = vec3f(0.49, 0.7, 0.28);
  let forest = vec3f(0.075, 0.48, 0.31);
  let canopy = vec3f(0.34, 0.85, 0.53);
  let first = mix(water, shore, smoothstep(-0.42, -0.03, value));
  let second = mix(first, dryland, smoothstep(-0.03, 0.18, value));
  let third = mix(second, grassland, smoothstep(0.15, 0.4, value));
  let fourth = mix(third, forest, smoothstep(0.37, 0.68, value));
  return mix(fourth, canopy, smoothstep(0.69, 0.95, value));
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let rasterWidth = u32(uniforms.raster.x);
  let rasterHeight = u32(uniforms.raster.y);
  let column = min(u32(input.coordinates.x * f32(rasterWidth)), rasterWidth - 1u);
  let row = min(u32(input.coordinates.y * f32(rasterHeight)), rasterHeight - 1u);
  let pixelIndex = row * rasterWidth + column;

  if (validityValues[pixelIndex] == 0u) {
    let hatch = fract((input.position.x + input.position.y) / 12.0);
    let cloud = mix(vec3f(0.14, 0.2, 0.25), vec3f(0.32, 0.4, 0.42), step(0.56, hatch));
    return vec4f(cloud, 1.0);
  }

  let displayMode = uniforms.raster.z;
  let red = redValues[pixelIndex];
  let nearInfrared = nearInfraredValues[pixelIndex];
  let analyzedValue = analyzedValues[pixelIndex];
  var color: vec3f;

  if (displayMode < 0.5) {
    color = getVegetationColor(analyzedValue);
    let shading = clamp(0.84 + (red + nearInfrared) * 0.18, 0.78, 1.08);
    color *= shading;
  } else if (displayMode < 1.5) {
    let intensity = clamp(analyzedValue * 1.8, 0.0, 1.0);
    color = mix(vec3f(0.12, 0.045, 0.055), vec3f(1.0, 0.57, 0.39), intensity);
  } else {
    let intensity = clamp(analyzedValue * 1.28, 0.0, 1.0);
    color = mix(vec3f(0.09, 0.06, 0.18), vec3f(0.57, 0.93, 0.82), intensity);
  }

  if (uniforms.presentation.y > 0.5 && thresholdValidityValues[pixelIndex] == 0u) {
    color = mix(color * 0.27, vec3f(0.07, 0.12, 0.17), 0.34);
  }

  return vec4f(color, 1.0);
}
`;

/** Presents resident source bands and NDVI results without copying any raster pixels to the CPU. */
export class RasterLabRenderer {
  private readonly device: Device;
  private readonly uniformBuffer: Buffer;
  private readonly model: Model;
  private readonly rasterWidth: number;
  private readonly rasterHeight: number;
  private destroyed = false;

  constructor(device: Device, sources: RasterLabRendererSources) {
    this.device = device;
    this.rasterWidth = sources.width;
    this.rasterHeight = sources.height;
    this.uniformBuffer = device.createBuffer({
      id: 'raster-lab-display-uniforms',
      data: new Float32Array(8),
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    try {
      this.model = new Model(device, {
        id: 'raster-lab-false-color-model',
        source: RASTER_LAB_SHADER,
        topology: 'triangle-list',
        vertexCount: 3,
        shaderLayout: {
          attributes: [],
          bindings: [
            {name: 'redValues', type: 'read-only-storage', group: 0, location: 0},
            {name: 'nearInfraredValues', type: 'read-only-storage', group: 0, location: 1},
            {name: 'vegetationIndexValues', type: 'read-only-storage', group: 0, location: 2},
            {name: 'analyzedValues', type: 'read-only-storage', group: 0, location: 3},
            {name: 'validityValues', type: 'read-only-storage', group: 0, location: 4},
            {name: 'thresholdValidityValues', type: 'read-only-storage', group: 0, location: 5},
            {name: 'uniforms', type: 'uniform', group: 0, location: 6}
          ]
        },
        bindings: {
          redValues: sources.red,
          nearInfraredValues: sources.nearInfrared,
          vegetationIndexValues: sources.vegetationIndex,
          analyzedValues: sources.analyzedValues,
          validityValues: sources.validity,
          thresholdValidityValues: sources.thresholdValidity,
          uniforms: this.uniformBuffer
        },
        parameters: {depthCompare: 'always', depthWriteEnabled: false}
      });
    } catch (error) {
      this.uniformBuffer.destroy();
      throw error;
    }
  }

  /** Clears the shared canvas once, then clips a fullscreen triangle to the map surface. */
  render(
    canvasContext: CanvasContext,
    viewport: RasterLabViewport,
    settings: RasterLabDisplaySettings
  ): void {
    if (this.destroyed) return;
    const framebuffer = canvasContext.getCurrentFramebuffer();
    const [canvasWidth, canvasHeight] = canvasContext.getDrawingBufferSize();
    const minimumX = Math.max(0, Math.floor(viewport.x));
    const minimumY = Math.max(0, Math.floor(viewport.y));
    const maximumX = Math.min(canvasWidth, Math.ceil(viewport.x + viewport.width));
    const maximumY = Math.min(canvasHeight, Math.ceil(viewport.y + viewport.height));
    const width = maximumX - minimumX;
    const height = maximumY - minimumY;
    if (width <= 0 || height <= 0) return;

    this.uniformBuffer.write(
      Float32Array.from([
        this.rasterWidth,
        this.rasterHeight,
        settings.mode === 'ndvi' ? 0 : settings.mode === 'red' ? 1 : 2,
        settings.contrast,
        settings.threshold,
        Number(settings.thresholdEnabled),
        0,
        0
      ])
    );

    const encoder = this.device.createCommandEncoder({id: 'raster-lab-presentation'});
    this.model.predraw(encoder);
    const renderPass = encoder.beginRenderPass({
      id: 'raster-lab-false-color-pass',
      framebuffer,
      clearColor: [0.012, 0.024, 0.037, 1],
      clearDepth: 1,
      clearStencil: false
    });
    const rectangle: [number, number, number, number] = [minimumX, minimumY, width, height];
    renderPass.setParameters({viewport: rectangle, scissorRect: rectangle});
    this.model.draw(renderPass);
    renderPass.end();
    this.device.submit(encoder.finish());
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.model.destroy();
    this.uniformBuffer.destroy();
  }
}
