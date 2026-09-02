// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  ShaderLayout,
  UniformBinding,
  UniformBlockBinding,
  AttributeDeclaration,
  VaryingBinding,
  AttributeShaderType,
  CompositeShaderType,
  UniformBlockLayout,
  UniformBufferBindingLayout,
  UniformInfo
} from '@luma.gl/core';
import {getVariableShaderTypeInfo, assertDefined, log, makeShaderBlockLayout} from '@luma.gl/core';

import {GL, GLUniformType} from '@luma.gl/webgl/constants';
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
  program: WebGLProgram,
  options: {
    uniformBlockLayouts?: readonly UniformBlockLayout[];
    shaderLayout?: ShaderLayout | null;
  } = {}
): ShaderLayout {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: []
  };

  shaderLayout.attributes = readAttributeDeclarations(gl, program);

  // Uniform blocks
  const uniformBlocks: UniformBlockBinding[] = readUniformBlocks(gl, program, options);
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
      visibility: (uniformBlock.vertex ? 0x1 : 0) | (uniformBlock.fragment ? 0x2 : 0),
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
  program: WebGLProgram,
  options: {
    uniformBlockLayouts?: readonly UniformBlockLayout[];
    shaderLayout?: ShaderLayout | null;
  }
): UniformBlockBinding[] {
  const uniformBlocks: UniformBlockBinding[] = [];
  const knownBlocksByIndex = getKnownUniformBlocksByIndex(gl, program, options);

  for (const [blockIndex, uniformBlock] of knownBlocksByIndex) {
    uniformBlocks.push(uniformBlock);

    // Firefox on affected AMD drivers has returned null or empty builtin arrays and
    // active-uniform indices belonging to a different block. Keep reflection as optional
    // validation, but never make a module-backed std140 layout depend on those results.
    try {
      const reflectedUniformBlock = readReflectedUniformBlock(
        gl,
        program,
        blockIndex,
        uniformBlock.name
      );
      validateReflectedUniformBlock(reflectedUniformBlock, uniformBlock);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.once(
        0,
        `WebGL uniform block reflection failed for "${uniformBlock.name}"; using supplied std140 metadata. ${message}`
      )();
    }
  }

  const blockCount = gl.getProgramParameter(program, GL.ACTIVE_UNIFORM_BLOCKS);
  if (!Number.isInteger(blockCount) || blockCount < 0) {
    throw new Error(
      `Failed to reflect WebGL uniform blocks: ACTIVE_UNIFORM_BLOCKS returned ${String(blockCount)}`
    );
  }

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
    if (!knownBlocksByIndex.has(blockIndex)) {
      uniformBlocks.push(readReflectedUniformBlock(gl, program, blockIndex));
    }
  }

  uniformBlocks.sort((a, b) => a.location - b.location);
  return uniformBlocks;
}

function validateReflectedUniformBlock(
  reflectedUniformBlock: UniformBlockBinding,
  knownUniformBlock: UniformBlockBinding
): void {
  for (const reflectedUniform of reflectedUniformBlock.uniforms) {
    const knownUniform = knownUniformBlock.uniforms.find(
      uniform =>
        reflectedUniform.name === uniform.name || reflectedUniform.name.endsWith(`.${uniform.name}`)
    );
    if (!knownUniform) {
      throw new Error(
        `Failed to validate WebGL uniform block "${knownUniformBlock.name}": reflected unexpected member "${reflectedUniform.name}"`
      );
    }
    if (
      reflectedUniform.format !== knownUniform.format ||
      reflectedUniform.arrayLength !== knownUniform.arrayLength ||
      reflectedUniform.byteOffset !== knownUniform.byteOffset ||
      reflectedUniform.byteStride !== knownUniform.byteStride
    ) {
      throw new Error(
        `Failed to validate WebGL uniform block "${knownUniformBlock.name}": reflected layout for "${reflectedUniform.name}" does not match supplied std140 metadata`
      );
    }
  }
}

