// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AttributeShaderType, ShaderLayout, TextureBindingLayout, log} from '@luma.gl/core';
import {TypeInfo, VariableInfo, WgslReflect, ResourceType} from 'wgsl_reflect';

/**
 * Parse a ShaderLayout from WGSL shader source code.
 * @param source WGSL source code (can contain both @vertex and @fragment entry points)
 * @returns
 */
export function getShaderLayoutFromWGSL(source: string): ShaderLayout {
  const shaderLayout: ShaderLayout = {attributes: [], bindings: []};

  let parsedWGSL: WgslReflect;
  try {
    parsedWGSL = parseWGSL(source);
  } catch (error: any) {
    log.error(error.message)();
    return shaderLayout;
  }

  for (const uniform of parsedWGSL.uniforms) {
    const members = [];
    // @ts-expect-error
    for (const attribute of uniform.type?.members || []) {
      members.push({
        name: attribute.name,
        type: getType(attribute.type)
      });
    }

    shaderLayout.bindings.push({
      type: 'uniform',
      name: uniform.name,
      group: uniform.group,
      location: uniform.binding,
      // @ts-expect-error TODO - unused for now but needs fixing
      members
    });
  }

  for (const texture of parsedWGSL.textures) {
    const bindingDeclaration: TextureBindingLayout = {
      type: 'texture',
      name: texture.name,
      group: texture.group,
      location: texture.binding,
      ...getTextureBindingFromReflect(texture)
    };

    shaderLayout.bindings.push(bindingDeclaration);
  }

  for (const sampler of parsedWGSL.samplers) {
    shaderLayout.bindings.push({
      type: 'sampler',
      name: sampler.name,
      group: sampler.group,
      location: sampler.binding
    });
  }

  const vertex = parsedWGSL.entry.vertex[0]; // "main"

  // Vertex shader inputs
  const attributeCount = vertex?.inputs.length || 0; // inputs to "main"
  for (let i = 0; i < attributeCount; i++) {
    const wgslAttribute = vertex.inputs[i];

    // locationType can be "builtin"
    if (wgslAttribute.locationType === 'location') {
      const type = getType(wgslAttribute.type);

      shaderLayout.attributes.push({
        name: wgslAttribute.name,
        location: Number(wgslAttribute.location),
        type
      });
    }
  }
  return shaderLayout;
}

/** Get a valid shader attribute type string from a wgsl-reflect type */
function getType(type: TypeInfo | null): AttributeShaderType {
  // @ts-expect-error WgslReflect type checks needed
  return type?.format ? `${type.name}<${type.format.name}>` : type.name;
}

function parseWGSL(source: string): WgslReflect {
  try {
    return new WgslReflect(source);
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    let message = 'WGSL parse error';
    if (typeof error === 'object' && error?.message) {
      message += `: ${error.message} `;
    }
    if (typeof error === 'object' && error?.token) {
      message += error.token.line || '';
    }
    throw new Error(message, {cause: error});
  }
}

function getTextureBindingFromReflect(
  v: VariableInfo, // VariableInfo for a texture
  opts?: {format?: GPUTextureFormat} // optional: if you know the runtime format
): {
  viewDimension: GPUTextureViewDimension;
  /** @note sampleType float vs unfilterable-float cannot be determined without checking texture format and features */
  sampleType: GPUTextureSampleType;
  multisampled: boolean;
} {
  if (v.resourceType !== ResourceType.Texture) {
    throw new Error('Not a texture binding');
  }

  const typeName = v.type.name; // e.g. "texture_2d", "texture_cube_array", "texture_multisampled_2d"
  // @ts-expect-error v.type.format is not always defined
  const component = v.type.format?.name as 'f32' | 'i32' | 'u32' | undefined;

  // viewDimension
  const viewDimension: GPUTextureViewDimension = typeName.includes('cube_array')
    ? 'cube-array'
    : typeName.includes('cube')
      ? 'cube'
      : typeName.includes('2d_array')
        ? '2d-array'
        : typeName.includes('3d')
          ? '3d'
          : typeName.includes('1d')
            ? '1d'
            : '2d';

  // multisampled
  const multisampled = typeName === 'texture_multisampled_2d';

  // sampleType
  let sampleType: GPUTextureSampleType;
  if (typeName.startsWith('texture_depth')) {
    sampleType = 'depth';
  } else if (component === 'i32') {
    sampleType = 'sint';
  } else if (component === 'u32') {
    sampleType = 'uint';
  } else {
    sampleType = 'float'; // default to float
  }

  return {viewDimension, sampleType, multisampled};
}
