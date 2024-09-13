// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ShaderLayout,
  UniformBinding,
  UniformBlockBinding,
  AttributeDeclaration,
  VaryingBinding,
  AttributeShaderType
} from '@luma.gl/core';
import {getVariableShaderTypeInfo} from '@luma.gl/core';

import {GL, GLUniformType} from '@luma.gl/constants';
import {
  isGLSamplerType,
  getTextureBindingFromGLSamplerType,
  convertGLUniformTypeToShaderVariableType
} from '../converters/webgl-shadertypes';

/**
 * Extract metadata describing binding information for a program's shaders
 * Note: `linkProgram()` needs to have been called
 * (although linking does not need to have been successful).
 */
export function getShaderLayoutFromGLSL(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): ShaderLayout {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: []
  };

  shaderLayout.attributes = readAttributeDeclarations(gl, program);

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
      group: 0,
      location: uniformBlock.location,
      visibility: (uniformBlock.vertex ? 0x1 : 0) & (uniformBlock.fragment ? 0x2 : 0),
      minBindingSize: uniformBlock.byteLength,
      uniforms
    });
  }

  const uniforms: UniformBinding[] = readUniformBindings(gl, program);
  let textureUnit = 0;
  for (const uniform of uniforms) {
    if (isGLSamplerType(uniform.type)) {
      const {viewDimension, sampleType} = getTextureBindingFromGLSamplerType(uniform.type);
      shaderLayout.bindings.push({
        type: 'texture',
        name: uniform.name,
        group: 0,
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

// HELPERS

/**
 * Extract info about all transform feedback varyings
 *
 * linkProgram needs to have been called, although linking does not need to have been successful
 */
function readAttributeDeclarations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): AttributeDeclaration[] {
  const attributes: AttributeDeclaration[] = [];

  const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

  for (let index = 0; index < count; index++) {
    const activeInfo = gl.getActiveAttrib(program, index);
    if (!activeInfo) {
      throw new Error('activeInfo');
    }
    const {name, type: compositeType /* , size*/} = activeInfo;
    const location = gl.getAttribLocation(program, name);
    // Add only user provided attributes, for built-in attributes like `gl_InstanceID` location will be < 0
    if (location >= 0) {
      const attributeType = convertGLUniformTypeToShaderVariableType(compositeType);

      // Whether an attribute is instanced is essentially fixed by the structure of the shader code,
      // so it is arguably a static property of the shader.
      // There is no hint in the shader declarations
      // Heuristic: Any attribute name containing the word "instance" will be assumed to be instanced
      const stepMode = /instance/i.test(name) ? 'instance' : 'vertex';

      attributes.push({
        name,
        location,
        stepMode,
        type: attributeType as AttributeShaderType
        // size - for arrays, size is the number of elements in the array
      });
    }
  }

  // Sort by declaration order
  attributes.sort((a: AttributeDeclaration, b: AttributeDeclaration) => a.location - b.location);
  return attributes;
}

/**
 * Extract info about all transform feedback varyings
 *
 * linkProgram needs to have been called, although linking does not need to have been successful
 */
function readVaryings(gl: WebGL2RenderingContext, program: WebGLProgram): VaryingBinding[] {
  const varyings: VaryingBinding[] = [];

  const count = gl.getProgramParameter(program, GL.TRANSFORM_FEEDBACK_VARYINGS);
  for (let location = 0; location < count; location++) {
    const activeInfo = gl.getTransformFeedbackVarying(program, location);
    if (!activeInfo) {
      throw new Error('activeInfo');
    }
    const {name, type: glUniformType, size} = activeInfo;
    const uniformType = convertGLUniformTypeToShaderVariableType(glUniformType as GLUniformType);
    const {type, components} = getVariableShaderTypeInfo(uniformType);
    varyings.push({location, name, type, size: size * components});
  }

  varyings.sort((a, b) => a.location - b.location);
  return varyings;
}

/**
 * Extract info about all uniforms
 *
 * Query uniform locations and build name to setter map.
 */
function readUniformBindings(gl: WebGL2RenderingContext, program: WebGLProgram): UniformBinding[] {
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
 * @note In WebGL, "active" just means that unused (inactive) blocks may have been optimized away during linking)
 */
function readUniformBlocks(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): UniformBlockBinding[] {
  const getBlockParameter = (blockIndex: number, pname: GL): any =>
    gl.getActiveUniformBlockParameter(program, blockIndex, pname);

  const uniformBlocks: UniformBlockBinding[] = [];

  const blockCount = gl.getProgramParameter(program, GL.ACTIVE_UNIFORM_BLOCKS);
  for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
    const blockInfo: UniformBlockBinding = {
      name: gl.getActiveUniformBlockName(program, blockIndex) || '',
      location: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_BINDING),
      byteLength: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_DATA_SIZE),
      vertex: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
      fragment: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
      uniformCount: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORMS),
      uniforms: [] as any[]
    };

    const uniformIndices =
      (getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES) as number[]) || [];

    const uniformType = gl.getActiveUniforms(program, uniformIndices, GL.UNIFORM_TYPE); // Array of GLenum indicating the types of the uniforms.
    const uniformArrayLength = gl.getActiveUniforms(program, uniformIndices, GL.UNIFORM_SIZE); // Array of GLuint indicating the sizes of the uniforms.
    // const uniformBlockIndex = gl.getActiveUniforms(
    //   program,
    //   uniformIndices,
    //   GL.UNIFORM_BLOCK_INDEX
    // ); // Array of GLint indicating the block indices of the uniforms.
    const uniformOffset = gl.getActiveUniforms(program, uniformIndices, GL.UNIFORM_OFFSET); // Array of GLint indicating the uniform buffer offsets.
    const uniformStride = gl.getActiveUniforms(program, uniformIndices, GL.UNIFORM_ARRAY_STRIDE); // Array of GLint indicating the strides between the elements.
    // const uniformMatrixStride = gl.getActiveUniforms(
    //   program,
    //   uniformIndices,
    //   GL.UNIFORM_MATRIX_STRIDE
    // ); // Array of GLint indicating the strides between columns of a column-major matrix or a row-major matrix.
    // const uniformRowMajor = gl.getActiveUniforms(program, uniformIndices, GL.UNIFORM_IS_ROW_MAJOR);
    for (let i = 0; i < blockInfo.uniformCount; ++i) {
      const activeInfo = gl.getActiveUniform(program, uniformIndices[i]);
      if (!activeInfo) {
        throw new Error('activeInfo');
      }

      const format = convertGLUniformTypeToShaderVariableType(uniformType[i]);

      blockInfo.uniforms.push({
        name: activeInfo.name,
        format,
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

/**
 * TOOD - compare with a above, confirm copy, then delete
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
*/

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
