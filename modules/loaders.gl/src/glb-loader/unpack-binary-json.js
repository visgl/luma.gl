function parseJSONPointer(value) {
  if (typeof value === 'string') {
    // Remove escape character
    if (value.indexOf('##/') === 0) {
      return value.slice(1);
    }

    let matches = value.match(/\#\/[a-z]+\/([0-9]+)/);
    if (matches) {
      const index = parseInt(matches[2], 10);
      return [matches[1], index];
    }

    // Legacy: `$$$i`
    matches = value.match(/\$\$\$([0-9]+)/);
    if (matches) {
      const index = parseInt(matches[1], 10);
      return ['accessors', index];
    }
  }

  return null;
}

// Recursively unpacks objects, replacing "JSON pointers" with typed arrays
export default function unpackJsonArrays(json, buffers, options = {}) {
  const object = json;

  const pointer = parseJSONPointer(object);
  if (pointer) {
    const [field, index] = pointer;
    const value = json[field] && json[field][index];
    if (!value) {
      console.error(`Invalid JSON pointer ${object}`); // eslint-disable-line
    }
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
