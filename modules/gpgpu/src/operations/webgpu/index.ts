import {arithmetic} from './arithmetic';
import {dot} from './dot';
import {equalAll} from './equal-all';
import {extent} from './extent';
import {fround} from './fround';
import {gather} from './gather';
import {segmentedMap} from './segmented-map';
import {interleave} from './interleave';
import {length} from './length';
import {select} from './select';
import {sequence} from './sequence';

/** WebGPU backend for built-in GPGPU operations, implemented with compute pipelines. */
export const webgpuBackend = {
  arithmetic,
  dot,
  equalAll,
  extent,
  fround,
  gather,
  interleave,
  length,
  segmentedMap,
  select,
  sequence
};
