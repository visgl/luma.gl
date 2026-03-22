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
  const sourceMatch =
    language === 'wgsl'
      ? shaderSource.match(
          new RegExp(`struct\\s+${uniformBlockName}\\s*\\{([\\s\\S]*?)\\}\\s*;`, 'm')
        )
      : shaderSource.match(
          new RegExp(
            `uniform\\s+${uniformBlockName}\\s*\\{([\\s\\S]*?)\\}\\s*[A-Za-z0-9_]+\\s*;`,
            'm'
          )
        );

  if (!sourceMatch) {
    return null;
  }

  const fieldNames: string[] = [];

  for (const sourceLine of sourceMatch[1].split('\n')) {
    const line = sourceLine.replace(/\/\/.*$/, '').trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const fieldMatch =
      language === 'wgsl'
        ? line.match(/^([A-Za-z0-9_]+)\s*:/)
        : line.match(
            /^(?:uniform\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/
          );

    if (fieldMatch) {
      fieldNames.push(fieldMatch[1]);
    }
  }

  return fieldNames;
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
