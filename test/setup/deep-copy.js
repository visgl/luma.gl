// Recursively copies objects
export default function deepCopy(object) {
  if (Array.isArray(object)) {
    return object.map(element => deepCopy(element));
  }

  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = deepCopy(object[key]);
    }
    return newObject;
  }

  return object;
}
