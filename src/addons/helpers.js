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

export function getHTMLTemplate(id) {
  return document.getElementById(id).innerHTML;
}

export function getShadersFromHTML({vs, fs, id}) {
  assert(vs);
  assert(fs);
  return {
    id,
    vs: getHTMLTemplate(vs),
    fs: getHTMLTemplate(fs)
  };
}
