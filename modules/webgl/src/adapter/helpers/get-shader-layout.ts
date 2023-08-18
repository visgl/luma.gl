// luma.gl, MIT license

import type {
  ShaderLayout,
  AttributeLayout,
  UniformBinding,
  UniformBlockBinding,
  AttributeBinding,
  VaryingBinding,
  AccessorObject,
  BufferMapping,
  VertexFormat
} from '@luma.gl/core';
import {log} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {isWebGL2} from '../../context/context/webgl-checks';
import {Accessor} from '../../classic/accessor'; // TODO - should NOT depend on classic API
import {decodeUniformType, decodeAttributeType} from './uniforms';
import {getVertexFormat} from '../converters/vertex-formats';
import {isSamplerUniform} from './uniforms';

/**
 * Extract metadata describing binding information for a program's shaders
 * Note: `linkProgram()` needs to have been called
 * (although linking does not need to have been successful).
 */
export function getShaderLayout(gl: WebGLRenderingContext, program: WebGLProgram): ShaderLayout {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: []
  };

  const attributes: AttributeBinding[] = readAttributeBindings(gl, program);
  for (const attribute of attributes) {
    // TODO - multicolumn attributes like a matrix4 can be up to 16 elts...
    const size = Math.min(attribute.accessor.size, 4);
    const format =
      // attribute.accessor.format ||
      getVertexFormat(attribute.accessor.type || GL.FLOAT, size);
    shaderLayout.attributes.push({
      name: attribute.name,
      location: attribute.location,
      format,
      stepMode: attribute.accessor.divisor === 1 ? 'instance' : 'vertex'
    });
  }

  // Uniform blocks
  const uniformBlocks: UniformBlockBinding[] = readUniformBlocks(gl, program);
  for (const uniformBlock of uniformBlocks) {
    const uniforms = uniformBlock.uniforms.map(uniform => ({
      name: uniform.name,
      format: uniform.format,
      byteOffset: uniform.byteOffset,
      byteStride: uniform.byteStride,
      arrayLength: uniform.arrayLength
    }));
    shaderLayout.bindings.push({
      type: 'uniform',
      name: uniformBlock.name,
      location: uniformBlock.location,
      visibility: (uniformBlock.vertex ? 0x1 : 0) & (uniformBlock.fragment ? 0x2 : 0),
      minBindingSize: uniformBlock.byteLength,
      uniforms
    });
  }

  const uniforms: UniformBinding[] = readUniformBindings(gl, program);
  let textureUnit = 0;
  for (const uniform of uniforms) {
    if (isSamplerUniform(uniform.type)) {
      const {viewDimension, sampleType} = getSamplerInfo(uniform.type);
      shaderLayout.bindings.push({
        type: 'texture',
        name: uniform.name,
        location: textureUnit,
        viewDimension,
        sampleType
      });

      // @ts-expect-error
      uniform.textureUnit = textureUnit;
      textureUnit += 1;
    }
  }

  if (uniforms.length) {
    shaderLayout.uniforms = uniforms;
  }

  // Varyings
  const varyings: VaryingBinding[] = readVaryings(gl, program);
  // Note - samplers are always in unform bindings, even if uniform blocks are used
  if (varyings?.length) {
    shaderLayout.varyings = varyings;
  }

  return shaderLayout;
}

/**
 * Merges an provided shader layout into a base shader layout
 * In WebGL, this allows the auto generated shader layout to be overridden by the application
 * Typically to change the format of the vertex attributes (from float32x4 to uint8x4 etc).
 * @todo Drop this? This could also be done more clearly with bufferMapping
 */
export function mergeShaderLayout(
  baseLayout: ShaderLayout,
  overrideLayout: ShaderLayout
): ShaderLayout {
  // Deep clone the base layout
  const mergedLayout: ShaderLayout = {
    ...baseLayout,
    attributes: baseLayout.attributes.map(attribute => ({...attribute}))
  };
  // Merge the attributes
  for (const attribute of overrideLayout?.attributes || []) {
    const baseAttribute = mergedLayout.attributes.find(attr => attr.name === attribute.name);
    if (!baseAttribute) {
      log.warn(`shader layout attribute ${attribute.name} not present in shader`);
    } else {
      baseAttribute.format = attribute.format || baseAttribute.format;
      baseAttribute.stepMode = attribute.stepMode || baseAttribute.stepMode;
    }
  }
  return mergedLayout;
}

