// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderAttributeType, ShaderLayout, log} from '@luma.gl/core';
import {WgslReflect} from 'wgsl_reflect';

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
    for (const attribute of (uniform.type as any)?.members || []) {
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
    shaderLayout.bindings.push({
      type: 'texture',
      name: texture.name,
      group: texture.group,
      location: texture.binding
    });
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
