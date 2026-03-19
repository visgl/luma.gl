// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Buffer} from '@luma.gl/core';
import {Computation, ShaderInputs} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {equals, config} from '@math.gl/core';
import {fp64arithmetic, fp64ify} from '@luma.gl/shadertools';

config.EPSILON = 1e-11;

const ENABLE_WGSL_FP64_COMPUTE_DIAGNOSTICS = false;

type ArithmeticOperationName = 'sum_fp64' | 'sub_fp64' | 'mul_fp64' | 'div_fp64';
type HelperOperationName = 'split' | 'quickTwoSum' | 'twoSum' | 'twoSub' | 'twoProd';

type ArithmeticCase = {
  inputA: number;
  inputB: number;
  label: string;
};

type HelperCase = {
  expectNonZeroLowPart?: boolean;
  inputA: number;
  inputB: number;
  label: string;
};

type ArithmeticOperation = {
  name: ArithmeticOperationName;
  operation: (inputA: number, inputB: number) => number;
};

type HelperOperation = {
  cases: HelperCase[];
  expression: string;
  name: HelperOperationName;
  operation: (inputA: number, inputB: number) => number;
};

const ARITHMETIC_CASES: ArithmeticCase[] = [
  {label: 'decimal pair', inputA: 0.1, inputB: 0.1},
  {label: 'mixed magnitude pair', inputA: 3.0e-19, inputB: 3.3e13},
  {label: 'large over medium', inputA: 1.4e9, inputB: 6.3e5},
  {label: 'fraction over tiny', inputA: 0.3, inputB: 3.2e-16}
];

const ARITHMETIC_OPERATIONS: ArithmeticOperation[] = [
  {name: 'sum_fp64', operation: (inputA, inputB) => inputA + inputB},
  {name: 'sub_fp64', operation: (inputA, inputB) => inputA - inputB},
  {name: 'mul_fp64', operation: (inputA, inputB) => inputA * inputB},
  {name: 'div_fp64', operation: (inputA, inputB) => inputA / inputB}
];

const HELPER_OPERATIONS: HelperOperation[] = [
  {
    name: 'split',
    expression: 'split(inputA.x)',
    operation: inputA => inputA,
    cases: [
      {label: 'decimal split', inputA: 0.1, inputB: 0, expectNonZeroLowPart: true},
      {
        label: 'seahorse x split',
        inputA: -0.743643887037151,
        inputB: 0,
        expectNonZeroLowPart: true
      },
      {label: 'tiny split', inputA: 3.2e-16, inputB: 0, expectNonZeroLowPart: true}
    ]
  },
  {
    name: 'quickTwoSum',
    expression: 'quickTwoSum(inputA.x, inputB.x)',
    operation: (inputA, inputB) => inputA + inputB,
    cases: [
      {label: 'ordered decimal pair', inputA: 0.1, inputB: 1.0e-8, expectNonZeroLowPart: true},
      {
        label: 'ordered large plus one',
        inputA: 3.3e13,
        inputB: 1.0,
        expectNonZeroLowPart: true
      },
      {
        label: 'ordered seahorse delta',
        inputA: -0.743643887037151,
        inputB: 1.0e-8,
        expectNonZeroLowPart: true
      }
    ]
  },
  {
    name: 'twoSum',
    expression: 'twoSum(inputA.x, inputB.x)',
    operation: (inputA, inputB) => inputA + inputB,
    cases: [
      {label: 'decimal pair', inputA: 0.1, inputB: 0.2, expectNonZeroLowPart: true},
      {
        label: 'large plus tiny',
        inputA: 3.3e13,
        inputB: 3.0e-19,
        expectNonZeroLowPart: true
      },
      {
        label: 'mixed sign pair',
        inputA: -0.743643887037151,
        inputB: 1.0e-8,
        expectNonZeroLowPart: true
      }
    ]
  },
  {
    name: 'twoSub',
    expression: 'twoSub(inputA.x, inputB.x)',
    operation: (inputA, inputB) => inputA - inputB,
    cases: [
      {label: 'decimal difference', inputA: 0.3, inputB: 0.2, expectNonZeroLowPart: true},
      {
        label: 'large minus tiny',
        inputA: 3.3e13,
        inputB: 3.0e-19,
        expectNonZeroLowPart: true
      },
      {
        label: 'mixed sign difference',
        inputA: -0.743643887037151,
        inputB: 1.0e-8,
        expectNonZeroLowPart: true
      }
    ]
  },
  {
    name: 'twoProd',
    expression: 'twoProd(inputA.x, inputB.x)',
    operation: (inputA, inputB) => inputA * inputB,
    cases: [
      {label: 'decimal product', inputA: 0.1, inputB: 0.1, expectNonZeroLowPart: true},
      {
        label: 'seahorse scale product',
        inputA: -0.743643887037151,
        inputB: 1.0e-8,
        expectNonZeroLowPart: true
      },
      {
        label: 'tiny over huge product',
        inputA: 3.0e-19,
        inputB: 3.3e13,
        expectNonZeroLowPart: true
      }
    ]
  }
];

