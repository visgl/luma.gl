import {add} from './add';
import {divide} from './divide';
import {extent} from './extent';
import {fround} from './fround';
import {gather} from './gather';
import {interleave} from './interleave';
import {multiply} from './multiply';
import {sequence} from './sequence';
import {subtract} from './subtract';

/** WebGPU backend for built-in GPGPU operations, implemented with compute pipelines. */
export const webgpuBackend = {
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
