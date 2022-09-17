import {ShaderModule} from '../../types';

// JavaScript utilities
import {fp64ify, fp64LowPart, fp64ifyMatrix4} from './fp64-utils';

/** */
export type FP64ShaderModule = ShaderModule & {
  fp64ify: typeof fp64ify;
  fp64LowPart: typeof fp64LowPart;
  fp64ifyMatrix4: typeof fp64ifyMatrix4;
};

// JavaScript utilities
export {fp64ify, fp64LowPart, fp64ifyMatrix4} from './fp64-utils';

/**
 * 64bit arithmentic: add, sub, mul, div (small subset of fp64 module)
 */
export const fp64arithmetic: FP64ShaderModule;

/**
 * Full 64 bit math library
 */
export const fp64: FP64ShaderModule;
