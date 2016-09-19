// Export all symbols for LumaGL
/* global window */
export * from './luma';

// Assign global luma variable to help debugging
import * as lumaSymbols from './luma';
import {luma} from './utils';
if (typeof window !== 'undefined') {
  Object.assign(luma, lumaSymbols);
  window.luma = luma;
}
