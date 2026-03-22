// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

type VoronoiManProps = {
  cellScale?: number;
  edgeWidth?: number;
  decalSize?: number;
  decalFeather?: number;
  fillColor?: [number, number, number, number];
  edgeColor?: [number, number, number, number];
  voronoiMan_faceMaskSampler?: Texture | null;
};

const voronoiManWGSL = /* wgsl */ `\
struct VoronoiManUniforms {
  cellScale: f32,
  edgeWidth: f32,
  decalSize: f32,
  decalFeather: f32,
  fillColor: vec4f,
  edgeColor: vec4f
};

@group(1) @binding(auto) var<uniform> voronoiMan: VoronoiManUniforms;
@group(1) @binding(auto) var voronoiMan_faceMaskSampler: texture_2d<f32>;
@group(1) @binding(auto) var voronoiMan_faceMaskSamplerSampler: sampler;

fn voronoiMan_hash33(position: vec3f) -> vec3f {
  let x = dot(position, vec3f(127.1, 311.7, 74.7));
  let y = dot(position, vec3f(269.5, 183.3, 246.1));
  let z = dot(position, vec3f(113.5, 271.9, 124.6));
  return fract(sin(vec3f(x, y, z)) * 43758.5453);
}

fn voronoiMan_distanceToSegment(point: vec2f, startPoint: vec2f, endPoint: vec2f) -> f32 {
  let segment = endPoint - startPoint;
  let denominator = max(dot(segment, segment), 0.0001);
  let projected = clamp(dot(point - startPoint, segment) / denominator, 0.0, 1.0);
  let closestPoint = startPoint + segment * projected;
  return distance(point, closestPoint);
}

fn voronoiMan_bodyColor(position: vec3f) -> vec3f {
  let scaledPosition = position * voronoiMan.cellScale;
  let cell = floor(scaledPosition);
  let localPosition = fract(scaledPosition);
  var nearestDistance = 999.0;
  var secondDistance = 999.0;

  for (var offsetX: i32 = -1; offsetX <= 1; offsetX = offsetX + 1) {
    for (var offsetY: i32 = -1; offsetY <= 1; offsetY = offsetY + 1) {
      for (var offsetZ: i32 = -1; offsetZ <= 1; offsetZ = offsetZ + 1) {
        let offset = vec3f(f32(offsetX), f32(offsetY), f32(offsetZ));
        let randomPoint = voronoiMan_hash33(cell + offset);
        let delta = offset + randomPoint - localPosition;
        let currentDistance = length(delta);
        if (currentDistance < nearestDistance) {
          secondDistance = nearestDistance;
          nearestDistance = currentDistance;
        } else if (currentDistance < secondDistance) {
          secondDistance = currentDistance;
        }
      }
    }
  }

  let edgeBlend = smoothstep(
    voronoiMan.edgeWidth,
    voronoiMan.edgeWidth + 0.035,
    secondDistance - nearestDistance
  );
  let fillBlend = smoothstep(0.15, 0.95, nearestDistance);
  let fillColor = mix(voronoiMan.fillColor.rgb * 1.06, voronoiMan.fillColor.rgb * 0.9, fillBlend);
  return mix(voronoiMan.edgeColor.rgb, fillColor, edgeBlend);
}

fn voronoiMan_filterColor(color: vec4f, position: vec3f, uv: vec2f) -> vec4f {
  let bodyColor = voronoiMan_bodyColor(position);
  let faceMask = textureSample(
    voronoiMan_faceMaskSampler,
    voronoiMan_faceMaskSamplerSampler,
    uv
  ).r;
  let finalColor = mix(bodyColor, color.rgb, faceMask);
  return vec4f(finalColor, color.a);
}
`;

const voronoiManGLSL = /* glsl */ `\
uniform voronoiManUniforms {
  float cellScale;
  float edgeWidth;
  float decalSize;
  float decalFeather;
  vec4 fillColor;
  vec4 edgeColor;
} voronoiMan;

uniform sampler2D voronoiMan_faceMaskSampler;

vec3 voronoiMan_hash33(vec3 position) {
  float x = dot(position, vec3(127.1, 311.7, 74.7));
  float y = dot(position, vec3(269.5, 183.3, 246.1));
  float z = dot(position, vec3(113.5, 271.9, 124.6));
  return fract(sin(vec3(x, y, z)) * 43758.5453);
}

float voronoiMan_distanceToSegment(vec2 point, vec2 startPoint, vec2 endPoint) {
  vec2 segment = endPoint - startPoint;
  float denominator = max(dot(segment, segment), 0.0001);
  float projected = clamp(dot(point - startPoint, segment) / denominator, 0.0, 1.0);
  vec2 closestPoint = startPoint + segment * projected;
  return distance(point, closestPoint);
}

vec3 voronoiMan_bodyColor(vec3 position) {
  vec3 scaledPosition = position * voronoiMan.cellScale;
  vec3 cell = floor(scaledPosition);
  vec3 localPosition = fract(scaledPosition);
  float nearestDistance = 999.0;
  float secondDistance = 999.0;

  for (int offsetX = -1; offsetX <= 1; offsetX++) {
    for (int offsetY = -1; offsetY <= 1; offsetY++) {
      for (int offsetZ = -1; offsetZ <= 1; offsetZ++) {
        vec3 offset = vec3(float(offsetX), float(offsetY), float(offsetZ));
        vec3 randomPoint = voronoiMan_hash33(cell + offset);
        vec3 delta = offset + randomPoint - localPosition;
        float currentDistance = length(delta);
        if (currentDistance < nearestDistance) {
          secondDistance = nearestDistance;
          nearestDistance = currentDistance;
        } else if (currentDistance < secondDistance) {
          secondDistance = currentDistance;
        }
      }
    }
  }

  float edgeBlend = smoothstep(
    voronoiMan.edgeWidth,
    voronoiMan.edgeWidth + 0.035,
    secondDistance - nearestDistance
  );
  float fillBlend = smoothstep(0.15, 0.95, nearestDistance);
  vec3 fillColor = mix(voronoiMan.fillColor.rgb * 1.06, voronoiMan.fillColor.rgb * 0.9, fillBlend);
  return mix(voronoiMan.edgeColor.rgb, fillColor, edgeBlend);
}

vec4 voronoiMan_filterColor(vec4 color, vec3 position, vec2 uv) {
  vec3 bodyColor = voronoiMan_bodyColor(position);
  float faceMask = texture(voronoiMan_faceMaskSampler, uv).r;
  vec3 finalColor = mix(bodyColor, color.rgb, faceMask);
  return vec4(finalColor, color.a);
}
`;

export const voronoiMan = {
  name: 'voronoiMan',
  bindingLayout: [
    {name: 'voronoiMan', group: 1},
    {name: 'voronoiMan_faceMaskSampler', group: 1}
  ],
  source: voronoiManWGSL,
  fs: voronoiManGLSL,
  defines: {
    USE_VORONOI_MAN: true
  },
  uniformTypes: {
    cellScale: 'f32',
    edgeWidth: 'f32',
    decalSize: 'f32',
    decalFeather: 'f32',
    fillColor: 'vec4<f32>',
    edgeColor: 'vec4<f32>'
  },
  getUniforms: props => props
} as const satisfies ShaderModule<VoronoiManProps>;
