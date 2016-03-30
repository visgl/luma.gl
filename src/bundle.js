/* Generate script that can be used in browser without browserify */

/* global window */
import 'babel-polyfill';
import * as LumaGL from './index';
// import Fx from './addons/fx';
// import WorkerGroup from './addons/workers';
// import * as helpers from './addons/helpers';

// Export all LumaGL objects as members of global LumaGL variable
if (typeof window !== 'undefined') {
  window.LumaGL = LumaGL;
}