export function mergeBufferMap(baseLayout: ShaderLayout, bufferMap: BufferMapping[]): ShaderLayout {
  // Deep clone the base layout
  const mergedLayout: ShaderLayout = {
    ...baseLayout,
    attributes: baseLayout.attributes.map(attribute => ({...attribute}))
  };
  for (const bufferMapping of bufferMap) {
    // Handle interleave
    switch (bufferMapping.type) {
      case 'interleave':
        // Handle interleaved buffer mapping
        for (const attributeOverride of bufferMapping.attributes) {
          overrideShaderLayoutAttribute(mergedLayout, attributeOverride);
        }
        break;

      default:
        // Handle simple attribute overrides
        overrideShaderLayoutAttribute(mergedLayout, bufferMapping);
    }
  }
  return mergedLayout;
}

function overrideShaderLayoutAttribute(
  layout: ShaderLayout,
  attributeOverride: {name: string; format?: VertexFormat}
): void {
  const attribute = getAttributeFromLayout(layout, attributeOverride.name);
  if (attribute && attributeOverride.format) {
    attribute.format = attributeOverride.format;
  }
}

export function getAttributeFromLayout(
  shaderLayout: ShaderLayout,
  name: string
): AttributeLayout | null {
  const attribute = shaderLayout.attributes.find(attr => attr.name === name);
  if (!attribute) {
    log.warn(`shader layout attribute "${name}" not present in shader`);
  }
  return attribute || null;
}

// HELPERS

/**
 * Extract info about all transform feedback varyings
 *
 * linkProgram needs to have been called, although linking does not need to have been successful
 */
function readAttributeBindings(
  gl: WebGLRenderingContext,
  program: WebGLProgram
): AttributeBinding[] {
  const attributes: AttributeBinding[] = [];

  const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

  for (let index = 0; index < count; index++) {
    const activeInfo = gl.getActiveAttrib(program, index);
    if (!activeInfo) {
      throw new Error('activeInfo');
    }
    const {name, type: compositeType, size} = activeInfo;
    const location = gl.getAttribLocation(program, name);
    // Add only user provided attributes, for built-in attributes like
    // `gl_InstanceID` locaiton will be < 0
    if (location >= 0) {
      const {glType, components} = decodeAttributeType(compositeType);
      const accessor: AccessorObject = {type: glType, size: size * components};
      // Any attribute name containing the word "instance" will be assumed to be instanced
      if (/instance/i.test(name)) {
        accessor.divisor = 1;
      }
      const attributeInfo = {location, name, accessor: new Accessor(accessor)}; // Base values
      attributes.push(attributeInfo);
    }
  }

  attributes.sort((a: AttributeBinding, b: AttributeBinding) => a.location - b.location);
  return attributes;
}

/**
 * Extract info about all transform feedback varyings
 *
 * linkProgram needs to have been called, although linking does not need to have been successful
 */
function readVaryings(gl: WebGLRenderingContext, program: WebGLProgram): VaryingBinding[] {
  if (!isWebGL2(gl)) {
    return [];
  }
  const gl2 = gl as WebGL2RenderingContext;

  const varyings: VaryingBinding[] = [];

  const count = gl.getProgramParameter(program, GL.TRANSFORM_FEEDBACK_VARYINGS);
  for (let location = 0; location < count; location++) {
    const activeInfo = gl2.getTransformFeedbackVarying(program, location);
    if (!activeInfo) {
      throw new Error('activeInfo');
    }
    const {name, type: compositeType, size} = activeInfo;
    const {glType, components} = decodeUniformType(compositeType);
    const accessor = new Accessor({type: glType, size: size * components});
    const varying = {location, name, accessor}; // Base values
    varyings.push(varying);
  }

  varyings.sort((a, b) => a.location - b.location);
  return varyings;
}

/**
 * Extract info about all uniforms
 *
 * Query uniform locations and build name to setter map.
 */
