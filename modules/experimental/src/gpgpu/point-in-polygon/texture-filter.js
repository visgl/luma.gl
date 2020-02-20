// shader module to perform texture filtering

const vs = `
uniform vec4 textureFilter_uBoundingBox; //[xMin, yMin, xSize, ySize]
uniform sampler2D textureFilter_uTexture;
vec2 textureFilter_filter(vec2 position) {
  vec2 filterValueIndex;
  // Transfrom 'pos' to texture coordinate
  vec2 pos = position - textureFilter_uBoundingBox.xy;
  pos = pos / textureFilter_uBoundingBox.zw;
  filterValueIndex.y = float(gl_VertexID);
  if (pos.x < 0. || pos.x > 1. || pos.y < 0. || pos.y > 1.) {
    filterValueIndex.x = -1.;
  } else {
    // Red channel is ID, Green channel inside/outside polygon
    vec4 color = texture(textureFilter_uTexture, pos.xy);
    filterValueIndex.x = color.g > 0. ? color.r : -1.;
  }
  return filterValueIndex;
}
`;

function getUniforms(opts = {}) {
  const uniforms = {};
  if (opts.boundingBox) {
    const [xMin, yMin, xMax, yMax] = opts.boundingBox;
    uniforms.textureFilter_uBoundingBox = [xMin, yMin, xMax - xMin, yMax - yMin];
  }
  if (opts.texture) {
    uniforms.textureFilter_uTexture = opts.texture;
  }
  return uniforms;
}

export default {
  name: 'texture-filter',
  vs,
  getUniforms
};