/** Resolves supplied module and application metadata against active linked blocks by name. */
function getKnownUniformBlocksByIndex(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  options: {
    uniformBlockLayouts?: readonly UniformBlockLayout[];
    shaderLayout?: ShaderLayout | null;
  }
): Map<number, UniformBlockBinding> {
  const knownUniformBlocks = new Map<string, UniformBufferBindingLayout>();

  for (const uniformBlockLayout of options.uniformBlockLayouts || []) {
    knownUniformBlocks.set(
      uniformBlockLayout.name,
      makeUniformBlockBindingFromTypes(uniformBlockLayout)
    );
  }

  for (const binding of options.shaderLayout?.bindings || []) {
    if (isUsableUniformBlockBinding(binding)) {
      knownUniformBlocks.set(binding.name, binding);
    }
  }

  const knownBlocksByIndex = new Map<number, UniformBlockBinding>();
  for (const binding of knownUniformBlocks.values()) {
    const resolvedBlock = getActiveUniformBlockIndex(gl, program, binding.name);
    if (!resolvedBlock) {
      continue;
    }

    const {blockIndex, blockName} = resolvedBlock;
    if (knownBlocksByIndex.has(blockIndex)) {
      throw new Error(
        `Multiple supplied uniform block layouts resolve to active WebGL block "${blockName}"`
      );
    }

    knownBlocksByIndex.set(blockIndex, {
      name: blockName,
      location: blockIndex,
      byteLength: binding.minBindingSize!,
      vertex: Boolean(binding.visibility && binding.visibility & 0x1),
      fragment: Boolean(binding.visibility && binding.visibility & 0x2),
      uniformCount: binding.uniforms!.length,
      uniforms: binding.uniforms!.map(uniform => ({...uniform}))
    });
  }

  return knownBlocksByIndex;
}

/** Queries only the linked block index, trying luma's established `Uniforms` alias. */
function getActiveUniformBlockIndex(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  blockName: string
): {blockIndex: number; blockName: string} | null {
  const blockNames = blockName.endsWith('Uniforms')
    ? [blockName, blockName.slice(0, -'Uniforms'.length)]
    : [blockName, `${blockName}Uniforms`];

  for (const candidateBlockName of blockNames) {
    const blockIndex = gl.getUniformBlockIndex(program, candidateBlockName);
    if (blockIndex !== GL.INVALID_INDEX) {
      if (!Number.isInteger(blockIndex) || blockIndex < 0) {
        throw new Error(
          `Failed to resolve WebGL uniform block "${candidateBlockName}": getUniformBlockIndex returned ${String(
            blockIndex
          )}`
        );
      }
      return {blockIndex, blockName: candidateBlockName};
    }
  }

  return null;
}

