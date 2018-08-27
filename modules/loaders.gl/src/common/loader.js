import {request as d3request} from 'd3-request';

export function loadFile(url, loader, options = {}) {
  if (loader.parseBinary) {
    return loadBinary(url).then(data => loader.parseBinary(data, options));
  }
  if (loader.parseText) {
    return d3request(url).then(text => loader.parseText(text, options));
  }
  return Promise.reject(new Error(`Could not load ${url} using ${loader.name} loader`));
}

/**
 * loads binary data
 * @param {string} url
 * @return {Promise} promise that resolves to the binary data
 */
/* global XMLHttpRequest */
export function loadBinary(url) {
  let request = null;
  const promise = new Promise((resolve, reject) => {
    request = new XMLHttpRequest();
    try {
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';

      request.onload = () => {
        if (request.status === 200) {
          resolve(request.response);
        }
        reject(new Error('Could not get binary data'));
      };
      request.onerror = error => reject(error);

      request.send();
    } catch (error) {
      reject(error);
    }
  });
  // Make abort() available
  promise.abort = request.abort.bind(request);
  return promise;
}
