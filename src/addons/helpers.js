import Program from '../webgl/program';
import Shaders from '../shaders';
import {XHRGroup} from '../io';
import {merge} from '../utils';

/* global document */

// Alternate constructor
// Create a program from vertex and fragment shader node ids
// TODO - remove from Program
// Extracting templates should be done by app with separate helper method
export function makeProgramFromHTMLTemplates(gl, vsId, fsId, id) {
  const vs = document.getElementById(vsId).innerHTML;
  const fs = document.getElementById(fsId).innerHTML;
  return new Program(gl, {vs, fs, id});
}

// Alternate constructor
// Build program from default shaders (requires Shaders)
// TODO - remove from Program
// default shaders should be selected by app, e.g. with addons/helpers methods
export function makeProgramfromDefaultShaders(gl, id) {
  return new Program(gl, {
    vs: Shaders.Vertex.Default,
    fs: Shaders.Fragment.Default,
    id
  });
}

// Alternate constructor
// TODO - remove from Program.
// Loading should be done by app, e.g. with addons/helpers methods
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
