const fs = `\
uniform vec2 position;
uniform float radiusPixels;
uniform float zoom;
uniform float borderWidthPixels;
uniform vec4 borderColor;

vec4 magnify_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec2 pos = vec2(position.x, 1.0 - position.y);
  float dist = distance(texCoord * texSize, pos * texSize);
  if (dist < radiusPixels) {
    return texture2D(texture, (texCoord - pos) / zoom + pos);
  }

  if (borderWidthPixels > 0.0 && dist <= radiusPixels + borderWidthPixels) {
    return borderColor;
  }
  return texture2D(texture, texCoord);
}
`;

const uniforms = {
  // range 0 to 1
  position: [0, 0],
  radiusPixels: 200,
  zoom: 2.0,
  borderWidthPixels: 0.0,
  borderColor: [255, 255, 255, 255],
};

export const MagnifyEffect = {
  name: 'magnify',
  uniforms,
  fs,
  passes: [{sampler: true}],
};