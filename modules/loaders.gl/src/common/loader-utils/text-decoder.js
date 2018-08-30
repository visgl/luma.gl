// The MIT License (MIT) Copyright (c) 2016 Till Affeldt
/* global window */

// allowed encoding strings for utf-8
export const utf8Encodings = ['utf8', 'utf-8', 'unicode-1-1-utf-8'];

class TextDecoderPolyfill {
  constructor(encoding, options) {
    if (
      utf8Encodings.indexOf(encoding) < 0 &&
      typeof encoding !== 'undefined' &&
      encoding !== null
    ) {
      throw new RangeError('Invalid encoding type. Only utf-8 is supported');
    } else {
      this.encoding = 'utf-8';
      this.ignoreBOM = false;
      this.fatal = typeof options !== 'undefined' && 'fatal' in options ? options.fatal : false;
      if (typeof this.fatal !== 'boolean') {
        throw new TypeError('fatal flag must be boolean');
      }
    }
  }

  decode(view, options) {
    if (typeof view === 'undefined') {
      return '';
    }

    const stream = typeof options !== 'undefined' && 'stream' in options ? options.stream : false;
    if (typeof stream !== 'boolean') {
      throw new TypeError('stream option must be boolean');
    }

    if (view instanceof ArrayBuffer) {
      view = new Uint8Array(view);
    }

    if (!ArrayBuffer.isView(view)) {
      throw new TypeError('passed argument must be an array buffer view');
    } else {
      const arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
      const charArr = new Array(arr.length);
      arr.forEach((charcode, i) => {
        charArr[i] = String.fromCharCode(charcode);
      });
      const text = charArr.join('');
      try {
        return decodeURIComponent(escape(text));
      } catch (error) {
        return text;
      }
    }
  }
}

export default typeof window !== 'undefined' ? window.TextDecoder : TextDecoderPolyfill;
