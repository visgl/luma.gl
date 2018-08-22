// Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng
import path from 'path';
import fs from 'fs';

/* global Buffer, Blob */

export function loadUri(uri, rootFolder = '.') {
  if (uri.startsWith('http:') || uri.startsWith('https:')) {
    return Promise.reject(new Error('request based loading of URIs not implemented'));
  }

  if (uri.startsWith('data:')) {
    return Promise.resolve(parseDataUriToBuffer(uri));
  }

  const filePath = path.join((rootFolder = '.'), uri);
  return fs.readFileAsync(filePath).then(buffer => ({buffer}));
}

/**
 * Parses a data URI into a buffer, as well as retrieving its declared MIME type.
 *
 * @param {string} uri - a data URI (assumed to be valid)
 * @returns {Object} { buffer, mimeType }
 */
export function parseDataUriToBuffer(uri) {
  const dataIndex = uri.indexOf(',');

  let buffer;
  let mimeType;
  if (uri.slice(dataIndex - 7, dataIndex) === ';base64') {
    buffer = new Buffer(uri.slice(dataIndex + 1), 'base64');
    mimeType = uri.slice(5, dataIndex - 7).trim();
  } else {
    buffer = new Buffer(decodeURIComponent(uri.slice(dataIndex + 1)));
    mimeType = uri.slice(5, dataIndex).trim();
  }

  if (!mimeType) {
    mimeType = 'text/plain;charset=US-ASCII';
  } else if (mimeType[0] === ';') {
    mimeType = `text/plain${mimeType}`;
  }

  return {buffer, mimeType};
}

export function parseDataURItoBlob(dataURI, mime) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs
  const byteString = window.atob(dataURI);

  // separate out the mime component
  // write the bytes of the string to an ArrayBuffer
  // const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  return new Blob([ia], {type: mime});
}
