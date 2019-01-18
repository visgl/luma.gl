import {requestFile} from './browser-request-file';

let pathPrefix = '';

/*
 * Set a relative path prefix
 */
export function setPathPrefix(prefix) {
  pathPrefix = prefix;
}

export function loadFile(url, opts) {
  if (typeof url !== 'string' && !opts) {
    // TODO - warn for deprecated mode
    opts = url;
    url = opts.url;
  }
  opts.url = pathPrefix ? pathPrefix + url : url;
  return requestFile(opts);
}

/* global Image, Blob, URL, createImageBitmap, location */

/*
 * Loads images asynchronously
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * returns a promise tracking the load
 */
export function loadImage(url, opts) {
  url = pathPrefix ? pathPrefix + url : url;

  if (typeof Image === 'undefined') {
    // In a web worker
    // XMLHttpRequest throws invalid URL error if using relative path
    // resolve url relative to original base
    url = new URL(url, location.pathname).href;
    return requestFile({url, responseType: 'arraybuffer'}).then(arraybuffer => {
      const blob = new Blob([new Uint8Array(arraybuffer)]);
      return createImageBitmap(blob);
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image ${url}.`));
      image.crossOrigin = (opts && opts.crossOrigin) || 'anonymous';
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}
