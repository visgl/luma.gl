// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type ShaderBindingDebugRow, getShaderBindingDebugRowsFromWGSL} from './wgsl-binding-debug';
import {type ShaderLayout} from '../../types';
import {scanWGSLInterface} from './wgsl-interface-scan';
import {
  type AssembleWGSLShaderOptions,
  type GetUniformsFunc,
  type WGSLBindingAssignment,
  type AssembleStageOptions,
  type WGSLApplicationRelocationState,
  type BindingRelocationContext,
  type WGSLRelocationState,
  type WGSLRelocationParams
} from './shader-assembly-types';
import {getShaderModuleDependencies} from '../shader-module/shader-module-dependencies';
import {
  assembleGetUniforms,
  appendInjections,
  getShaderModuleSource,
  INJECT_SHADER_DECLARATIONS
} from './shader-assembly-shared';
import {PlatformInfo} from './platform-info';
import {assert} from '../utils/assert';
import {preprocess} from '../preprocessor/preprocessor';
import {assembleShaderPluginVertexInputsWGSL} from './shader-plugin-vertex-inputs';
import {assembleShaderPluginVaryingsWGSL} from './shader-plugin-varyings';
import {
  normalizeShaderHooks,
  validateShaderHookInjections,
  isShaderHookRegistered,
  getShaderHooks
} from './shader-hooks';
import {type ShaderInjection, injectShader} from './shader-injections';
import {checkShaderModuleDeprecations, type ShaderModule} from '../shader-module/shader-module';
import {
  getWGSLBindingDeclarationMatches,
  WGSL_EXPLICIT_BINDING_DECLARATION_REGEXES,
  WGSL_BINDING_DECLARATION_REGEXES,
  replaceWGSLBindingDeclarationMatches,
  hasWGSLAutoBinding,
  MODULE_WGSL_BINDING_DECLARATION_REGEXES,
  type WGSLBindingDeclarationMatch,
  getFirstWGSLAutoBindingDeclarationMatch
} from './wgsl-binding-scan';

export const RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT = 100;

/** Inject shader modules and compute metadata for the resulting WGSL source. */
export function assembleWGSLShader(options: AssembleWGSLShaderOptions): {
  source: string;
  getUniforms: GetUniformsFunc;
  bindingAssignments: WGSLBindingAssignment[];
  bindingTable: ShaderBindingDebugRow[];
  shaderLayout: ShaderLayout | null;
} {
  const assembledShader = assembleWGSLSource(options);
  return {
    ...assembledShader,
    bindingTable: getShaderBindingDebugRowsFromWGSL(
      assembledShader.source,
      assembledShader.bindingAssignments
    ),
    shaderLayout: scanWGSLInterface(assembledShader.source, {
      vertexEntryPoint: options.vertexEntryPoint,
      scanVertexAttributes: options.scanVertexAttributes
    })
  };
}

/** @internal Assemble source without scanning metadata that subsequent preprocessing invalidates. */
export function assembleWGSLSource(options: AssembleWGSLShaderOptions): {
  source: string;
  getUniforms: GetUniformsFunc;
  bindingAssignments: WGSLBindingAssignment[];
} {
  const modules = getShaderModuleDependencies(options.modules || []);
  const {source, bindingAssignments} = assembleShaderWGSL(options.platformInfo, {
    ...options,
    source: options.source,
    stage: 'vertex',
    modules
  });

  return {
    source,
    getUniforms: assembleGetUniforms(modules),
    bindingAssignments
  };
}

/**
 * Pulls together complete source code for either a vertex or a fragment shader
 * adding prologues, requested module chunks, and any final injections.
 * @param gl
 * @param options
 * @returns
 */
