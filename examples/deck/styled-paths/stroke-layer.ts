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
import {
  Model,
  makeStrokeGeometry,
  type StrokeGeometryOptions,
  type StrokePosition
} from '@luma.gl/engine';
import {pathDash, type PathDashProps} from '@luma.gl/shadertools';

export type Route = {
  name: string;
  path: readonly StrokePosition[];
  color: [number, number, number];
  closed?: boolean;
};
type StrokeMeshLayerProps = LayerProps & {
  routes: readonly Route[];
  geometryOptions: StrokeGeometryOptions;
  dash: PathDashProps;
};

/** Example adapter for local, world-unit strokes. Dash changes only update uniforms. */
export class StrokeMeshLayer extends Layer<StrokeMeshLayerProps> {
  static override layerName = 'StrokeMeshLayer';
  declare state: {model?: Model; vertices?: Buffer};
  override getAttributeManager() {
    return null;
  }
  override initializeState(): void {}
  override updateState({props, oldProps}: UpdateParameters<this>): void {
    if (
      this.state.model &&
      props.routes === oldProps.routes &&
      props.geometryOptions === oldProps.geometryOptions
    )
      return;
    this.destroyMesh();
    const mesh: number[] = [];
    props.routes.forEach((route, featureIndex) => {
      const geometry = makeStrokeGeometry(route.path, {
        ...props.geometryOptions,
        closed: route.closed
      });
      const positions = geometry.attributes['POSITION']!.value;
      const coordinates = geometry.attributes['TEXCOORD_0']!.value;
      for (let index = 0; index < positions.length / 3; index++) {
        mesh.push(
          positions[index * 3],
          positions[index * 3 + 1],
          positions[index * 3 + 2],
          coordinates[index * 2],
          coordinates[index * 2 + 1],
          ...route.color,
          featureIndex
        );
      }
    });
    const vertices = this.context.device.createBuffer({
      data: mesh.length ? new Float32Array(mesh) : new Float32Array(9)
    });
    try {
      const model = new Model(this.context.device, {
        ...this.getShaders({
          source: SOURCE,
          vs: VERTEX_SHADER,
          fs: FRAGMENT_SHADER,
          modules: [project32, picking, pathDash]
        }),
        id: `${this.id}-mesh`,
        topology: 'triangle-list',
        vertexCount: mesh.length / 9,
        bufferLayout: [
          {
            name: 'vertices',
            byteStride: 36,
            attributes: [
              {attribute: 'position', format: 'float32x3', byteOffset: 0},
              {attribute: 'coordinates', format: 'float32x2', byteOffset: 12},
              {attribute: 'color', format: 'float32x3', byteOffset: 20},
              {attribute: 'featureIndex', format: 'float32', byteOffset: 32}
            ]
          }
        ],
        attributes: {vertices},
        parameters: {
          depthCompare: 'less-equal',
          depthWriteEnabled: false,
          cullMode: 'none',
          blend: true,
          blendColorOperation: 'add',
          blendColorSrcFactor: 'src-alpha',
          blendColorDstFactor: 'one-minus-src-alpha',
          blendAlphaOperation: 'add',
          blendAlphaSrcFactor: 'one',
          blendAlphaDstFactor: 'one-minus-src-alpha'
        }
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
    this.state.model?.shaderInputs.setProps({pathDash: this.props.dash});
    this.state.model?.draw(renderPass);
  }
  override getPickingInfo({info}: {info: PickingInfo}): PickingInfo {
    info.object = this.props.routes[info.index];
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
const SOURCE = /* wgsl */ `
struct StrokeVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
  @location(2) distanceAlongPath: f32,
};
@vertex fn vertexMain(@location(0) position: vec3<f32>, @location(1) coordinates: vec2<f32>,
  @location(2) color: vec3<f32>, @location(3) featureIndex: f32) -> StrokeVertex {
  var output: StrokeVertex;
  output.position = project_position_to_clipspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  output.color = color;
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  output.distanceAlongPath = coordinates.x;
  return output;
}
@fragment fn fragmentMain(input: StrokeVertex) -> @location(0) vec4<f32> {
  let coverage = pathDash_getCoverage(input.distanceAlongPath);
  if (coverage <= 0.01 || layer.opacity <= 0.0) { discard; }
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4<f32>(input.pickingColor, 1.0);
  }
  var color = input.color;
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return vec4<f32>(color, coverage * layer.opacity);
}
`;
const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec3 position;
in vec2 coordinates;
in vec3 color;
in float featureIndex;
out vec4 vertexColor;
out float distanceAlongPath;
void main() {
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vertexColor = vec4(color, layer.opacity);
  distanceAlongPath = coordinates.x;
  DECKGL_FILTER_COLOR(vertexColor, geometry);
}
`;
const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
in vec4 vertexColor;
in float distanceAlongPath;
out vec4 fragColor;
void main() {
  float coverage = pathDash_getCoverage(distanceAlongPath);
  if (coverage <= 0.01 || vertexColor.a <= 0.0) discard;
  fragColor = vec4(vertexColor.rgb, vertexColor.a * coverage);
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
