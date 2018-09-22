// Expose Khronos Debug support module on global context
/* global window, global */
const WebGLDebug = require('webgl-debug');
const global_ = typeof global !== 'undefined' ? global : window;
global_.WebGLDebug = WebGLDebug;

import {installParameterDefinitions} from './webgl-debug/debug-parameters';

console.log('luma.gl: WebGL debug support imported'); // eslint-disable-line

// eslint-disable-next-line
export default function installDebugger() {
  installParameterDefinitions();
  console.log('luma.gl: WebGL debug support installed'); // eslint-disable-line
}
