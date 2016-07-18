import Shaders from '../../shaderlib';
import assert from 'assert';
/* global document */

export function getDefaultShaders({id}) {
  return {
    vs: Shaders.Vertex.Default,
    fs: Shaders.Fragment.Default,
    id
  };
}

export function getStringFromHTML(id) {
  return document.getElementById(id).innerHTML;
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
