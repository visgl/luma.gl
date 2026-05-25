import {arithmetic} from './arithmetic';
import {convertColors} from './convert-colors';
import {extent} from './extent';
import {fround} from './fround';
import {gather} from './gather';
import {interleave} from './interleave';
import {sequence} from './sequence';

/** WebGPU backend for built-in GPGPU operations, implemented with compute pipelines. */
export const webgpuBackend = {
  arithmetic,
  'convert-colors': convertColors,
  extent,
  fround,
  gather,
  interleave,
  sequence
};
