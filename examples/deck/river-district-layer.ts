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
import {Model} from '@luma.gl/engine';
import {
  heightFog,
  lambertMaterial,
  type HeightFogProps,
  type ShaderModule
} from '@luma.gl/shadertools';
import {getMeterOffsetPosition, surfaceBuffer} from '@deck.gl-community/gpu-layers';
import {makeCityMesh, type CityFeature} from './river-district-data';

type RiverDistrictLayerProps = LayerProps & {
  features: readonly CityFeature[];
  fog?: HeightFogProps;
  roughness?: number;
};

/** Shared fixture adapter using luma materials and Deck projection, picking, and capture. */
export class RiverDistrictLayer extends Layer<RiverDistrictLayerProps> {
  static override layerName = 'RiverDistrictLayer';
  static override defaultProps = {
    fog: {},
    roughness: 1,
    parameters: {depthCompare: 'less-equal', depthWriteEnabled: true, cullMode: 'none'}
  };
  declare state: {model?: Model; vertices?: Buffer};

  override getAttributeManager() {
    return null;
  }
  override initializeState(): void {}

  override updateState({props, oldProps}: UpdateParameters<this>): void {
    if (this.state.model && props.features === oldProps.features) return;
    this.destroyMesh();
    const mesh = makeCityMesh(props.features);
    const vertices = this.context.device.createBuffer({data: mesh});
    try {
      const model = new Model(this.context.device, {
        ...this.getShaders({
          source: SOURCE,
          vs: VERTEX_SHADER,
          fs: FRAGMENT_SHADER,
          modules: [project32, picking, lambertMaterial, heightFog, surfaceBuffer, districtMesh]
        }),
        id: `${this.id}-mesh`,
        topology: 'triangle-list',
        vertexCount: mesh.length / 10,
        bufferLayout: [
          {
            name: 'vertices',
            byteStride: 40,
            attributes: [
              {attribute: 'position', format: 'float32x3', byteOffset: 0},
              {attribute: 'normal', format: 'float32x3', byteOffset: 12},
              {attribute: 'color', format: 'float32x3', byteOffset: 24},
              {attribute: 'featureIndex', format: 'float32', byteOffset: 36}
            ]
          }
        ],
        attributes: {vertices},
        parameters: {depthCompare: 'less-equal', depthWriteEnabled: true, cullMode: 'none'}
      });
      this.setState({model, vertices});
    } catch (error) {
      vertices.destroy();
      throw error;
    }
  }

  override getModels(): Model[] {
    return this.state.model ? [this.state.model] : [];
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    this.state.model?.shaderInputs.setProps({
      heightFog: {...heightFog.defaultUniforms, ...this.props.fog},
      districtMesh: {
        roughness: this.props.roughness,
        cameraPosition: getMeterOffsetPosition(
          this.context.viewport,
          this.props.coordinateOrigin!,
          this.context.viewport.cameraPosition
        )
      },
      lambertMaterial: {ambient: 0.45, diffuse: 0.55},
      lighting: {
        enabled: true,
        lights: [
          {type: 'ambient', color: [255, 255, 255], intensity: 1},
          {type: 'directional', color: [255, 255, 255], intensity: 1, direction: [0.5, 0.3, -0.8]}
        ]
      }
    });
    this.state.model?.draw(renderPass);
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
    this.state.model?.destroy();
    this.state.vertices?.destroy();
    this.setState({model: undefined, vertices: undefined});
  }
}

const districtMesh = {
  name: 'districtMesh',
  bindingLayout: [{name: 'districtMesh', group: 3}],
  source: `struct DistrictMeshUniforms {
  roughness: f32,
  cameraPosition: vec3f,
};
@group(3) @binding(auto) var<uniform> districtMesh: DistrictMeshUniforms;`,
  fs: `layout(std140) uniform districtMeshUniforms {
  float roughness;
  vec3 cameraPosition;
} districtMesh;`,
  uniformTypes: {roughness: 'f32', cameraPosition: 'vec3<f32>'},
  defaultUniforms: {roughness: 1, cameraPosition: [0, 0, 0]}
} as const satisfies ShaderModule;

const SOURCE = /* wgsl */ `
struct CityVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
  @location(2) worldPosition: vec3<f32>,
  @location(3) normal: vec3<f32>,
  @location(4) commonNormal: vec3<f32>,
};
@vertex fn vertexMain(
  @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>,
  @location(2) color: vec3<f32>, @location(3) featureIndex: f32
) -> CityVertex {
  var output: CityVertex;
  output.position = project_position_to_clipspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  output.worldPosition = position;
  output.normal = normal;
  output.commonNormal = project_normal(normal);
  output.color = color;
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  return output;
}
@fragment fn fragmentMain(input: CityVertex) -> @location(0) vec4<f32> {
  if (surfaceBuffer.enabled != 0) {
    return surfaceBuffer_encode(input.commonNormal, districtMesh.roughness);
  }
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4<f32>(input.pickingColor, 1.0);
  }
  let cameraPosition = districtMesh.cameraPosition;
  var color = lighting_getLightColor2(input.color, cameraPosition, input.worldPosition, normalize(input.normal));
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return heightFog_getColor(vec4<f32>(color, layer.opacity), input.worldPosition, cameraPosition);
}
`;

const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec3 position;
in vec3 normal;
in vec3 color;
in float featureIndex;
out vec4 vertexColor;
out vec3 worldPosition;
out vec3 worldNormal;
out vec3 commonNormal;
void main() {
  worldPosition = position;
  worldNormal = normal;
  commonNormal = project_normal(normal);
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vertexColor = vec4(color, layer.opacity);
  DECKGL_FILTER_COLOR(vertexColor, geometry);
}
`;
const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
in vec4 vertexColor;
in vec3 worldPosition;
in vec3 worldNormal;
in vec3 commonNormal;
out vec4 fragColor;
void main() {
  if (surfaceBuffer.enabled != 0) {
    fragColor = surfaceBuffer_encode(commonNormal, districtMesh.roughness);
    return;
  }
  vec3 color = lighting_getLightColor(vertexColor.rgb, districtMesh.cameraPosition, worldPosition, normalize(worldNormal));
  fragColor = heightFog_getColor(vec4(color, vertexColor.a), worldPosition, districtMesh.cameraPosition);
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
