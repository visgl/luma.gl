// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';
import {random} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
uniform tiltShiftUniforms {
  blurRadius: f32,
  gradientRadius: f32,
  start: vec2f,
  end: vec2f,
  invert: u32,
};

@group(0) @binding(1) var<uniform> tiltShift: tiltShiftUniforms;

fn tiltShift_getDelta(vec2 texSize) -> vec2f {
  vec2 vector = normalize((tiltShift.end - tiltShift.start) * texSize);
  return tiltShift.invert ? vec2(-vector.y, vector.x) : vector;
}

fn tiltShift_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) -> vec4f {
  vec4 color = vec4(0.0);
  float total = 0.0;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  vec2 normal = normalize(vec2((tiltShift.start.y - tiltShift.end.y) * texSize.y, (tiltShift.end.x - tiltShift.start.x) * texSize.x));
  float radius = smoothstep(0.0, 1.0,
    abs(dot(texCoord * texSize - tiltShift.start * texSize, normal)) / tiltShift.gradientRadius) * tiltShift.blurRadius;

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec4 offsetColor = texture(source, texCoord + tiltShift_getDelta(texSize) / texSize * percent * radius);

    /* switch to pre-multiplied alpha to correctly blur transparent images */
    offsetColor.rgb *= offsetColor.a;

    color += offsetColor * weight;
    total += weight;
  }

  color = color / total;

  /* switch back from pre-multiplied alpha */
  color.rgb /= color.a + 0.00001;

  return color;
}
`;

const fs = /* glsl */ `\
uniform tiltShiftUniforms {
  float blurRadius;
  float gradientRadius;
  vec2 start;
  vec2 end;
  bool invert;
} tiltShift;

vec2 tiltShift_getDelta(vec2 texSize) {
  vec2 vector = normalize((tiltShift.end - tiltShift.start) * texSize);
  return tiltShift.invert ? vec2(-vector.y, vector.x) : vector;
}

vec4 tiltShift_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec4 color = vec4(0.0);
  float total = 0.0;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  vec2 normal = normalize(vec2((tiltShift.start.y - tiltShift.end.y) * texSize.y, (tiltShift.end.x - tiltShift.start.x) * texSize.x));
  float radius = smoothstep(0.0, 1.0,
    abs(dot(texCoord * texSize - tiltShift.start * texSize, normal)) / tiltShift.gradientRadius) * tiltShift.blurRadius;

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec4 offsetColor = texture(source, texCoord + tiltShift_getDelta(texSize) / texSize * percent * radius);

    /* switch to pre-multiplied alpha to correctly blur transparent images */
    offsetColor.rgb *= offsetColor.a;

    color += offsetColor * weight;
    total += weight;
  }

  color = color / total;

  /* switch back from pre-multiplied alpha */
  color.rgb /= color.a + 0.00001;

  return color;
}
`;

/**
 * Tilt Shift
 * Simulates the shallow depth of field normally encountered in close-up photography
 */
export type TiltShiftProps = {
  /** The x,y coordinate of the start of the line segment. */
  start?: [number, number];
  /** The xm y coordinate of the end of the line segment. */
  end?: [number, number];
  /** The maximum radius of the pyramid blur. */
  blurRadius?: number;
  /** The distance from the line at which the maximum blur radius is reached. */
  gradientRadius?: number;
  /** @deprecated internal shaderpass use */
  invert?: number;
};

export type TiltShiftUniforms = TiltShiftProps;

/**
 * Tilt Shift
 * Simulates the shallow depth of field normally encountered in close-up
 * photography, which makes the scene seem much smaller than it actually
 * is. This filter assumes the scene is relatively planar, in which case
 * the part of the scene that is completely in focus can be described by
 * a line (the intersection of the focal plane and the scene). An example
 * of a planar scene might be looking at a road from above at a downward
 * angle. The image is then blurred with a blur radius that starts at zero
 * on the line and increases further from the line.
 */
export const tiltShift = {
  name: 'tiltShift',
  dependencies: [random],
  source,
  fs,

  props: {} as TiltShiftProps,
  uniforms: {} as TiltShiftUniforms,
  uniformTypes: {
    blurRadius: 'f32',
    gradientRadius: 'f32',
    start: 'vec2<f32>',
    end: 'vec2<f32>',
    invert: 'i32'
  },
  propTypes: {
    blurRadius: {value: 15, min: 0, max: 50},
    gradientRadius: {value: 200, min: 0, max: 400},
    start: {value: [0, 0]},
    end: {value: [1, 1]},
    invert: {value: 0, private: true}
  },

  passes: [
    {sampler: true, uniforms: {invert: 0}},
    {sampler: true, uniforms: {invert: 1}}
  ]
} as const satisfies ShaderPass<TiltShiftProps, TiltShiftProps>;

/*
function tiltShift(startX, startY, endX, endY, blurRadius, gradientRadius) {
  var dx = endX - startX;
  var dy = endY - startY;
  var d = Math.sqrt(dx * dx + dy * dy);
  simpleShader.call(this, gl.tiltShift, {
    blurRadius: blurRadius,
    gradientRadius: gradientRadius,
    start: [startX, startY],
    end: [endX, endY],
    delta: [dx / d, dy / d],
    texSize: [this.width, this.height]
  });
  simpleShader.call(this, gl.tiltShift, {
    blurRadius: blurRadius,
    gradientRadius: gradientRadius,
    start: [startX, startY],
    end: [endX, endY],
    delta: [-dy / d, dx / d],
    texSize: [this.width, this.height]
  });

  return this;
}
*/
