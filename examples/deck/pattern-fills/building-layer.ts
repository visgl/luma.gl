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
import {patternFill, type PatternFillProps} from '@luma.gl/shaders';
import {makeCityMesh, type CityFeature} from '../river-district-data';

type BuildingMeshLayerProps = LayerProps & {
  features: readonly CityFeature[];
  pattern: PatternFillProps;
};

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
          modules: [project32, picking, pbrMaterial, riverfrontWindows, patternFill]
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
    this.state.meshNode?.model.shaderInputs.setProps({patternFill: this.props.pattern});
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
  @location(2) coordinates: vec2<f32>,
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
  output.coordinates = position.xy;
  if (abs(normal.x) > 0.5) { output.coordinates = position.yz; }
  else if (abs(normal.y) > 0.5) { output.coordinates = position.xz; }
  return output;
}
${buildingPBRFragmentWGSL}
@fragment fn fragmentMain(input: CityVertex) -> @location(0) vec4<f32> {
  let windowCoverage = riverfrontWindowCoverage(input.facade);
  let coverage = patternFill_getCoverage(input.coordinates);
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4<f32>(input.pickingColor, 1.0);
  }
  var color = shadeBuilding(input, windowCoverage, mix(input.color, input.color * 0.18, coverage));
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
out vec2 patternCoordinates;
void main() {
  patternCoordinates = position.xy;
  if (abs(normal.x) > 0.5) patternCoordinates = position.yz;
  else if (abs(normal.y) > 0.5) patternCoordinates = position.xz;
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
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
in vec2 patternCoordinates;
out vec4 fragColor;
${buildingPBRFragmentGLSL}
void main() {
  float coverage = patternFill_getCoverage(patternCoordinates);
  fragColor = shadeBuilding(facade, vec4(mix(vertexColor.rgb, vertexColor.rgb * 0.18, coverage), vertexColor.a));
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
