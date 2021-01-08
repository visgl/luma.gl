import ShaderModule from './shader-module';
import {assert} from '../utils';

// Instantiate shader modules and any dependencies resolve dependencies
export function resolveModules(modules) {
  return getShaderDependencies(instantiateModules(modules));
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
 * @param {String[]} modules - Array of modules (inline modules or module names)
 * @return {String[]} - Array of modules
 */
function getShaderDependencies(modules) {
  const moduleMap = {};
  const moduleDepth = {};
  getDependencyGraph({modules, level: 0, moduleMap, moduleDepth});

  // Return a reverse sort so that dependencies come before the modules that use them
  return Object.keys(moduleDepth)
    .sort((a, b) => moduleDepth[b] - moduleDepth[a])
    .map(name => moduleMap[name]);
}

/**
 * Recursively checks module dpendencies to calculate dependency
 * level of each module.
 *
 * @param {object} options
 * @param {object[]} options.modules - Array of modules
 * @param {number} options.level - Current level
 * @param {object} options.moduleMap -
 * @param {object} options.moduleDepth - Current level
 * @return {object} - Map of module name to its level
 */
// Adds another level of dependencies to the result map
function getDependencyGraph({modules, level, moduleMap, moduleDepth}) {
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

function instantiateModules(modules, seen) {
  return modules.map(module => {
    if (module instanceof ShaderModule) {
      return module;
    }

    assert(
      typeof module !== 'string',
      `Shader module use by name is deprecated. Import shader module '${module}' and use it directly.`
    );
    assert(module.name, 'shader module has no name');

    module = new ShaderModule(module);
    module.dependencies = instantiateModules(module.dependencies);

    return module;
  });
}

export const TEST_EXPORTS = {
  getShaderDependencies,
  getDependencyGraph
};
