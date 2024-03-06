// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray} from '@luma.gl/core';

// Uses copyWithin to significantly speed up typed array value filling
export function fillArray(options: {
  target: NumberArray;
  source: NumberArray;
  start?: number;
  count?: number;
}): NumberArray {
  const {target, source, start = 0, count = 1} = options;
  const length = source.length;
  const total = count * length;
  let copied = 0;
  for (let i = start; copied < length; copied++) {
    target[i++] = source[copied];
  }

  while (copied < total) {
    // If we have copied less than half, copy everything we got
    // else copy remaining in one operation
    if (copied < total - copied) {
      target.copyWithin(start + copied, start, start + copied);
      copied *= 2;
    } else {
      target.copyWithin(start + copied, start, start + total - copied);
      copied = total;
    }
  }

  return options.target;
}
