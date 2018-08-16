
// Private shader module used by `Transform`

const vs = `\
attribute float transform_elementID;

// returns current elementID's texture co-ordianate
vec2 transform_getTexCoord(vec2 size) {
  float yOffset =  1. / (2. * size[1]);
  float xOffset =  1. / (2. * size[0]);
  float yIndex = floor((transform_elementID / size[0]) + yOffset );
  float xIndex = transform_elementID - (yIndex * size[0]);
  xIndex = (xIndex / size[0]) + xOffset;
  yIndex = (yIndex / size[1]) + yOffset;
  return vec2(xIndex, yIndex);
}

// returns current elementID's position
vec2 transform_getPos(vec2 size) {
  vec2 texCoord = transform_getTexCoord(size);
  // Change from [0 1] range to [-1 1]
  vec2 pos = (texCoord * (2.0, 2.0)) - (1., 1.);
  return pos;
}

// returns current elementID's pixel value
vec4 transform_getInput(sampler2D texSampler, vec2 size) {
  vec2 texCoord = transform_getTexCoord(size);
  vec4 textureColor = texture2D(texSampler, texCoord);
  return textureColor;
}
`;

export default {
  name: 'transform',
  vs,
  fs: null
};