/** Reflects and validates every driver value needed for one raw GLSL uniform block. */
function readReflectedUniformBlock(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  blockIndex: number,
  knownBlockName?: string
): UniformBlockBinding {
  const blockName = knownBlockName || gl.getActiveUniformBlockName(program, blockIndex);
  if (!blockName) {
    throw new Error(
      `Failed to reflect WebGL uniform block at index ${blockIndex}: missing block name`
    );
  }

  const getBlockParameter = (pname: GL, label: string): unknown => {
    const value = gl.getActiveUniformBlockParameter(program, blockIndex, pname);
    if (value === null || value === undefined) {
      throw new Error(
        `Failed to reflect WebGL uniform block "${blockName}": ${label} returned null`
      );
    }
    return value;
  };

  const location = getFiniteInteger(
    getBlockParameter(GL.UNIFORM_BLOCK_BINDING, 'UNIFORM_BLOCK_BINDING'),
    blockName,
    'UNIFORM_BLOCK_BINDING',
    0
  );
  const byteLength = getFiniteInteger(
    getBlockParameter(GL.UNIFORM_BLOCK_DATA_SIZE, 'UNIFORM_BLOCK_DATA_SIZE'),
    blockName,
    'UNIFORM_BLOCK_DATA_SIZE',
    0
  );
  const uniformCount = getFiniteInteger(
    getBlockParameter(GL.UNIFORM_BLOCK_ACTIVE_UNIFORMS, 'UNIFORM_BLOCK_ACTIVE_UNIFORMS'),
    blockName,
    'UNIFORM_BLOCK_ACTIVE_UNIFORMS',
    0
  );
  const uniformIndices = getNumericArray(
    getBlockParameter(
      GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES,
      'UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES'
    ),
    blockName,
    'UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES',
    uniformCount
  );

  const uniformTypes = getActiveUniformValues(
    gl,
    program,
    uniformIndices,
    GL.UNIFORM_TYPE,
    'UNIFORM_TYPE',
    blockName,
    uniformCount
  );
  const uniformArrayLengths = getActiveUniformValues(
    gl,
    program,
    uniformIndices,
    GL.UNIFORM_SIZE,
    'UNIFORM_SIZE',
    blockName,
    uniformCount
  );
  const uniformBlockIndices = getActiveUniformValues(
    gl,
    program,
    uniformIndices,
    GL.UNIFORM_BLOCK_INDEX,
    'UNIFORM_BLOCK_INDEX',
    blockName,
    uniformCount
  );
  const uniformOffsets = getActiveUniformValues(
    gl,
    program,
    uniformIndices,
    GL.UNIFORM_OFFSET,
    'UNIFORM_OFFSET',
    blockName,
    uniformCount
  );
  const uniformStrides = getActiveUniformValues(
    gl,
    program,
    uniformIndices,
    GL.UNIFORM_ARRAY_STRIDE,
    'UNIFORM_ARRAY_STRIDE',
    blockName,
    uniformCount
  );

  const uniforms: UniformInfo[] = [];
  for (let uniformPosition = 0; uniformPosition < uniformCount; uniformPosition++) {
    if (uniformBlockIndices[uniformPosition] !== blockIndex) {
      throw new Error(
        `Failed to reflect WebGL uniform block "${blockName}": active uniform index ${uniformIndices[uniformPosition]} belongs to block ${uniformBlockIndices[uniformPosition]}, expected ${blockIndex}`
      );
    }

    const uniformIndex = uniformIndices[uniformPosition];
    const activeInfo = gl.getActiveUniform(program, uniformIndex);
    if (!activeInfo) {
      throw new Error(
        `Failed to reflect WebGL uniform block "${blockName}": getActiveUniform(${uniformIndex}) returned null`
      );
    }

    const uniformType = getFiniteInteger(
      uniformTypes[uniformPosition],
      blockName,
      `UNIFORM_TYPE[${uniformPosition}]`,
      1
    );
    const arrayLength = getFiniteInteger(
      uniformArrayLengths[uniformPosition],
      blockName,
      `UNIFORM_SIZE[${uniformPosition}]`,
      1
    );
    const byteOffset = getFiniteInteger(
      uniformOffsets[uniformPosition],
      blockName,
      `UNIFORM_OFFSET[${uniformPosition}]`,
      0
    );
    const byteStride = getFiniteInteger(
      uniformStrides[uniformPosition],
      blockName,
      `UNIFORM_ARRAY_STRIDE[${uniformPosition}]`,
      0
    );

    if (activeInfo.type !== uniformType || activeInfo.size !== arrayLength) {
      throw new Error(
        `Failed to reflect WebGL uniform block "${blockName}": getActiveUniform(${uniformIndex}) disagrees with getActiveUniforms`
      );
    }

    uniforms.push({
      name: activeInfo.name,
      format: convertGLUniformTypeToShaderVariableType(uniformType as GLUniformType),
      arrayLength,
      byteOffset,
      byteStride
    });
  }

  const blockInfo: UniformBlockBinding = {
    name: blockName,
    location,
    byteLength,
    vertex: Boolean(
      getBlockParameter(
        GL.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER,
        'UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER'
      )
    ),
    fragment: Boolean(
      getBlockParameter(
        GL.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER,
        'UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER'
      )
    ),
    uniformCount,
    uniforms
  };

  const uniformInstancePrefixes = new Set(
    blockInfo.uniforms
      .map(uniform => uniform.name.split('.')[0])
      .filter((instanceName): instanceName is string => Boolean(instanceName))
  );
  const blockAlias = blockInfo.name.replace(/Uniforms$/, '');
  if (
    uniformInstancePrefixes.size === 1 &&
    !uniformInstancePrefixes.has(blockInfo.name) &&
    !uniformInstancePrefixes.has(blockAlias)
  ) {
    const [instanceName] = uniformInstancePrefixes;
    log.warn(
      `Uniform block "${blockInfo.name}" uses GLSL instance "${instanceName}". ` +
        `luma.gl binds uniform buffers by block name ("${blockInfo.name}") and alias ("${blockAlias}"). ` +
        'Prefer matching the instance name to one of those to avoid confusing silent mismatches.'
    )();
  }

  return blockInfo;
}

function getActiveUniformValues(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  uniformIndices: number[],
  pname: GL,
  label: string,
  blockName: string,
  expectedLength: number
): number[] {
  const values = gl.getActiveUniforms(program, uniformIndices, pname);
  if (values === null) {
    throw new Error(`Failed to reflect WebGL uniform block "${blockName}": ${label} returned null`);
  }
  return getNumericArray(values, blockName, label, expectedLength);
}

function getNumericArray(
  value: unknown,
  blockName: string,
  label: string,
  expectedLength: number
): number[] {
  if (!Array.isArray(value) && !ArrayBuffer.isView(value)) {
    throw new Error(
      `Failed to reflect WebGL uniform block "${blockName}": ${label} returned a non-array value`
    );
  }
  const values = Array.from(value as ArrayLike<number>);
  if (values.length !== expectedLength || values.some(item => !Number.isInteger(item))) {
    throw new Error(
      `Failed to reflect WebGL uniform block "${blockName}": ${label} returned ${values.length} invalid values, expected ${expectedLength}`
    );
  }
  return values;
}

