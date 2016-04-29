import Shaders from '../shaders';
import {loadFiles} from '../io';
import {merge} from '../utils';
import assert from 'assert';
/* global document */

export function getDefaultShaders({id}) {
  return {
    vs: Shaders.Vertex.Default,
    fs: Shaders.Fragment.Default,
    id
  };
}

export function getShadersFromHTML({vs, fs, id}) {
  assert(vs);
  assert(fs);
  return {
    vs: document.getElementById(vs).innerHTML,
    fs: document.getElementById(fs).innerHTML,
    id
  };
}

// Load shaders using XHR
// @deprecated - Use glslify instead
export async function getShadersFromURIs(gl, {vs, fs, id, ...opts}) {
  opts = merge({
    path: '/',
    noCache: false
  }, opts);

  const vertexShaderURI = opts.path + vs;
  const fragmentShaderURI = opts.path + fs;

  const files = await loadFiles({
    paths: [vertexShaderURI, fragmentShaderURI],
    noCache: opts.noCache
  });

  return {vs: files[0], fs: files[1], id};
}
