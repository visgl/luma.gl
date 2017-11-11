import {
  registerShaderModules,
  setDefaultShaderModules,
  fp32,
  fp64,
  project,
  dirlight,
  picking,
  diffuse
} from 'luma.gl';

import test from 'tape-catch';

test('shaderlib#shader module imports are defined', t => {
  t.ok(registerShaderModules, 'registerShaderModules is defined');
  t.ok(setDefaultShaderModules, 'setDefaultShaderModules is defined');
  t.ok(fp32, 'fp32 is defined');
  t.ok(fp64, 'fp64 is defined');
  t.ok(project, 'project is defined');
  t.ok(dirlight, 'dirlight is defined');
  t.ok(picking, 'picking is defined');
  t.ok(diffuse, 'diffuse is defined');
  t.end();
});
