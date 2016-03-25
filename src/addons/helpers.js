import Program from '../webgl/program';
import Shaders from '../shaders';
import {XHRGroup} from '../io';
import {merge} from '../utils';
/* global document */

// Alternate constructor
// Build program from default shaders (requires Shaders)
export function makeProgramfromDefaultShaders(gl, id) {
  return new Program(gl, {
    vs: Shaders.Vertex.Default,
    fs: Shaders.Fragment.Default,
    id
  });
}

// Create a program from vertex and fragment shader node ids
// @deprecated - Use glslify instead
export function makeProgramFromHTMLTemplates(gl, vsId, fsId, id) {
  const vs = document.getElementById(vsId).innerHTML;
  const fs = document.getElementById(fsId).innerHTML;
  return new Program(gl, {vs, fs, id});
}

// Load shaders using XHR
// @deprecated - Use glslify instead
export async function makeProgramFromShaderURIs(gl, vs, fs, opts) {
  opts = merge({
    path: '/',
    noCache: false
  }, opts);

  const vertexShaderURI = opts.path + vs;
  const fragmentShaderURI = opts.path + fs;

  const responses = await new XHRGroup({
    urls: [vertexShaderURI, fragmentShaderURI],
    noCache: opts.noCache
  }).sendAsync();

  return new Program(gl, {vs: responses[0], fs: responses[1]});
}
