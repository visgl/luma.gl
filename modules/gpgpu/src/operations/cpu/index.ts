import {arithmetic} from './arithmetic';
import {extent} from './extent';
import {fround} from './fround';
import {gather} from './gather';
import {interleave} from './interleave';
import {segmentedMap} from './segmented-map';
import {sequence} from './sequence';

/** CPU fallback backend for built-in GPGPU operations. Registered by default. */
export const cpuBackend = {
  arithmetic,
  extent,
  fround,
  gather,
  interleave,
  segmentedMap,
  sequence
};
