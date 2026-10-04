// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  _GlobeViewport,
  type LayerContext,
  type LayerProps,
  type Viewport
} from '@deck.gl/core';
import type {RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {clouds, type CloudProps, type ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, type NumberArray3} from '@math.gl/core';
import {getMeterOffsetPosition} from '../projection/meter-offset-position';

export type CloudLayerProps = LayerProps & CloudProps;

const cloudView = {
  name: 'cloudView',
  uniformTypes: {
    camera: 'vec3<f32>',
    lowerLeft: 'vec3<f32>',
    lowerRight: 'vec3<f32>',
    upperLeft: 'vec3<f32>',
    opacity: 'f32'
  },
  source: `struct cloudViewUniforms {
    camera: vec3f,
    lowerLeft: vec3f,
    lowerRight: vec3f,
    upperLeft: vec3f,
    opacity: f32,
  }; @group(3) @binding(auto) var<uniform> cloudView: cloudViewUniforms;`,
  vs: `layout(std140) uniform cloudViewUniforms {
    vec3 camera;
    vec3 lowerLeft;
    vec3 lowerRight;
    vec3 upperLeft;
    float opacity;
  } cloudView;`,
  fs: `layout(std140) uniform cloudViewUniforms {
    vec3 camera;
    vec3 lowerLeft;
    vec3 lowerRight;
    vec3 upperLeft;
    float opacity;
  } cloudView;`
} as const satisfies ShaderModule;

/** Animated sky clouds for flat-map perspective views. Place after celestial layers and before
 * opaque scene layers. The cloud slab remains at far depth and never writes the depth buffer.
 * Cloud uniforms use local metres relative to coordinateOrigin; globe views are not supported.
 */
export class CloudLayer extends Layer<CloudLayerProps> {
  static override layerName = 'CloudLayer';
  static override defaultProps = {
    cover: {type: 'number', value: 0.45, min: 0, max: 1},
    altitude: {type: 'number', value: 1000},
    thickness: {type: 'number', value: 1200, min: 1},
    scale: {type: 'number', value: 1400, min: 1},
    density: {type: 'number', value: 0.005, min: 0},
    time: {type: 'number', value: 0},
    velocity: [14, 4],
    sunDirection: [0, 0.8, 0.6],
    sunColor: [1, 0.95, 0.85],
    pickable: false
  };
  declare state: {model: Model};
  override getAttributeManager() {
    return null;
  }
  override initializeState({device}: LayerContext): void {
    this.setState({
      model: new Model(device, {
        ...this.getShaders({
          source: SOURCE,
          vs: VERTEX_SHADER,
          fs: FRAGMENT_SHADER,
          modules: [picking, clouds, cloudView]
        }),
        id: `${this.id}-clouds`,
        topology: 'triangle-list',
        vertexCount: 3,
        parameters: {
          depthCompare: 'less-equal',
          depthWriteEnabled: false,
          cullMode: 'none',
          blend: true,
          blendColorSrcFactor: 'one',
          blendColorDstFactor: 'one-minus-src-alpha',
          blendAlphaSrcFactor: 'one',
          blendAlphaDstFactor: 'one-minus-src-alpha'
        }
      })
    });
  }
  override getModels(): Model[] {
    return this.state.model ? [this.state.model] : [];
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    const viewport = this.context.viewport;
    if (
      viewport instanceof _GlobeViewport ||
      viewport.projectionMatrix[15] !== 0 ||
      !this.props.cover
    )
      return;
    this.state.model.shaderInputs.setProps({
      clouds: {
        cover: this.props.cover,
        altitude: this.props.altitude,
        thickness: this.props.thickness,
        scale: this.props.scale,
        density: this.props.density,
        time: this.props.time,
        velocity: this.props.velocity,
        sunDirection: this.props.sunDirection,
        sunColor: this.props.sunColor
      },
      cloudView: {
        ...getCloudViewUniforms(viewport, this.props.coordinateOrigin),
        opacity: this.props.opacity
      }
    });
    this.state.model.draw(renderPass);
  }
  override finalizeState(context: LayerContext): void {
    this.state.model?.destroy();
    super.finalizeState(context);
  }
}

/** Unnormalised perspective rays interpolate linearly across the screen. */
export function getCloudViewUniforms(viewport: Viewport, coordinateOrigin: Readonly<NumberArray3>) {
  const inverseProjection = new Matrix4(viewport.projectionMatrix).invert();
  const inverseView = new Matrix4(viewport.viewMatrix).invert();
  const units = viewport.getDistanceScales([...coordinateOrigin]).unitsPerMeter;
  function getRay(horizontal: number, vertical: number): NumberArray3 {
    const position = inverseProjection.transform([horizontal, vertical, 1, 1]);
    const direction = inverseView.transform([position[0], position[1], position[2], 0]);
    return [direction[0] / units[0], direction[1] / units[1], direction[2] / units[2]];
  }
  return {
    camera: getMeterOffsetPosition(viewport, coordinateOrigin, viewport.cameraPosition),
    lowerLeft: getRay(-1, -1),
    lowerRight: getRay(1, -1),
    upperLeft: getRay(-1, 1)
  };
}

const SOURCE = /* wgsl */ `
struct CloudVertex { @builtin(position) position: vec4f, @location(0) direction: vec3f };
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> CloudVertex {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  let corner = positions[index];
  let fraction = corner * 0.5 + 0.5;
  var output: CloudVertex;
  output.position = vec4f(corner, 1.0, 1.0);
  output.direction = cloudView.lowerLeft + fraction.x * (cloudView.lowerRight - cloudView.lowerLeft)
    + fraction.y * (cloudView.upperLeft - cloudView.lowerLeft);
  return output;
}
@fragment fn fragmentMain(input: CloudVertex) -> @location(0) vec4f {
  if (picking.isActive > 0.5) { discard; }
  return clouds_getColor(cloudView.camera, normalize(input.direction)) * cloudView.opacity;
}`;
const VERTEX_SHADER = /* glsl */ `#version 300 es
out vec3 direction;
void main() {
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 corner = positions[gl_VertexID];
  vec2 fraction = corner * 0.5 + 0.5;
  gl_Position = vec4(corner, 1.0, 1.0);
  direction = cloudView.lowerLeft + fraction.x * (cloudView.lowerRight - cloudView.lowerLeft)
    + fraction.y * (cloudView.upperLeft - cloudView.lowerLeft);
}`;
const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
in vec3 direction; out vec4 fragColor;
void main() {
  if (picking.isActive > 0.5) discard;
  fragColor = clouds_getColor(cloudView.camera, normalize(direction)) * cloudView.opacity;
}`;
