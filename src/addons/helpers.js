import assert from 'assert';
/* global document */

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
