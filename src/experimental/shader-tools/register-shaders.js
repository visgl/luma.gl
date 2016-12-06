import assert from 'assert';

const shaderModules = {};

/**
 * Registers an array of shader modules
 * @param {Object[]} shaderModuleList - Array of shader modules
 */
export function registerShaderModules(shaderModuleList) {
  for (const shaderModule in shaderModuleList) {
    assert(shaderModule.name, 'shader module has no name');
    if (!shaderModules[shaderModule.name]) {
      throw new Error(`shader module ${shaderModule.name} already registered`);
    }
    shaderModules[shaderModule.name] = shaderModule;
    shaderModule.dependencies = shaderModule.dependencies || [];
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
 * @param {String[]} moduleNames - Array of module names
 * @return {String[]} - Array of modules
 */
export function getShaderDependencies(moduleNames) {
  const result = {};
  getDependencyGraph({
    moduleNames,
    level: 0,
    result
  });
  return Object.keys(result).sort((a, b) => result[a] - result[b]);
}

// Adds another level of dependencies to the result map
function getDependencyGraph({moduleNames, level, result}) {
  if (level >= 5) {
    throw new Error('Possible loop in shader dependency graph');
  }
  for (const moduleName in moduleNames) {
    result[moduleName] = level;
  }

  for (const moduleName in moduleNames) {
    const shaderModule = shaderModules[moduleName];
    assert(shaderModule, 'Unknown shader module');

    getDependencyGraph({
      moduleNames: shaderModule.dependencies,
      level,
      result
    });
  }

  return result;
}
