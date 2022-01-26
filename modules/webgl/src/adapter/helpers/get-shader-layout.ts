import {ShaderLayout, BindingLayout, UniformBinding, UniformBlockBinding, ProgramBindings, AttributeBinding, VaryingBinding, AttributeLayout} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2} from '../../context/context/webgl-checks';
import Accessor from '../../classic/accessor'; // TODO - should NOT depend on classic API
import {decodeUniformType, decodeAttributeType} from './uniforms';
import {getVertexFormat} from '../converters/vertex-formats';
import {isSamplerUniform} from './uniforms';
/**
 * Extract metadata describing binding information for a program's shaders
 * Note: `linkProgram()` needs to have been called
 * (although linking does not need to have been successful).
*/
export function getShaderLayout(gl: WebGLRenderingContext, program: WebGLProgram): ShaderLayout {
  const programBindings = getProgramBindings(gl, program);

  const shaderLayout: ShaderLayout = {
    attributes: [], 
    bindings: []
  };

  for (const attribute of programBindings.attributes) {
    const format = attribute.accessor.format || 
      getVertexFormat(attribute.accessor.type || GL.FLOAT, attribute.accessor.size);
    shaderLayout.attributes.push({
      name: attribute.name,
      location: attribute.location,
      format,
      stepMode: attribute.accessor.divisor === 1 ? 'instance' : 'vertex'
    });
  }

  // Uniform blocks
  for (const uniformBlock of programBindings.uniformBlocks) {
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

  let textureUnit = 0;
  for (const uniform of programBindings.uniforms) {
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

  const uniforms = programBindings.uniforms?.filter(uniform => uniform.location !== null) || [];
  if (uniforms.length) {
    shaderLayout.uniforms = uniforms;
  }
  if (programBindings.varyings?.length) {
    shaderLayout.varyings = programBindings.varyings;
  };

  return shaderLayout;
}

/**
 * Extract metadata describing binding information for a program's shaders
 * Note: `linkProgram()` needs to have been called
 * (although linking does not need to have been successful).
*/
export function getProgramBindings(gl: WebGLRenderingContext, program: WebGLProgram): ProgramBindings {
  const config: ProgramBindings = {
    attributes: readAttributeBindings(gl, program),
    uniforms: readUniformBindings(gl, program),
    uniformBlocks: readUniformBlocks(gl, program),
    varyings: readVaryings(gl, program)
  };

  Object.seal(config);
  return config;
  // generateWebGPUStyleBindings(bindings);
}


/**
 * Extract info about all transform feedback varyings
 *
 * linkProgram needs to have been called, although linking does not need to have been successful
 */
function readAttributeBindings(gl: WebGLRenderingContext, program: WebGLProgram): AttributeBinding[] {
  const attributes: AttributeBinding[] = [];

  const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

  for (let index = 0; index < count; index++) {
    const {name, type: compositeType, size} = gl.getActiveAttrib(program, index);
    const location = gl.getAttribLocation(program, name);
    // Add only user provided attributes, for built-in attributes like
    // `gl_InstanceID` locaiton will be < 0
    if (location >= 0) {
      const {glType, components} = decodeAttributeType(compositeType);
      const accessor = {type: glType, size: size * components};
      inferProperties(location, name, accessor);

      const attributeInfo = {location, name, accessor: new Accessor(accessor)}; // Base values
      // @ts-expect-error
      attributes.push(attributeInfo);
    }
  }

  // @ts-expect-error
  attributes.sort((a, b) => (a.location ?? a.field[0].location) - (b.location ?? b.field[0].location));
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

  const varyings = [];

  const count = gl.getProgramParameter(program, GL.TRANSFORM_FEEDBACK_VARYINGS);
  for (let location = 0; location < count; location++) {
    const {name, type: compositeType, size} = gl2.getTransformFeedbackVarying(program, location);
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
    const {name: rawName, size, type} = gl.getActiveUniform(program, i);
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
function readUniformBlocks(gl: WebGLRenderingContext, program: WebGLProgram): UniformBlockBinding[] {
  if (!isWebGL2(gl)) {
    return [];
  }
  const gl2 = gl as WebGL2RenderingContext;

  const getBlockParameter = (blockIndex, pname) => gl2.getActiveUniformBlockParameter(program, blockIndex, pname);

  const uniformBlocks: UniformBlockBinding[] = [];

  const blockCount = gl2.getProgramParameter(program, GL.ACTIVE_UNIFORM_BLOCKS);
  for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {

    const blockInfo = {
      name: gl2.getActiveUniformBlockName(program, blockIndex),
      location: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_BINDING),
      byteLength: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_DATA_SIZE),
      vertex: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
      fragment: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
      uniformCount: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORMS),
      uniforms: []
    }

    const uniformIndices = getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES);

    const uniformType = gl2.getActiveUniforms(program, uniformIndices, GL.UNIFORM_TYPE); // Array of GLenum indicating the types of the uniforms.
    const uniformArrayLength = gl2.getActiveUniforms(program, uniformIndices,GL.UNIFORM_SIZE); // Array of GLuint indicating the sizes of the uniforms.
    const uniformBlockIndex = gl2.getActiveUniforms(program, uniformIndices,GL.UNIFORM_BLOCK_INDEX); // Array of GLint indicating the block indices of the uniforms.
    const uniformOffset = gl2.getActiveUniforms(program, uniformIndices,GL.UNIFORM_OFFSET); // Array of GLint indicating the uniform buffer offsets.
    const uniformStride = gl2.getActiveUniforms(program, uniformIndices,GL.UNIFORM_ARRAY_STRIDE); // Array of GLint indicating the strides between the elements.
    const uniformMatrixStride = gl2.getActiveUniforms(program, uniformIndices,GL.UNIFORM_MATRIX_STRIDE); // Array of GLint indicating the strides between columns of a column-major matrix or a row-major matrix.
    const uniformRowMajor = gl2.getActiveUniforms(program, uniformIndices,GL.UNIFORM_IS_ROW_MAJOR); 
    for (let i = 0; i < blockInfo.uniformCount; ++i) {
      blockInfo.uniforms.push({
        name: gl2.getActiveUniform(program, uniformIndices[i]).name,
        format: decodeUniformType(uniformType[i]).format,
        type: uniformType[i],
        arrayLength: uniformArrayLength[i],
        byteOffset: uniformOffset[i],
        byteStride: uniformStride[i],
        matrixStride: uniformStride[i],
        rowMajor: uniformRowMajor[i]
      });
    }

    uniformBlocks.push(blockInfo);
  }

  uniformBlocks.sort((a, b) => a.location - b.location);
  return uniformBlocks;
}