for (const arithmeticOperation of ARITHMETIC_OPERATIONS) {
  test(`fp64 WGSL#${arithmeticOperation.name}`, async tapeTest => {
    if (!ENABLE_WGSL_FP64_COMPUTE_DIAGNOSTICS) {
      tapeTest.comment('Temporarily disabling fp64 WGSL compute diagnostics');
      tapeTest.end();
      return;
    }
    const webgpuDevice = await getWebGPUTestDevice();
    if (!webgpuDevice) {
      tapeTest.comment('WebGPU unavailable, skipping fp64 WGSL diagnostics');
      tapeTest.end();
      return;
    }
    if (isAppleMetalDevice(webgpuDevice)) {
      tapeTest.comment('Skipping fp64 WGSL diagnostics on Apple Metal');
      tapeTest.end();
      return;
    }

    const encodedInputA = new Float32Array(ARITHMETIC_CASES.length * 2);
    const encodedInputB = new Float32Array(ARITHMETIC_CASES.length * 2);

    for (let index = 0; index < ARITHMETIC_CASES.length; index++) {
      const float64Index = index * 2;
      fp64ify(ARITHMETIC_CASES[index].inputA, encodedInputA, float64Index);
      fp64ify(ARITHMETIC_CASES[index].inputB, encodedInputB, float64Index);
    }

    const inputABuffer = webgpuDevice.createBuffer({
      data: encodedInputA,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const inputBBuffer = webgpuDevice.createBuffer({
      data: encodedInputB,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const resultBuffer = webgpuDevice.createBuffer({
      byteLength: encodedInputA.byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });

    const shaderInputs = new ShaderInputs({fp64arithmetic});
    const computation = new Computation(webgpuDevice, {
      source: buildWGSLArithmeticSource(arithmeticOperation.name),
      modules: [fp64arithmetic],
      shaderInputs,
      shaderLayout: {
        bindings: [
          {name: 'fp64arithmeticUniforms', type: 'uniform', group: 0, location: 0},
          {name: 'inputAData', type: 'storage', group: 0, location: 1},
          {name: 'inputBData', type: 'storage', group: 0, location: 2},
          {name: 'resultData', type: 'storage', group: 0, location: 3}
        ]
      }
    });

    try {
      computation.setBindings({
        inputAData: inputABuffer,
        inputBData: inputBBuffer,
        resultData: resultBuffer
      });
      computation.updateShaderInputs();

      const computePass = webgpuDevice.beginComputePass({});
      computation.dispatch(computePass, ARITHMETIC_CASES.length);
      computePass.end();
      webgpuDevice.submit();

      const resultData = new Float32Array(await resultBuffer.readAsync());
      for (let index = 0; index < ARITHMETIC_CASES.length; index++) {
        const arithmeticCase = ARITHMETIC_CASES[index];
        const expectedValue = arithmeticOperation.operation(
          arithmeticCase.inputA,
          arithmeticCase.inputB
        );
        const resultHigh = resultData[index * 2];
        const resultLow = resultData[index * 2 + 1];
        const result64 = resultHigh + resultLow;
        const absoluteError = Math.abs(expectedValue - result64);
        const relativeError = expectedValue === 0 ? absoluteError : absoluteError / expectedValue;

        tapeTest.ok(
          equals(expectedValue, result64),
          `${arithmeticOperation.name} ${arithmeticCase.label} within tolerance`
        );
        if (!equals(expectedValue, result64)) {
          tapeTest.comment(
            `  ${arithmeticOperation.name} ${arithmeticCase.label} expected=${expectedValue} result=${result64}`
          );
          tapeTest.comment(
            `  hiLo=[${resultHigh}, ${resultLow}] absoluteError=${absoluteError} relativeError=${relativeError}`
          );
        }
      }
    } finally {
      computation.destroy();
      inputABuffer.destroy();
      inputBBuffer.destroy();
      resultBuffer.destroy();
    }

    tapeTest.end();
  });
}

for (const helperOperation of HELPER_OPERATIONS) {
  test(`fp64 WGSL helper#${helperOperation.name}`, async tapeTest => {
    if (!ENABLE_WGSL_FP64_COMPUTE_DIAGNOSTICS) {
      tapeTest.comment('Temporarily disabling fp64 WGSL helper diagnostics');
      tapeTest.end();
      return;
    }
    const webgpuDevice = await getWebGPUTestDevice();
    if (!webgpuDevice) {
      tapeTest.comment('WebGPU unavailable, skipping fp64 WGSL helper diagnostics');
      tapeTest.end();
      return;
    }
    if (isAppleMetalDevice(webgpuDevice)) {
      tapeTest.comment('Skipping fp64 WGSL helper diagnostics on Apple Metal');
      tapeTest.end();
      return;
    }

    const encodedInputA = new Float32Array(helperOperation.cases.length * 2);
    const encodedInputB = new Float32Array(helperOperation.cases.length * 2);

    for (let index = 0; index < helperOperation.cases.length; index++) {
      encodedInputA[index * 2] = Math.fround(helperOperation.cases[index].inputA);
      encodedInputB[index * 2] = Math.fround(helperOperation.cases[index].inputB);
    }

    const inputABuffer = webgpuDevice.createBuffer({
      data: encodedInputA,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const inputBBuffer = webgpuDevice.createBuffer({
      data: encodedInputB,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const resultBuffer = webgpuDevice.createBuffer({
      byteLength: encodedInputA.byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });

    const shaderInputs = new ShaderInputs({fp64arithmetic});
    const computation = new Computation(webgpuDevice, {
      source: buildWGSLHelperSource(helperOperation.expression),
      modules: [fp64arithmetic],
      shaderInputs,
      shaderLayout: {
        bindings: [
          {name: 'fp64arithmeticUniforms', type: 'uniform', group: 0, location: 0},
          {name: 'inputAData', type: 'storage', group: 0, location: 1},
          {name: 'inputBData', type: 'storage', group: 0, location: 2},
          {name: 'resultData', type: 'storage', group: 0, location: 3}
        ]
      }
    });

    try {
      computation.setBindings({
        inputAData: inputABuffer,
        inputBData: inputBBuffer,
        resultData: resultBuffer
      });
      computation.updateShaderInputs();

      const computePass = webgpuDevice.beginComputePass({});
      computation.dispatch(computePass, helperOperation.cases.length);
      computePass.end();
      webgpuDevice.submit();

      const resultData = new Float32Array(await resultBuffer.readAsync());
      for (let index = 0; index < helperOperation.cases.length; index++) {
        const helperCase = helperOperation.cases[index];
        const expectedValue = helperOperation.operation(helperCase.inputA, helperCase.inputB);
        const resultHigh = resultData[index * 2];
        const resultLow = resultData[index * 2 + 1];
        const result64 = resultHigh + resultLow;
        const absoluteError = Math.abs(expectedValue - result64);
        const relativeError = expectedValue === 0 ? absoluteError : absoluteError / expectedValue;

        tapeTest.ok(
          Number.isFinite(resultHigh) && Number.isFinite(resultLow),
          `${helperOperation.name} ${helperCase.label} produced finite hi/lo`
        );
        tapeTest.ok(
          equals(expectedValue, result64),
          `${helperOperation.name} ${helperCase.label} recombined result within tolerance`
        );
        if (helperCase.expectNonZeroLowPart) {
          tapeTest.ok(
            resultLow !== 0,
            `${helperOperation.name} ${helperCase.label} retained a non-zero low part`
          );
        }
        if (
          !equals(expectedValue, result64) ||
          (helperCase.expectNonZeroLowPart && resultLow === 0)
        ) {
          tapeTest.comment(
            `  ${helperOperation.name} ${helperCase.label} expected=${expectedValue} result=${result64}`
          );
          tapeTest.comment(
            `  hiLo=[${resultHigh}, ${resultLow}] absoluteError=${absoluteError} relativeError=${relativeError}`
          );
        }
      }
    } finally {
      computation.destroy();
      inputABuffer.destroy();
      inputBBuffer.destroy();
      resultBuffer.destroy();
    }

    tapeTest.end();
  });
}

function buildWGSLArithmeticSource(operationName: ArithmeticOperationName): string {
  return `\
@group(0) @binding(1) var<storage, read> inputAData: array<vec2f>;
@group(0) @binding(2) var<storage, read> inputBData: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> resultData: array<vec2f>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  let inputA = inputAData[index];
  let inputB = inputBData[index];
  resultData[index] = ${operationName}(inputA, inputB);
}
`;
}

function buildWGSLHelperSource(expression: string): string {
  return `\
@group(0) @binding(1) var<storage, read> inputAData: array<vec2f>;
@group(0) @binding(2) var<storage, read> inputBData: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> resultData: array<vec2f>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  let inputA = inputAData[index];
  let inputB = inputBData[index];
  resultData[index] = ${expression};
}
`;
}
