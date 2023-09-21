import {glsl} from '../../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform vec2 screenXY;
uniform float radiusPixels;
uniform float zoom;
uniform float borderWidthPixels;
uniform vec4 borderColor;

vec4 magnify_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec2 pos = vec2(screenXY.x, 1.0 - screenXY.y);
  float dist = distance(texCoord * texSize, pos * texSize);
  if (dist < radiusPixels) {
    return texture2D(texture, (texCoord - pos) / zoom + pos);
  }

  if (dist <= radiusPixels + borderWidthPixels) {
    return borderColor;
  }
  return texture2D(texture, texCoord);
}
`;

const uniforms = {
  // range 0 to 1
  screenXY: [0, 0],
  radiusPixels: 200,
  zoom: 2.0,
  borderWidthPixels: 0.0,
  borderColor: [255, 255, 255, 255]
};

/**
 * Magnify - display a circle with magnify effect applied to surrounding the pixels given position
 * @param screenXY: x, y position in screen coords, both x and y is normalized and in range `[0, 1]`. `[0, 0]` is the up left corner, `[1, 1]` is the bottom right corner. Default value is `[0, 0]`.
 * @param radiusPixels: effect radius in pixels. Default value is `100`.
 * @param zoom: magnify level. Default value is `2`.
 * @param borderWidthPixels: border width of the effect circle, will not show border if value <= 0.0. Default value is `0`.
 * @param borderColor: border color of the effect circle. Default value is `[255, 255, 255, 255]`.
 */
export const magnify = {
  name: 'magnify',
  uniforms,
  fs,
  passes: [{sampler: true}]
};
