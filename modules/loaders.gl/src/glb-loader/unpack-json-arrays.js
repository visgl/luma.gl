const DEFAULT_UNTOKENIZE = value => {
  if (typeof value === 'string') {
    const matches = value.match(/\$\$\$([0-9]+)/);
    if (matches) {
      const index = matches[1];
      return parseInt(index, 10);
    }
  }
  return -1;
};

// Recursively unpacks objects, replacing "JSON pointers" with typed arrays
export default function unpackJsonArrays(json, buffers, options = {}) {
  const {untokenize = DEFAULT_UNTOKENIZE} = options;

  const object = json;

  // Check if a buffer token in that case replace with buffer
  const bufferIndex = untokenize(object);
  if (bufferIndex >= 0) {
    return buffers[bufferIndex];
  }

  // Copy array
  if (Array.isArray(object)) {
    return object.map(element => unpackJsonArrays(element, buffers, options));
  }

  // Copy object
  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = unpackJsonArrays(object[key], buffers, options);
    }
    return newObject;
  }

  return object;
}
