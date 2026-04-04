// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from './shader-module';
import {assert} from '../utils/assert';

/**
 * Shader stages supported by shader-module uniform-layout validation helpers.
 */
export type ShaderModuleUniformLayoutStage = 'vertex' | 'fragment' | 'wgsl';

/**
 * Describes the result of comparing declared `uniformTypes` with the fields
 * found in a shader uniform block.
 */
export type ShaderModuleUniformLayoutValidationResult = {
  /** Name of the shader module being validated. */
  moduleName: string;
  /** Expected block name derived from the shader module name. */
  uniformBlockName: string;
  /** Shader stage that was inspected. */
  stage: ShaderModuleUniformLayoutStage;
  /** Field names declared by the module metadata. */
  expectedUniformNames: string[];
  /** Field names parsed from the shader source. */
  actualUniformNames: string[];
  /** Whether the declared and parsed field lists match exactly. */
  matches: boolean;
};

/**
 * Parsed information about one GLSL uniform block declaration.
 */
export type GLSLUniformBlockInfo = {
  /** Declared block type name. */
  blockName: string;
  /** Optional instance name that follows the block declaration. */
  instanceName: string | null;
  /** Raw layout qualifier text, if present. */
  layoutQualifier: string | null;
  /** Whether any explicit layout qualifier was present. */
  hasLayoutQualifier: boolean;
  /** Whether the block explicitly declares `layout(std140)`. */
  isStd140: boolean;
  /** Raw source text inside the block braces. */
  body: string;
};

/**
 * Logging surface used by validation and warning helpers.
 */
type Logger = {
  /** Error logger compatible with luma's deferred log API. */
  error?: (...args: unknown[]) => () => unknown;
  /** Warning logger compatible with luma's deferred log API. */
  warn?: (...args: unknown[]) => () => unknown;
};

/**
 * Matches one field declaration inside a GLSL uniform block body.
 */
const GLSL_UNIFORM_BLOCK_FIELD_REGEXP =
  /^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/;
/**
 * Matches full GLSL uniform block declarations, including optional layout qualifiers.
 */
