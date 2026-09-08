// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  initializeShaderModules,
  _resolveModules,
  _getDependencyGraph as getDependencyGraph
} from '@luma.gl/shadertools';

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

it('ShaderModules#import', () => {
  expect(Boolean(_resolveModules !== undefined), '_resolveModules import successful').toBe(true);
  expect(Boolean(getDependencyGraph !== undefined), 'getDependencyGraph import successful').toBe(
    true
  );
  void 0;
});

it('ShaderModules#getShaderDependencies', () => {
  const result = _resolveModules([project64, project]);
  expect(
    result.map(module => module.name),
    'Module order is correct'
  ).toEqual([fp32.name, project.name, fp64.name, project64.name]);

  void 0;
});

it('ShaderModules#getDependencyGraph', () => {
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
  void 0;
});
