// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ClipSpace
import {Device} from '@luma.gl/core';
import {Model, ModelProps} from '../model/model';
import {Geometry} from '../geometry/geometry';

const CLIPSPACE_VERTEX_SHADER_WGSL = /* wgsl */ `\
struct VertexInput {
  aClipSpacePosition: vec2<f32>;
  aTexCoord: vec2<f32>;
  aCoordinate: vec2<f32>;  
}

struct FragmentInput {
  @builtin(position) Position : vec4<f32>;
  @location(0) position : vec2<f32>;
  @location(1) coordinate : vec2<f32>;
  @location(2) uv : vec2<f32>;
};

@stage(vertex)
fn vertexMain(input: VertexInput) -> FragmentInput {
  var output: FragmentInput;
  output.Position = vec4(aClipSpacePosition, 0., 1.);
  output.position = input.aClipSpacePosition;
  output.coordinate = input.aCoordinate;
  output.uv = aTexCoord;
}
`;

const CLIPSPACE_VERTEX_SHADER = /* glsl */ `\
#version 300 es
in vec2 aClipSpacePosition;
in vec2 aTexCoord;
in vec2 aCoordinate;

out vec2 position;
out vec2 coordinate;
out vec2 uv;

void main(void) {
  gl_Position = vec4(aClipSpacePosition, 0., 1.);
  position = aClipSpacePosition;
  coordinate = aCoordinate;
  uv = aTexCoord;
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
      props = {...props, source: `${CLIPSPACE_VERTEX_SHADER_WGSL}\m${props.source}`};
    }

    super(device, {
      ...props,
      source: CLIPSPACE_VERTEX_SHADER_WGSL,
      vs: CLIPSPACE_VERTEX_SHADER,
      vertexCount: 4,
      geometry: new Geometry({
        topology: 'triangle-strip',
        vertexCount: 4,
        attributes: {
          aClipSpacePosition: {size: 2, value: new Float32Array(POSITIONS)},
          aTexCoord: {size: 2, value: new Float32Array(TEX_COORDS)},
          aCoordinate: {size: 2, value: new Float32Array(TEX_COORDS)}
        }
      })
    });
  }
}
