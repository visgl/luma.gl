/* eslint-disable guard-for-in, complexity, no-try-catch */
import assert from 'assert';
import {loadFile, loadImage} from './platform';
import {Texture2D} from '../webgl';

function noop() {}

/*
 * Loads (Requests) multiple files asynchronously
 */
export function loadFiles({urls, onProgress = noop, ...opts}) {
  assert(urls.every(url => typeof url === 'string'),
    'loadImages: {urls} must be array of strings');
  let count = 0;
  return Promise.all(urls.map(
    url => {
      const promise = loadFile({url, ...opts});
      promise.then(file => onProgress({
        progress: ++count / urls.length,
        count,
        total: urls.length,
        url
      }));
      return promise;
    }
  ));
}

/*
 * Loads (requests) multiple images asynchronously
 */
export function loadImages({urls, onProgress = noop, ...opts}) {
  assert(urls.every(url => typeof url === 'string'),
    'loadImages: {urls} must be array of strings');
  let count = 0;
  return Promise.all(urls.map(
    url => {
      const promise = loadImage(url);
      promise.then(file => onProgress({
        progress: ++count / urls.length,
        count,
        total: urls.length,
        url
      }));
      return promise;
    }
  ));
}

export function loadTextures(gl, {urls, onProgress = noop, ...opts}) {
  assert(urls.every(url => typeof url === 'string'),
    'loadTextures: {urls} must be array of strings');
  return loadImages({urls, onProgress, ...opts})
  .then(images => images.map((img, i) => {
    let params = Array.isArray(opts.parameters) ?
      opts.parameters[i] : opts.parameters;
    params = params === undefined ? {} : params;
    return new Texture2D(gl, {
      ...params,
      data: img
    });
  }));
}
