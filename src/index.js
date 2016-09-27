// Export all symbols for LumaGL
/* global window */
export * from './luma';

// Assign global luma variable to help debugging
import * as lumaSymbols from './luma';
import {luma} from './utils';
Object.assign(luma, lumaSymbols);
if (typeof window !== 'undefined') {
  window.luma = luma;
}
