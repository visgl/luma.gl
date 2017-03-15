import {registerShaderModules} from '../shader-tools';

import * as fp64 from './fp64';

import * as fog from './fog';
import * as picking from './picking';
// import * as lighting from './lighting';
import * as material from './material';

registerShaderModules([
  fp64,
  fog,
  picking,
  // lighting,
  material
]);
