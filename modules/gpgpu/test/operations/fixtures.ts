// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {SignedDataType} from '@luma.gl/core';
import {TypedArray} from '@math.gl/core';
import {GPUTable, backendRegistry, webglBackend} from '@luma.gl/gpgpu';
import {webgpuBackend} from '../../src/operations/webgpu';

backendRegistry.add('webgl', webglBackend);
backendRegistry.add('webgpu', webgpuBackend);

export type TestData =
  | {
      value: number[] | TypedArray;
      type?: SignedDataType;
      size?: number;
      offset?: number;
      stride?: number;
    }
  | {
      constant: number | number[];
      type?: SignedDataType;
    };

export function makeTable(source: TestData): GPUTable {
  if ('constant' in source) {
    return GPUTable.fromConstant(source.constant, source.type);
  }
  return GPUTable.fromArray(source.value, source);
}

/** Check table value against definition, returns error if any */
export function verifyTableValue(table: GPUTable, expected: TestData): string | null {
  const size = table.size;

  if ('type' in expected && expected.type !== table.type) {
    return `type does not match. Expected: ${expected.type}, actual: ${table.type}`;
  }
  if ('size' in expected && expected.size !== table.size) {
    return `size does not match. Expected: ${expected.size}, actual:  ${table.size}`;
  }
  if (table.isConstant !== 'constant' in expected) {
    return `isConstant does not match. Expected: ${'constant' in expected}, actual: ${table.isConstant}`;
  }

  const actual = table.value;
  const target = 'constant' in expected ? (expected.constant as number[]) : expected.value;
  if (!actual) {
    return `Unexpected empty result`;
  }
  const mismatches: {index: number; expected: number[]; actual: number[]}[] = [];
  for (let i = 0; i < target.length; i += size) {
    const actualItem = actual?.slice(i, i + size);
    const expectedItem = target.slice(i, i + size);
    if (!equals(actualItem, expectedItem)) {
      mismatches.push({
        index: i / size,
        expected: Array.from(expectedItem),
        actual: Array.from(actualItem)
      });
    }
  }
  if (mismatches.length === 0) {
    return null;
  }
  return `Values do not match:\n${mismatches
    .map(entry => `Vertex ${entry.index}\nexpected: ${entry.expected}\n  actual: ${entry.actual}`)
    .join('\n')}`;
}

export function isSupportedByWebGPU(...inputs: (TestData | undefined)[]): boolean {
  return inputs.every(input => {
    if (!input) {
      return true;
    }
    return (
      (input.type ?? 'float32') === 'float32' || input.type === 'uint32' || input.type === 'sint32'
    );
  });
}

/** numeric or numeric array comparison at GPU precision (float32) */
function equals(a: any, b: any) {
  if (a === b) return true;
  if (Number.isNaN(a)) return Number.isNaN(b);

  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) if (!equals(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.fround(a) === Math.fround(b);
  }
  return false;
}
function isArray(value: any) {
  return Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView));
}
