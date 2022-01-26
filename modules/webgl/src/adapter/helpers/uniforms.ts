import {UniformFormat, VertexFormat} from '@luma.gl/api';
import GL from '@luma.gl/constants';

/** Check is uniform is of sampler type */
export function isSamplerUniform(type: GL): boolean {
  return SAMPLER_TYPES.includes(type);
}

const SAMPLER_TYPES = [
  GL.SAMPLER_2D,
  GL.SAMPLER_CUBE,
  GL.SAMPLER_3D,
  GL.SAMPLER_2D_SHADOW,
  GL.SAMPLER_2D_ARRAY,
  GL.SAMPLER_2D_ARRAY_SHADOW,
  GL.SAMPLER_CUBE_SHADOW,
  GL.INT_SAMPLER_2D,
  GL.INT_SAMPLER_3D,
  GL.INT_SAMPLER_CUBE,
  GL.INT_SAMPLER_2D_ARRAY,
  GL.UNSIGNED_INT_SAMPLER_2D,
  GL.UNSIGNED_INT_SAMPLER_3D,
  GL.UNSIGNED_INT_SAMPLER_CUBE,
  GL.UNSIGNED_INT_SAMPLER_2D_ARRAY
];

// Composite types table 
const COMPOSITE_GL_TYPES: Record<string, [GL, number, string, UniformFormat, VertexFormat?]> = {
  [GL.FLOAT]: [GL.FLOAT, 1, 'float', 'f32', 'float32'],
  [GL.FLOAT_VEC2]: [GL.FLOAT, 2, 'vec2', 'vec2<f32>', 'float32x2'],
  [GL.FLOAT_VEC3]: [GL.FLOAT, 3, 'vec3', 'vec3<f32>', 'float32x3'],
  [GL.FLOAT_VEC4]: [GL.FLOAT, 4, 'vec4', 'vec4<f32>', 'float32x4'],

  [GL.INT]: [GL.INT, 1, 'int', 'i32', 'sint32'],
  [GL.INT_VEC2]: [GL.INT, 2, 'ivec2', 'vec2<i32>', 'sint32x2'],
  [GL.INT_VEC3]: [GL.INT, 3, 'ivec3', 'vec3<i32>', 'sint32x3'],
  [GL.INT_VEC4]: [GL.INT, 4, 'ivec4', 'vec4<i32>', 'sint32x4'],

  [GL.UNSIGNED_INT]: [GL.UNSIGNED_INT, 1, 'uint', 'u32', 'uint32'],
  [GL.UNSIGNED_INT_VEC2]: [GL.UNSIGNED_INT, 2, 'uvec2', 'vec2<u32>', 'uint32x2'],
  [GL.UNSIGNED_INT_VEC3]: [GL.UNSIGNED_INT, 3, 'uvec3', 'vec3<u32>', 'uint32x3'],
  [GL.UNSIGNED_INT_VEC4]: [GL.UNSIGNED_INT, 4, 'uvec4', 'vec4<u32>', 'uint32x4'],

  [GL.BOOL]: [GL.FLOAT, 1, 'bool', 'f32', 'float32x2'],
  [GL.BOOL_VEC2]: [GL.FLOAT, 2, 'bvec2', 'vec2<f32>'],
  [GL.BOOL_VEC3]: [GL.FLOAT, 3, 'bvec3', 'vec3<f32>'],
  [GL.BOOL_VEC4]: [GL.FLOAT, 4, 'bvec4', 'vec4<f32>'],

  [GL.FLOAT_MAT2]: [GL.FLOAT, 8, 'mat2', 'mat2x2<f32>'], // 4
  [GL.FLOAT_MAT2x3]: [GL.FLOAT, 8, 'mat2x3', 'mat2x3<f32>'], // 6
  [GL.FLOAT_MAT2x4]: [GL.FLOAT, 8, 'mat2x4', 'mat2x4<f32>'], // 8

  [GL.FLOAT_MAT3x2]: [GL.FLOAT, 12, 'mat3x2', 'mat3x2<f32>'], // 6
  [GL.FLOAT_MAT3]: [GL.FLOAT, 12, 'mat3', 'mat3x3<f32>'], // 9
  [GL.FLOAT_MAT3x4]: [GL.FLOAT, 12, 'mat3x4', 'mat3x4<f32>'], // 12

  [GL.FLOAT_MAT4x2]: [GL.FLOAT, 16, 'mat4x2', 'mat4x2<f32>'], // 8
  [GL.FLOAT_MAT4x3]: [GL.FLOAT, 16, 'mat4x3', 'mat4x3<f32>'], // 12
  [GL.FLOAT_MAT4]: [GL.FLOAT, 16, 'mat4', 'mat4x4<f32>'] // 16
};

/** Decomposes a composite type GL.VEC3 into a basic type (GL.FLOAT) and components (3) */
export function decodeUniformType(uniformType: GL): {format: UniformFormat, components: number, glType} {
  const typeAndSize = COMPOSITE_GL_TYPES[uniformType];
  if (!typeAndSize) {
    return null;
  }
  const [glType, components, , format] = typeAndSize;
  return {format, components, glType};
}

export function decodeAttributeType(uniformType: GL): {format: VertexFormat, components: number, glType} {
  const typeAndSize = COMPOSITE_GL_TYPES[uniformType];
  if (!typeAndSize) {
    return null;
  }
  const [glType, components, , , format] = typeAndSize;
  return {format, components, glType};
}

/** Decomposes a composite type GL.VEC3 into a basic type (GL.FLOAT) and components (3) */
export function decomposeCompositeGLType(compositeGLType) {
  const typeAndSize = COMPOSITE_GL_TYPES[compositeGLType];
  if (!typeAndSize) {
    return null;
  }
  const [type, components] = typeAndSize;
  return {type, components};
}

export function getCompositeGLType(type, components) {
  switch (type) {
    case GL.BYTE:
    case GL.UNSIGNED_BYTE:
    case GL.SHORT:
    case GL.UNSIGNED_SHORT:
      type = GL.FLOAT;
      break;
    default:
  }

  for (const glType in COMPOSITE_GL_TYPES) {
    const [compType, compComponents, name] = COMPOSITE_GL_TYPES[glType];
    if (compType === type && compComponents === components) {
      return {glType, name};
    }
  }
  return null;
}
