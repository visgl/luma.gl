import {arithmetic} from './arithmetic';
import {extent} from './extent';
import {interleave} from './interleave';
import {fround} from './fround';
import {gather} from './gather';
import {dot} from './dot';
import {equalAll} from './equal-all';
import {length} from './length';
import {segmentedMap} from './segmented-map';
import {select} from './select';
import {sequence} from './sequence';

/** WebGL backend for built-in GPGPU operations, implemented with transform feedback. */
export const webglBackend = {
  arithmetic,
  dot,
  equalAll,
  extent,
  gather,
  interleave,
  fround,
  length,
  segmentedMap,
  select,
  sequence
};
