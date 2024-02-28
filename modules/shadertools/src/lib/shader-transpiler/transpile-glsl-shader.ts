// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TRANSPILATION TABLES

/**
 * Transpiles GLSL 3.00 shader source code to target GLSL version (3.00 or 1.00)
 *
 * @note We always run transpiler even if same version e.g. 3.00 => 3.00
 * @note For texture sampling transpilation, apps need to use non-standard texture* calls in GLSL 3.00 source
 * RFC: https://github.com/visgl/luma.gl/blob/7.0-release/dev-docs/RFCs/v6.0/portable-glsl-300-rfc.md
 */
export function transpileGLSLShader(source: string, stage: 'vertex' | 'fragment'): string {
  const sourceGLSLVersion = Number(source.match(/^#version[ \t]+(\d+)/m)?.[1] || 100);
  if (sourceGLSLVersion !== 300) {
    // TODO - we splurge on a longer error message to help deck.gl custom layer developers
    throw new Error('luma.gl v9 only supports GLSL 3.00 shader sources');
  }

  switch (stage) {
    case 'vertex':
      source = convertShader(source, ES300_VERTEX_REPLACEMENTS);
      return source;
    case 'fragment':
      source = convertShader(source, ES300_FRAGMENT_REPLACEMENTS);
      return source;
    default:
      // Unknown shader stage
      throw new Error(stage);
  }
}

type GLSLReplacement = [RegExp, string];

/** Simple regex replacements for GLSL ES 1.00 syntax that has changed in GLSL ES 3.00 */
const ES300_REPLACEMENTS: GLSLReplacement[] = [
  // Fix poorly formatted version directive
  [/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/, '#version 300 es\n'],
  // The individual `texture...()` functions were replaced with `texture()` overloads
  [/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g, 'textureLod('],
  [/\btexture(2D|2DProj|Cube)(EXT)?\(/g, 'texture(']
];

const ES300_VERTEX_REPLACEMENTS: GLSLReplacement[] = [
  ...ES300_REPLACEMENTS,
  // `attribute` keyword replaced with `in`
  [makeVariableTextRegExp('attribute'), 'in $1'],
  // `varying` keyword replaced with `out`
  [makeVariableTextRegExp('varying'), 'out $1']
];

/** Simple regex replacements for GLSL ES 1.00 syntax that has changed in GLSL ES 3.00 */
const ES300_FRAGMENT_REPLACEMENTS: GLSLReplacement[] = [
  ...ES300_REPLACEMENTS,
  // `varying` keyword replaced with `in`
  [makeVariableTextRegExp('varying'), 'in $1']
];

function convertShader(source: string, replacements: GLSLReplacement[]) {
  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, replacement);
  }
  return source;
}

/**
 * Creates a regexp that tests for a specific variable type
 * @example
 *   should match:
 *     in float weight;
 *     out vec4 positions[2];
 *   should not match:
 *     void f(out float a, in float b) {}
 */
function makeVariableTextRegExp(qualifier: 'attribute' | 'varying' | 'in' | 'out'): RegExp {
  return new RegExp(`\\b${qualifier}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`, 'g');
}
