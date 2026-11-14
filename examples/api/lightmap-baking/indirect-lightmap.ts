// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Texture, type Device, type RenderPass} from '@luma.gl/core';
import {ClipSpace, type Geometry} from '@luma.gl/engine';
import type {LightmapAtlas} from '@luma.gl/engine/lighting';
import {RayTracingSceneRenderer, ScenegraphSurfaces} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core';
import type {Light} from '@luma.gl/shaders';
import type {BakeTile} from './bake-tiles';
import {makeBakingScenegraph} from './baking-scenegraph';

/** Example-owned indirect transport. Geometry and atlas positions are in world space. */
export class IndirectLightmap {
  private readonly renderer;
  private readonly adapter = new ScenegraphSurfaces();
  private readonly scene;
  private readonly positions;
  private readonly normals;
  private readonly output;
  private readonly target;
  private readonly color;
  private readonly composite;
  constructor(
    private readonly device: Device,
    private readonly geometry: Geometry,
    private readonly atlas: LightmapAtlas,
    private region?: BakeTile
  ) {
    this.renderer = new RayTracingSceneRenderer(device);
    this.scene = makeBakingScenegraph(geometry);
    const {positions, normals} = makeReceiverData(geometry, atlas, region);
    this.positions = device.createTexture({
      width: region?.width ?? atlas.width,
      height: region?.height ?? atlas.height,
      format: 'rgba32float',
      data: positions
    });
    this.normals = device.createTexture({
      width: region?.width ?? atlas.width,
      height: region?.height ?? atlas.height,
      format: 'rgba32float',
      data: normals
    });
    this.output = device.createTexture({
      width: region?.width ?? atlas.width,
      height: region?.height ?? atlas.height,
      format: 'rgba16float',
      usage: Texture.STORAGE | Texture.TEXTURE
    });
    this.color = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT
    });
    this.target = device.createFramebuffer({width: 1, height: 1, colorAttachments: [this.color]});
    this.composite = new ClipSpace(device, {
      source: /* wgsl */ `
@group(0) @binding(0) var irradiance: texture_2d<f32>;
@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let pixel = vec2i(inputs.Position.xy);
  let center = textureLoad(irradiance, pixel, 0);
  if (center.a <= 0.0) { return vec4f(0.0); }
  var sum = vec3f(0.0);
  var weightSum = 0.0;
  // Smooth only indirect irradiance inside a chart; never mix through walls or gutters.
  for (var vertical = -1; vertical <= 1; vertical++) {
    for (var horizontal = -1; horizontal <= 1; horizontal++) {
      let value = textureLoad(irradiance, pixel + vec2i(horizontal, vertical), 0);
      if (value.a == center.a) {
        let weight = f32((2 - abs(horizontal)) * (2 - abs(vertical)));
        sum += value.rgb * weight;
        weightSum += weight;
      }
    }
  }
  return vec4f(sum / weightSum, 0.0);
}`,
      shaderLayout: {
        attributes: [],
        bindings: [{name: 'irradiance', type: 'texture', group: 0, location: 0}]
      },
      bindings: {irradiance: this.output},
      colorAttachmentFormats: ['rgba16float'],
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one',
        blendAlphaSrcFactor: 'zero',
        blendAlphaDstFactor: 'one'
      }
    });
  }
  setRegion(region: BakeTile): void {
    const {positions, normals} = makeReceiverData(this.geometry, this.atlas, region);
    this.positions.writeData(positions);
    this.normals.writeData(normals);
    this.region = region;
  }
  update(lights: readonly Light[], sampleIndex: number): void {
    this.renderer.render({
      id: 'indirect-bake',
      surfaces: this.adapter.getSurfaces(this.scene),
      lights,
      framebuffer: this.target,
      camera: {
        position: [0, 1, 5],
        viewMatrix: new Matrix4().lookAt({eye: [0, 1, 5], center: [0, 1, 0]}),
        projectionMatrix: new Matrix4().perspective({
          fovy: Math.PI / 3,
          aspect: 1,
          near: 0.1,
          far: 40
        })
      },
      progressive: false,
      adaptiveResolution: false,
      resolutionScale: 1,
      imageRegion: this.region
        ? {offset: [this.region.x, this.region.y], fullSize: [this.atlas.width, this.atlas.height]}
        : undefined,
      samplingFrameIndex: sampleIndex,
      samplingSeed: 31,
      maxBounces: 1,
      shadows: true,
      emitterSampling: true
    });
    this.device.submit();
    this.renderer.encodeIrradiance('indirect-bake', this.positions, this.normals, this.output);
    this.composite.predraw(this.device.commandEncoder);
  }
  draw(renderPass: RenderPass): void {
    this.composite.draw(renderPass);
  }
  destroy(): void {
    this.composite.destroy();
    this.renderer.destroy();
    this.adapter.destroy();
    this.positions.destroy();
    this.normals.destroy();
    this.output.destroy();
    this.target.destroy();
    this.color.destroy();
  }
}

/** Rasterize generated triangle charts at texel centers; gutters remain unoccupied. */
function makeReceiverData(
  geometry: Geometry,
  atlas: LightmapAtlas,
  region = {x: 0, y: 0, width: atlas.width, height: atlas.height}
) {
  const positions = new Float32Array(region.width * region.height * 4);
  const normals = new Float32Array(positions.length);
  const coordinates = geometry.attributes[`TEXCOORD_${atlas.uvSet}`].value;
  const sourcePositions = geometry.attributes.POSITION.value;
  const sourceNormals = geometry.attributes.NORMAL.value;
  for (const chart of atlas.charts) {
    const vertices = [chart.firstVertex, chart.firstVertex + 1, chart.firstVertex + 2];
    const horizontal = vertices.map(vertex => coordinates[vertex * 2] * atlas.width);
    const vertical = vertices.map(vertex => coordinates[vertex * 2 + 1] * atlas.height);
    const determinant =
      (vertical[1] - vertical[2]) * (horizontal[0] - horizontal[2]) +
      (horizontal[2] - horizontal[1]) * (vertical[0] - vertical[2]);
    if (Math.abs(determinant) < 1e-12) continue;
    const {x, y, width, height} = chart.rectangle;
    for (
      let row = Math.max(y, region.y);
      row < Math.min(y + height, region.y + region.height);
      row++
    )
      for (
        let column = Math.max(x, region.x);
        column < Math.min(x + width, region.x + region.width);
        column++
      ) {
        const first =
          ((vertical[1] - vertical[2]) * (column + 0.5 - horizontal[2]) +
            (horizontal[2] - horizontal[1]) * (row + 0.5 - vertical[2])) /
          determinant;
        const second =
          ((vertical[2] - vertical[0]) * (column + 0.5 - horizontal[2]) +
            (horizontal[0] - horizontal[2]) * (row + 0.5 - vertical[2])) /
          determinant;
        const weights = [first, second, 1 - first - second];
        if (weights.some(weight => weight < -1e-6)) continue;
        const offset = ((row - region.y) * region.width + column - region.x) * 4;
        for (let component = 0; component < 3; component++)
          for (let corner = 0; corner < 3; corner++) {
            positions[offset + component] +=
              weights[corner] * sourcePositions[vertices[corner] * 3 + component];
            normals[offset + component] +=
              weights[corner] * sourceNormals[vertices[corner] * 3 + component];
          }
        const length = Math.hypot(normals[offset], normals[offset + 1], normals[offset + 2]) || 1;
        for (let component = 0; component < 3; component++) normals[offset + component] /= length;
        positions[offset + 3] = chart.id;
      }
  }
  return {positions, normals};
}
