import {arithmetic} from './arithmetic';
import {extent} from './extent';
import {fround} from './fround';
import {gather} from './gather';
import {interleave} from './interleave';
import {dot} from './dot';
import {equalAll} from './equal-all';
import {length} from './length';
import {segmentedMap} from './segmented-map';
import {select} from './select';
import {sequence} from './sequence';
import {swizzle} from './swizzle';

/** CPU fallback backend for built-in GPGPU operations. Registered by default. */
export const cpuBackend = {
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
  sequence,
  swizzle
};
