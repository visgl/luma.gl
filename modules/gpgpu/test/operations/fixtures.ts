// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {SignedDataType, Device} from '@luma.gl/core';
import {TypedArray, equals} from '@math.gl/core';
import {
  GPUTableEvaluator,
  backendRegistry,
  webglBackend,
  webgpuBackend,
  cpuBackend
} from '@luma.gl/gpgpu';
import {Stat} from '@probe.gl/stats';
import {getTestDevice as _getTestDevice} from '@luma.gl/test-utils';

backendRegistry.add('webgl', webglBackend);
backendRegistry.add('webgpu', webgpuBackend);
backendRegistry.add('null', cpuBackend);

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

/** Check table value against definition, returns error if any */
export async function verifyTableValue(
  table: GPUTableEvaluator,
  expected: TestData,
  epsilon?: number
): Promise<string | null> {
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

  const actual = table.isConstant ? table.value : await table.readValue();
  const target = 'constant' in expected ? (expected.constant as number[]) : expected.value;
  if (!actual) {
    return `Unexpected empty result`;
  }
  const equalFunc = epsilon === undefined ? exactEquals : (a: any, b: any) => equals(a, b, epsilon);
  const mismatches: {index: number; expected: number[]; actual: number[]}[] = [];
  for (let i = 0; i < target.length; i += size) {
    const actualItem = actual?.slice(i, i + size);
    const expectedItem = target.slice(i, i + size);
    if (!equalFunc(actualItem, expectedItem)) {
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

export function isSupportedByWebGPU(...inputs: (GPUTableEvaluator | undefined)[]): boolean {
  const visitedEvaluators = new Set<GPUTableEvaluator>();
  return inputs.every(input => isEvaluatorSupportedByWebGPU(input, visitedEvaluators));
}

function isEvaluatorSupportedByWebGPU(
  evaluator: GPUTableEvaluator | undefined,
  visitedEvaluators: Set<GPUTableEvaluator>
): boolean {
  if (!evaluator || visitedEvaluators.has(evaluator)) {
    return true;
  }
  visitedEvaluators.add(evaluator);
  if (evaluator.type !== 'float32' && evaluator.type !== 'uint32' && evaluator.type !== 'sint32') {
    return false;
  }

  const source = evaluator.source;

  if (source instanceof GPUTableEvaluator) {
    return isEvaluatorSupportedByWebGPU(source, visitedEvaluators);
  }

  if (!source || !('dependencies' in source) || !source.dependencies) {
    return true;
  }

  return source.dependencies.every(dependency =>
    isEvaluatorSupportedByWebGPU(dependency, visitedEvaluators)
  );
}

/** numeric or numeric array comparison at GPU precision (float32) */
function exactEquals(a: any, b: any) {
  if (a === b) return true;
  if (Number.isNaN(a)) return Number.isNaN(b);

  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) if (!exactEquals(a[i], b[i])) return false;
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

export function getTestDevice(deviceType: 'webgl' | 'webgpu' | 'cpu'): Promise<Device | null> {
  return _getTestDevice(deviceType === 'cpu' ? 'null' : deviceType);
}

export function getRunStats(device: Device): Stat | null {
  if (device.type === 'null') return null;
  const stats = device.statsManager.getStats('GPGPU Operation Counts');
  return stats.get(device.type === 'webgl' ? 'Transform Runs' : 'Computation Runs');
}
