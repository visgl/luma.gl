import {add} from './add';
import {fround} from './fround';
import {interleave} from './interleave';

/** WebGPU backend for built-in GPGPU operations, implemented with compute pipelines. */
export const webgpuBackend = {
  add,
  fround,
  interleave
};
