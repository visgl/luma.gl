// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderModule, initializeShaderModules} from './shader-module';

// import type {ShaderModule} from '../shader-module/shader-module';

type AbstractModule = {
  name: string;
  dependencies?: AbstractModule[];
};

/** Order modules that have no dependency relation by name, so the result is a function of the SET. */
function byName<T extends AbstractModule>(modules: readonly T[]): T[] {
  return [...modules].sort((moduleA, moduleB) => (moduleA.name < moduleB.name ? -1 : 1));
}

export type GetShaderModuleDependenciesOptions = {
  /**
   * Order modules that have no dependency relation by name, so the result is a
   * function of the module SET rather than of the order the caller listed them in.
   *
   * WGSL only. Two callers asking for the same modules in different orders otherwise
   * get sources that are permutations of each other - identical content and identical
   * binding assignments, but different bytes - so they miss in the shader and pipeline
   * caches and build duplicate pipelines for the same program. Sorting siblings by
   * name removes that while preserving dependencies-before-dependents, which holds
   * for any DFS post-order regardless of the order siblings are visited in.
   *
   * This must stay off for GLSL. There, order is part of the language: a module's
   * `#define`s and function declarations have to appear textually before any use, and
   * modules in this repo (for example the gpgpu `source_values_texture` module, which
   * depends on a `TYPE` define supplied by another module) rely on caller order
   * instead of declaring that dependency. Sorting them breaks compilation.
   */
  canonicalOrder?: boolean;
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
 * @param options - Set `canonicalOrder` to make the result independent of caller order (WGSL only)
 * @return - Array of modules
 */
export function getShaderModuleDependencies<T extends AbstractModule>(
  modules: T[],
  options?: GetShaderModuleDependenciesOptions
): T[] {
  const order = options?.canonicalOrder ? byName : (unsorted: readonly T[]) => unsorted;
  // Data structures for topological sort
  const visited = new Set<T>(); // Fully processed modules (black nodes)
  const recursionStack = new Set<T>(); // Modules in current DFS path (gray nodes)
  const result: T[] = []; // Post-order traversal result
  const nameToModule = new Map<string, T>(); // Name collision detection

  /**
   * Check for name collisions between distinct module objects
   */
  function checkNameCollision(module: T): void {
    const existing = nameToModule.get(module.name);
    if (existing && existing !== module) {
      throw new Error(
        `Shader module name collision: Multiple different module objects share the name "${module.name}". ` +
          `Each module object must have a unique name.`
      );
    }
    nameToModule.set(module.name, module);
  }

  /**
   * DFS visit function for topological sort with cycle detection
   */
  function visit(module: T, path: string[]): void {
    // Cycle detection: if module is in recursion stack, we've found a back edge
    if (recursionStack.has(module)) {
      const cyclePath = [...path, module.name].join(' -> ');
      throw new Error(`Shader module dependency cycle detected: ${cyclePath}`);
    }

    // Already processed: skip if visited
    if (visited.has(module)) {
      return;
    }

    // Check for name collision before processing
    checkNameCollision(module);

    // Mark as visiting (white -> gray)
    recursionStack.add(module);
    const newPath = [...path, module.name];

    // Recursively visit all dependencies
    if (module.dependencies) {
      for (const dep of order(module.dependencies as T[])) {
        visit(dep as T, newPath);
      }
    }

    // Mark as visited (gray -> black)
    recursionStack.delete(module);
    visited.add(module);

    // Post-order: add to result after all dependencies processed
    result.push(module);
  }

  // Start DFS from each root module
  for (const module of order(modules)) {
    visit(module, []);
  }

  initializeShaderModules(result);
  return result;
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
  return getShaderModuleDependencies(modules);
}

// DEPRECATED

/**
 * Instantiate shader modules and resolve any dependencies
 * @deprecated Use getShaderDpendencies
 */
export function resolveModules(modules: ShaderModule[]): ShaderModule[] {
  return getShaderDependencies(modules);
}
