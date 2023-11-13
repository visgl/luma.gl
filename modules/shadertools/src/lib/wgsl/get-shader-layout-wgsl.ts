// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {ShaderAttributeType, ShaderLayout} from '@luma.gl/core';
import {WgslReflect} from '../../wgsl-reflect/wgsl_reflect.module.js';

export function getShaderLayoutFromWGSL(source: string): ShaderLayout {
  const reflect = new WgslReflect(source);

  const shaderLayout: ShaderLayout = {attributes: [], bindings: []};

  for (const uniform of reflect.uniforms) {
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

  const vertex = reflect.entry.vertex[0]; // "main"

  // Vertex shader inputs
  const attributeCount = vertex.inputs.length; // 4, inputs to "main"
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

function getType(type: any): ShaderAttributeType {
  return type.format ? `${type.name}<${type.format.name}>` : type.name;
}
