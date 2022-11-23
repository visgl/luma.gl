import {assert} from '../utils/assert';
import type {ShaderModule} from '../shader-module/shader-module';
import {ShaderModuleInstance} from '../shader-module/shader-module-instance';

// Instantiate shader modules and any dependencies resolve dependencies
export function resolveModules(modules: (ShaderModule | ShaderModuleInstance)[]): ShaderModuleInstance[] {
  return getShaderDependencies(instantiateModules(modules));
}

function instantiateModules(modules: (ShaderModule | ShaderModuleInstance)[]): ShaderModuleInstance[] {
  return modules.map((module: ShaderModule | ShaderModuleInstance) => {
    if (module instanceof ShaderModuleInstance) {
      return module;
    }

    assert(
      typeof module !== 'string',
      `Shader module use by name is deprecated. Import shader module '${module}' and use it directly.`
    );
    assert(module.name, 'shader module has no name');

    const moduleObject = new ShaderModuleInstance(module);
    moduleObject.dependencies = instantiateModules(module.dependencies || []);

    return moduleObject;
  });
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
function getShaderDependencies(modules: ShaderModule[]): ShaderModuleInstance[] {
  const moduleMap: Record<string, ShaderModuleInstance> = {};
  const moduleDepth: Record<string, number> = {};
  getDependencyGraph({modules, level: 0, moduleMap, moduleDepth});

  // Return a reverse sort so that dependencies come before the modules that use them
  return Object.keys(moduleDepth)
    .sort((a, b) => moduleDepth[b] - moduleDepth[a])
    .map((name) => moduleMap[name]);
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
function getDependencyGraph(options: {
  modules: ShaderModule[],
  level: number,
  moduleMap: Record<string, ShaderModule>;
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

export const TEST_EXPORTS = {
  getShaderDependencies,
  getDependencyGraph
};
