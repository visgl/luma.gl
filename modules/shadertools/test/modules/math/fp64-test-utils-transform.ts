// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {BufferTransform} from '@luma.gl/engine';
import {fp64} from '@luma.gl/shadertools';
import {equals, config} from '@math.gl/core';
import type {Test} from 'tape-promise/tape';

const {fp64ify} = fp64;

config.EPSILON = 1e-11;

export type ArithmeticOperationName =
  | 'sum_fp64'
  | 'sub_fp64'
  | 'mul_fp64'
  | 'div_fp64'
  | 'sqrt_fp64';

export type HelperOperationName = 'split' | 'quickTwoSum' | 'twoSum' | 'twoSub' | 'twoProd';

export type ArithmeticTestCase = {
  label: string;
  inputA: number;
  inputB: number;
  reason?: string;
};

export type HelperDiagnosticCase = {
  label: string;
  inputA: number;
  inputB?: number;
  reason?: string;
};

export type TransformPlatformInfo = {
  gpu: string;
  gpuBackend: string;
  vendor: string;
  renderer: string;
  label: string;
  isAppleMetal: boolean;
  isIntel: boolean;
};

type ArithmeticResult = {
  testCase: ArithmeticTestCase;
  expectedHigh: number;
  expectedLow: number;
  resultHigh: number;
  resultLow: number;
  scalarHigh?: number;
  scalarLow?: number;
  reference64: number;
  result64: number;
  absoluteError: number;
  relativeError: number;
  isEqual: boolean;
};

type HelperDiagnosticResult = {
  testCase: HelperDiagnosticCase;
  expectedHigh: number;
  expectedLow: number;
  resultHigh: number;
  resultLow: number;
  scalarHigh: number;
  scalarLow: number;
  reference64: number;
  result64: number;
  absoluteError: number;
  relativeError: number;
  isEqual: boolean;
};

type ArithmeticTransformOptions = {
  operationName: ArithmeticOperationName;
  binary: boolean;
  operation: (inputA: number, inputB: number) => number;
  testCases: ArithmeticTestCase[];
  includeScalarOutputs?: boolean;
};

type HelperTransformOptions = {
  operationName: HelperOperationName;
  binary: boolean;
  testCases: HelperDiagnosticCase[];
};

type Float64Pair = [number, number];

const FLOAT32_BYTES = Float32Array.BYTES_PER_ELEMENT;

// Use 'invariant' specifier to work around some issues on Apple GPUs. The
// specifier may or may not have an effect, depending on the browser and the
// ANGLE backend, but it's an improvement when it's supported.
// See: https://github.com/visgl/luma.gl/issues/1764

export function getTransformPlatformInfo(device: Device): TransformPlatformInfo {
  const gpu = String(device.info.gpu || 'unknown').toLowerCase();
  const gpuBackend = String(device.info.gpuBackend || 'unknown').toLowerCase();
  const vendor = String(device.info.vendor || 'unknown');
  const renderer = String(device.info.renderer || 'unknown');

  return {
    gpu,
    gpuBackend,
    vendor,
    renderer,
    label: `${gpu}/${gpuBackend} (${vendor}, ${renderer})`,
    isAppleMetal: gpu === 'apple' && gpuBackend === 'metal',
    isIntel: gpu === 'intel'
  };
}

