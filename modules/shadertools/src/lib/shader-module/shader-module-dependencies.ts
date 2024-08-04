// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule, initializeShaderModules} from './shader-module';

// import type {ShaderModule} from '../shader-module/shader-module';

type AbstractModule = {
  name: string;
  dependencies?: AbstractModule[];
};

/**
 * Takes a list of shader module names and returns a new list of
 * shader module names that includes all dependencies, sorted so
 * that modules that are dependencies of other modules come first.
 *
 * If the shader glsl code from the returned modules is concatenated
 * in the reverse order, it is guaranteed that all functions be resolved and
 * that all function and variable definitions come before use.
 *
 * @param modules - Array of modules (inline modules or module names)
 * @return - Array of modules
 */
export function getShaderModuleDependencies<T extends AbstractModule>(modules: T[]): T[] {
  initializeShaderModules(modules);
  const moduleMap: Record<string, T> = {};
  const moduleDepth: Record<string, number> = {};
  getDependencyGraph({modules, level: 0, moduleMap, moduleDepth});

  // Return a reverse sort so that dependencies come before the modules that use them
  const dependencies = Object.keys(moduleDepth)
    .sort((a, b) => moduleDepth[b] - moduleDepth[a])
    .map(name => moduleMap[name]);
  initializeShaderModules(dependencies);
  return dependencies;
}

/**
 * Recursively checks module dependencies to calculate dependency level of each module.
 *
 * @param options.modules - Array of modules
 * @param options.level - Current level
 * @param options.moduleMap -
 * @param options.moduleDepth - Current level
 * @return - Map of module name to its level
 */
// Adds another level of dependencies to the result map
export function getDependencyGraph<T extends AbstractModule>(options: {
  modules: T[];
  level: number;
  moduleMap: Record<string, T>;
  moduleDepth: Record<string, number>;
}) {
  const {modules, level, moduleMap, moduleDepth} = options;
  if (level >= 5) {
    throw new Error('Possible loop in shader dependency graph');
  }

  // Update level on all current modules
  for (const module of modules) {
    moduleMap[module.name] = module;
    if (moduleDepth[module.name] === undefined || moduleDepth[module.name] < level) {
      moduleDepth[module.name] = level;
    }
  }

  // Recurse
  for (const module of modules) {
    if (module.dependencies) {
      getDependencyGraph({modules: module.dependencies, level: level + 1, moduleMap, moduleDepth});
    }
  }
}

/**
 * Takes a list of shader module names and returns a new list of
 * shader module names that includes all dependencies, sorted so
 * that modules that are dependencies of other modules come first.
 *
 * If the shader glsl code from the returned modules is concatenated
 * in the reverse order, it is guaranteed that all functions be resolved and
 * that all function and variable definitions come before use.
 *
 * @param modules - Array of modules (inline modules or module names)
 * @return - Array of modules
 */
export function getShaderDependencies(modules: ShaderModule[]): ShaderModule[] {
  initializeShaderModules(modules);
  const moduleMap: Record<string, ShaderModule> = {};
  const moduleDepth: Record<string, number> = {};
  getDependencyGraph({modules, level: 0, moduleMap, moduleDepth});

  // Return a reverse sort so that dependencies come before the modules that use them
  modules = Object.keys(moduleDepth)
    .sort((a, b) => moduleDepth[b] - moduleDepth[a])
    .map(name => moduleMap[name]);
  initializeShaderModules(modules);
  return modules;
}

// DEPRECATED

/**
 * Instantiate shader modules and resolve any dependencies
 * @deprecated Use getShaderDpendencies
 */
export function resolveModules(modules: ShaderModule[]): ShaderModule[] {
  return getShaderDependencies(modules);
}