export function assembleShaderWGSL(
  platformInfo: PlatformInfo,
  options: AssembleStageOptions
): {source: string; bindingAssignments: WGSLBindingAssignment[]} {
  const {
    // id,
    source,
    stage,
    modules,
    // defines = {},
    defines = {},
    hookFunctions = [],
    inject = {},
    pluginInjections = {},
    pluginVertexInputs = {},
    pluginVaryings = {},
    vertexEntryPoint = 'vertexMain',
    fragmentEntryPoint = 'fragmentMain',
    log
  } = options;

  assert(typeof source === 'string', 'shader source must be a string');

  // const isVertex = type === 'vs';
  // const sourceLines = source.split('\n');

  const preprocessedSource = preprocess(source, {defines});
  const pluginVertexInputAssembly = assembleShaderPluginVertexInputsWGSL(
    preprocessedSource,
    vertexEntryPoint,
    pluginVertexInputs
  );
  const pluginVaryingAssembly = assembleShaderPluginVaryingsWGSL(
    pluginVertexInputAssembly.source,
    vertexEntryPoint,
    fragmentEntryPoint,
    pluginVaryings
  );
  const coreSource = pluginVaryingAssembly.source;

  // Combine Module and Application Defines
  // const allDefines = {};
  // modules.forEach(module => {
  //   Object.assign(allDefines, module.getDefines());
  // });
  // Object.assign(allDefines, defines);

  // Add platform defines (use these to work around platform-specific bugs and limitations)
  // Add common defines (GLSL version compatibility, feature detection)
  // Add precision declaration for fragment shaders
  let assembledSource = '';
  //   prologue
  //     ? `\
  // ${getShaderNameDefine({id, source, type})}
  // ${getShaderType(type)}
  // ${getPlatformShaderDefines(platformInfo)}
  // ${getApplicationDefines(allDefines)}
  // ${isVertex ? '' : FRAGMENT_SHADER_PROLOGUE}
  // `
  // `;

  const hookFunctionMap = normalizeShaderHooks(hookFunctions);

  // Add source of dependent modules in resolved order
  const hookInjections: Record<string, ShaderInjection[]> = {};
  const declInjections: Record<string, ShaderInjection[]> = {};
  const mainInjections: Record<string, ShaderInjection[]> = {};

  appendInjections(pluginInjections, hookInjections, declInjections, mainInjections);

  for (const key in inject) {
    const injection: ShaderInjection =
      typeof inject[key] === 'string' ? {injection: inject[key], order: 0} : inject[key];
    const match = /^(v|f)s:(#)?([\w-]+)$/.exec(key);
    if (match) {
      const hash = match[2];
      const name = match[3];
      if (hash) {
        if (name === 'decl') {
          declInjections[key] = [...(declInjections[key] || []), injection];
        } else {
          mainInjections[key] = [...(mainInjections[key] || []), injection];
        }
      } else {
        hookInjections[key] = [...(hookInjections[key] || []), injection];
      }
    } else {
      // Regex injection
      mainInjections[key] = [...(mainInjections[key] || []), injection];
    }
  }
  appendGeneratedVertexInputInjections(
    pluginVertexInputAssembly.declarations,
    pluginVertexInputAssembly.initialization,
    declInjections,
    mainInjections
  );
  appendGeneratedVaryingInjections(pluginVaryingAssembly, declInjections, mainInjections);

  // Application and plugin injections are WGSL-specific, so every named hook they target must exist.
  validateShaderHookInjections(hookFunctionMap, hookInjections);

  // TODO - hack until shadertool modules support WebGPU
  const modulesToInject = modules.map(module => ({
    module,
    source: preprocess(getShaderModuleSource(module, 'wgsl', log), {defines})
  }));
  const applicationRelocation = relocateWGSLApplicationBindings(coreSource);
  const usedBindingsByGroup = getUsedBindingsByGroupFromApplicationWGSL(
    applicationRelocation.source
  );
  const reservedBindingKeysByGroup = reserveModuleBindings(
    modulesToInject,
    options._bindingRegistry,
    usedBindingsByGroup
  );
  const bindingAssignments: WGSLBindingAssignment[] = [];

  // Resolve all bindings before emitting source, preserving module and declaration order.
  const relocatedModules = modulesToInject.map(({module, source: moduleSource}) => {
    const relocation = relocateWGSLModuleBindings(moduleSource, module, {
      usedBindingsByGroup,
      bindingRegistry: options._bindingRegistry,
      reservedBindingKeysByGroup
    });
    bindingAssignments.push(...relocation.bindingAssignments);
    return {module, source: relocation.source};
  });

  for (const {module, source: moduleSource} of relocatedModules) {
    if (log) {
      checkShaderModuleDeprecations(module, coreSource, log);
    }
    assembledSource += moduleSource;

    const injections = getWGSLModuleInjections(module);
    for (const key in injections) {
      const match = /^(v|f)s:#([\w-]+)$/.exec(key);
      if (match) {
        const name = match[2];
        const injectionType = name === 'decl' ? declInjections : mainInjections;
        injectionType[key] = injectionType[key] || [];
        injectionType[key].push(injections[key]);
      } else if (isShaderHookRegistered(hookFunctionMap, key)) {
        // `ShaderModule.inject` is not language-specific and often carries GLSL-only hook
        // injections, so WGSL silently skips module injections into hooks it has not declared.
        hookInjections[key] = hookInjections[key] || [];
        hookInjections[key].push(injections[key]);
      }
    }
  }

  // For injectShader
  assembledSource += INJECT_SHADER_DECLARATIONS;

  assembledSource = injectShader(
    assembledSource,
    stage,
    getWGSLDeclarationInjections(declInjections),
    false,
    'wgsl',
    {vertex: vertexEntryPoint, fragment: fragmentEntryPoint}
  );

  assembledSource += getWGSLShaderHooks(hookFunctionMap, hookInjections);
  assembledSource += formatWGSLBindingAssignmentComments(bindingAssignments);

  // Add the version directive and actual source of this shader
  assembledSource += applicationRelocation.source;

  // Apply any requested shader injections
  assembledSource = injectShader(assembledSource, stage, mainInjections, false, 'wgsl', {
    vertex: vertexEntryPoint,
    fragment: fragmentEntryPoint
  });

  assertNoUnresolvedAutoBindings(assembledSource);

  return {source: assembledSource, bindingAssignments};
}

export function appendGeneratedVertexInputInjections(
  declarations: string,
  initialization: string,
  declarationInjections: Record<string, ShaderInjection[]>,
  mainInjections: Record<string, ShaderInjection[]>
): void {
  if (declarations) {
    declarationInjections['vs:#decl'] = declarationInjections['vs:#decl'] || [];
    declarationInjections['vs:#decl'].push({
      injection: declarations,
      order: Number.MIN_SAFE_INTEGER
    });
  }
  if (initialization) {
    mainInjections['vs:#main-start'] = mainInjections['vs:#main-start'] || [];
    mainInjections['vs:#main-start'].push({
      injection: initialization,
      order: Number.MIN_SAFE_INTEGER
    });
  }
}

export function appendGeneratedVaryingInjections(
  assembly: {
    declarations: string;
    vertexInitialization: string;
    fragmentInitialization: string;
  },
  declarationInjections: Record<string, ShaderInjection[]>,
  mainInjections: Record<string, ShaderInjection[]>
): void {
  if (assembly.declarations) {
    declarationInjections['vs:#decl'] = declarationInjections['vs:#decl'] || [];
    declarationInjections['vs:#decl'].push({
      injection: assembly.declarations,
      order: Number.MIN_SAFE_INTEGER
    });
  }
  if (assembly.vertexInitialization) {
    mainInjections['vs:#main-start'] = mainInjections['vs:#main-start'] || [];
    mainInjections['vs:#main-start'].push({
      injection: assembly.vertexInitialization,
      order: Number.MIN_SAFE_INTEGER
    });
  }
  if (assembly.fragmentInitialization) {
    mainInjections['fs:#main-start'] = mainInjections['fs:#main-start'] || [];
    mainInjections['fs:#main-start'].push({
      injection: assembly.fragmentInitialization,
      order: Number.MIN_SAFE_INTEGER
    });
  }
}

export function getWGSLModuleInjections(module: ShaderModule): Record<string, ShaderInjection> {
  return {
    ...(module.instance?.normalizedInjections.vertex || {}),
    ...(module.instance?.normalizedInjections.fragment || {})
  };
}

export function getWGSLDeclarationInjections(
  declarationInjections: Record<string, ShaderInjection[]>
): Record<string, ShaderInjection[]> {
  const unifiedDeclarations = [
    ...(declarationInjections['vs:#decl'] || []),
    ...(declarationInjections['fs:#decl'] || [])
  ];

  return unifiedDeclarations.length ? {'vs:#decl': unifiedDeclarations} : {};
}

export function getWGSLShaderHooks(
  hookFunctionMap: ReturnType<typeof normalizeShaderHooks>,
  hookInjections: Record<string, ShaderInjection[]>
): string {
  return (
    getShaderHooks(hookFunctionMap.vertex, hookInjections, 'wgsl') +
    getShaderHooks(hookFunctionMap.fragment, hookInjections, 'wgsl')
  );
}

export function getUsedBindingsByGroupFromApplicationWGSL(
  source: string
): Map<number, Set<number>> {
  const usedBindingsByGroup = new Map<number, Set<number>>();

  for (const match of getWGSLBindingDeclarationMatches(
    source,
    WGSL_EXPLICIT_BINDING_DECLARATION_REGEXES
  )) {
    const location = Number(match.bindingToken);
    const group = Number(match.groupToken);

    validateApplicationWGSLBinding(group, location, match.name);
    registerUsedBindingLocation(
      usedBindingsByGroup,
      group,
      location,
      `application binding "${match.name}"`
    );
  }

  return usedBindingsByGroup;
}

export function relocateWGSLApplicationBindings(source: string): {source: string} {
  const declarationMatches = getWGSLBindingDeclarationMatches(
    source,
    WGSL_BINDING_DECLARATION_REGEXES
  );
  const usedBindingsByGroup = new Map<number, Set<number>>();

  for (const declarationMatch of declarationMatches) {
    if (declarationMatch.bindingToken === 'auto') {
      continue;
    }

    const location = Number(declarationMatch.bindingToken);
    const group = Number(declarationMatch.groupToken);

    validateApplicationWGSLBinding(group, location, declarationMatch.name);
    registerUsedBindingLocation(
      usedBindingsByGroup,
      group,
      location,
      `application binding "${declarationMatch.name}"`
    );
  }

  const relocationState: WGSLApplicationRelocationState = {
    sawSupportedBindingDeclaration: declarationMatches.length > 0
  };

  const relocatedSource = replaceWGSLBindingDeclarationMatches(
    source,
    WGSL_BINDING_DECLARATION_REGEXES,
    declarationMatch =>
      relocateWGSLApplicationBindingMatch(declarationMatch, usedBindingsByGroup, relocationState)
  );

  if (hasWGSLAutoBinding(source) && !relocationState.sawSupportedBindingDeclaration) {
    throw new Error(
      'Unsupported @binding(auto) declaration form in application WGSL. ' +
        'Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.'
    );
  }

  return {source: relocatedSource};
}

export function relocateWGSLModuleBindings(
  moduleSource: string,
  module: ShaderModule,
  context: BindingRelocationContext
): {source: string; bindingAssignments: WGSLBindingAssignment[]} {
  const bindingAssignments: WGSLBindingAssignment[] = [];
  const declarationMatches = getWGSLBindingDeclarationMatches(
    moduleSource,
    MODULE_WGSL_BINDING_DECLARATION_REGEXES
  );
  const relocationState: WGSLRelocationState = {
    sawSupportedBindingDeclaration: declarationMatches.length > 0,
    nextHintedBindingLocation:
      typeof module.firstBindingSlot === 'number' ? module.firstBindingSlot : null
  };

  const relocatedSource = replaceWGSLBindingDeclarationMatches(
    moduleSource,
    MODULE_WGSL_BINDING_DECLARATION_REGEXES,
    declarationMatch =>
      relocateWGSLModuleBindingMatch(declarationMatch, {
        module,
        context,
        bindingAssignments,
        relocationState
      })
  );

  if (hasWGSLAutoBinding(moduleSource) && !relocationState.sawSupportedBindingDeclaration) {
    throw new Error(
      `Unsupported @binding(auto) declaration form in module "${module.name}". ` +
        'Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.'
    );
  }

  return {source: relocatedSource, bindingAssignments};
}

export function relocateWGSLModuleBindingMatch(
  declarationMatch: WGSLBindingDeclarationMatch,
  params: WGSLRelocationParams
): string {
  const {module, context, bindingAssignments, relocationState} = params;

  const {match, bindingToken, groupToken, name} = declarationMatch;
  const group = Number(groupToken);

  if (bindingToken === 'auto') {
    const registryKey = getBindingRegistryKey(group, module.name, name);
    const registryLocation = context.bindingRegistry?.get(registryKey);
    const location =
      registryLocation !== undefined
        ? registryLocation
        : allocateAutoBindingLocation(
            group,
            context.usedBindingsByGroup,
            module.name,
            relocationState.nextHintedBindingLocation ?? undefined,
            context.bindingRegistry
          );
    validateModuleWGSLBinding(module.name, group, location, name);
    if (
      registryLocation !== undefined &&
      claimReservedBindingLocation(context.reservedBindingKeysByGroup, group, location, registryKey)
    ) {
      bindingAssignments.push({moduleName: module.name, name, group, location});
      return match.replace(/@binding\(\s*auto\s*\)/, `@binding(${location})`);
    }
    registerUsedBindingLocation(
      context.usedBindingsByGroup,
      group,
      location,
      `module "${module.name}" binding "${name}"`
    );
    context.bindingRegistry?.set(registryKey, location);
    bindingAssignments.push({moduleName: module.name, name, group, location});
    if (relocationState.nextHintedBindingLocation !== null && registryLocation === undefined) {
      relocationState.nextHintedBindingLocation = location + 1;
    }
    return match.replace(/@binding\(\s*auto\s*\)/, `@binding(${location})`);
  }

  const location = Number(bindingToken);
  validateModuleWGSLBinding(module.name, group, location, name);
  const registryKey = getBindingRegistryKey(group, module.name, name);
  if (
    !claimReservedBindingLocation(context.reservedBindingKeysByGroup, group, location, registryKey)
  ) {
    registerUsedBindingLocation(
      context.usedBindingsByGroup,
      group,
      location,
      `module "${module.name}" binding "${name}"`
    );
  }
  bindingAssignments.push({moduleName: module.name, name, group, location});
  return match;
}

export function relocateWGSLApplicationBindingMatch(
  declarationMatch: WGSLBindingDeclarationMatch,
  usedBindingsByGroup: Map<number, Set<number>>,
  relocationState: WGSLApplicationRelocationState
): string {
  const {match, bindingToken, groupToken, name} = declarationMatch;
  const group = Number(groupToken);

  if (bindingToken === 'auto') {
    const location = allocateApplicationAutoBindingLocation(group, usedBindingsByGroup);
    validateApplicationWGSLBinding(group, location, name);
    registerUsedBindingLocation(
      usedBindingsByGroup,
      group,
      location,
      `application binding "${name}"`
    );
    return match.replace(/@binding\(\s*auto\s*\)/, `@binding(${location})`);
  }

  relocationState.sawSupportedBindingDeclaration = true;
  return match;
}

/** Reserve declared locations before reusing registry assignments or allocating new bindings. */
export function reserveModuleBindings(
  modules: {module: ShaderModule; source: string}[],
  bindingRegistry: Map<string, number> | undefined,
  usedBindingsByGroup: Map<number, Set<number>>
): Map<number, Map<number, string>> {
  const reservedBindingKeysByGroup = new Map<number, Map<number, string>>();
  const autoBindings: {module: ShaderModule; name: string; group: number}[] = [];

  function reserveBinding(
    group: number,
    location: number,
    registryKey: string,
    label: string
  ): void {
    registerUsedBindingLocation(usedBindingsByGroup, group, location, label);
    const reservedBindingKeys = reservedBindingKeysByGroup.get(group) || new Map<number, string>();
    reservedBindingKeys.set(location, registryKey);
    reservedBindingKeysByGroup.set(group, reservedBindingKeys);
  }

  for (const {module, source} of modules) {
    for (const binding of getWGSLBindingDeclarationMatches(
      source,
      MODULE_WGSL_BINDING_DECLARATION_REGEXES
    )) {
      const group = Number(binding.groupToken);
      if (binding.bindingToken === 'auto') {
        autoBindings.push({module, name: binding.name, group});
        continue;
      }
      const location = Number(binding.bindingToken);
      validateModuleWGSLBinding(module.name, group, location, binding.name);
      reserveBinding(
        group,
        location,
        getBindingRegistryKey(group, module.name, binding.name),
        `module "${module.name}" binding "${binding.name}"`
      );
    }
  }

  // Only auto declarations reuse registry entries. Explicit declarations already own their slots.
  // Conflicting active assignments remain errors so previously assembled shaders keep their layout.
  for (const {module, name, group} of autoBindings) {
    const registryKey = getBindingRegistryKey(group, module.name, name);
    const location = bindingRegistry?.get(registryKey);
    if (location !== undefined) {
      reserveBinding(group, location, registryKey, `registered module binding "${registryKey}"`);
    }
  }

  return reservedBindingKeysByGroup;
}

export function claimReservedBindingLocation(
  reservedBindingKeysByGroup: Map<number, Map<number, string>>,
  group: number,
  location: number,
  registryKey: string
): boolean {
  const reservedBindingKeys = reservedBindingKeysByGroup.get(group);
  if (!reservedBindingKeys) {
    return false;
  }

  const reservedKey = reservedBindingKeys.get(location);
  if (!reservedKey) {
    return false;
  }
  if (reservedKey !== registryKey) {
    throw new Error(
      `Registered module binding "${registryKey}" collided with "${reservedKey}": group ${group}, binding ${location}.`
    );
  }
  reservedBindingKeys.delete(location);
  return true;
}

export function validateApplicationWGSLBinding(
  group: number,
  location: number,
  name: string
): void {
  if (group === 0 && location >= RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT) {
    throw new Error(
      `Application binding "${name}" in group 0 uses reserved binding ${location}. ` +
        `Application-owned explicit group-0 bindings must stay below ${RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT}.`
    );
  }
}

export function validateModuleWGSLBinding(
  moduleName: string,
  group: number,
  location: number,
  name: string
): void {
  if (group === 0 && location < RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT) {
    throw new Error(
      `Module "${moduleName}" binding "${name}" in group 0 uses reserved application binding ${location}. ` +
        `Module-owned explicit group-0 bindings must be ${RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT} or higher.`
    );
  }
}

export function registerUsedBindingLocation(
  usedBindingsByGroup: Map<number, Set<number>>,
  group: number,
  location: number,
  label: string
): void {
  const usedBindings = usedBindingsByGroup.get(group) || new Set<number>();
  if (usedBindings.has(location)) {
    throw new Error(
      `Duplicate WGSL binding assignment for ${label}: group ${group}, binding ${location}.`
    );
  }
  usedBindings.add(location);
  usedBindingsByGroup.set(group, usedBindings);
}

export function allocateAutoBindingLocation(
  group: number,
  usedBindingsByGroup: Map<number, Set<number>>,
  moduleName: string,
  preferredBindingLocation?: number,
  bindingRegistry?: Map<string, number>
): number {
  const usedBindings = usedBindingsByGroup.get(group) || new Set<number>();
  const registeredBindingLocations = new Set<number>();
  const registryGroupPrefix = `${group}:`;
  const registryModulePrefix = `${registryGroupPrefix}${moduleName}:`;
  for (const [registryKey, location] of bindingRegistry || []) {
    if (registryKey.startsWith(registryModulePrefix)) {
      registeredBindingLocations.add(location);
    }
  }
  let nextBinding =
    preferredBindingLocation ??
    (group === 0
      ? RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT
      : usedBindings.size > 0
        ? Math.max(...usedBindings) + 1
        : 0);

  while (usedBindings.has(nextBinding) || registeredBindingLocations.has(nextBinding)) {
    nextBinding++;
  }

  // Active modules were reserved above; only stale, inactive modules can own this free slot.
  for (const [registryKey, location] of bindingRegistry || []) {
    if (location === nextBinding && registryKey.startsWith(registryGroupPrefix)) {
      bindingRegistry?.delete(registryKey);
    }
  }

  return nextBinding;
}

export function allocateApplicationAutoBindingLocation(
  group: number,
  usedBindingsByGroup: Map<number, Set<number>>
): number {
  const usedBindings = usedBindingsByGroup.get(group) || new Set<number>();
  let nextBinding = 0;

  while (usedBindings.has(nextBinding)) {
    nextBinding++;
  }

  return nextBinding;
}

export function assertNoUnresolvedAutoBindings(source: string): void {
  const unresolvedBinding = getFirstWGSLAutoBindingDeclarationMatch(
    source,
    MODULE_WGSL_BINDING_DECLARATION_REGEXES
  );
  if (!unresolvedBinding) {
    return;
  }

  const moduleName = getWGSLModuleNameAtIndex(source, unresolvedBinding.index);
  if (moduleName) {
    throw new Error(
      `Unresolved @binding(auto) for module "${moduleName}" binding "${unresolvedBinding.name}" remained in assembled WGSL source.`
    );
  }

  if (isInApplicationWGSLSection(source, unresolvedBinding.index)) {
    throw new Error(
      `Unresolved @binding(auto) for application binding "${unresolvedBinding.name}" remained in assembled WGSL source.`
    );
  }

  throw new Error(
    `Unresolved @binding(auto) remained in assembled WGSL source near "${formatWGSLSourceSnippet(unresolvedBinding.match)}".`
  );
}

export function formatWGSLBindingAssignmentComments(
  bindingAssignments: WGSLBindingAssignment[]
): string {
  if (bindingAssignments.length === 0) {
    return '';
  }

  let source = '// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------\n';
  for (const bindingAssignment of bindingAssignments) {
    source += `// ${bindingAssignment.moduleName}.${bindingAssignment.name} -> @group(${bindingAssignment.group}) @binding(${bindingAssignment.location})\n`;
  }
  source += '\n';
  return source;
}

export function getBindingRegistryKey(
  group: number,
  moduleName: string,
  bindingName: string
): string {
  return `${group}:${moduleName}:${bindingName}`;
}

export function getWGSLModuleNameAtIndex(source: string, index: number): string | undefined {
  const moduleHeaderRegex = /^\/\/ ----- MODULE ([^\n]+) ---------------$/gm;
  let moduleName: string | undefined;
  let match: RegExpExecArray | null;

  match = moduleHeaderRegex.exec(source);
  while (match && match.index <= index) {
    moduleName = match[1];
    match = moduleHeaderRegex.exec(source);
  }

  return moduleName;
}

export function isInApplicationWGSLSection(source: string, index: number): boolean {
  const injectionMarkerIndex = source.indexOf(INJECT_SHADER_DECLARATIONS);
  return injectionMarkerIndex >= 0 ? index > injectionMarkerIndex : true;
}

export function formatWGSLSourceSnippet(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
