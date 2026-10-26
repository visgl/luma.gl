// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// ClipSpace
import {Device} from '@luma.gl/core';
import {Model, ModelProps} from '../model/model';
import {Geometry} from '../geometry/geometry';
import {uid} from '../utils/uid';

const CLIPSPACE_VERTEX_SHADER_WGSL = /* wgsl */ `\
struct VertexInputs {
  @location(0) clipSpacePositions: vec2<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) coordinates: vec2<f32>
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) position : vec2<f32>,
  @location(1) coordinate : vec2<f32>,
  @location(2) uv : vec2<f32>
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  outputs.Position = vec4(inputs.clipSpacePositions, 0., 1.);
  outputs.position = inputs.clipSpacePositions;
  outputs.coordinate = inputs.coordinates;
  outputs.uv = inputs.texCoords;
  return outputs;
}
`;

const CLIPSPACE_VERTEX_SHADER = /* glsl */ `\
#version 300 es
in vec2 clipSpacePositions;
in vec2 texCoords;
in vec2 coordinates;

out vec2 position;
out vec2 coordinate;
out vec2 uv;

void main(void) {
  gl_Position = vec4(clipSpacePositions, 0., 1.);
  position = clipSpacePositions;
  coordinate = coordinates;
  uv = texCoords;
}
`;

const QUAD_POSITIONS = [-1, -1, 1, -1, -1, 1, 1, 1];

const TRIANGLE_POSITIONS = [-1, -1, 3, -1, -1, 3];

/** Props for ClipSpace */
export type ClipSpaceProps = Omit<ModelProps, 'vs' | 'vertexCount' | 'geometry'> & {
  /** Fullscreen geometry. Defaults to the two-triangle quad. */
  geometryType?: 'quad' | 'triangle';
};

/**
 * A flat geometry that covers the "visible area" that the GPU renders.
 */
export class ClipSpace extends Model {
  constructor(device: Device, props: ClipSpaceProps) {
    const {geometryType = 'quad', ...modelProps} = props;
    const positions = geometryType === 'triangle' ? TRIANGLE_POSITIONS : QUAD_POSITIONS;
    const textureCoordinates = positions.map(position => (position + 1) / 2);
    const vertexCount = positions.length / 2;

    // For WGSL we need to append the supplied fragment shader to the default vertex shader source
    if (modelProps.source) {
      modelProps.source = `${CLIPSPACE_VERTEX_SHADER_WGSL}\n${modelProps.source}`;
    }

    super(device, {
      id: modelProps.id || uid('clip-space'),
      ...modelProps,
      vs: CLIPSPACE_VERTEX_SHADER,
      vertexCount,
      geometry: new Geometry({
        topology: geometryType === 'triangle' ? 'triangle-list' : 'triangle-strip',
        vertexCount,
        attributes: {
          clipSpacePositions: {size: 2, value: new Float32Array(positions)},
          texCoords: {size: 2, value: new Float32Array(textureCoordinates)},
          coordinates: {size: 2, value: new Float32Array(textureCoordinates)}
        }
      })
    });
  }
}
