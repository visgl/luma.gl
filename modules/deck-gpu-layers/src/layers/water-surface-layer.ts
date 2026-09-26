// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  COORDINATE_SYSTEM,
  Layer,
  picking,
  project32,
  type LayerContext,
  type LayerProps,
  type UpdateParameters
} from '@deck.gl/core';
import type {Buffer, RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {waterMaterial, type WaterMaterialProps} from '@luma.gl/shadertools';

export type WaterSurfaceLayerProps = LayerProps & {
  /** Borrowed packed float32x3 triangle vertices in local east/north/up meters. */
  positions: Buffer;
  vertexCount: number;
  /** Surface shading parameters. Wave coordinates are local east/north meters. */
  material?: Omit<WaterMaterialProps, 'mapping' | 'time'>;
  /** Seconds supplied by the caller. Reading a clock does not schedule additional frames. */
  time?: number | (() => number);
};

/** Flat water triangles shaded by luma.gl's shared material on either rendering backend. */
export class WaterSurfaceLayer extends Layer<WaterSurfaceLayerProps> {
  static override layerName = 'WaterSurfaceLayer';
  static override defaultProps = {
    coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
    time: 0
  };
  declare state: {model: Model};

  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    const model = new Model(device, {
      ...this.getShaders({
        source: SOURCE,
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        modules: [project32, picking, waterMaterial]
      }),
      id: `${this.id}-water`,
      topology: 'triangle-list',
      vertexCount: this.props.vertexCount,
      bufferLayout: [{name: 'position', format: 'float32x3'}],
      attributes: {position: this.props.positions},
      parameters: {
        depthCompare: 'less-equal',
        depthWriteEnabled: true,
        cullMode: 'none',
        blend: true,
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.setState({model});
  }

  override updateState({props, oldProps}: UpdateParameters<this>): void {
    if (props.positions !== oldProps.positions)
      this.state.model.setAttributes({position: props.positions});
    this.state.model.setVertexCount(props.vertexCount);
  }

  override getModels(): Model[] {
    return this.state.model ? [this.state.model] : [];
  }

  override draw({renderPass}: {renderPass: RenderPass}): void {
    this.state.model.shaderInputs.setProps({
      waterMaterial: {
        ...waterMaterial.defaultUniforms,
        mapping: 'uv',
        coordinateScale: [0.08, 0.08],
        opacity: 1,
        ...this.props.material,
        time: typeof this.props.time === 'function' ? this.props.time() : this.props.time
      },
      lighting: {
        enabled: true,
        lights: [
          {type: 'ambient', color: [255, 255, 255], intensity: 0.45},
          {
            type: 'directional',
            color: [255, 244, 218],
            intensity: 0.85,
            direction: [0.5, 0.3, -0.8]
          }
        ]
      }
    });
    this.state.model.draw(renderPass);
  }
}

const SOURCE = /* wgsl */ `
struct WaterVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) commonPosition: vec3<f32>,
  @location(1) localPosition: vec3<f32>,
};
@vertex fn vertexMain(@location(0) position: vec3<f32>) -> WaterVertex {
  let projected = project_position_to_clipspace_and_commonspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  var output: WaterVertex;
  output.position = projected.clipPosition;
  // Deck's projection uses OpenGL depth; WebGPU clips to [0, w].
  output.position.z = (output.position.z + output.position.w) * 0.5;
  output.commonPosition = projected.commonPosition.xyz;
  output.localPosition = position;
  return output;
}
@fragment fn fragmentMain(input: WaterVertex) -> @location(0) vec4<f32> {
  let pickingColor = picking_getPickingColorFromIndex(0u);
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(pickingColor)) { discard; }
    return vec4<f32>(pickingColor, 1.0);
  }
  var color = water_getColorMapped(project.cameraPosition, input.commonPosition, input.localPosition, vec3<f32>(0.0, 0.0, 1.0), input.localPosition.xy);
  if (picking.isHighlightActive > 0.5 && distance(pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = vec4<f32>(mix(color.rgb, picking.highlightColor.rgb, picking.highlightColor.a), color.a);
  }
  return vec4<f32>(color.rgb, color.a * layer.opacity);
}
`;

const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec3 position;
out vec3 commonPosition;
out vec3 localPosition;
out vec3 cameraPosition;
void main() {
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(0.0);
  vec4 commonPosition4;
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0), commonPosition4);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  commonPosition = commonPosition4.xyz;
  localPosition = position;
  cameraPosition = project.cameraPosition;
  vec4 color = vec4(1.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`;

const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
in vec3 commonPosition;
in vec3 localPosition;
in vec3 cameraPosition;
out vec4 fragColor;
void main() {
  fragColor = water_getColorMapped(cameraPosition, commonPosition, localPosition, vec3(0.0, 0.0, 1.0), localPosition.xy);
  fragColor.a *= layer.opacity;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
