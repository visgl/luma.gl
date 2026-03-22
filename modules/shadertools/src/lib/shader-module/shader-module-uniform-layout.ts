// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from './shader-module';
import {assert} from '../utils/assert';

export type ShaderModuleUniformLayoutStage = 'vertex' | 'fragment' | 'wgsl';

export type ShaderModuleUniformLayoutValidationResult = {
  moduleName: string;
  uniformBlockName: string;
  stage: ShaderModuleUniformLayoutStage;
  expectedUniformNames: string[];
  actualUniformNames: string[];
  matches: boolean;
};

type Logger = {
  error?: (...args: unknown[]) => () => unknown;
};

const GLSL_UNIFORM_BLOCK_FIELD_REGEXP =
  /^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/;

export function getShaderModuleUniformBlockName(module: ShaderModule): string {
  return `${module.name}Uniforms`;
}

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

function extractGLSLUniformBlockBody(
  shaderSource: string,
  uniformBlockName: string
): string | null {
  const sourceMatch = shaderSource.match(
    new RegExp(`uniform\\s+${uniformBlockName}\\s*\\{([\\s\\S]*?)\\}\\s*[A-Za-z0-9_]+\\s*;`, 'm')
  );

  return sourceMatch?.[1] || null;
}

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

function formatShaderModuleUniformLayoutError(
  validationResult: ShaderModuleUniformLayoutValidationResult
): string {
  return `${validationResult.moduleName}: ${validationResult.stage} shader uniform block ${
    validationResult.uniformBlockName
  } does not match module.uniformTypes.\nExpected: ${validationResult.expectedUniformNames.join(
    ', '
  )}\nActual: ${validationResult.actualUniformNames.join(', ')}`;
}
