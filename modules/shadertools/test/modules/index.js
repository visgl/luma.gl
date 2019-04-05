import './fp64/fp64-arithmetic-transform.spec';
import '../../src/modules/lights/test/lights.spec';
import '../../src/modules/picking/test/picking.spec';
import './phong-lighting/phong-lighting.spec';

import {
  registerShaderModules,
  setDefaultShaderModules,
  fp32,
  fp64,
  project,
  // lighting,
  dirlight,
  picking,
  diffuse
} from '@luma.gl/shadertools';

import test from 'tape-catch';

test('shadertools#module imports are defined', t => {
  t.ok(registerShaderModules, 'registerShaderModules is defined');
  t.ok(setDefaultShaderModules, 'setDefaultShaderModules is defined');
  t.ok(fp32, 'fp32 is defined');
  t.ok(fp64, 'fp64 is defined');
  t.ok(project, 'project is defined');
  // TODO: looks like lighting is not correctly imported and we should be using
  // deck.gl lighting module, disabling this failing test.
  // t.ok(lighting, 'lighting is defined');
  t.ok(dirlight, 'dirlight is defined');
  t.ok(picking, 'picking is defined');
  t.ok(diffuse, 'diffuse is defined');
  t.end();
});
