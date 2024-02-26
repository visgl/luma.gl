// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {ShaderAttributeType, ShaderLayout} from '@luma.gl/core';
import {WgslReflect} from '../../libs/wgsl-reflect/wgsl_reflect.module.js';

/**
 * Parse a ShaderLayout from WGSL shader source code.
 * @param source WGSL source code (can contain both @vertex and @fragment entry points)
 * @returns
 */
export function getShaderLayoutFromWGSL(source: string): ShaderLayout {
  const shaderLayout: ShaderLayout = {attributes: [], bindings: []};

  const parsedWGSL = parseWGSL(source);

  for (const uniform of parsedWGSL.uniforms) {
    const members = [];
    for (const member of uniform.type.members) {
      members.push({
        name: member.name,
        type: getType(member.type)
      });
    }

    shaderLayout.bindings.push({
      type: 'uniform',
      name: uniform.name,
      location: uniform.binding,
      // @ts-expect-error
      group: uniform.group,
      members
    });
  }

  const vertex = parsedWGSL.entry.vertex[0]; // "main"

  // Vertex shader inputs
  const attributeCount = vertex.inputs.length; // inputs to "main"
  for (let i = 0; i < attributeCount; i++) {
    const wgslAttribute = vertex.inputs[i];

    // locationType can be "builtin"
    if (wgslAttribute.locationType === 'location') {
      const type = getType(wgslAttribute.type);

      shaderLayout.attributes.push({
        name: wgslAttribute.name,
        location: wgslAttribute.location,
        type
      });
    }
  }
  return shaderLayout;
}

/** Get a valid shader attribute type string from a wgsl-reflect type */
function getType(type: any): ShaderAttributeType {
  return type.format ? `${type.name}<${type.format.name}>` : type.name;
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
