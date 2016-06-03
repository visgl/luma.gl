/* eslint-disable guard-for-in, complexity, no-try-catch */
import assert from 'assert';
import {loadFile, loadImage} from './platform';

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
      const promise = loadImage({url, ...opts});
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
