import {arithmetic} from './arithmetic';
import {extent} from './extent';
import {interleave} from './interleave';
import {fround} from './fround';
import {gather} from './gather';
import {sequence} from './sequence';

/** WebGL backend for built-in GPGPU operations, implemented with transform feedback. */
export const webglBackend = {
  arithmetic,
  extent,
  gather,
  interleave,
  fround,
  sequence
};
