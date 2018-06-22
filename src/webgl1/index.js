// Optional polyfills to support WebGL1
// Normally not imported directly
// The files in this directory should be self contained and not include any other files

export {default as polyfillContext} from './polyfill-context';
export {default as polyfillVertexArrayObject} from './polyfill-vertex-array-object';

console.log('luma.gl: WebGL1 polyfills installed'); // eslint-disable-line
