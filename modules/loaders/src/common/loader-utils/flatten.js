// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * Flattens a nested array into a single level array,
 * or a single value into an array with one value
 * @example flatten([[1, [2]], [3], 4]) => [1, 2, 3, 4]
 * @example flatten(1) => [1]
 * @param {Array} array The array to flatten.
 * @param {Function} filter= - Optional predicate called on each `value` to
 *   determine if it should be included (pushed onto) the resulting array.
 * @param {Function} map= - Optional transform applied to each array elements.
 * @param {Array} result=[] - Optional array to push value into
 * @return {Array} Returns the new flattened array (new array or `result` if provided)
 */
export function flatten(array, {filter = () => true, map = x => x, result = []} = {}) {
  // Wrap single object in array
  if (!Array.isArray(array)) {
    return filter(array) ? [map(array)] : [];
  }
  // Deep flatten and filter the array
  return flattenArray(array, filter, map, result);
}

// Deep flattens an array. Helper to `flatten`, see its parameters
function flattenArray(array, filter, map, result) {
  let index = -1;
  while (++index < array.length) {
    const value = array[index];
    if (Array.isArray(value)) {
      flattenArray(value, filter, map, result);
    } else if (filter(value)) {
      result.push(map(value));
    }
  }
  return result;
}

export function countVertices(nestedArray, dimensions = 3) {
  let nestedCount = 0;
  let localCount = 0;
  let index = -1;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      nestedCount += countVertices(value);
    } else {
      localCount++;
    }
  }
  return nestedCount + (nestedCount === 0 && localCount < dimensions ? dimensions : localCount);
}

// Flattens nested array of vertices, padding third coordinate as needed
export function flattenVertices(nestedArray, {result = [], dimensions = 3} = {}) {
  let index = -1;
  let vertexLength = 0;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      flattenVertices(value, {result, dimensions});
    } else {
      // eslint-disable-next-line
      if (vertexLength < dimensions) {
        result.push(value);
        vertexLength++;
      }
    }
  }
  // Add a third coordinate if needed
  if (vertexLength > 0 && vertexLength < dimensions) {
    result.push(0);
  }
  return result;
}

export function flattenToTypedArray(nestedArray, ArrayType = Float32Array) {
  if (nestedArray.length === 0) {
    return new Float32Array(0);
  }

  if (!checkVertices(nestedArray)) {
    return null;
  }

  const count = countVertices(nestedArray);

  const typedArray = new ArrayType(count);
  flattenVerticesInPlace(nestedArray, typedArray);
  return typedArray;
}

function checkVertices(nestedArray, predicate = Number.isFinite) {
  let index = -1;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      if (!checkVertices(value, predicate)) {
        return false;
      }
    } else if (!predicate(value)) {
      return false;
    }
  }
  return true;
}

function flattenVerticesInPlace(nestedArray, result, dimensions = 3) {
  flattenVerticesInPlaceRecursive(nestedArray, result, dimensions, 0);
  return result;
}

// Flattens nested array of vertices, padding third coordinate as needed
function flattenVerticesInPlaceRecursive(nestedArray, result, dimensions, insert) {
  let index = -1;
  let vertexLength = 0;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      insert = flattenVerticesInPlaceRecursive(value, result, dimensions, insert);
    } else {
      // eslint-disable-next-line
      if (vertexLength < dimensions) {
        result[insert++] = value;
        vertexLength++;
      }
    }
  }
  // Add a third coordinate if needed
  if (vertexLength > 0 && vertexLength < dimensions) {
    result[insert++] = 0;
  }
  return insert;
}