export async function runArithmeticCases(
  device: Device,
  {
    operationName,
    binary,
    operation,
    testCases,
    tapeTest,
    caseKind,
    includeScalarOutputs = false
  }: ArithmeticTransformOptions & {
    tapeTest: Test;
    caseKind: 'must-pass' | 'diagnostic';
  }
): Promise<ArithmeticResult[]> {
  if (!BufferTransform.isSupported(device)) {
    tapeTest.comment('Transform not supported, skipping fp64 transform tests');
    return [];
  }

  if (testCases.length === 0) {
    tapeTest.comment(`${operationName}: no ${caseKind} cases for this platform`);
    return [];
  }

  const arithmeticResults = await runArithmeticTransform(device, {
    operationName,
    binary,
    operation,
    testCases,
    includeScalarOutputs
  });

  for (const arithmeticResult of arithmeticResults) {
    const {testCase} = arithmeticResult;
    const argumentList = binary
      ? `${formatNumber(testCase.inputA)}, ${formatNumber(testCase.inputB)}`
      : `${formatNumber(testCase.inputA)}`;
    const assertionLabel = `${operationName}(${argumentList}) ${caseKind}`;

    if (caseKind === 'must-pass') {
      tapeTest.ok(arithmeticResult.isEqual, `${assertionLabel} within tolerance`);
      if (!arithmeticResult.isEqual) {
        logArithmeticResult(tapeTest, arithmeticResult);
      }
    } else {
      tapeTest.pass(`${assertionLabel} executed`);
      if (!arithmeticResult.isEqual) {
        logArithmeticResult(tapeTest, arithmeticResult);
      }
    }
  }

  return arithmeticResults;
}

export async function runHelperDiagnostics(
  device: Device,
  {
    operationName,
    binary,
    testCases,
    tapeTest
  }: HelperTransformOptions & {
    tapeTest: Test;
  }
): Promise<HelperDiagnosticResult[]> {
  if (!BufferTransform.isSupported(device)) {
    tapeTest.comment('Transform not supported, skipping fp64 helper diagnostics');
    return [];
  }

  if (testCases.length === 0) {
    tapeTest.comment(`${operationName}: no helper diagnostic cases configured`);
    return [];
  }

  const helperResults = await runHelperTransform(device, {
    operationName,
    binary,
    testCases
  });

  for (const helperResult of helperResults) {
    const {testCase} = helperResult;
    const argumentList = binary
      ? `${formatNumber(testCase.inputA)}, ${formatNumber(testCase.inputB ?? 0)}`
      : `${formatNumber(testCase.inputA)}`;

    tapeTest.pass(`${operationName}(${argumentList}) diagnostic executed`);
    if (!helperResult.isEqual) {
      logHelperResult(tapeTest, operationName, helperResult);
    }
  }

  return helperResults;
}

async function runArithmeticTransform(
  device: Device,
  options: ArithmeticTransformOptions
): Promise<ArithmeticResult[]> {
  const {operationName, binary, operation, testCases, includeScalarOutputs = false} = options;
  const inputCount = testCases.length;
  const encodedInputA = new Float32Array(inputCount * 2);
  const encodedInputB = binary ? new Float32Array(inputCount * 2) : null;
  const expectedResult = new Float32Array(inputCount * 2);

  for (let index = 0; index < testCases.length; index++) {
    const testCase = testCases[index];
    const float64Index = index * 2;
    const expectedValue = operation(testCase.inputA, testCase.inputB);

    fp64ify(testCase.inputA, encodedInputA, float64Index);
    if (encodedInputB) {
      fp64ify(testCase.inputB, encodedInputB, float64Index);
    }
    fp64ify(expectedValue, expectedResult, float64Index);
  }

  const vertexShader = buildArithmeticShader(operationName, binary, includeScalarOutputs);
  const inputABuffer = device.createBuffer({data: encodedInputA});
  const inputBBuffer = encodedInputB ? device.createBuffer({data: encodedInputB}) : null;
  const resultBuffer = device.createBuffer({byteLength: encodedInputA.byteLength});
  const outputBuffers: Record<string, {byteLength: number} | undefined> = {
    result: resultBuffer
  };
  let resultHighBuffer;
  let resultLowBuffer;

  if (includeScalarOutputs) {
    resultHighBuffer = device.createBuffer({byteLength: inputCount * FLOAT32_BYTES});
    resultLowBuffer = device.createBuffer({byteLength: inputCount * FLOAT32_BYTES});
    outputBuffers.resultHigh = resultHighBuffer;
    outputBuffers.resultLow = resultLowBuffer;
  }

  const attributes = inputBBuffer
    ? {inputA: inputABuffer, inputB: inputBBuffer}
    : {inputA: inputABuffer};
  const bufferLayout = inputBBuffer
    ? [
        {name: 'inputA', format: 'float32x2' as const},
        {name: 'inputB', format: 'float32x2' as const}
      ]
    : [{name: 'inputA', format: 'float32x2' as const}];

  const transform = new BufferTransform(device, {
    vs: vertexShader,
    modules: [fp64],
    attributes,
    bufferLayout,
    feedbackBuffers: outputBuffers,
    outputs: Object.keys(outputBuffers),
    vertexCount: testCases.length
  });

  try {
    transform.run();

    const gpuResult = await readFloat32Array(transform, 'result');
    const gpuResultHigh = includeScalarOutputs
      ? await readFloat32Array(transform, 'resultHigh')
      : null;
    const gpuResultLow = includeScalarOutputs
      ? await readFloat32Array(transform, 'resultLow')
      : null;

    const arithmeticResults: ArithmeticResult[] = [];
    for (let index = 0; index < testCases.length; index++) {
      const expectedHigh = expectedResult[index * 2];
      const expectedLow = expectedResult[index * 2 + 1];
      const resultHigh = gpuResult[index * 2];
      const resultLow = gpuResult[index * 2 + 1];
      const reference64 = expectedHigh + expectedLow;
      const result64 = resultHigh + resultLow;
      const absoluteError = Math.abs(reference64 - result64);
      const relativeError = getRelativeError(reference64, result64);

      arithmeticResults.push({
        testCase: testCases[index],
        expectedHigh,
        expectedLow,
        resultHigh,
        resultLow,
        scalarHigh: gpuResultHigh?.[index],
        scalarLow: gpuResultLow?.[index],
        reference64,
        result64,
        absoluteError,
        relativeError,
        isEqual: equals(reference64, result64)
      });
    }

    return arithmeticResults;
  } finally {
    transform.destroy();
    inputABuffer.destroy();
    inputBBuffer?.destroy();
    resultBuffer.destroy();
    resultHighBuffer?.destroy();
    resultLowBuffer?.destroy();
  }
}

