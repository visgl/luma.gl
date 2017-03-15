import luma from './globals';

// Export all symbols for LumaGL
export * from './without-io';
export * from './io';

// Assign global luma variable to help debugging
import * as io from './io';
Object.assign(luma, io);