function readUniformBindings(gl: WebGLRenderingContext, program: WebGLProgram): UniformBinding[] {
  const uniforms: UniformBinding[] = [];

  const uniformCount = gl.getProgramParameter(program, GL.ACTIVE_UNIFORMS);
  for (let i = 0; i < uniformCount; i++) {
    const activeInfo = gl.getActiveUniform(program, i);
    if (!activeInfo) {
      throw new Error('activeInfo');
    }
    const {name: rawName, size, type} = activeInfo;
    const {name, isArray} = parseUniformName(rawName);
    let webglLocation = gl.getUniformLocation(program, name);
    const uniformInfo = {
      // WebGL locations are uniquely typed but just numbers
      location: webglLocation as number,
      name,
      size,
      type,
      isArray
    };
    uniforms.push(uniformInfo);

    // Array (e.g. matrix) uniforms can occupy several 4x4 byte banks
    if (uniformInfo.size > 1) {
      for (let j = 0; j < uniformInfo.size; j++) {
        const elementName = `${name}[${j}]`;

        webglLocation = gl.getUniformLocation(program, elementName);

        const arrayElementUniformInfo = {
          ...uniformInfo,
          name: elementName,
          location: webglLocation as number
        };

        uniforms.push(arrayElementUniformInfo);
      }
    }
  }
  return uniforms;
}

/**
 * Extract info about all "active" uniform blocks
 *
 * ("Active" just means that unused (aka inactive) blocks may have been
 * optimized away during linking)
 */
function readUniformBlocks(
  gl: WebGLRenderingContext,
  program: WebGLProgram
): UniformBlockBinding[] {
  if (!isWebGL2(gl)) {
    return [];
  }
  const gl2 = gl as WebGL2RenderingContext;

  const getBlockParameter = (blockIndex: number, pname: GL): any =>
    gl2.getActiveUniformBlockParameter(program, blockIndex, pname);

  const uniformBlocks: UniformBlockBinding[] = [];

  const blockCount = gl2.getProgramParameter(program, GL.ACTIVE_UNIFORM_BLOCKS);
  for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
    const blockInfo: UniformBlockBinding = {
      name: gl2.getActiveUniformBlockName(program, blockIndex) || '',
      location: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_BINDING),
      byteLength: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_DATA_SIZE),
      vertex: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
      fragment: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
      uniformCount: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORMS),
      uniforms: [] as any[]
    };

    const uniformIndices =
      (getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES) as number[]) || [];

    const uniformType = gl2.getActiveUniforms(program, uniformIndices, GL.UNIFORM_TYPE); // Array of GLenum indicating the types of the uniforms.
    const uniformArrayLength = gl2.getActiveUniforms(program, uniformIndices, GL.UNIFORM_SIZE); // Array of GLuint indicating the sizes of the uniforms.
    // const uniformBlockIndex = gl2.getActiveUniforms(
    //   program,
    //   uniformIndices,
    //   GL.UNIFORM_BLOCK_INDEX
    // ); // Array of GLint indicating the block indices of the uniforms.
    const uniformOffset = gl2.getActiveUniforms(program, uniformIndices, GL.UNIFORM_OFFSET); // Array of GLint indicating the uniform buffer offsets.
    const uniformStride = gl2.getActiveUniforms(program, uniformIndices, GL.UNIFORM_ARRAY_STRIDE); // Array of GLint indicating the strides between the elements.
    // const uniformMatrixStride = gl2.getActiveUniforms(
    //   program,
    //   uniformIndices,
    //   GL.UNIFORM_MATRIX_STRIDE
    // ); // Array of GLint indicating the strides between columns of a column-major matrix or a row-major matrix.
    // const uniformRowMajor = gl2.getActiveUniforms(program, uniformIndices, GL.UNIFORM_IS_ROW_MAJOR);
    for (let i = 0; i < blockInfo.uniformCount; ++i) {
      const activeInfo = gl2.getActiveUniform(program, uniformIndices[i]);
      if (!activeInfo) {
        throw new Error('activeInfo');
      }

      blockInfo.uniforms.push({
        name: activeInfo.name,
        format: decodeUniformType(uniformType[i]).format,
        type: uniformType[i],
        arrayLength: uniformArrayLength[i],
        byteOffset: uniformOffset[i],
        byteStride: uniformStride[i]
        // matrixStride: uniformStride[i],
        // rowMajor: uniformRowMajor[i]
      });
    }

    uniformBlocks.push(blockInfo);
  }

  uniformBlocks.sort((a, b) => a.location - b.location);
  return uniformBlocks;
}