async function runHelperTransform(
  device: Device,
  options: HelperTransformOptions
): Promise<HelperDiagnosticResult[]> {
  const {operationName, binary, testCases} = options;
  const inputCount = testCases.length;
  const inputAData = new Float32Array(inputCount);
  const inputBData = binary ? new Float32Array(inputCount) : null;

  for (let index = 0; index < testCases.length; index++) {
    const testCase = testCases[index];
    inputAData[index] = Math.fround(testCase.inputA);
    if (inputBData) {
      inputBData[index] = Math.fround(testCase.inputB ?? 0);
    }
  }

  const vertexShader = buildHelperShader(operationName, binary);
  const inputABuffer = device.createBuffer({data: inputAData});
  const inputBBuffer = inputBData ? device.createBuffer({data: inputBData}) : null;
  const resultBuffer = device.createBuffer({byteLength: inputCount * FLOAT32_BYTES * 2});
  const resultHighBuffer = device.createBuffer({byteLength: inputCount * FLOAT32_BYTES});
  const resultLowBuffer = device.createBuffer({byteLength: inputCount * FLOAT32_BYTES});
  const attributes = inputBBuffer
    ? {inputA: inputABuffer, inputB: inputBBuffer}
    : {inputA: inputABuffer};
  const bufferLayout = inputBBuffer
    ? [
        {name: 'inputA', format: 'float32' as const},
        {name: 'inputB', format: 'float32' as const}
      ]
    : [{name: 'inputA', format: 'float32' as const}];

  const transform = new BufferTransform(device, {
    vs: vertexShader,
    modules: [fp64],
    attributes,
    bufferLayout,
    feedbackBuffers: {
      result: resultBuffer,
      resultHigh: resultHighBuffer,
      resultLow: resultLowBuffer
    },
    outputs: ['result', 'resultHigh', 'resultLow'],
    vertexCount: testCases.length
  });

  try {
    transform.run();

    const gpuResult = await readFloat32Array(transform, 'result');
    const gpuResultHigh = await readFloat32Array(transform, 'resultHigh');
    const gpuResultLow = await readFloat32Array(transform, 'resultLow');

    const helperResults: HelperDiagnosticResult[] = [];
    for (let index = 0; index < testCases.length; index++) {
      const testCase = testCases[index];
      const [expectedHigh, expectedLow] = emulateHelperOperation(
        operationName,
        testCase.inputA,
        testCase.inputB ?? 0
      );
      const resultHigh = gpuResult[index * 2];
      const resultLow = gpuResult[index * 2 + 1];
      const reference64 = expectedHigh + expectedLow;
      const result64 = resultHigh + resultLow;
      const absoluteError = Math.abs(reference64 - result64);
      const relativeError = getRelativeError(reference64, result64);

      helperResults.push({
        testCase,
        expectedHigh,
        expectedLow,
        resultHigh,
        resultLow,
        scalarHigh: gpuResultHigh[index],
        scalarLow: gpuResultLow[index],
        reference64,
        result64,
        absoluteError,
        relativeError,
        isEqual: equals(reference64, result64)
      });
    }

    return helperResults;
  } finally {
    transform.destroy();
    inputABuffer.destroy();
    inputBBuffer?.destroy();
    resultBuffer.destroy();
    resultHighBuffer.destroy();
    resultLowBuffer.destroy();
  }
}

