// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';

/**
 * Extracts a table suitable for `console.table()` from a shader layout to assist in debugging.
 * @param layout shader layout
 * @param name app should provide the most meaningful name, usually the model or pipeline name / id.
 * @returns
 */
export function getDebugTableForShaderLayout(
  layout: ShaderLayout,
  name: string
): Record<string, Record<string, string>> {
  const table: Record<string, Record<string, string>> = {};

  const header = 'Values'; // '`Shader Layout for ${name}`;

  if (layout.attributes.length === 0 && !layout.varyings?.length) {
    return {'No attributes or varyings': {[header]: 'N/A'}};
  }

  for (const attributeDeclaration of layout.attributes) {
    if (attributeDeclaration) {
      const glslDeclaration = `${attributeDeclaration.location} ${attributeDeclaration.name}: ${attributeDeclaration.type}`;
      table[`in ${glslDeclaration}`] = {[header]: attributeDeclaration.stepMode || 'vertex'};
    }
  }

  for (const varyingDeclaration of layout.varyings || []) {
    const glslDeclaration = `${varyingDeclaration.location} ${varyingDeclaration.name}`;
    table[`out ${glslDeclaration}`] = {[header]: JSON.stringify(varyingDeclaration)};
  }

  return table;
}
