import {add} from './add';
import {divide} from './divide';
import {extent} from './extent';
import {interleave} from './interleave';
import {fround} from './fround';
import {gather} from './gather';
import {multiply} from './multiply';
import {sequence} from './sequence';
import {subtract} from './subtract';

/** WebGL backend for built-in GPGPU operations, implemented with transform feedback. */
export const webglBackend = {
  add,
  divide,
  extent,
  gather,
  interleave,
  fround,
  multiply,
  sequence,
  subtract
};
