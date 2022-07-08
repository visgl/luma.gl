// Returns true if given object is empty, false otherwise.
export function isObjectEmpty(object) {
  for (const key in object) {
    return false;
  }
  return true;
}

export function deepArrayEqual(x, y) {
  if (x === y) {
    return true;
  }
  const isArrayX = Array.isArray(x) || ArrayBuffer.isView(x);
  const isArrayY = Array.isArray(y) || ArrayBuffer.isView(y);

  // @ts-expect-error DataView...
  if (isArrayX && isArrayY && x.length === y.length) {
    // @ts-expect-error DataView...
    for (let i = 0; i < x.length; ++i) {
      if (x[i] !== y[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}
