import type {ShaderLayout} from '../../adapter/types/shader-layout';

/**
 * Extracts a table suitable for `console.table()` from a shader layout to assist in debugging.
 * @param layout shader layout
 * @param name app should provide the most meaningful name, usually the model or pipeline name / id.
 * @returns 
 */
export function getDebugTableForShaderLayout(
  layout: ShaderLayout,
  name: string = ''
): Record<string, Record<string, string>> {
  const table: Record<string, Record<string, string>> = {};

  const header = `Shader Layout for ${name}`;

  for (const attributeDeclaration of layout.attributes) {
    if (attributeDeclaration) {
      const glslDeclaration = `${attributeDeclaration.location} ${attributeDeclaration.name}: ${attributeDeclaration.type}`;
      table[`in ${glslDeclaration}`] = {[header]: attributeDeclaration.stepMode || 'vertex'};
    }
  }

  for (const varyingDeclaration of layout.varyings || []) {
    const glslDeclaration = `${varyingDeclaration.location} ${varyingDeclaration.name}`;
    table[`out ${glslDeclaration}`] = {[header]: JSON.stringify(varyingDeclaration.accessor)};
  }

  return table;
}
