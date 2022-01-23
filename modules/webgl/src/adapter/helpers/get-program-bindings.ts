import {ShaderLayout, BindingLayout, UniformBinding, UniformBlockBinding, ProgramBindings, AttributeBinding, VaryingBinding} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2} from '../../context/context/webgl-checks';
import Accessor from '../../classic/accessor'; // TODO - should NOT depend on classic API
import {decomposeCompositeGLType} from '../../webgl-utils/attribute-utils';

/**
 * Extract metadata describing binding information for a program's shaders
 * Note: `linkProgram()` needs to have been called
 * (although linking does not need to have been successful).
*/
export function getShaderLayout(gl: WebGLRenderingContext, program: WebGLProgram): ShaderLayout {
  const programBindings = getProgramBindings(gl, program);
  const bindings: BindingLayout[] = [];
  for (const uniformBlock of programBindings.uniformBlocks) {
    bindings.push({
      type: 'uniform',
      name: uniformBlock.name,
      location: uniformBlock.location
    });
  }
  for (const uniform of programBindings.uniforms) {
    // console.log(uniform)
    // switch (uniform.type) {
    // }
  }
  return {
    attributes: [], // programBindings.attributes,
    bindings
  };
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
      const {type, components} = decomposeCompositeGLType(compositeType);
      const accessor = {type, size: size * components};
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
    const {type, components} = decomposeCompositeGLType(compositeType);
    const accessor = new Accessor({type, size: size * components});
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
      uniformIndices: getBlockParameter(blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES),
      uniforms: []
    }

    for (let uniformIndex = 0; uniformIndex < blockInfo.uniformCount; ++uniformIndex) {
      // TODO - Can we extract more?
    }

    uniformBlocks.push(blockInfo);
  }

  uniformBlocks.sort((a, b) => a.location - b.location);
  return uniformBlocks;
}

const SAMPLER_UNIFORMS_GL_TO_GPU = {
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
  [GL.INT_SAMPLER_2D_ARRAY]: ['2d-array', 'sint'],
  [GL.UNSIGNED_INT_SAMPLER_2D]: ['2d', 'sint'],
  [GL.UNSIGNED_INT_SAMPLER_3D]: ['3d', 'sint'],
  [GL.UNSIGNED_INT_SAMPLER_CUBE]: ['cube', 'sint'],
  [GL.UNSIGNED_INT_SAMPLER_2D_ARRAY]: ['2d-array', 'sint']
};

/**
 * Generate a list of "WebGPU-style" bindings for this program
 */
function generateWebGPUStyleBindings(config: ProgramBindings) {
  const bindings: any = [];

  // Uniform blocks
  for (const blockInfo of config.uniformBlocks) {
    bindings.push({
      binding: blockInfo.location,
      visibility: (blockInfo.vertex ? 0x1 : 0) & (blockInfo.fragment ? 0x2 : 0),
      buffer: {
        type: 'uniform',
        // minBindingSize: blockInfo.size
      }
    })
  }

  // Sampler uniforms
  for (const uniformInfo of config.uniforms) {
    let sampler = SAMPLER_UNIFORMS_GL_TO_GPU[uniformInfo.type];
    if (sampler) {
      const [viewDimension, sampleType] = sampler;
      bindings.push({
        binding: uniformInfo.location,
        visibility: 0, // Not available in WebGL on individual uniforms?
        texture: {
          viewDimension,
          sampleType
        }
      });
    }
  }
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