// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { random } from '@luma.gl/shadertools';
const source = /* wgsl */ `
uniform zoomBlurUniforms {
  center: vec2f,
  strength: f32,
};

@group(0) @binding(1) var<uniform> zoomBlur : zoomBlurUniforms;


fn zoomBlur_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) -> vec4f {
  vec4 color = vec4(0.0);
  float total = 0.0;
  vec2 toCenter = zoomBlur.center * texSize - texCoord * texSize;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = 0.0; t <= 40.0; t++) {
    float percent = (t + offset) / 40.0;
    float weight = 4.0 * (percent - percent * percent);
    vec4 offsetColor = texture(source, texCoord + toCenter * percent * zoomBlur.strength / texSize);
    color += offsetColor * weight;
    total += weight;
  }

  color = color / total;
  return color;
}
`;
const fs = /* glsl */ `
uniform zoomBlurUniforms {
  vec2 center;
  float strength;
} zoomBlur;

vec4 zoomBlur_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec4 color = vec4(0.0);
  float total = 0.0;
  vec2 toCenter = zoomBlur.center * texSize - texCoord * texSize;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = 0.0; t <= 40.0; t++) {
    float percent = (t + offset) / 40.0;
    float weight = 4.0 * (percent - percent * percent);
    vec4 offsetColor = texture(source, texCoord + toCenter * percent * zoomBlur.strength / texSize);
    color += offsetColor * weight;
    total += weight;
  }

  color = color / total;
  return color;
}
`;
/**
 * Zoom Blur
 * Blurs the image away from a certain point, which looks like radial motion blur.
 */
export const zoomBlur = {
    name: 'zoomBlur',
    dependencies: [random],
    source,
    fs,
    props: {},
    uniforms: {},
    uniformTypes: {
        center: 'vec2<f32>',
        strength: 'f32'
    },
    propTypes: {
        center: { value: [0.5, 0.5] },
        strength: { value: 0.3, min: 0, softMax: 1 }
    },
    passes: [{ sampler: true }]
};
