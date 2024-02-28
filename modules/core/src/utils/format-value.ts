// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-console */
import type {NumberArray} from '../types';

/** TODO @deprecated - delete when confident that probe.gl logging implements all opts */
function formatArrayValue(v: NumberArray, opts: {maxElts?: number; size?: number} = {}): string {
  const {maxElts = 16, size = 1} = opts;
  let string = '[';
  for (let i = 0; i < v.length && i < maxElts; ++i) {
    if (i > 0) {
      string += `,${i % size === 0 ? ' ' : ''}`;
    }
    string += formatValue(v[i], opts);
  }
  const terminator = v.length > maxElts ? '...' : ']';
  return `${string}${terminator}`;
}

/** TODO @deprecated - delete when confident that probe.gl logging implements all opts */
export function formatValue(
  v: number | NumberArray | unknown,
  opts: {isInteger?: boolean; size?: number} = {}
): string {
  const EPSILON = 1e-16;
  const {isInteger = false} = opts;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    return formatArrayValue(v as NumberArray, opts);
  }
  if (typeof v !== 'number') {
    return String(v);
  }
  if (Math.abs(v) < EPSILON) {
    return isInteger ? '0' : '0.';
  }
  if (isInteger) {
    return v.toFixed(0);
  }
  if (Math.abs(v) > 100 && Math.abs(v) < 10000) {
    return v.toFixed(0);
  }
  const string = v.toPrecision(2);
  const decimal = string.indexOf('.0');
  return decimal === string.length - 2 ? string.slice(0, -1) : string;
}
