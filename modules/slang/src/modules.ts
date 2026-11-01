// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Program, ShaderFunction, SlangType, SourceLocation, Token} from './ast';
import type {SlangModuleOptions, SlangNativeModule, SlangTarget} from './types';
import {SlangParser} from './parser';
import {tokenizeSlang} from './lexer';
import {SlangTranspileError} from './diagnostics';

export function getSlangTypeSignature(type: SlangType): string {
  return type.name === 'array'
    ? `${getSlangTypeSignature(type.element!)}[${type.length}]`
    : type.element
      ? `${type.name}<${getSlangTypeSignature(type.element)}>`
      : type.name;
}
export function getSlangParameterDirection(parameter: ShaderFunction['parameters'][number]) {
  return parameter.modifiers.includes('inout')
    ? 'inout'
    : parameter.modifiers.includes('out')
      ? 'out'
      : 'in';
}

/** Resolve only the explicitly supplied registry; each named dependency is parsed once. */
export function parseSlangProgram(
  source: string,
  options: SlangModuleOptions & {sourceName?: string; target: SlangTarget}
): Program {
  const sourceName = options.sourceName || 'shader.slang';
  type Unit = {source: string; name: string; tokens: Token[]; native?: SlangNativeModule};
  const units: Unit[] = [];
  const visited = new Set<string>();
  const visiting: string[] = [];
  const fail: (message: string, location: SourceLocation) => never = (message, location) => {
    throw new SlangTranspileError(message, location, location.sourceName || sourceName);
  };
  const visit = (text: string, name: string, native?: SlangNativeModule): void => {
    const tokens = tokenizeSlang(text, name);
    const retained: Token[] = [];
    let depth = 0;
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.text !== 'import') {
        if (token.text === '{') depth++;
        if (token.text === '}') depth--;
        retained.push(token);
        continue;
      }
      if (depth) fail('Imports must be at module scope', token);
      let moduleName = '';
      do {
        const identifier = tokens[++index];
        if (identifier.kind !== 'identifier')
          fail('Imports require a registry module name; file imports are unsupported', identifier);
        moduleName += identifier.text;
        if (tokens[index + 1].text !== '.') break;
        moduleName += '.';
        index++;
      } while (true);
      if (tokens[++index].text !== ';')
        fail('Expected a semicolon after the module name', tokens[index]);
      if (visiting.includes(moduleName))
        fail(`Import cycle: ${[...visiting, moduleName].join(' -> ')}`, token);
      if (visited.has(moduleName)) continue;
      if (!options.modules || !Object.prototype.hasOwnProperty.call(options.modules, moduleName))
        fail(`Missing registry module ${moduleName}`, token);
      if (visiting.length >= 128) fail('Module import depth exceeds 128', token);
      const module = options.modules[moduleName];
      if (typeof module !== 'string' && module[options.target] === undefined)
        fail(`Native module ${moduleName} has no ${options.target} implementation`, token);
      visiting.push(moduleName);
      visit(
        typeof module === 'string' ? module : module.declarations,
        moduleName,
        typeof module === 'string' ? undefined : module
      );
      visiting.pop();
      visited.add(moduleName);
    }
    units.push({source: text, name, tokens: retained, native});
  };
  visit(source, sourceName);
  const typeNames = units.flatMap(unit =>
    unit.tokens.flatMap((token, index) =>
      token.text === 'struct' ? [unit.tokens[index + 1].text] : []
    )
  );
  const program: Program = {declarations: [], publicNames: new Map(), nativeModules: []};
  const publicNames = program.publicNames as Map<string, string>;
  const contracts: {
    declaration: ShaderFunction;
    module: NonNullable<Program['nativeModules']>[number];
  }[] = [];
  const addPublicName = (name: string, shaderName: string, location: SourceLocation): void => {
    if (!/^[a-zA-Z][a-zA-Z_0-9]*$/.test(shaderName) || shaderName.startsWith('gl_'))
      fail('Public shader names must be ordinary identifiers outside reserved prefixes', location);
    const previous = publicNames.get(name);
    if (previous && previous !== shaderName) fail(`Conflicting public name for ${name}`, location);
    if (
      [...publicNames].some(
        ([otherName, otherShaderName]) => otherName !== name && otherShaderName === shaderName
      )
    )
      fail(`Duplicate public shader name ${shaderName}`, location);
    publicNames.set(name, shaderName);
  };
  for (const unit of units) {
    const parsed = new SlangParser(unit.source, unit.name, {
      tokens: unit.tokens,
      typeNames,
      allowPrototypes: Boolean(unit.native)
    }).parseProgram();
    program.declarations.push(...parsed.declarations);
    if (!unit.native) continue;
    const module = {
      name: unit.name,
      code: unit.native[options.target]!,
      sourceName: `${unit.name}.${options.target}`,
      functions: [] as string[],
      imports: [] as string[]
    };
    program.nativeModules!.push(module);
    for (const declaration of parsed.declarations) {
      if (declaration.kind === 'function' && !declaration.prototype)
        fail(
          'Native declarations require function prototypes, not function bodies',
          declaration.location
        );
      if (declaration.kind === 'function') module.functions.push(declaration.name);
      addPublicName(
        declaration.name,
        unit.native.names?.[declaration.name] || declaration.name,
        declaration.location
      );
    }
    for (const name of Object.keys(unit.native.names || {}))
      if (!parsed.declarations.some(declaration => declaration.name === name))
        fail(`Unknown native declaration ${name}`, {
          offset: 0,
          line: 1,
          column: 1,
          sourceName: unit.name
        });
    const imports = new SlangParser(unit.native.imports || '', `${unit.name}:imports`, {
      typeNames,
      allowPrototypes: true
    }).parseProgram();
    for (const declaration of imports.declarations) {
      if (declaration.kind !== 'function' || !declaration.prototype)
        fail('Native imports require Slang function prototypes', declaration.location);
      contracts.push({declaration, module});
    }
  }
  for (const [name, shaderName] of Object.entries(options.exports || {})) {
    const declaration = program.declarations.find(declaration => declaration.name === name);
    if (!declaration) fail(`Unknown Slang export ${name}`, {offset: 0, line: 1, column: 1});
    addPublicName(name, shaderName, declaration.location);
  }
  for (const {declaration: contract, module} of contracts) {
    const declarations = program.declarations.filter(
      (declaration): declaration is ShaderFunction =>
        declaration.kind === 'function' &&
        !declaration.prototype &&
        publicNames.get(declaration.name) === contract.name
    );
    const declaration = declarations[0];
    if (declarations.length !== 1 || !declaration)
      fail(
        `Native import ${contract.name} requires one explicitly exported Slang function`,
        contract.location
      );
    if (
      getSlangTypeSignature(contract.type) !== getSlangTypeSignature(declaration.type) ||
      contract.parameters.length !== declaration.parameters.length ||
      contract.parameters.some(
        (parameter, index) =>
          getSlangTypeSignature(parameter.type) !==
            getSlangTypeSignature(declaration.parameters[index].type) ||
          getSlangParameterDirection(parameter) !==
            getSlangParameterDirection(declaration.parameters[index])
      )
    )
      fail(`Native import ${contract.name} has an incompatible Slang signature`, contract.location);
    module.imports.push(declaration.name);
  }
  return program;
}
