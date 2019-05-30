/**
 * @filter        Dot Screen
 * @description   Simulates a black and white halftone rendering of the image by multiplying
 *                pixel values with a rotated 2D sine wave pattern.
 * @param centerX The x coordinate of the pattern origin.
 * @param centerY The y coordinate of the pattern origin.
 * @param angle   The rotation of the pattern in radians.
 * @param size    The diameter of a dot in pixels.
 */
const fs = `\
uniform vec2 center;
uniform float angle;
uniform float size;

float pattern(vec2 texSize, vec2 texCoord) {
  float scale = 3.1415 / size;

  float s = sin(angle), c = cos(angle);
  vec2 tex = texCoord * texSize - center * texSize;
  vec2 point = vec2(
    c * tex.x - s * tex.y,
    s * tex.x + c * tex.y
  ) * scale;
  return (sin(point.x) * sin(point.y)) * 4.0;
}

vec4 dotScreen_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  float average = (color.r + color.g + color.b) / 3.0;
  return vec4(vec3(average * 10.0 - 5.0 + pattern(texSize, texCoord)), color.a);
}
`;

const uniforms = {
  center: [0.5, 0.5],
  angle: {value: 1.1, softMin: 0, softMax: Math.PI / 2},
  size: {value: 3, min: 1, softMin: 3, softMax: 20}
};

export default {
  name: 'dotScreen',
  uniforms,
  fs,

  passes: [{filter: true}]
};
