const LENGTH_BY_TYPE = {
  vec2: 2,
  vec3: 3,
  vec4: 4,
  bvec2: 2,
  bvec3: 3,
  bvec4: 4,
  ivec2: 2,
  ivec3: 3,
  ivec4: 4,
  mat2: 4,
  mat3: 9,
  mat4: 16
};

/**
 * Convert nested uniforms from flat array to expected shape
 * e.g. a vec2[16] uniform can be set with a Float32Array[32] in WebGL
 * but it has to be converted to Array[16] for the transpiled shader code
 */
export function normalizeUniform(value, dimensions) {
  const len = dimensions[1];
  const dim = dimensions[0];

  if (value.length !== dim) {
    const newValue = [];
    for (let i = 0; i < dim; i++) {
      newValue[i] = [];
      for (let j = 0; j < len; j++) {
        newValue[i][j] = value[i * len + j];
      }
    }
    return newValue;
  }
  return value;
}

/**
 * Given a list of uniform definitions, return source code for normalization
 */
export function getUniformNormalizer(uniforms) {
  let result = '';

  for (const name in uniforms) {
    if (uniforms[name].dimensions.length) {
      const dim = uniforms[name].dimensions[0];
      const len = LENGTH_BY_TYPE[uniforms[name].type];
      result += `uniforms.${name} = normalizeUniform(uniforms.${name}, [${dim}, ${len}])`;
    }
  }

  if (result) {
    result = `${normalizeUniform.toString()}\n${result}`;
  }

  return result;
}
