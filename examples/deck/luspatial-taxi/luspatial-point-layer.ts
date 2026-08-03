// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  project32,
  type Color,
  type LayerContext,
  type LayerProps,
  type PickingInfo
} from '@deck.gl/core';
import {Buffer, type RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {DrawCommandBuffer} from '@luma.gl/experimental';

export type LuSpatialPointLayerProps = LayerProps & {
  longitudeLatitudes: Buffer;
  visibleIds: Buffer;
  drawCommands: DrawCommandBuffer;
  commandIndex: number;
  color: Color;
  radiusPixels: number;
};

type LuSpatialPointLayerState = {
  model: Model | null;
  styleUniforms: Buffer | null;
};

const POINT_BLEND_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

const LUSPATIAL_POINT_SHADER = /* wgsl */ `
struct PointStyleUniforms {
  color: vec4<f32>,
  radiusPixels: f32,
  opacity: f32,
  pickingActive: f32,
  _padding: f32,
};

@group(0) @binding(auto) var<storage, read> longitudeLatitudes: array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(auto) var<uniform> pointStyle: PointStyleUniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) pointCoordinate: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) @interpolate(flat) pickingColor: vec3<f32>,
};

fn getPointCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  return corners[vertexIndex];
}

fn encodePickingColor(sourceIndex: u32) -> vec3<f32> {
  let colorIndex = sourceIndex + 1u;
  return vec3<f32>(
    f32(colorIndex % 256u),
    f32((colorIndex / 256u) % 256u),
    f32((colorIndex / 65536u) % 256u)
  ) / 255.0;
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let longitudeLatitude = longitudeLatitudes[sourceIndex];
  let pointCorner = getPointCorner(vertexIndex);
  let pickingColor = encodePickingColor(sourceIndex);
  let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
  let highlighted = picking.isHighlightActive > 0.5 &&
    distance(pickingColor, highlightedObjectColor) < 0.00001;
  let radiusPixels = pointStyle.radiusPixels * select(1.0, 1.65, highlighted);

  geometry.worldPosition = vec3<f32>(longitudeLatitude, 0.0);
  geometry.pickingColor = pickingColor;
  var clipPosition = project_position_to_clipspace(
    vec3<f32>(longitudeLatitude, 0.0),
    vec3<f32>(0.0),
    vec3<f32>(0.0)
  );
  let clipOffset = project_pixel_size_to_clipspace(pointCorner * radiusPixels);
  clipPosition = vec4<f32>(clipPosition.xy + clipOffset, clipPosition.z, clipPosition.w);

  var output: VertexOutput;
  output.position = clipPosition;
  output.pointCoordinate = pointCorner;
  output.color = select(pointStyle.color, vec4<f32>(1.0, 0.55, 0.12, 1.0), highlighted);
  output.pickingColor = pickingColor;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let radiusSquared = dot(input.pointCoordinate, input.pointCoordinate);
  if (radiusSquared > 1.0) { discard; }
  if (pointStyle.pickingActive > 0.5) {
    return vec4<f32>(input.pickingColor, 1.0);
  }
  let coverage = 1.0 - smoothstep(0.18, 1.0, radiusSquared);
  let alpha = input.color.a * pointStyle.opacity * coverage;
  return vec4<f32>(input.color.rgb, alpha);
}`;

/** WebGPU-only Deck layer that renders GPU-selected source IDs with an indirect draw. */
export class LuSpatialPointLayer extends Layer<LuSpatialPointLayerProps> {
  static override layerName = 'LuSpatialPointLayer';
  static override defaultProps = {parameters: POINT_BLEND_PARAMETERS};

  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    if (device.type !== 'webgpu') throw new Error('LuSpatialPointLayer requires WebGPU');
    const styleUniforms = device.createBuffer({
      id: `${this.id}-style-uniforms`,
      byteLength: 32,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const model = new Model(device, {
      ...this.getShaders({modules: [project32, picking], source: LUSPATIAL_POINT_SHADER}),
      id: `${this.id}-model`,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: 0,
      bufferLayout: [],
      bindings: {
        longitudeLatitudes: this.props.longitudeLatitudes,
        visibleIds: this.props.visibleIds,
        pointStyle: styleUniforms
      },
      parameters: POINT_BLEND_PARAMETERS
    });
    this.setState({model, styleUniforms} satisfies LuSpatialPointLayerState);
  }

  override getModels(): Model[] {
    const model = (this.state as LuSpatialPointLayerState).model;
    return model ? [model] : [];
  }

  override draw({
    renderPass,
    shaderModuleProps
  }: {
    renderPass: RenderPass;
    shaderModuleProps?: {picking?: {isActive?: number | boolean}};
  }): void {
    const {model, styleUniforms} = this.state as LuSpatialPointLayerState;
    if (!model || !styleUniforms) return;
    const [red, green, blue, alpha = 255] = this.props.color;
    const zoom = this.context.viewport.zoom ?? 12;
    const zoomRadiusScale = clamp(2 ** ((zoom - 12) * 0.2), 0.8, 2.2);
    styleUniforms.write(
      new Float32Array([
        red / 255,
        green / 255,
        blue / 255,
        alpha / 255,
        this.props.radiusPixels * zoomRadiusScale,
        this.props.opacity ?? 1,
        shaderModuleProps?.picking?.isActive ? 1 : 0,
        0
      ])
    );
    model.setInstanceCount(0);
    model.draw(renderPass);
    this.props.drawCommands.draw(renderPass, this.props.commandIndex);
  }

  override getPickingInfo({info}: {info: PickingInfo}): PickingInfo {
    return info;
  }

  override finalizeState(context: LayerContext): void {
    const state = this.state as LuSpatialPointLayerState;
    state.model?.destroy();
    state.styleUniforms?.destroy();
    this.setState({model: null, styleUniforms: null} satisfies LuSpatialPointLayerState);
    super.finalizeState(context);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