function getFiniteInteger(
  value: unknown,
  blockName: string,
  label: string,
  minimum: number
): number {
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new Error(
      `Failed to reflect WebGL uniform block "${blockName}": ${label} returned ${String(value)}`
    );
  }
  return value as number;
}

function makeUniformBlockBindingFromTypes(
  uniformBlockLayout: UniformBlockLayout
): UniformBufferBindingLayout {
  const shaderBlockLayout = makeShaderBlockLayout(uniformBlockLayout.uniformTypes, {
    layout: 'std140'
  });
  const uniforms = getUniformInfosFromTypes(
    uniformBlockLayout.uniformTypes,
    shaderBlockLayout.fields
  );
  return {
    type: 'uniform',
    name: uniformBlockLayout.name,
    group: 0,
    location: 0,
    minBindingSize: shaderBlockLayout.byteLength,
    uniforms
  };
}

function getUniformInfosFromTypes(
  uniformTypes: Readonly<Record<string, CompositeShaderType>>,
  fields: ReturnType<typeof makeShaderBlockLayout>['fields']
): UniformInfo[] {
  const uniforms: UniformInfo[] = [];

  const addType = (name: string, type: CompositeShaderType): void => {
    if (typeof type === 'string') {
      const field = fields[name];
      if (!field) {
        throw new Error(`Missing std140 layout field ${name}`);
      }
      uniforms.push({
        name,
        format: field.shaderType,
        arrayLength: 1,
        byteOffset: field.offset * 4,
        byteStride: 0
      });
      return;
    }

    if (Array.isArray(type)) {
      addArrayType(name, type[0] as CompositeShaderType, type[1] as number);
      return;
    }

    for (const [memberName, memberType] of Object.entries(
      type as Record<string, CompositeShaderType>
    )) {
      addType(`${name}.${memberName}`, memberType);
    }
  };

  const addArrayType = (name: string, type: CompositeShaderType, arrayLength: number): void => {
    if (typeof type === 'string') {
      const firstField = fields[`${name}[0]`];
      const secondField = arrayLength > 1 ? fields[`${name}[1]`] : undefined;
      if (!firstField) {
        throw new Error(`Missing std140 array layout field ${name}[0]`);
      }
      uniforms.push({
        name: `${name}[0]`,
        format: firstField.shaderType,
        arrayLength,
        byteOffset: firstField.offset * 4,
        byteStride: secondField ? (secondField.offset - firstField.offset) * 4 : 0
      });
      return;
    }

    if (Array.isArray(type)) {
      throw new Error(`Nested uniform arrays are not supported for ${name}`);
    }

    for (const [memberName, memberType] of Object.entries(
      type as Record<string, CompositeShaderType>
    )) {
      if (typeof memberType !== 'string') {
        throw new Error(`Composite uniform array members are not supported for ${name}`);
      }
      const firstName = `${name}[0].${memberName}`;
      const secondName = `${name}[1].${memberName}`;
      const firstField = fields[firstName];
      const secondField = arrayLength > 1 ? fields[secondName] : undefined;
      if (!firstField) {
        throw new Error(`Missing std140 array layout field ${firstName}`);
      }
      uniforms.push({
        name: firstName,
        format: firstField.shaderType,
        arrayLength,
        byteOffset: firstField.offset * 4,
        byteStride: secondField ? (secondField.offset - firstField.offset) * 4 : 0
      });
    }
  };

  for (const [uniformName, uniformType] of Object.entries(uniformTypes)) {
    addType(uniformName, uniformType);
  }
  return uniforms;
}

function isUsableUniformBlockBinding(
  binding: ShaderLayout['bindings'][number]
): binding is UniformBufferBindingLayout & {minBindingSize: number; uniforms: UniformInfo[]} {
  return (
    binding.type === 'uniform' &&
    Number.isInteger(binding.minBindingSize) &&
    binding.minBindingSize! >= 0 &&
    Array.isArray(binding.uniforms) &&
    binding.uniforms.every(
      uniform =>
        typeof uniform.name === 'string' &&
        typeof uniform.format === 'string' &&
        Number.isInteger(uniform.arrayLength) &&
        uniform.arrayLength > 0 &&
        Number.isInteger(uniform.byteOffset) &&
        uniform.byteOffset >= 0 &&
        Number.isInteger(uniform.byteStride) &&
        uniform.byteStride >= 0
    )
  );
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
  const uniformName = assertDefined(matches?.[1], `Failed to parse GLSL uniform name ${name}`);
  return {
    name: uniformName,
    // TODO - is this a bug, shouldn't we return the value?
    length: matches?.[2] ? 1 : 0,
    isArray: Boolean(matches?.[2])
  };
}
