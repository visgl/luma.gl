import test from 'tape-catch';
import {
  resolveModules,
  TEST_EXPORTS,
  setDefaultShaderModules,
  getDefaultShaderModules
} from '@luma.gl/shadertools/lib/resolve-modules';

const {getDependencyGraph} = TEST_EXPORTS;

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
  dependencies: [project, fp64]
};

test('ShaderModules#import', t => {
  t.ok(resolveModules !== undefined, 'resolveModules import successful');
  t.ok(getDependencyGraph !== undefined, 'getDependencyGraph import successful');
  t.ok(setDefaultShaderModules !== undefined, 'setDefaultShaderModules import successful');
  t.ok(getDefaultShaderModules !== undefined, 'getDefaultShaderModules import successful');
  t.end();
});

test('ShaderModules#setAndgetDefaultShaderModules', t => {
  let modules = [fp32, fp64, project];
  setDefaultShaderModules(modules);
  const savedModules1 = getDefaultShaderModules();
  t.equal(savedModules1.length, 3, 'setDefaultShaderModules is ok');
  modules = [fp32, fp64];
  setDefaultShaderModules(modules);
  let savedModules2 = getDefaultShaderModules();
  savedModules2.push(project);
  setDefaultShaderModules(savedModules2);
  savedModules2 = getDefaultShaderModules();
  setDefaultShaderModules([]);
  t.equal(savedModules1.length, savedModules2.length, 'getDefaultShaderModules is ok');

  t.end();
});

test('ShaderModules#getShaderDependencies', t => {
  const result = resolveModules([project64, project]);
  t.deepEqual(
    result.map(module => module.name),
    [fp32.name, project.name, fp64.name, project64.name],
    'Module order is correct'
  );
  t.end();
});

test('ShaderModules#getDependencyGraph', t => {
  const moduleDepth = {};
  getDependencyGraph({
    modules: [project64, project],
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
    'Module dependecny is correct'
  );
  t.end();
});
