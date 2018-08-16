/**
 * Adapted from THREE.js under MIT license
 * @author Don McCurdy / https://www.donmccurdy.com
 */

/* global TextDecoder */

export function decodeText(array) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(array);
  }

  // Avoid the String.fromCharCode.apply(null, array) shortcut, which
  // throws a "maximum call stack size exceeded" error for large arrays.

  let s = '';
  for (let i = 0; i < array.length; i++) {
    // Implicitly assumes little-endian.
    s += String.fromCharCode(array[i]);
  }

  // Merges multi-byte utf-8 characters.
  return decodeURIComponent(escape(s));
}

export function extractUrlBase(url) {
  const index = url.lastIndexOf('/');
  return index === -1 ? './' : url.substr(0, index + 1);
}
