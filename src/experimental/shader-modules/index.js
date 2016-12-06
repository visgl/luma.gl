import {registerShaderModules} from '../shader-tools';

import * as fog from './fog';
import * as picking from './picking';
import * as lighting from './lighting';
import * as material from './material';
import * as project from './project';

registerShaderModules({
  fog,
  picking,
  lighting,
  material,
  project
});
