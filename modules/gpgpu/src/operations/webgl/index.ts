import {add} from './add';
import {interleave} from './interleave';
import {fround} from './fround';

/** WebGL backend for built-in GPGPU operations, implemented with transform feedback. */
export const webglBackend = {
  add,
  interleave,
  fround
};
