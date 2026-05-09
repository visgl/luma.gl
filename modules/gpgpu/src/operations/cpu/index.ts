import {add} from './add';
import {fround} from './fround';
import {interleave} from './interleave';

/** CPU fallback backend for built-in GPGPU operations. Registered by default. */
export const cpuBackend = {
  add,
  fround,
  interleave
};
