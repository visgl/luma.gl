// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  project32,
  type LayerContext,
  type LayerProps,
  type PickingInfo
} from '@deck.gl/core';
import {Buffer, type RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

/** Actual luGraph allocations consumed by a deck.gl node layer without staging or copying. */
export type LuGraphNodeLayerProps = LayerProps & {
  positions: Buffer;
  importance: Buffer;
  components: Buffer;
  distances: Buffer;
  selectionMask: Buffer;
  vertexCount: number;
};

type LuGraphNodeLayerState = {
  model: Model | null;
  styleUniforms: Buffer | null;
};

const NODE_BLEND_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

/** Direct instance vertex fetch and four independently computed resident graph attributes. */
export const LUGRAPH_DECK_NODE_SHADER = /* wgsl */ `
struct NodeStyle {
  radiusPixels: f32,
  opacity: f32,
  pickingActive: f32,
  vertexCount: f32,
};

@group(0) @binding(auto) var<storage, read> importance: array<f32>;
@group(0) @binding(auto) var<storage, read> components: array<u32>;
@group(0) @binding(auto) var<storage, read> distances: array<u32>;
@group(0) @binding(auto) var<storage, read> selectionMask: array<u32>;
@group(0) @binding(auto) var<uniform> nodeStyle: NodeStyle;

struct NodeVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) corner: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) @interpolate(flat) pickingColor: vec3<f32>,
};

fn getNodeCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  return corners[vertexIndex];
}

fn getComponentColor(component: u32) -> vec3<f32> {
  let colors = array<vec3<f32>, 6>(
    vec3<f32>(0.26, 0.79, 1.00),
    vec3<f32>(1.00, 0.58, 0.28),
    vec3<f32>(0.74, 0.48, 1.00),
    vec3<f32>(0.34, 0.92, 0.66),
    vec3<f32>(1.00, 0.41, 0.66),
    vec3<f32>(0.96, 0.86, 0.34)
  );
  return colors[component % 6u];
}

fn encodeNodePickingColor(vertex: u32) -> vec3<f32> {
  let index = vertex + 1u;
  return vec3<f32>(
    f32(index % 256u),
    f32((index / 256u) % 256u),
    f32((index / 65536u) % 256u)
  ) / 255.0;
}

@vertex fn vertexMain(
  @location(0) nodePosition: vec2<f32>,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> NodeVertexOutput {
  let corner = getNodeCorner(vertexIndex);
  let pickingColor = encodeNodePickingColor(instanceIndex);
  let selected = selectionMask[instanceIndex] != 0u;
  let reached = distances[instanceIndex] != 0xffffffffu;
  let rank = max(importance[instanceIndex] * nodeStyle.vertexCount, 0.0);
  var radius = nodeStyle.radiusPixels * clamp(sqrt(rank), 0.65, 2.3);

  let highlightedColor = picking_normalizeColor(picking.highlightedObjectColor);
  let highlighted = picking.isHighlightActive > 0.5 &&
    distance(pickingColor, highlightedColor) < 0.00001;
  if (selected || highlighted) { radius *= 1.35; }

  geometry.worldPosition = vec3<f32>(nodePosition, 0.0);
  geometry.pickingColor = pickingColor;
  var clipPosition = project_position_to_clipspace(
    vec3<f32>(nodePosition, 0.0),
    vec3<f32>(0.0),
    vec3<f32>(0.0)
  );
  // Deck's project32 matrices use OpenGL depth; WebGPU clip space requires [0, w].
  clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
  clipPosition = vec4<f32>(
    clipPosition.xy + project_pixel_size_to_clipspace(corner * radius),
    clipPosition.z,
    clipPosition.w
  );

  let componentColor = getComponentColor(components[instanceIndex]);
  let accentColor = select(componentColor, vec3<f32>(1.0, 0.78, 0.28), selected);
  let brightness = select(0.56, 1.0, reached || selected || highlighted);

  var output: NodeVertexOutput;
  output.position = clipPosition;
  output.corner = corner;
  output.color = vec4<f32>(accentColor * brightness, 0.95);
  output.pickingColor = pickingColor;
  return output;
}

@fragment fn fragmentMain(input: NodeVertexOutput) -> @location(0) vec4<f32> {
  let radiusSquared = dot(input.corner, input.corner);
  if (radiusSquared > 1.0) { discard; }
  if (nodeStyle.pickingActive > 0.5) {
    return vec4<f32>(input.pickingColor, 1.0);
  }
  let coverage = 1.0 - smoothstep(0.48, 1.0, radiusSquared);
  return vec4<f32>(input.color.rgb, input.color.a * nodeStyle.opacity * coverage);
}`;

/** Deck layer whose actual instance vertex attribute is the progressive luGraph position buffer. */
export class LuGraphNodeLayer extends Layer<LuGraphNodeLayerProps> {
  static override layerName = 'LuGraphNodeLayer';
  static override defaultProps = {parameters: NODE_BLEND_PARAMETERS};

  override getAttributeManager() {
    return null;
  }

  /** Keeps Deck picking and lifecycle counts aligned with the resident vertex allocation. */
  override getNumInstances(): number {
    return this.props.vertexCount;
  }

  override initializeState({device}: LayerContext): void {
    if (device.type !== 'webgpu') throw new Error('LuGraphNodeLayer requires WebGPU');
    const styleUniforms = device.createBuffer({
      id: `${this.id}-style-uniforms`,
      byteLength: 16,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const model = new Model(device, {
      ...this.getShaders({modules: [project32, picking], source: LUGRAPH_DECK_NODE_SHADER}),
      id: `${this.id}-model`,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: this.props.vertexCount,
      attributes: {nodePosition: this.props.positions},
      bufferLayout: [{name: 'nodePosition', format: 'float32x2', stepMode: 'instance'}],
      bindings: {
        importance: this.props.importance,
        components: this.props.components,
        distances: this.props.distances,
        selectionMask: this.props.selectionMask,
        nodeStyle: styleUniforms
      },
      parameters: NODE_BLEND_PARAMETERS
    });
    this.setState({model, styleUniforms} satisfies LuGraphNodeLayerState);
  }

  override getModels(): Model[] {
    const model = (this.state as LuGraphNodeLayerState).model;
    return model ? [model] : [];
  }

  override draw({
    renderPass,
    shaderModuleProps
  }: {
    renderPass: RenderPass;
    shaderModuleProps?: {picking?: {isActive?: number | boolean}};
  }): void {
    const {model, styleUniforms} = this.state as LuGraphNodeLayerState;
    if (!model || !styleUniforms) return;
    styleUniforms.write(
      new Float32Array([
        6,
        this.props.opacity ?? 1,
        shaderModuleProps?.picking?.isActive ? 1 : 0,
        this.props.vertexCount
      ])
    );
    model.setInstanceCount(this.props.vertexCount);
    model.draw(renderPass);
  }

  override getPickingInfo({info}: {info: PickingInfo}): PickingInfo {
    return info;
  }

  override finalizeState(context: LayerContext): void {
    const state = this.state as LuGraphNodeLayerState;
    state.model?.destroy();
    state.styleUniforms?.destroy();
    this.setState({model: null, styleUniforms: null} satisfies LuGraphNodeLayerState);
    super.finalizeState(context);
  }
}