const GLSL_UNIFORM_BLOCK_REGEXP =
  /((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;

/**
 * Returns the uniform block type name expected for the supplied shader module.
 */
export function getShaderModuleUniformBlockName(module: ShaderModule): string {
  return `${module.name}Uniforms`;
}

/**
 * Returns the ordered field names parsed from a shader module's uniform block.
 *
 * @returns `null` when the stage has no source or the expected block is absent.
 */
export function getShaderModuleUniformBlockFields(
  module: ShaderModule,
  stage: ShaderModuleUniformLayoutStage
): string[] | null {
  const shaderSource =
    stage === 'wgsl' ? module.source : stage === 'vertex' ? module.vs : module.fs;

  if (!shaderSource) {
    return null;
  }

  const uniformBlockName = getShaderModuleUniformBlockName(module);
  return extractShaderUniformBlockFieldNames(
    shaderSource,
    stage === 'wgsl' ? 'wgsl' : 'glsl',
    uniformBlockName
  );
}

/**
 * Computes the validation result for a shader module's declared and parsed
 * uniform-block field lists.
 *
 * @returns `null` when the module has no declared uniform types or no matching block.
 */
export function getShaderModuleUniformLayoutValidationResult(
  module: ShaderModule,
  stage: ShaderModuleUniformLayoutStage
): ShaderModuleUniformLayoutValidationResult | null {
  const expectedUniformNames = Object.keys(module.uniformTypes || {});
  if (!expectedUniformNames.length) {
    return null;
  }

  const actualUniformNames = getShaderModuleUniformBlockFields(module, stage);
  if (!actualUniformNames) {
    return null;
  }

  return {
    moduleName: module.name,
    uniformBlockName: getShaderModuleUniformBlockName(module),
    stage,
    expectedUniformNames,
    actualUniformNames,
    matches: areStringArraysEqual(expectedUniformNames, actualUniformNames)
  };
}

/**
 * Validates that a shader module's parsed uniform block matches `uniformTypes`.
 *
 * When a mismatch is detected, the helper logs a formatted error and optionally
 * throws via {@link assert}.
 */
export function validateShaderModuleUniformLayout(
  module: ShaderModule,
  stage: ShaderModuleUniformLayoutStage,
  options: {
    log?: Logger;
    throwOnError?: boolean;
  } = {}
): ShaderModuleUniformLayoutValidationResult | null {
  const validationResult = getShaderModuleUniformLayoutValidationResult(module, stage);
  if (!validationResult || validationResult.matches) {
    return validationResult;
  }

  const message = formatShaderModuleUniformLayoutError(validationResult);
  options.log?.error?.(message, validationResult)();

  if (options.throwOnError !== false) {
    assert(false, message);
  }

  return validationResult;
}

/**
 * Parses all GLSL uniform blocks in a shader source string.
 */
export function getGLSLUniformBlocks(shaderSource: string): GLSLUniformBlockInfo[] {
  const blocks: GLSLUniformBlockInfo[] = [];
  const uncommentedSource = stripShaderComments(shaderSource);

  for (const sourceMatch of uncommentedSource.matchAll(GLSL_UNIFORM_BLOCK_REGEXP)) {
    const layoutQualifier = sourceMatch[1]?.trim() || null;
    blocks.push({
      blockName: sourceMatch[2],
      body: sourceMatch[3],
      instanceName: sourceMatch[4] || null,
      layoutQualifier,
      hasLayoutQualifier: Boolean(layoutQualifier),
      isStd140: Boolean(
        layoutQualifier && /\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(layoutQualifier)
      )
    });
  }

  return blocks;
}

/**
 * Emits warnings for GLSL uniform blocks that do not explicitly declare
 * `layout(std140)`.
 *
 * @returns The list of parsed blocks that were considered non-compliant.
 */
export function warnIfGLSLUniformBlocksAreNotStd140(
  shaderSource: string,
  stage: Exclude<ShaderModuleUniformLayoutStage, 'wgsl'>,
  log?: Logger,
  context?: {label?: string}
): GLSLUniformBlockInfo[] {
  const nonStd140Blocks = getGLSLUniformBlocks(shaderSource).filter(block => !block.isStd140);
  const seenBlockNames = new Set<string>();

  for (const block of nonStd140Blocks) {
    if (seenBlockNames.has(block.blockName)) {
      continue;
    }
    seenBlockNames.add(block.blockName);

    const shaderLabel = context?.label ? `${context.label} ` : '';
    const actualLayout = block.hasLayoutQualifier
      ? `declares ${normalizeWhitespace(block.layoutQualifier!)} instead of layout(std140)`
      : 'does not declare layout(std140)';
    const message = `${shaderLabel}${stage} shader uniform block ${
      block.blockName
    } ${actualLayout}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;
    log?.warn?.(message, block)();
  }

  return nonStd140Blocks;
}

/**
 * Extracts field names from the named GLSL or WGSL uniform block/struct.
 */
function extractShaderUniformBlockFieldNames(
  shaderSource: string,
  language: 'glsl' | 'wgsl',
  uniformBlockName: string
): string[] | null {
  const sourceBody =
    language === 'wgsl'
      ? extractWGSLStructBody(shaderSource, uniformBlockName)
      : extractGLSLUniformBlockBody(shaderSource, uniformBlockName);

  if (!sourceBody) {
    return null;
  }

  const fieldNames: string[] = [];

  for (const sourceLine of sourceBody.split('\n')) {
    const line = sourceLine.replace(/\/\/.*$/, '').trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const fieldMatch =
      language === 'wgsl'
        ? line.match(/^([A-Za-z0-9_]+)\s*:/)
        : line.match(GLSL_UNIFORM_BLOCK_FIELD_REGEXP);

    if (fieldMatch) {
      fieldNames.push(fieldMatch[1]);
    }
  }

  return fieldNames;
}

/**
 * Extracts the body of a WGSL struct with the supplied name.
 */
function extractWGSLStructBody(shaderSource: string, uniformBlockName: string): string | null {
  const structMatch = new RegExp(`\\bstruct\\s+${uniformBlockName}\\b`, 'm').exec(shaderSource);
  if (!structMatch) {
    return null;
  }

  const openBraceIndex = shaderSource.indexOf('{', structMatch.index);
  if (openBraceIndex < 0) {
    return null;
  }

  let braceDepth = 0;
  for (let index = openBraceIndex; index < shaderSource.length; index++) {
    const character = shaderSource[index];
    if (character === '{') {
      braceDepth++;
      continue;
    }
    if (character !== '}') {
      continue;
    }

    braceDepth--;
    if (braceDepth === 0) {
      return shaderSource.slice(openBraceIndex + 1, index);
    }
  }

  return null;
}

/**
 * Extracts the body of a named GLSL uniform block from shader source.
 */
function extractGLSLUniformBlockBody(
  shaderSource: string,
  uniformBlockName: string
): string | null {
  const block = getGLSLUniformBlocks(shaderSource).find(
    candidate => candidate.blockName === uniformBlockName
  );
  return block?.body || null;
}

/**
 * Returns `true` when the two arrays contain the same strings in the same order.
 */
function areStringArraysEqual(leftValues: string[], rightValues: string[]): boolean {
  if (leftValues.length !== rightValues.length) {
    return false;
  }

  for (let valueIndex = 0; valueIndex < leftValues.length; valueIndex++) {
    if (leftValues[valueIndex] !== rightValues[valueIndex]) {
      return false;
    }
  }

  return true;
}

/**
 * Formats the standard validation error message for a shader-module layout mismatch.
 */
function formatShaderModuleUniformLayoutError(
  validationResult: ShaderModuleUniformLayoutValidationResult
): string {
  const {expectedUniformNames, actualUniformNames} = validationResult;
  const missingUniformNames = expectedUniformNames.filter(
    uniformName => !actualUniformNames.includes(uniformName)
  );
  const unexpectedUniformNames = actualUniformNames.filter(
    uniformName => !expectedUniformNames.includes(uniformName)
  );
  const mismatchDetails = [
    `Expected ${expectedUniformNames.length} fields, found ${actualUniformNames.length}.`
  ];
  const firstMismatchDescription = getFirstUniformMismatchDescription(
    expectedUniformNames,
    actualUniformNames
  );
  if (firstMismatchDescription) {
    mismatchDetails.push(firstMismatchDescription);
  }
  if (missingUniformNames.length) {
    mismatchDetails.push(
      `Missing from shader block (${missingUniformNames.length}): ${formatUniformNameList(
        missingUniformNames
      )}.`
    );
  }
  if (unexpectedUniformNames.length) {
    mismatchDetails.push(
      `Unexpected in shader block (${unexpectedUniformNames.length}): ${formatUniformNameList(
        unexpectedUniformNames
      )}.`
    );
  }
  if (
    expectedUniformNames.length <= 12 &&
    actualUniformNames.length <= 12 &&
    (missingUniformNames.length || unexpectedUniformNames.length)
  ) {
    mismatchDetails.push(`Expected: ${expectedUniformNames.join(', ')}.`);
    mismatchDetails.push(`Actual: ${actualUniformNames.join(', ')}.`);
  }

  return `${validationResult.moduleName}: ${validationResult.stage} shader uniform block ${
    validationResult.uniformBlockName
  } does not match module.uniformTypes. ${mismatchDetails.join(' ')}`;
}

/**
 * Removes line and block comments from shader source before lightweight parsing.
 */
function stripShaderComments(shaderSource: string): string {
  return shaderSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/**
 * Collapses repeated whitespace in a layout qualifier for log-friendly output.
 */
function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function getFirstUniformMismatchDescription(
  expectedUniformNames: string[],
  actualUniformNames: string[]
): string | null {
  const minimumLength = Math.min(expectedUniformNames.length, actualUniformNames.length);
  for (let index = 0; index < minimumLength; index++) {
    if (expectedUniformNames[index] !== actualUniformNames[index]) {
      return `First mismatch at field ${index + 1}: expected ${
        expectedUniformNames[index]
      }, found ${actualUniformNames[index]}.`;
    }
  }

  if (expectedUniformNames.length > actualUniformNames.length) {
    return `Shader block ends after field ${actualUniformNames.length}; expected next field ${
      expectedUniformNames[actualUniformNames.length]
    }.`;
  }
  if (actualUniformNames.length > expectedUniformNames.length) {
    return `Shader block has extra field ${actualUniformNames.length}: ${
      actualUniformNames[expectedUniformNames.length]
    }.`;
  }

  return null;
}

function formatUniformNameList(uniformNames: string[], maxNames = 8): string {
  if (uniformNames.length <= maxNames) {
    return uniformNames.join(', ');
  }

  const remainingCount = uniformNames.length - maxNames;
  return `${uniformNames.slice(0, maxNames).join(', ')}, ... (${remainingCount} more)`;
}
