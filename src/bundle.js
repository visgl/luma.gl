/* Generate script that can be used in browser without browserify */

/* global window */
import 'babel-polyfill';
import * as LumaGL from './index';
import * as addons from './addons';
import * as IO from './io/browser';

LumaGL.addons = addons;
LumaGL.IO = IO;
Object.assign(LumaGL, IO);

// Export all LumaGL objects as members of global LumaGL variable
if (typeof window !== 'undefined') {
  window.LumaGL = LumaGL;
}
