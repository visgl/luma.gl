// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device, type RenderPass, type Sampler} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {CHART_BASELINE_DATA} from './chart-baseline';
import type {ANARIJSONSceneHandle} from './playground-scene';

export function getChartLabelPositions(
  scene: ANARIJSONSceneHandle,
  width: number,
  height: number,
  verticalOffset = 0.7
): Float32Array {
  const camera = scene.frame.getParameter('camera')!;
  const parameters = camera.getParameters();
  const position = parameters.position ?? [0, 0, 5];
  const direction = parameters.direction ?? [0, 0, -1];
  const aspect = parameters.aspect ?? width / height;
  const near = parameters.near ?? 0.05;
  const far = parameters.far ?? 500;
  const cameraHeight = parameters.height ?? 12;
  const projection =
    camera.subtype === 'orthographic'
      ? new Matrix4().ortho({
          left: (-cameraHeight * aspect) / 2,
          right: (cameraHeight * aspect) / 2,
          bottom: -cameraHeight / 2,
          top: cameraHeight / 2,
          near,
          far
        })
      : new Matrix4().perspective({fovy: parameters.fovy ?? Math.PI / 3, aspect, near, far});
  const viewProjection = projection.multiplyRight(
    new Matrix4().lookAt({
      eye: position,
      center: [position[0] + direction[0], position[1] + direction[1], position[2] + direction[2]],
      up: parameters.up ?? [0, 1, 0]
    })
  );
  const positions = new Float32Array(CHART_BASELINE_DATA.length * 4);
  const instances = Array.from(scene.instanceIdentifiers);
  for (const [index, datum] of CHART_BASELINE_DATA.entries()) {
    const instance = instances.find(
      ([, identifier]) => identifier === `point-${datum.identifier}`
    )?.[0];
    const transform = instance?.getParameter('transform');
    const worldPosition = transform
      ? new Matrix4(transform).transform([0, verticalOffset, 0, 1])
      : [0, 0, 0, 1];
    const clipPosition = viewProjection.transform(worldPosition);
    clipPosition[2] = (clipPosition[2] + clipPosition[3]) * 0.5;
    if (!instance) clipPosition[3] = -1;
    positions.set(clipPosition, index * 4);
  }
  return positions;
}

/** Example-owned raster labels, positioned from the current retained chart instances. */
export class ChartLabels {
  private readonly model: Model;
  private readonly positions: Buffer;
  private readonly uniforms: Buffer;
  private readonly texture: Texture;
  private readonly sampler: Sampler;

  constructor(device: Device) {
    const canvas = document.createElement('canvas');
    canvas.width = CHART_BASELINE_DATA.length * 128;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.font = 'bold 24px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (const [index, datum] of CHART_BASELINE_DATA.entries()) {
      context.fillStyle = 'rgba(15, 20, 35, 0.85)';
      context.fillRect(index * 128 + 4, 8, 120, 48);
      context.fillStyle = '#ffffff';
      context.fillText(datum.identifier, index * 128 + 64, 32);
    }
    this.texture = device.createTexture({
      width: canvas.width,
      height: canvas.height,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    this.texture.writeData(context.getImageData(0, 0, canvas.width, canvas.height).data);
    this.sampler = device.createSampler({minFilter: 'linear', magFilter: 'linear'});
    this.positions = device.createBuffer({
      byteLength: CHART_BASELINE_DATA.length * 16,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.uniforms = device.createBuffer({byteLength: 16, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    this.model = new Model(device, {
      id: 'chart-raster-labels',
      vertexCount: 6,
      instanceCount: CHART_BASELINE_DATA.length,
      source: `
@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> viewport: vec4<f32>;
@group(0) @binding(2) var atlas: texture_2d<f32>;
@group(0) @binding(3) var atlasSampler: sampler;
struct LabelVertex { @builtin(position) position: vec4<f32>, @location(0) coordinates: vec2<f32> };
@vertex fn vertexMain(@builtin(vertex_index) index: u32, @builtin(instance_index) label: u32) -> LabelVertex {
  let corners = array<vec2<f32>, 6>(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,-1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(1.0,-1.0), vec2<f32>(1.0,1.0));
  let corner = corners[index];
  var output: LabelVertex;
  let center = positions[label];
  output.position = vec4<f32>(center.xy + corner * vec2<f32>(96.0, 48.0) / viewport.xy * center.w, center.zw);
  output.coordinates = vec2<f32>((f32(label) + corner.x * 0.5 + 0.5) / 6.0, 0.5 - corner.y * 0.5);
  return output;
}
@fragment fn fragmentMain(input: LabelVertex) -> @location(0) vec4<f32> {
  let color = textureSample(atlas, atlasSampler, input.coordinates);
  if (color.a < 0.01) { discard; }
  return vec4<f32>(color.rgb * color.a, color.a);
}
`,
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'positions', type: 'read-only-storage', group: 0, location: 0},
          {name: 'viewport', type: 'uniform', group: 0, location: 1},
          {name: 'atlas', type: 'texture', group: 0, location: 2},
          {name: 'atlasSampler', type: 'sampler', group: 0, location: 3}
        ]
      },
      parameters: {
        depthCompare: 'less-equal',
        depthWriteEnabled: false,
        blend: true,
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
  }

  draw(pass: RenderPass, scene: ANARIJSONSceneHandle, width: number, height: number): void {
    this.positions.write(getChartLabelPositions(scene, width, height));
    this.uniforms.write(new Float32Array([width, height, 0, 0]));
    this.model.setBindings({
      positions: this.positions,
      viewport: this.uniforms,
      atlas: this.texture.view,
      atlasSampler: this.sampler
    });
    this.model.draw(pass);
  }

  destroy(): void {
    this.model.destroy();
    this.positions.destroy();
    this.uniforms.destroy();
    this.texture.destroy();
    this.sampler.destroy();
  }
}
