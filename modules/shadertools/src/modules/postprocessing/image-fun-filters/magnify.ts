// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform magnifyUniforms {
  vec2 screenXY;
  float radiusPixels;
  float zoom;
  float borderWidthPixels;
  vec4 borderColor;
} magnify;

vec4 magnify_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 pos = vec2(magnify.screenXY.x, 1.0 - magnify.screenXY.y);
  float dist = distance(texCoord * texSize, pos * texSize);
  if (dist < magnify.radiusPixels) {
    return texture(source, (texCoord - pos) / magnify.zoom + pos);
  }

  if (dist <= magnify.radiusPixels + magnify.borderWidthPixels) {
    return magnify.borderColor;
  }
  return texture(source, texCoord);
}
`;

/**
 * Magnify - display a circle with magnify effect applied to surrounding the pixels given position
 */
export type MagnifyProps = {
  /** x, y position in screen coords, both x and y is normalized and in range `[0, 1]`. `[0, 0]` is the up left corner, `[1, 1]` is the bottom right corner. Default value is `[0, 0]`. */
  screenXY?: number[];
  /** effect radius in pixels. Default value is `100`. */
  radiusPixels?: number;
  /** magnify level. Default value is `2`. */
  zoom?: number;
  /** border width of the effect circle, will not show border if value <= 0.0. Default value is `0`. */
  borderWidthPixels?: number;
  /** border color of the effect circle. Default value is `[255, 255, 255, 255]`. */
  borderColor?: number[];
};

/**
 * Magnify - display a circle with magnify effect applied to surrounding the pixels given position
 */
export const magnify: ShaderPass<MagnifyProps, MagnifyProps> = {
  name: 'magnify',
  uniformTypes: {
    screenXY: 'vec2<f32>',
    radiusPixels: 'f32',
    zoom: 'f32',
    borderWidthPixels: 'f32',
    borderColor: 'vec4<f32>'
  },
  uniformPropTypes: {
    // range 0 to 1
    screenXY: {value: [0, 0]},
    radiusPixels: 200,
    zoom: 2.0,
    borderWidthPixels: 0.0,
    borderColor: {value: [255, 255, 255, 255]}
  },
  fs,
  passes: [{sampler: true}]
};