function buildArithmeticShader(
  operationName: ArithmeticOperationName,
  binary: boolean,
  includeScalarOutputs: boolean
): string {
  const operationCall = binary ? `${operationName}(inputA, inputB)` : `${operationName}(inputA)`;
  const inputBDeclaration = binary ? 'in vec2 inputB;\n' : '';

  return `\
#version 300 es
in vec2 inputA;
${inputBDeclaration}invariant out vec2 result;
${includeScalarOutputs ? 'invariant out float resultHigh;\ninvariant out float resultLow;\n' : ''}void main(void) {
  vec2 resultValue = ${operationCall};
  result = resultValue;
  ${includeScalarOutputs ? 'resultHigh = resultValue.x;\n  resultLow = resultValue.y;\n  ' : ''}}
`;
}

function buildHelperShader(operationName: HelperOperationName, binary: boolean): string {
  const operationCall = binary ? `${operationName}(inputA, inputB)` : `${operationName}(inputA)`;
  const inputBDeclaration = binary ? 'in float inputB;\n' : '';

  return `\
#version 300 es
in float inputA;
${inputBDeclaration}invariant out vec2 result;
invariant out float resultHigh;
invariant out float resultLow;
void main(void) {
  vec2 resultValue = ${operationCall};
  result = resultValue;
  resultHigh = resultValue.x;
  resultLow = resultValue.y;
}
`;
}

async function readFloat32Array(
  transform: BufferTransform,
  outputName: string
): Promise<Float32Array> {
  const outputData = await transform.readAsync(outputName);
  return new Float32Array(
    outputData.buffer,
    outputData.byteOffset,
    outputData.byteLength / FLOAT32_BYTES
  );
}

function logArithmeticResult(tapeTest: Test, arithmeticResult: ArithmeticResult): void {
  const {testCase} = arithmeticResult;
  tapeTest.comment(`  case: ${testCase.label}`);
  if (testCase.reason) {
    tapeTest.comment(`  note: ${testCase.reason}`);
  }
  tapeTest.comment(
    `  reference64=${arithmeticResult.reference64} result64=${arithmeticResult.result64}`
  );
  tapeTest.comment(
    `  absoluteError=${arithmeticResult.absoluteError} relativeError=${arithmeticResult.relativeError}`
  );
  tapeTest.comment(
    `  expectedHiLo=[${arithmeticResult.expectedHigh}, ${arithmeticResult.expectedLow}] resultHiLo=[${arithmeticResult.resultHigh}, ${arithmeticResult.resultLow}]`
  );
  if (arithmeticResult.scalarHigh !== undefined && arithmeticResult.scalarLow !== undefined) {
    tapeTest.comment(
      `  scalarResultHiLo=[${arithmeticResult.scalarHigh}, ${arithmeticResult.scalarLow}]`
    );
  }
}

