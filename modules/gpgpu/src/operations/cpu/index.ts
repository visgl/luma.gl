import {add} from './add';
import {divide} from './divide';
import {extent} from './extent';
import {fround} from './fround';
import {gather} from './gather';
import {interleave} from './interleave';
import {multiply} from './multiply';
import {sequence} from './sequence';
import {subtract} from './subtract';

/** CPU fallback backend for built-in GPGPU operations. Registered by default. */
export const cpuBackend = {
  add,
  divide,
  extent,
  fround,
  gather,
  interleave,
  multiply,
  sequence,
  subtract
};