const SAMPLER_UNIFORMS_GL_TO_GPU: Record<
  number,
  [
    '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d',
    'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint'
  ]
> = {
  [GL.SAMPLER_2D]: ['2d', 'float'],
  [GL.SAMPLER_CUBE]: ['cube', 'float'],
  [GL.SAMPLER_3D]: ['3d', 'float'],
  [GL.SAMPLER_2D_SHADOW]: ['3d', 'depth'],
  [GL.SAMPLER_2D_ARRAY]: ['2d-array', 'float'],
  [GL.SAMPLER_2D_ARRAY_SHADOW]: ['2d-array', 'depth'],
  [GL.SAMPLER_CUBE_SHADOW]: ['cube', 'float'],
  [GL.INT_SAMPLER_2D]: ['2d', 'sint'],
  [GL.INT_SAMPLER_3D]: ['3d', 'sint'],
  [GL.INT_SAMPLER_CUBE]: ['cube', 'sint'],
  [GL.INT_SAMPLER_2D_ARRAY]: ['2d-array', 'uint'],
  [GL.UNSIGNED_INT_SAMPLER_2D]: ['2d', 'uint'],
  [GL.UNSIGNED_INT_SAMPLER_3D]: ['3d', 'uint'],
  [GL.UNSIGNED_INT_SAMPLER_CUBE]: ['cube', 'uint'],
  [GL.UNSIGNED_INT_SAMPLER_2D_ARRAY]: ['2d-array', 'uint']
};

type SamplerInfo = {
  viewDimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  sampleType: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
};

function getSamplerInfo(type: GL): SamplerInfo {
  const sampler = SAMPLER_UNIFORMS_GL_TO_GPU[type];
  if (!sampler) {
    throw new Error('sampler');
  }
  const [viewDimension, sampleType] = sampler;
  return {viewDimension, sampleType};
}

// HELPERS

function parseUniformName(name: string): {name: string; length: number; isArray: boolean} {
  // Shortcut to avoid redundant or bad matches
  if (name[name.length - 1] !== ']') {
    return {
      name,
      length: 1,
      isArray: false
    };
  }

  // if array name then clean the array brackets
  const UNIFORM_NAME_REGEXP = /([^[]*)(\[[0-9]+\])?/;
  const matches = UNIFORM_NAME_REGEXP.exec(name);
  if (!matches || matches.length < 2) {
    throw new Error(`Failed to parse GLSL uniform name ${name}`);
  }

  return {
    name: matches[1],
    length: matches[2] ? 1 : 0,
    isArray: Boolean(matches[2])
  };
}

/**
 * TODO - verify this is a copy of above and delete
 * import type {TextureFormat} from '@luma.gl/core';
* Extract info about all "active" uniform blocks
 * ("Active" just means that unused (inactive) blocks may have been optimized away during linking)
 *
 function getUniformBlockBindings(gl: WebGLRenderingContext, program): Binding[] {
  if (!isWebGL2(gl)) {
    return;
  }
  const bindings: Binding[] = [];
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
  for (let blockIndex = 0; blockIndex < count; blockIndex++) {
    const vertex = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
    const fragment = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
    const visibility = (vertex) + (fragment);
    const binding: BufferBinding = {
      location: gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_BINDING),
      // name: gl.getActiveUniformBlockName(program, blockIndex),
      type: 'uniform',
      visibility,
      minBindingSize: gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE),
      // uniformCount: gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS),
      // uniformIndices: gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES),
    }
    bindings.push(binding);
  }
  return bindings;
}

function setBindings(gl2: WebGL2RenderingContext, program: WebGLProgram, bindings: Binding[][]): void {
  for (const bindGroup of bindings) {
    for (const binding of bindGroup) {

    }
  }

  // Set up indirection table
  // this.gl2.uniformBlockBinding(this.handle, blockIndex, blockBinding);
}
 */
