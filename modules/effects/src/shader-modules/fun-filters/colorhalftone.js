/**
 * @filter        Color Halftone
 * @description   Simulates a CMYK halftone rendering of the image by multiplying pixel values
 *                with a four rotated 2D sine wave patterns, one each for cyan, magenta, yellow,
 *                and black.
 * @param centerX The x coordinate of the pattern origin.
 * @param centerY The y coordinate of the pattern origin.
 * @param angle   The rotation of the pattern in radians.
 * @param size    The diameter of a dot in pixels.
 */

// TODO pass texCoord to angle
const fs = `\
uniform vec2 center;
uniform float angle;
uniform float size;

float scale = 3.1514 / size;

float pattern(float angle, vec2 texSize, vec2 texCoord) {
  float s = sin(angle), c = cos(angle);
  vec2 tex = texCoord * texSize - center * texSize;
  vec2 point = vec2(
	c * tex.x - s * tex.y,
	s * tex.x + c * tex.y
  ) * scale;
  return (sin(point.x) * sin(point.y)) * 4.0;
}

vec4 colorHalftone_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  vec3 cmy = 1.0 - color.rgb;
  float k = min(cmy.x, min(cmy.y, cmy.z));
  cmy = (cmy - k) / (1.0 - k);
  cmy = clamp(
	cmy * 10.0 - 3.0 + vec3(
    pattern(angle + 0.26179, texSize, texCoord),
	  pattern(angle + 1.30899, texSize, texCoord),
    pattern(angle, texSize, texCoord)
  ),
	0.0,
	1.0
  );
  k = clamp(k * 10.0 - 5.0 + pattern(angle + 0.78539, texSize, texCoord), 0.0, 1.0);
  return vec4(1.0 - cmy - k, color.a);
}
`;

const uniforms = {
  center: [0.5, 0.5],
  angle: {value: 1.1, softMin: 0, softMax: Math.PI / 2},
  size: {value: 4, min: 1, softMin: 3, softMax: 20}
};

export default {
  name: 'colorHalftone',
  uniforms,
  fs,

  passes: [{filter: true}]
};
