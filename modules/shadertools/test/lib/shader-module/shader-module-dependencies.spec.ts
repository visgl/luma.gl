import {expect, test} from 'vitest';
import { initializeShaderModules, _resolveModules, _getDependencyGraph as getDependencyGraph } from '@luma.gl/shadertools';

// Dummy shader modules with dependencies
const fp32 = {
  name: 'fp32-test'
};
const fp64 = {
  name: 'fp64-test'
};
const project = {
  name: 'project-test',
  dependencies: [fp32]
};
const project64 = {
  name: 'project64-test',
  dependencies: [project, fp64],
  uniformTypes: {}
};
test('ShaderModules#import', () => {
  expect(_resolveModules !== undefined, '_resolveModules import successful').toBeTruthy();
  expect(getDependencyGraph !== undefined, 'getDependencyGraph import successful').toBeTruthy();
});
test('ShaderModules#getShaderDependencies', () => {
  const result = _resolveModules([project64, project]);
  expect(result.map(module => module.name), 'Module order is correct').toEqual([fp32.name, project.name, fp64.name, project64.name]);
});
test('ShaderModules#getDependencyGraph', () => {
  const moduleDepth = {};
  const modules = [project64, project];
  initializeShaderModules(modules);
  getDependencyGraph({
    modules,
    level: 0,
    moduleMap: {},
    moduleDepth
  });
  expect(moduleDepth, 'Module dependency is correct').toEqual({
    [fp32.name]: 2,
    [project.name]: 1,
    [fp64.name]: 1,
    [project64.name]: 0
  });
});
