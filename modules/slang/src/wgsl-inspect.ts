// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseWGSLDeclarationModule} from './wgsl-declaration-parser';
import {lowerSlangType} from './slang-types';
import type {Program, SlangType, Variable} from './ast';
import type {
  InspectionType,
  InspectionVariable,
  ShaderInspection,
  InspectShaderOptions
} from './inspection-types';

/** Inspect the documented WGSL authoring subset without analysis or target code generation. */
export function inspectWGSL(source: string, options: InspectShaderOptions = {}): ShaderInspection {
  const sourceName = options.sourceName || 'shader.wgsl';
  return createWGSLInspection(parseWGSLDeclarationModule(source, sourceName), sourceName);
}

/** Shared metadata projection, independent of whether function syntax was parsed or skipped. */
export function createWGSLInspection(program: Program, sourceName: string): ShaderInspection {
  function type(value: SlangType): InspectionType {
    if (value.structure) return {kind: 'struct', name: value.name};
    if (value.name === '$inferred') return {kind: 'inferred'};
    if (value.name === 'array')
      return {
        kind: 'array',
        element: type(value.element!),
        ...(value.length !== undefined ? {length: value.length} : {}),
        ...(value.lengthName ? {lengthExpression: value.lengthName} : {})
      };
    if (value.name === 'ConstantBuffer') return type(value.element!);
    if (value.name === 'Texture2D') return {kind: 'opaque', name: 'texture_2d<f32>'};
    if (value.name === 'SamplerState') return {kind: 'opaque', name: 'sampler'};
    return lowerSlangType(value);
  }
  const variable = (value: Variable): InspectionVariable => ({
    name: value.name,
    type: type(value.type),
    location: location(value.location),
    qualifiers: [...value.modifiers],
    ...(value.interface ? {interface: {...value.interface}} : {}),
    ...(value.binding ? {binding: {...value.binding}} : {})
  });
  const structures: ShaderInspection['structures'] = [];
  const globals: ShaderInspection['globals'] = [];
  const functions: ShaderInspection['functions'] = [];
  for (const declaration of program.declarations) {
    if (declaration.kind === 'struct')
      structures.push({
        name: declaration.name,
        members: declaration.fields.map(variable),
        location: location(declaration.location)
      });
    else if (declaration.kind === 'variable')
      globals.push({
        ...variable(declaration),
        addressSpace:
          declaration.type.name === 'ConstantBuffer' && !declaration.type.structure
            ? 'uniform'
            : declaration.binding
              ? 'handle'
              : 'private'
      });
    else {
      const stage = declaration.attributes.find(attribute => attribute.name === 'shader')
        ?.arguments[0] as 'vertex' | 'fragment' | undefined;
      functions.push({
        name: declaration.name,
        returnType: type(declaration.type),
        parameters: declaration.parameters.map(variable),
        location: location(declaration.location),
        hasBody: true,
        ...(stage ? {stage} : {}),
        ...(declaration.interface ? {returnInterface: {...declaration.interface}} : {})
      });
    }
  }
  return {
    language: 'wgsl',
    sourceName,
    structures,
    globals,
    functions,
    entryPoints: functions.filter(value => value.stage)
  };
}
function location(value: import('./ir').SourceLocation): import('./ir').SourceLocation {
  return {
    offset: value.offset,
    line: value.line,
    column: value.column,
    ...(value.sourceName ? {sourceName: value.sourceName} : {})
  };
}
