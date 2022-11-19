import type {TypedArray, NumberArray} from '../types';

let arrayBuffer: ArrayBuffer = null;

export function getScratchArrayBuffer(byteLength: number): ArrayBuffer {
  if (!arrayBuffer || arrayBuffer.byteLength < byteLength) {
    arrayBuffer = new ArrayBuffer(byteLength);
  }
  return arrayBuffer;
}

export function getScratchArray(Type: any, length: number): TypedArray {
  const scratchArrayBuffer = getScratchArrayBuffer(Type.BYTES_PER_ELEMENT * length);
  return new Type(scratchArrayBuffer, 0, length); // arrayBuffer, byteOffset, length (in elements)
}

// Uses copyWithin to significantly speed up typed array value filling
export function fillArray(options: {target: NumberArray, source: NumberArray, start?: number, count?: number}): NumberArray {
  const {start = 0, count = 1} = options;
  const length = options.source.length;
  const total = count * length;
  let copied = 0;
  for (let i = start; copied < length; copied++) {
    options.target[i++] = options.source[copied];
  }

  while (copied < total) {
    // If we have copied less than half, copy everything we got
    // else copy remaining in one operation
    if (copied < total - copied) {
      options.target.copyWithin(start + copied, start, start + copied);
      copied *= 2;
    } else {
      options.target.copyWithin(start + copied, start, start + total - copied);
      copied = total;
    }
  }

  return options.target;
}