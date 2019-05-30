/**
 * @filter        Hexagonal Pixelate
 * @description   Renders the image using a pattern of hexagonal tiles. Tile colors
 *                are nearest-neighbor sampled from the centers of the tiles.
 * @param centerX The x coordinate of the pattern center.
 * @param centerY The y coordinate of the pattern center.
 * @param scale   The width of an individual tile, in pixels.
 */
const fs = `\
uniform vec2 center;
uniform float scale;

vec4 hexagonalPixelate_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec2 tex = (texCoord * texSize - center * texSize) / scale;
  tex.y /= 0.866025404;
  tex.x -= tex.y * 0.5;

  vec2 a;
  if (tex.x + tex.y - floor(tex.x) - floor(tex.y) < 1.0) {
    a = vec2(floor(tex.x), floor(tex.y));
  }
  else a = vec2(ceil(tex.x), ceil(tex.y));
  vec2 b = vec2(ceil(tex.x), floor(tex.y));
  vec2 c = vec2(floor(tex.x), ceil(tex.y));

  vec3 TEX = vec3(tex.x, tex.y, 1.0 - tex.x - tex.y);
  vec3 A = vec3(a.x, a.y, 1.0 - a.x - a.y);
  vec3 B = vec3(b.x, b.y, 1.0 - b.x - b.y);
  vec3 C = vec3(c.x, c.y, 1.0 - c.x - c.y);

  float alen = length(TEX - A);
  float blen = length(TEX - B);
  float clen = length(TEX - C);

  vec2 choice;
  if (alen < blen) {
    if (alen < clen) choice = a;
    else choice = c;
  } else {
    if (blen < clen) choice = b;
    else choice = c;
  }

  choice.x += choice.y * 0.5;
  choice.y *= 0.866025404;
  choice *= scale / texSize;

  return texture2D(texture, choice + center);
}
`;

const uniforms = {
  center: {value: [0.5, 0.5], hint: 'screenspace'},
  scale: {value: 10, min: 1, softMin: 5, softMax: 50}
};

export default {
  name: 'hexagonalPixelate',
  uniforms,
  fs,

  passes: [{sampler: true}]
};
