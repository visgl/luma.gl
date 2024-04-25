// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('ShaderModules#import', t => {
  t.ok(_resolveModules !== undefined, '_resolveModules import successful');
  t.ok(getDependencyGraph !== undefined, 'getDependencyGraph import successful');
  t.end();
});

test('ShaderModules#getShaderDependencies', t => {
  const result = _resolveModules([project64, project]);
  t.deepEqual(
    result.map(module => module.name),
    [fp32.name, project.name, fp64.name, project64.name],
    'Module order is correct'
  );

  t.end();
});

test('ShaderModules#getDependencyGraph', t => {
  const moduleDepth = {};
  const modules = [project64, project];
  initializeShaderModules(modules);
  getDependencyGraph({
    modules,
    level: 0,
    moduleMap: {},
    moduleDepth
  });
  t.deepEqual(
    moduleDepth,
    {
      [fp32.name]: 2,
      [project.name]: 1,
      [fp64.name]: 1,
      [project64.name]: 0
    },
    'Module dependency is correct'
  );
  t.end();
});
