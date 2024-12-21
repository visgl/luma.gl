// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ClipSpace
import {Device} from '@luma.gl/core';
import {Model, ModelProps} from '../model/model';
import {Geometry} from '../geometry/geometry';
import {uid} from '../utils/uid';

const CLIPSPACE_VERTEX_SHADER_WGSL = /* wgsl */ `\
struct VertexInputs {
  @location(0) clipSpacePosition: vec2<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) coordinate: vec2<f32>  
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
  outputs.Position = vec4(inputs.clipSpacePosition, 0., 1.);
  outputs.position = inputs.clipSpacePosition;
  outputs.coordinate = inputs.coordinate;
  outputs.uv = inputs.texCoord;
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

/* eslint-disable indent, no-multi-spaces */
const POSITIONS = [-1, -1, 1, -1, -1, 1, 1, 1];

/** Props for ClipSpace */
export type ClipSpaceProps = Omit<ModelProps, 'vs' | 'vertexCount' | 'geometry'>;

/**
 * A flat geometry that covers the "visible area" that the GPU renders.
 */
export class ClipSpace extends Model {
  constructor(device: Device, props: ClipSpaceProps) {
    const TEX_COORDS = POSITIONS.map(coord => (coord === -1 ? 0 : coord));

    // For WGSL we need to append the supplied fragment shader to the default vertex shader source
    if (props.source) {
      props = {...props, source: `${CLIPSPACE_VERTEX_SHADER_WGSL}\n${props.source}`};
    }

    super(device, {
      id: props.id || uid('clip-space'),
      ...props,
      vs: CLIPSPACE_VERTEX_SHADER,
      vertexCount: 4,
      geometry: new Geometry({
        topology: 'triangle-strip',
        vertexCount: 4,
        attributes: {
          clipSpacePositions: {size: 2, value: new Float32Array(POSITIONS)},
          texCoords: {size: 2, value: new Float32Array(TEX_COORDS)},
          coordinates: {size: 2, value: new Float32Array(TEX_COORDS)}
        }
      })
    });
  }
}