function logHelperResult(
  tapeTest: Test,
  operationName: HelperOperationName,
  helperResult: HelperDiagnosticResult
): void {
  const {testCase} = helperResult;
  tapeTest.comment(`  helper: ${operationName} case=${testCase.label}`);
  if (testCase.reason) {
    tapeTest.comment(`  note: ${testCase.reason}`);
  }
  tapeTest.comment(`  reference64=${helperResult.reference64} result64=${helperResult.result64}`);
  tapeTest.comment(
    `  absoluteError=${helperResult.absoluteError} relativeError=${helperResult.relativeError}`
  );
  tapeTest.comment(
    `  expectedHiLo=[${helperResult.expectedHigh}, ${helperResult.expectedLow}] resultHiLo=[${helperResult.resultHigh}, ${helperResult.resultLow}]`
  );
  tapeTest.comment(`  scalarResultHiLo=[${helperResult.scalarHigh}, ${helperResult.scalarLow}]`);
}

function getRelativeError(reference64: number, result64: number): number {
  if (reference64 === 0) {
    return Math.abs(result64);
  }

  return Math.abs((reference64 - result64) / reference64);
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toPrecision(6) : String(value);
}

function emulateHelperOperation(
  operationName: HelperOperationName,
  inputA: number,
  inputB: number
): Float64Pair {
  switch (operationName) {
    case 'split':
      return emulateSplit(inputA);

    case 'quickTwoSum':
      return emulateQuickTwoSum(inputA, inputB);

    case 'twoSum':
      return emulateTwoSum(inputA, inputB);

    case 'twoSub':
      return emulateTwoSub(inputA, inputB);

    case 'twoProd':
      return emulateTwoProd(inputA, inputB);
  }
}

function emulateSplit(inputValue: number): Float64Pair {
  const splitValue = toFloat32(4097.0);
  const scaledValue = toFloat32(toFloat32(inputValue) * splitValue);
  const highPart = toFloat32(scaledValue - toFloat32(scaledValue - toFloat32(inputValue)));
  const lowPart = toFloat32(toFloat32(inputValue) - highPart);
  return [highPart, lowPart];
}

function emulateQuickTwoSum(inputA: number, inputB: number): Float64Pair {
  const sumValue = toFloat32(toFloat32(inputA) + toFloat32(inputB));
  const errorValue = toFloat32(toFloat32(inputB) - toFloat32(sumValue - toFloat32(inputA)));
  return [sumValue, errorValue];
}

function emulateTwoSum(inputA: number, inputB: number): Float64Pair {
  const sumValue = toFloat32(toFloat32(inputA) + toFloat32(inputB));
  const partialValue = toFloat32(sumValue - toFloat32(inputA));
  const errorValue = toFloat32(
    toFloat32(toFloat32(inputA) - toFloat32(sumValue - partialValue)) +
      toFloat32(toFloat32(inputB) - partialValue)
  );
  return [sumValue, errorValue];
}

function emulateTwoSub(inputA: number, inputB: number): Float64Pair {
  const subtractionValue = toFloat32(toFloat32(inputA) - toFloat32(inputB));
  const partialValue = toFloat32(subtractionValue - toFloat32(inputA));
  const errorValue = toFloat32(
    toFloat32(toFloat32(inputA) - toFloat32(subtractionValue - partialValue)) -
      toFloat32(toFloat32(inputB) + partialValue)
  );
  return [subtractionValue, errorValue];
}

function emulateTwoProd(inputA: number, inputB: number): Float64Pair {
  const productValue = toFloat32(toFloat32(inputA) * toFloat32(inputB));
  const [inputAHigh, inputALow] = emulateSplit(inputA);
  const [inputBHigh, inputBLow] = emulateSplit(inputB);
  const errorValue = toFloat32(
    toFloat32(toFloat32(inputAHigh * inputBHigh) - productValue) +
      toFloat32(inputAHigh * inputBLow) +
      toFloat32(inputALow * inputBHigh) +
      toFloat32(inputALow * inputBLow)
  );
  return [productValue, errorValue];
}

function toFloat32(value: number): number {
  return Math.fround(value);
}
