// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { SignedDataType } from '@luma.gl/core/index';
import {GPUTable, backendRegistry, webglBackend} from '@luma.gl/gpgpu';
import {equals} from '@math.gl/core';

backendRegistry.add('webgl', webglBackend);

export type TestData = {
  value: number[];
  type?: SignedDataType;
  size?: number;
  offset?: number;
  stride?: number;
} | {
  constant: number | number[];
  type?: SignedDataType;
};

export function makeTable(source: TestData): GPUTable {
  if ('constant' in source) {
    return GPUTable.fromConstant(source.constant, source.type);
  }
  return GPUTable.fromArray(source.value, source);
}

/** Check table shape against definition, returns error if any */
export function verifyTableShape(table: GPUTable, expected: TestData): string | null {
  if ('type' in expected && expected.type !== table.type) {
    return `type does not match. Expected: ${expected.type}, actual: ${table.type}`;
  }
  if ('size' in expected && expected.size !== table.size) {
    return `size does not match. Expected: ${expected.size}, actual:  ${table.size}`;
  }
  if (table.isConstant !== ('constant' in expected)) {
    return `isConstant does not match. Expected: ${'constant' in expected}, actual: ${table.isConstant}`;
  }
  return null;
}

/** Check table value against definition, returns error if any */
export function verifyTableValue(table: GPUTable, expected: TestData, epsilon: number = 7): string | null {
  const actual = table.value;
  const target = 'constant' in expected ? expected.constant : expected.value;

  if (equals(actual, target, epsilon)) {
    return null;
  }
  return `values do not match. Expected: ${target}, actual: ${Array.from(actual)}`;
}
