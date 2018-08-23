// The MIT License (MIT) Copyright (c) 2016 Till Affeldt
/* global window */

// allowed encoding strings for utf-8
const utf8Encodings = ['utf8', 'utf-8', 'unicode-1-1-utf-8'];

class TextEncoderPolyfill {
  constructor(encoding) {
    if (
      utf8Encodings.indexOf(encoding) < 0 &&
      typeof encoding !== 'undefined' &&
      encoding !== null
    ) {
      throw new RangeError('Invalid encoding type. Only utf-8 is supported');
    } else {
      this.encoding = 'utf-8';
    }
  }

  encode(str) {
    if (typeof str !== 'string') {
      throw new TypeError('passed argument must be of tye string');
    }
    const binstr = unescape(encodeURIComponent(str));
    const arr = new Uint8Array(binstr.length);
    binstr.split('').forEach((char, i) => {
      arr[i] = char.charCodeAt(0);
    });
    return arr;
  }
}

export default typeof window !== 'undefined' ? window.TextEncoder : TextEncoderPolyfill;