const SAMPLER_UNIFORMS_GL_TO_GPU: Record<number, [
  '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d',
  'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint'
]> = {
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

function getSamplerInfo(type: GL): {
  viewDimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  sampleType: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
} | undefined {
  let sampler = SAMPLER_UNIFORMS_GL_TO_GPU[type];
  if (sampler) {
    const [viewDimension, sampleType] = sampler;
    return {viewDimension, sampleType};
  }
  return null;
}

// HELPERS

function parseUniformName(name) {
  // Shortcut to avoid redundant or bad matches
  if (name[name.length - 1] !== ']'){
    return {
      name,
      length: 1,
      isArray: false
    };
  }

  // if array name then clean the array brackets
  const UNIFORM_NAME_REGEXP = /([^[]*)(\[[0-9]+\])?/;
  const matches = name.match(UNIFORM_NAME_REGEXP);
  if (!matches || matches.length < 2) {
    throw new Error(`Failed to parse GLSL uniform name ${name}`);
  }

  return {
    name: matches[1],
    length: matches[2] || 1,
    isArray: Boolean(matches[2])
  };
}

// Extract additional attribute metadata from shader names (based on attribute naming conventions)
function inferProperties(accessor, location, name) {
  if (/instance/i.test(name)) {
    // Any attribute containing the word "instance" will be assumed to be instanced
    accessor.divisor = 1;
  }
}

/**
 * TODO - verify this is a copy of above and delete
 * import type {TextureFormat} from '@luma.gl/api';
* Extract info about all "active" uniform blocks
 * ("Active" just means that unused (inactive) blocks may have been optimized away during linking)
 *
 function getUniformBlockBindings(gl, program): Binding[] {
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