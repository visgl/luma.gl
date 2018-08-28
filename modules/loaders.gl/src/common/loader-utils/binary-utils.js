/* global FileReader, Blob, ArrayBuffer, Buffer */
import assert from './assert';

export function toArrayBuffer(binaryData) {
  if (binaryData instanceof ArrayBuffer) {
    return binaryData;
  }

  if (typeof Blob !== 'undefined' && binaryData instanceof Blob) {
    return blobToArrayBuffer(binaryData);
  }

  // if (ArrayBuffer.isView(binaryData)) {
  //   return binaryData.buffer;
  // }

  return nodeBufferToArrayBuffer(binaryData);
  // assert(false);
  // return null;
}

// Convert (copy) ArrayBuffer to Buffer
export function toBuffer(binaryData) {
  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    /* global Buffer */
    const buffer = new Buffer(binaryData.byteLength);
    const view = new Uint8Array(binaryData);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  assert(false);
  return null;
}

// Helper functions

export function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    let arrayBuffer;
    const fileReader = new FileReader();
    fileReader.onload = event => {
      arrayBuffer = event.target.result;
    };
    fileReader.onloadend = event => resolve(arrayBuffer);
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(blob);
  });
}

function nodeBufferToArrayBuffer(buffer) {
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  const typedArray = new Uint8Array(buffer);
  return typedArray.buffer;
}
