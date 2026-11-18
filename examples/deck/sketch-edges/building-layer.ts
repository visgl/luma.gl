// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  project32,
  type LayerContext,
  type LayerProps,
  type PickingInfo,
  type UpdateParameters
} from '@deck.gl/core';
import type {Buffer, RenderPass} from '@luma.gl/core';
import type {Model, ModelNode} from '@luma.gl/engine';
import {pbrMaterial} from '@luma.gl/shaders';
import {
  buildingPBRFragmentWGSL,
  buildingPBRFragmentGLSL,
  buildingPBRVertexGLSL,
  createPBRBuildingMesh,
  drawPBRBuildingMesh
} from '../pbr-buildings';
import {riverfrontWindows} from '../riverfront-windows';
import {makeCityMesh, type CityFeature} from '../river-district-data';

type BuildingMeshLayerProps = LayerProps & {features: readonly CityFeature[]};

/** Example-owned mesh adapter; Deck supplies projection, picking uniforms, and the render pass. */
export class BuildingMeshLayer extends Layer<BuildingMeshLayerProps> {
  static override layerName = 'BuildingMeshLayer';
  declare state: {meshNode?: ModelNode; vertices?: Buffer};

  override getAttributeManager() {
    return null;
  }
  override initializeState(): void {}

  override updateState({props, oldProps}: UpdateParameters<this>): void {
    if (this.state.meshNode && props.features === oldProps.features) return;
    this.destroyMesh();
    const mesh = makeCityMesh(props.features, true);
    const vertices = this.context.device.createBuffer({data: mesh});
    try {
      const meshNode = createPBRBuildingMesh(this.context.device, {
        shaderAssembler: this.context.shaderAssembler,
        ...this.getShaders({
          source: SOURCE,
          vs: VERTEX_SHADER,
          fs: FRAGMENT_SHADER,
          modules: [project32, picking, pbrMaterial, riverfrontWindows]
        }),
        id: `${this.id}-mesh`,
        topology: 'triangle-list',
        vertexCount: mesh.length / 13,
        bufferLayout: [
          {
            name: 'vertices',
            byteStride: 52,
            attributes: [
              {attribute: 'position', format: 'float32x3', byteOffset: 0},
              {attribute: 'normal', format: 'float32x3', byteOffset: 12},
              {attribute: 'color', format: 'float32x3', byteOffset: 24},
              {attribute: 'featureIndex', format: 'float32', byteOffset: 36},
              {attribute: 'facadeCoordinates', format: 'float32x3', byteOffset: 40}
            ]
          }
        ],
        attributes: {vertices},
        parameters: {depthCompare: 'less-equal', depthWriteEnabled: true, cullMode: 'none'}
      });
      this.setState({meshNode, vertices});
    } catch (error) {
      vertices.destroy();
      throw error;
    }
  }

  override getModels(): Model[] {
    return this.state.meshNode ? [this.state.meshNode.model] : [];
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    if (this.state.meshNode) drawPBRBuildingMesh(this.state.meshNode, renderPass);
  }
  override getPickingInfo({info}: {info: PickingInfo}): PickingInfo {
    info.object = this.props.features[info.index];
    return info;
  }
  override finalizeState(context: LayerContext): void {
    this.destroyMesh();
    super.finalizeState(context);
  }
  private destroyMesh(): void {
    this.state.meshNode?.destroy();
    this.state.vertices?.destroy();
    this.setState({meshNode: undefined, vertices: undefined});
  }
}

const SOURCE = /* wgsl */ `
struct CityVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
  @location(3) commonPosition: vec3<f32>,
  @location(4) commonNormal: vec3<f32>,
  @location(5) facade: vec3f,
  @location(2) worldPosition: vec3<f32>,
};
@vertex fn vertexMain(
  @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>,
  @location(2) color: vec3<f32>, @location(3) featureIndex: f32,
  @location(4) facadeCoordinates: vec3f
) -> CityVertex {
  var output: CityVertex;
  output.position = project_position_to_clipspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  output.color = color;
  output.facade = facadeCoordinates;
  output.commonPosition = project_position_vec3_f32(position);
  output.commonNormal = project_normal(normal);
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  output.worldPosition = position;
  return output;
}
fn buildingMottleNoise(coordinate: vec2<f32>) -> f32 {
  let cell = floor(coordinate);
  var fraction = fract(coordinate);
  fraction = fraction * fraction * (vec2<f32>(3.0) - 2.0 * fraction);
  let first = fract(sin(dot(cell, vec2<f32>(127.1, 311.7))) * 43758.5453);
  let second = fract(sin(dot(cell + vec2<f32>(1.0, 0.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let third = fract(sin(dot(cell + vec2<f32>(0.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let fourth = fract(sin(dot(cell + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
${buildingPBRFragmentWGSL}
@fragment fn fragmentMain(input: CityVertex) -> @location(0) vec4<f32> {
  let windowCoverage = riverfrontWindowCoverage(input.facade);
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4<f32>(input.pickingColor, 1.0);
  }
  let mottle = buildingMottleNoise(input.worldPosition.xy * 0.12) * 0.55 +
    buildingMottleNoise(input.worldPosition.xz * 0.12) * 0.25 +
    buildingMottleNoise(input.worldPosition.yz * 0.12) * 0.2;
  var color = shadeBuilding(input, windowCoverage, input.color * (0.84 + mottle * 0.22));
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return vec4<f32>(color, layer.opacity);
}
`;

const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec3 position;
in vec3 normal;
in vec3 color;
in float featureIndex;
in vec3 facadeCoordinates;
out vec3 facade;
out vec4 vertexColor;
out vec3 worldPosition;
void main() {
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  worldPosition = position;
  ${buildingPBRVertexGLSL}
  facade = facadeCoordinates;
  vertexColor = vec4(color, layer.opacity);
  DECKGL_FILTER_COLOR(vertexColor, geometry);
}
`;
const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
in vec4 vertexColor;
in vec3 facade;
in vec3 worldPosition;
out vec4 fragColor;
${buildingPBRFragmentGLSL}
float buildingMottleNoise(vec2 coordinate) {
  vec2 cell = floor(coordinate);
  vec2 fraction = fract(coordinate);
  fraction = fraction * fraction * (3.0 - 2.0 * fraction);
  float first = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
  float second = fract(sin(dot(cell + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float third = fract(sin(dot(cell + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float fourth = fract(sin(dot(cell + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
void main() {
  float mottle = buildingMottleNoise(worldPosition.xy * 0.12) * 0.55 +
    buildingMottleNoise(worldPosition.xz * 0.12) * 0.25 +
    buildingMottleNoise(worldPosition.yz * 0.12) * 0.2;
  fragColor = shadeBuilding(facade, vec4(vertexColor.rgb * (0.84 + mottle * 0.22), vertexColor.a));
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
