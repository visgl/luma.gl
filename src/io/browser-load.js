import {requestFile} from './browser-request-file';

export function loadFile(opts) {
  return requestFile(opts);
}

/* global Image */

/*
 * Loads images asynchronously
 * returns a promise tracking the load
 * TODO - CORS support
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    try {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image ${url}.`));
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}
