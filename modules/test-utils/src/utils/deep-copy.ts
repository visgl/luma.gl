/** Recursively copies objects */
export function deepCopy(object: any): any {
  if (Array.isArray(object)) {
    return object.map(element => deepCopy(element));
  }

  if (object !== null && typeof object === 'object') {
    const newObject: Record<string, any> = {};
    for (const key in object) {
      newObject[key] = deepCopy(object[key]);
    }
    return newObject;
  }

  return object;
}
