import {arithmetic} from './arithmetic';
import {extent} from './extent';
import {fround} from './fround';
import {gather} from './gather';
import {interleave} from './interleave';
import {scatterInterleaved} from './scatter-interleaved';
import {sequence} from './sequence';

/** WebGPU backend for built-in GPGPU operations, implemented with compute pipelines. */
export const webgpuBackend = {
  arithmetic,
  extent,
  fround,
  gather,
  interleave,
  scatterInterleaved,
  sequence
};
