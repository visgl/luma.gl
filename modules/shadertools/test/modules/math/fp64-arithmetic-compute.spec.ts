// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation, ShaderInputs} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {equals, config} from '@math.gl/core';
import {fp64arithmetic, fp64ify} from '@luma.gl/shadertools';

config.EPSILON = 1e-11;

type ArithmeticOperationName = 'sum_fp64' | 'sub_fp64' | 'mul_fp64' | 'div_fp64' | 'sqrt_fp64';
type HelperOperationName = 'split' | 'quickTwoSum' | 'twoSum' | 'twoSub' | 'twoSqr' | 'twoProd';

type ArithmeticCase = {
  inputA: number;
  inputB: number;
  label: string;
  operations?: ArithmeticOperationName[];
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

type Fp64u32SubtractCase = {
  label: string;
  inputA: number;
  inputB: number;
  expectedBits?: number;
};

type IntegerPrimitiveCase = {
  label: string;
  inputA: number;
  inputB: number;
};

const ARITHMETIC_CASES: ArithmeticCase[] = [
  {label: 'decimal pair', inputA: 0.1, inputB: 0.1},
  {label: 'mixed magnitude pair', inputA: 3.0e-19, inputB: 3.3e13},
  {label: 'large over medium', inputA: 1.4e9, inputB: 6.3e5},
  {label: 'fraction over tiny', inputA: 0.3, inputB: 3.2e-16},
  {
    label: 'low-limb cancellation',
    inputA: 1 + 2 ** -30,
    inputB: -1,
    operations: ['sum_fp64']
  },
  {
    label: 'signed arithmetic',
    inputA: -2.75,
    inputB: 0.125,
    operations: ['sum_fp64', 'sub_fp64', 'mul_fp64', 'div_fp64']
  },
  {
    label: 'maximum divided by itself',
    inputA: 3.4028234663852886e38,
    inputB: 3.4028234663852886e38,
    operations: ['div_fp64']
  },
  {
    label: 'maximum divided by finite scalar',
    inputA: 3.4028234663852886e38,
    inputB: 25,
    operations: ['div_fp64']
  },
  {
    label: 'negative maximum divided by maximum',
    inputA: -3.4028234663852886e38,
    inputB: 3.4028234663852886e38,
    operations: ['div_fp64']
  },
  {
    label: 'minimum normal divided by itself',
    inputA: 2 ** -126,
    inputB: 2 ** -126,
    operations: ['div_fp64']
  },
  {
    label: 'minimum normal operands with one-third quotient',
    inputA: 2 ** -126,
    inputB: 3 * 2 ** -126,
    operations: ['div_fp64']
  },
  {
    label: 'subnormal operands with normal quotient',
    inputA: 2 ** -149,
    inputB: 3 * 2 ** -149,
    operations: ['div_fp64']
  },
  {
    label: 'maximum square root',
    inputA: 3.4028234663852886e38,
    inputB: 1,
    operations: ['sqrt_fp64']
  },
  {
    label: 'minimum normal square root',
    inputA: 2 ** -126,
    inputB: 1,
    operations: ['sqrt_fp64']
  },
  {
    label: 'small normal square root with residual',
    inputA: 3 * 2 ** -126,
    inputB: 1,
    operations: ['sqrt_fp64']
  },
  {
    label: 'minimum subnormal square root',
    inputA: 2 ** -149,
    inputB: 1,
    operations: ['sqrt_fp64']
  }
];

const ARITHMETIC_OPERATIONS: ArithmeticOperation[] = [
  {name: 'sum_fp64', operation: (inputA, inputB) => inputA + inputB},
  {name: 'sub_fp64', operation: (inputA, inputB) => inputA - inputB},
  {name: 'mul_fp64', operation: (inputA, inputB) => inputA * inputB},
  {name: 'div_fp64', operation: (inputA, inputB) => inputA / inputB},
  {name: 'sqrt_fp64', operation: inputA => Math.sqrt(inputA)}
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
      {label: 'tiny split', inputA: 3.2e-16, inputB: 0, expectNonZeroLowPart: true},
      {
        label: 'maximum finite split',
        inputA: 3.4028234663852886e38,
        inputB: 0,
        expectNonZeroLowPart: true
      }
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
      {label: 'decimal difference', inputA: 0.3, inputB: 0.2},
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
    name: 'twoSqr',
    expression: 'twoSqr(inputA.x)',
    operation: inputA => inputA * inputA,
    cases: [
      {label: 'decimal square', inputA: 0.1, inputB: 0, expectNonZeroLowPart: true},
      {
        label: 'seahorse square',
        inputA: -0.743643887037151,
        inputB: 0,
        expectNonZeroLowPart: true
      },
      {label: 'near-one square', inputA: 1 + 2 ** -23, inputB: 0, expectNonZeroLowPart: true}
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

const FP64U32_SUBTRACT_CASES: Fp64u32SubtractCase[] = [
  {label: 'f32 integer cancellation', inputA: 16777217, inputB: 16777216},
  {label: 'f64 integer cancellation', inputA: 2 ** 53, inputB: 2 ** 53 - 1},
  {label: 'half ulp around one', inputA: 1 + 2 ** -24, inputB: 1},
  {label: 'negative cancellation', inputA: 1, inputB: 16777217},
  {label: 'minimum f32 subnormal', inputA: 2 ** -149, inputB: 0},
  {label: 'subnormal tie to zero', inputA: 2 ** -150, inputB: 0},
  {label: 'subnormal tie to even', inputA: 3 * 2 ** -150, inputB: 0},
  {label: 'largest f32 subnormal', inputA: 2 ** -126, inputB: 2 ** -149},
  {label: 'normal subnormal boundary tie', inputA: 2 ** -126, inputB: 2 ** -150},
  {
    label: 'single-round exact delta avoids binary64 double rounding',
    inputA: 1 + 2 ** -24,
    inputB: -(2 ** -77),
    expectedBits: 0x3f800001
  },
  {label: 'tiny negative underflow', inputA: 0, inputB: Number.MIN_VALUE},
  {label: 'finite positive overflow', inputA: Number.MAX_VALUE, inputB: -Number.MAX_VALUE},
  {label: 'finite negative overflow', inputA: -Number.MAX_VALUE, inputB: Number.MAX_VALUE},
  {label: 'same-sign addition path', inputA: 1.5, inputB: -2.25},
  {label: 'negative zero', inputA: -0, inputB: 0, expectedBits: 0x80000000},
  {label: 'positive zero from signed zeros', inputA: 0, inputB: -0, expectedBits: 0},
  {label: 'positive infinity', inputA: Infinity, inputB: -Infinity},
  {
    label: 'invalid infinity subtraction',
    inputA: Infinity,
    inputB: Infinity,
    expectedBits: 0x7fc00000
  },
  {label: 'nan propagation', inputA: NaN, inputB: 1, expectedBits: 0x7fc00000}
];

const INTEGER_PRIMITIVE_CASES: IntegerPrimitiveCase[] = [
  {label: 'half ulp tie', inputA: 1, inputB: 2 ** -24},
  {label: 'exponent gap 24', inputA: 2 ** 20, inputB: 2 ** -4},
  {label: 'exponent gap 25', inputA: 2 ** 20, inputB: 2 ** -5},
  {label: 'exponent gap 26', inputA: 2 ** 20, inputB: 2 ** -6},
  {label: 'power boundary borrow', inputA: 1, inputB: -(3 * 2 ** -26)},
  {label: 'negative power boundary borrow', inputA: -1, inputB: 3 * 2 ** -26},
  {label: 'cancellation', inputA: 1, inputB: -(1 - 2 ** -23)},
  {label: 'wide exponent gap', inputA: 2 ** 100, inputB: 2 ** -100},
  {label: 'decimal pair', inputA: 0.1, inputB: 0.1},
  {label: 'product carry', inputA: 1 + 2 ** -23, inputB: 1 + 2 ** -23},
  {label: 'negative product', inputA: -0.743643887037151, inputB: 1.0e-8},
  ...makeIntegerPrimitiveCases(64),
  ...makeWideExponentPrimitiveCases(64)
];

test('fp64 WGSL#sub_fp64u32_to_f32', async tapeTest => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    tapeTest.comment('WebGPU unavailable, skipping fp64u32 subtraction diagnostics');
    tapeTest.end();
    return;
  }

  const encodedInputA = new Uint32Array(FP64U32_SUBTRACT_CASES.length * 2);
  const encodedInputB = new Uint32Array(FP64U32_SUBTRACT_CASES.length * 2);
  const expectedBits = new Uint32Array(FP64U32_SUBTRACT_CASES.length);

  for (let index = 0; index < FP64U32_SUBTRACT_CASES.length; index++) {
    const fp64u32SubtractCase = FP64U32_SUBTRACT_CASES[index];
    const inputA = getFloat64Words(fp64u32SubtractCase.inputA);
    const inputB = getFloat64Words(fp64u32SubtractCase.inputB);
    encodedInputA[index * 2] = inputA[0];
    encodedInputA[index * 2 + 1] = inputA[1];
    encodedInputB[index * 2] = inputB[0];
    encodedInputB[index * 2 + 1] = inputB[1];
    expectedBits[index] =
      fp64u32SubtractCase.expectedBits ??
      getExpectedExactDifferenceF32Bits(fp64u32SubtractCase.inputA, fp64u32SubtractCase.inputB);
  }

  const inputABuffer = webgpuDevice.createBuffer({
    byteLength: encodedInputA.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  inputABuffer.write(encodedInputA);
  const inputBBuffer = webgpuDevice.createBuffer({
    byteLength: encodedInputB.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  inputBBuffer.write(encodedInputB);
  const resultBuffer = webgpuDevice.createBuffer({
    byteLength: expectedBits.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });

  const computation = new Computation(webgpuDevice, {
    source: buildWGSLFp64u32SubtractSource(),
    modules: [fp64arithmetic],
    shaderLayout: {
      bindings: [
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

    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, FP64U32_SUBTRACT_CASES.length);
    computePass.end();
    webgpuDevice.submit();

    const resultBytes = await resultBuffer.readAsync();
    const resultBits = new Uint32Array(
      resultBytes.buffer,
      resultBytes.byteOffset,
      resultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    for (let index = 0; index < FP64U32_SUBTRACT_CASES.length; index++) {
      const fp64u32SubtractCase = FP64U32_SUBTRACT_CASES[index];
      tapeTest.equal(
        resultBits[index],
        expectedBits[index],
        `${fp64u32SubtractCase.label} rounded to expected f32 bits`
      );
      if (resultBits[index] !== expectedBits[index]) {
        tapeTest.comment(
          `  expected=0x${expectedBits[index].toString(16)} result=0x${resultBits[index].toString(16)}`
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

test('fp64 WGSL#sub_fp64u32_to_fp64 preserves binary64 coordinate deltas', async tapeTest => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    tapeTest.comment('WebGPU unavailable, skipping fp64u32 double-single subtraction diagnostics');
    tapeTest.end();
    return;
  }

  const coordinateCases = [
    {inputA: 20_000_000.123456, inputB: 20_000_000, label: 'projected coordinate offset'},
    {inputA: -73.985656000001, inputB: -73.985656, label: 'longitude cancellation'},
    {inputA: 1 + 2 ** -40, inputB: 1, label: 'sub-f32 unit delta'},
    {inputA: -8_000_000, inputB: -7_999_999.999999, label: 'negative projected delta'},
    {inputA: 20_000_000 + 2 ** -28, inputB: 20_000_000, label: 'one ULP GIS delta'},
    {inputA: -20_000_000 - 2 ** -28, inputB: -20_000_000, label: 'negative GIS delta'},
    {inputA: 2 ** 53, inputB: 2 ** 53 - 1, label: 'adjacent maximum-precision integers'},
    {inputA: 1 + 2 ** -24, inputB: -(2 ** -77), label: 'binary64 double-round boundary'},
    {inputA: 1, inputB: 2 ** -100, label: 'wide exponent gap rounds before splitting'},
    {inputA: 1, inputB: 2 ** -40, label: 'sparse representable low limb'},
    {inputA: 1.5, inputB: -2.25, label: 'opposite-sign addition path'},
    {inputA: 3.4028234663852886e38, inputB: 0, label: 'maximum f32 magnitude'},
    {inputA: 2 ** -149, inputB: 0, label: 'minimum f32 subnormal'},
    {inputA: 3 * 2 ** -150, inputB: 0, label: 'subnormal residual zero canonicalization'},
    {inputA: Number.MIN_VALUE, inputB: 0, label: 'below f32 exponent range'},
    {inputA: Number.MAX_VALUE, inputB: 0, label: 'above f32 exponent range'},
    {inputA: Number.MAX_VALUE, inputB: -Number.MAX_VALUE, label: 'binary64 overflow'},
    {inputA: Infinity, inputB: -Infinity, label: 'positive infinity'},
    {inputA: -Infinity, inputB: Infinity, label: 'negative infinity'},
    {inputA: Infinity, inputB: Infinity, label: 'invalid infinity subtraction'},
    {inputA: NaN, inputB: 1, label: 'nan propagation'},
    {inputA: -0, inputB: 0, label: 'zero canonicalization'},
    ...makeRawBinary64SubtractCases(96)
  ];
  const encodedInputA = new Uint32Array(coordinateCases.length * 2);
  const encodedInputB = new Uint32Array(coordinateCases.length * 2);
  const expectedBits = new Uint32Array(coordinateCases.length * 2);

  for (let index = 0; index < coordinateCases.length; index++) {
    const coordinateCase = coordinateCases[index];
    encodedInputA.set(getFloat64Words(coordinateCase.inputA), index * 2);
    encodedInputB.set(getFloat64Words(coordinateCase.inputB), index * 2);
    expectedBits.set(
      getExpectedBinary64DifferenceFp64Bits(coordinateCase.inputA, coordinateCase.inputB),
      index * 2
    );
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
    byteLength: coordinateCases.length * 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const computation = new Computation(webgpuDevice, {
    source: buildWGSLFp64u32DoubleSingleSubtractSource(),
    modules: [fp64arithmetic],
    defines: {LUMA_FP64_INTEGER_ARITHMETIC: true},
    shaderLayout: {
      bindings: [
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
    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, coordinateCases.length);
    computePass.end();
    webgpuDevice.submit();

    const resultBytes = await resultBuffer.readAsync();
    const resultBits = new Uint32Array(
      resultBytes.buffer,
      resultBytes.byteOffset,
      resultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    const signedResults = new Int32Array(
      resultBytes.buffer,
      resultBytes.byteOffset,
      resultBytes.byteLength / Int32Array.BYTES_PER_ELEMENT
    );
    for (let index = 0; index < coordinateCases.length; index++) {
      tapeTest.equal(
        resultBits[index * 4],
        expectedBits[index * 2],
        `${coordinateCases[index].label} high limb is exact`
      );
      tapeTest.equal(
        resultBits[index * 4 + 1],
        expectedBits[index * 2 + 1],
        `${coordinateCases[index].label} low limb is exact`
      );
      const expectedValue =
        bitcastUint32ToFloat32(expectedBits[index * 2]) +
        bitcastUint32ToFloat32(expectedBits[index * 2 + 1]);
      const expectedSign = Number.isNaN(expectedValue)
        ? 0
        : expectedValue > 0
          ? 1
          : expectedValue < 0
            ? -1
            : 0;
      tapeTest.equal(
        signedResults[index * 4 + 2],
        expectedSign,
        `${coordinateCases[index].label} has normalized sign`
      );
      tapeTest.equal(
        signedResults[index * 4 + 3],
        expectedSign,
        `${coordinateCases[index].label} compares against zero`
      );
    }
  } finally {
    computation.destroy();
    inputABuffer.destroy();
    inputBBuffer.destroy();
    resultBuffer.destroy();
  }

  tapeTest.end();
});

test('fp64 WGSL#normalize, classify, sign, and compare double-single values', async tapeTest => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    tapeTest.comment('WebGPU unavailable, skipping fp64 comparison diagnostics');
    tapeTest.end();
    return;
  }

  const nextFloatBelowOne = bitcastUint32ToFloat32(0x3f7fffff);
  const minimumSubnormal = bitcastUint32ToFloat32(0x00000001);
  const largestSubnormal = bitcastUint32ToFloat32(0x007fffff);
  const minimumNormal = bitcastUint32ToFloat32(0x00800000);
  const comparisonCases = [
    {
      inputA: [1, -2],
      inputB: [-0.5, 0],
      normalizedBits: [0xbf800000, 0],
      sign: -1,
      comparison: -1,
      finite: 1,
      nan: 0,
      label: 'overlapping limbs'
    },
    {
      inputA: [1, -(2 ** -24)],
      inputB: [nextFloatBelowOne, 0],
      normalizedBits: [0x3f7fffff, 0],
      sign: 1,
      comparison: 0,
      finite: 1,
      nan: 0,
      label: 'equivalent decompositions'
    },
    {
      inputA: [minimumSubnormal, 0],
      inputB: [0, 0],
      normalizedBits: [0x00000001, 0],
      sign: 1,
      comparison: 1,
      finite: 1,
      nan: 0,
      label: 'minimum subnormal bits'
    },
    {
      inputA: [largestSubnormal, minimumSubnormal],
      inputB: [minimumNormal, 0],
      normalizedBits: [0x00800000, 0],
      sign: 1,
      comparison: 0,
      finite: 1,
      nan: 0,
      label: 'subnormal to normal carry'
    },
    {
      inputA: [minimumNormal, -minimumSubnormal],
      inputB: [largestSubnormal, 0],
      normalizedBits: [0x007fffff, 0],
      sign: 1,
      comparison: 0,
      finite: 1,
      nan: 0,
      label: 'normal to subnormal borrow'
    },
    ...[
      [0, 0],
      [0, -0],
      [-0, 0],
      [-0, -0]
    ].map((inputA, index) => ({
      inputA,
      inputB: [0, 0],
      normalizedBits: [0, 0],
      sign: 0,
      comparison: 0,
      finite: 1,
      nan: 0,
      label: `signed zero pair ${index}`
    })),
    {
      inputA: [1, 2 ** -30],
      inputB: [1, 2 ** -31],
      normalizedBits: [0x3f800000, getFloat32Bits(2 ** -30)],
      sign: 1,
      comparison: 1,
      finite: 1,
      nan: 0,
      label: 'positive low-limb ordering'
    },
    {
      inputA: [-1, -(2 ** -30)],
      inputB: [-1, -(2 ** -31)],
      normalizedBits: [0xbf800000, getFloat32Bits(-(2 ** -30))],
      sign: -1,
      comparison: -1,
      finite: 1,
      nan: 0,
      label: 'negative low-limb ordering'
    },
    {
      inputA: [NaN, 0],
      inputB: [0, 0],
      normalizedBits: [0x7fc00000, 0],
      sign: 0,
      comparison: 0,
      finite: 0,
      nan: 1,
      label: 'unordered high nan'
    },
    {
      inputA: [1, NaN],
      inputB: [0, 0],
      normalizedBits: [0x7fc00000, 0],
      sign: 0,
      comparison: 0,
      finite: 0,
      nan: 1,
      label: 'unordered low nan'
    },
    {
      inputA: [Infinity, -Infinity],
      inputB: [0, 0],
      normalizedBits: [0x7fc00000, 0],
      sign: 0,
      comparison: 0,
      finite: 0,
      nan: 1,
      label: 'opposite infinities normalize to nan'
    },
    {
      inputA: [Infinity, 0],
      inputB: [3.4028234663852886e38, 0],
      normalizedBits: [0x7f800000, 0],
      sign: 1,
      comparison: 1,
      finite: 0,
      nan: 0,
      label: 'positive infinity'
    }
  ];
  const encodedInputs = new Uint32Array(comparisonCases.length * 4);
  for (let index = 0; index < comparisonCases.length; index++) {
    const comparisonCase = comparisonCases[index];
    encodedInputs.set(
      [
        getFloat32Bits(comparisonCase.inputA[0]),
        getFloat32Bits(comparisonCase.inputA[1]),
        getFloat32Bits(comparisonCase.inputB[0]),
        getFloat32Bits(comparisonCase.inputB[1])
      ],
      index * 4
    );
  }

  const inputBuffer = webgpuDevice.createBuffer({
    data: encodedInputs,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  try {
    for (const arithmeticMode of [
      {label: 'default arithmetic', defines: {}},
      {label: 'integer arithmetic', defines: {LUMA_FP64_INTEGER_ARITHMETIC: true}}
    ]) {
      const resultBuffer = webgpuDevice.createBuffer({
        byteLength: comparisonCases.length * 32,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      });
      const computation = new Computation(webgpuDevice, {
        source: buildWGSLFp64ComparisonSource(),
        modules: [fp64arithmetic],
        defines: arithmeticMode.defines,
        shaderLayout: {
          bindings: [
            {name: 'inputData', type: 'storage', group: 0, location: 1},
            {name: 'resultData', type: 'storage', group: 0, location: 2}
          ]
        }
      });
      try {
        computation.setBindings({inputData: inputBuffer, resultData: resultBuffer});
        const computePass = webgpuDevice.beginComputePass({});
        computation.dispatch(computePass, comparisonCases.length);
        computePass.end();
        webgpuDevice.submit();

        const resultBytes = await resultBuffer.readAsync();
        const resultBits = new Uint32Array(
          resultBytes.buffer,
          resultBytes.byteOffset,
          resultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
        );
        const signedResults = new Int32Array(
          resultBytes.buffer,
          resultBytes.byteOffset,
          resultBytes.byteLength / Int32Array.BYTES_PER_ELEMENT
        );
        for (let index = 0; index < comparisonCases.length; index++) {
          const comparisonCase = comparisonCases[index];
          const resultOffset = index * 8;
          tapeTest.equal(
            resultBits[resultOffset],
            comparisonCase.normalizedBits[0],
            `${arithmeticMode.label} ${comparisonCase.label} normalized high limb`
          );
          tapeTest.equal(
            resultBits[resultOffset + 1],
            comparisonCase.normalizedBits[1],
            `${arithmeticMode.label} ${comparisonCase.label} normalized low limb`
          );
          tapeTest.equal(
            signedResults[resultOffset + 2],
            comparisonCase.sign,
            `${arithmeticMode.label} ${comparisonCase.label} sign`
          );
          tapeTest.equal(
            signedResults[resultOffset + 3],
            comparisonCase.comparison,
            `${arithmeticMode.label} ${comparisonCase.label} comparison`
          );
          tapeTest.equal(
            resultBits[resultOffset + 4],
            comparisonCase.finite,
            `${arithmeticMode.label} ${comparisonCase.label} finite classification`
          );
          tapeTest.equal(
            resultBits[resultOffset + 5],
            comparisonCase.nan,
            `${arithmeticMode.label} ${comparisonCase.label} nan classification`
          );
        }
      } finally {
        computation.destroy();
        resultBuffer.destroy();
      }
    }
  } finally {
    inputBuffer.destroy();
  }

  tapeTest.end();
});

test('fp64 WGSL#integer twoSum and twoProd preserve exact residual bits', async tapeTest => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    tapeTest.comment('WebGPU unavailable, skipping fp64 WGSL integer primitive tests');
    tapeTest.end();
    return;
  }

  const encodedInputs = new Uint32Array(INTEGER_PRIMITIVE_CASES.length * 2);
  const expectedResults = new Uint32Array(INTEGER_PRIMITIVE_CASES.length * 4);
  for (let index = 0; index < INTEGER_PRIMITIVE_CASES.length; index++) {
    const primitiveCase = INTEGER_PRIMITIVE_CASES[index];
    const inputA = Math.fround(primitiveCase.inputA);
    const inputB = Math.fround(primitiveCase.inputB);
    encodedInputs[index * 2] = getFloat32Bits(inputA);
    encodedInputs[index * 2 + 1] = getFloat32Bits(inputB);

    const [sumHighBits, sumLowBits] = getExpectedTwoSumBits(inputA, inputB);
    const exactProduct = inputA * inputB;
    const productHigh = Math.fround(exactProduct);
    const productLow = Math.fround(exactProduct - productHigh);
    expectedResults.set(
      [sumHighBits, sumLowBits, getFloat32Bits(productHigh), getFloat32Bits(productLow)],
      index * 4
    );
  }

  const inputBuffer = webgpuDevice.createBuffer({
    data: encodedInputs,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const resultBuffer = webgpuDevice.createBuffer({
    byteLength: expectedResults.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const computation = new Computation(webgpuDevice, {
    source: buildWGSLIntegerPrimitiveSource(),
    modules: [fp64arithmetic],
    defines: getFp64IntegerTestDefines(webgpuDevice.info.gpu),
    shaderLayout: {
      bindings: [
        {name: 'inputData', type: 'storage', group: 0, location: 1},
        {name: 'resultData', type: 'storage', group: 0, location: 2}
      ]
    }
  });

  try {
    const compilationMessages = await (
      computation.shader as typeof computation.shader & {
        getCompilationInfo: () => Promise<readonly {message: string; type: string}[]>;
      }
    ).getCompilationInfo();
    for (const message of compilationMessages.filter(message => message.type === 'error')) {
      tapeTest.comment(`WGSL compilation error: ${message.message}`);
    }
    tapeTest.equal(
      compilationMessages.filter(message => message.type === 'error').length,
      0,
      'integer fp64 WGSL compiles without errors'
    );

    computation.setBindings({inputData: inputBuffer, resultData: resultBuffer});
    computation.updateShaderInputs();

    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, INTEGER_PRIMITIVE_CASES.length);
    computePass.end();
    webgpuDevice.submit();

    const resultBytes = await resultBuffer.readAsync();
    const resultBits = new Uint32Array(
      resultBytes.buffer,
      resultBytes.byteOffset,
      resultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    for (let index = 0; index < INTEGER_PRIMITIVE_CASES.length; index++) {
      const label = INTEGER_PRIMITIVE_CASES[index].label;
      for (let component = 0; component < 4; component++) {
        const resultIndex = index * 4 + component;
        tapeTest.equal(
          resultBits[resultIndex],
          expectedResults[resultIndex],
          `${label} ${['sum high', 'sum low', 'product high', 'product low'][component]} bits`
        );
      }
    }
  } finally {
    computation.destroy();
    inputBuffer.destroy();
    resultBuffer.destroy();
  }

  tapeTest.end();
});

test('fp64 WGSL#integer division and square root preserve subnormal limbs', async tapeTest => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    tapeTest.comment('WebGPU unavailable, skipping fp64 WGSL subnormal limb tests');
    tapeTest.end();
    return;
  }
  if (isSoftwareBackedDevice(webgpuDevice)) {
    tapeTest.comment('Skipping slow fp64 integer division and square root on software WebGPU');
    tapeTest.end();
    return;
  }

  const expectedBits = new Uint32Array([0x00000001, 0x80000001, 0x00000000, 0x00000001]);
  const resultBuffer = webgpuDevice.createBuffer({
    byteLength: expectedBits.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const computation = new Computation(webgpuDevice, {
    source: buildWGSLIntegerSubnormalSource(),
    modules: [fp64arithmetic],
    defines: getFp64IntegerTestDefines(webgpuDevice.info.gpu),
    shaderLayout: {
      bindings: [{name: 'resultData', type: 'storage', group: 0, location: 1}]
    }
  });

  try {
    computation.setBindings({resultData: resultBuffer});
    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, 1);
    computePass.end();
    webgpuDevice.submit();

    const resultBytes = await resultBuffer.readAsync();
    const resultBits = new Uint32Array(
      resultBytes.buffer,
      resultBytes.byteOffset,
      resultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    const labels = [
      'minimum subnormal quotient',
      'negative minimum subnormal quotient',
      'half-minimum tie to even',
      'square-root subnormal correction'
    ];
    for (let index = 0; index < expectedBits.length; index++) {
      tapeTest.equal(resultBits[index], expectedBits[index], `${labels[index]} bits`);
    }
  } finally {
    computation.destroy();
    resultBuffer.destroy();
  }

  tapeTest.end();
});

for (const arithmeticOperation of ARITHMETIC_OPERATIONS) {
  test(`fp64 WGSL#${arithmeticOperation.name}`, async tapeTest => {
    const webgpuDevice = await getWebGPUTestDevice();
    if (!webgpuDevice) {
      tapeTest.comment('WebGPU unavailable, skipping fp64 WGSL arithmetic tests');
      tapeTest.end();
      return;
    }
    if (isSoftwareBackedDevice(webgpuDevice)) {
      tapeTest.comment('Skipping slow fp64 integer arithmetic on software WebGPU');
      tapeTest.end();
      return;
    }

    const arithmeticCases = ARITHMETIC_CASES.filter(
      arithmeticCase =>
        !arithmeticCase.operations || arithmeticCase.operations.includes(arithmeticOperation.name)
    );
    const encodedInputA = new Float32Array(arithmeticCases.length * 2);
    const encodedInputB = new Float32Array(arithmeticCases.length * 2);

    for (let index = 0; index < arithmeticCases.length; index++) {
      const float64Index = index * 2;
      fp64ify(arithmeticCases[index].inputA, encodedInputA, float64Index);
      fp64ify(arithmeticCases[index].inputB, encodedInputB, float64Index);
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
      defines: getFp64IntegerTestDefines(webgpuDevice.info.gpu),
      shaderInputs,
      shaderLayout: {
        bindings: [
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
      computation.dispatch(computePass, arithmeticCases.length);
      computePass.end();
      webgpuDevice.submit();

      const resultBytes = await resultBuffer.readAsync();
      const resultData = new Float32Array(
        resultBytes.buffer,
        resultBytes.byteOffset,
        resultBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
      );
      for (let index = 0; index < arithmeticCases.length; index++) {
        const arithmeticCase = arithmeticCases[index];
        const expectedValue = arithmeticOperation.operation(
          arithmeticCase.inputA,
          arithmeticCase.inputB
        );
        const resultHigh = resultData[index * 2];
        const resultLow = resultData[index * 2 + 1];
        const result64 = resultHigh + resultLow;
        const absoluteError = Math.abs(expectedValue - result64);
        const relativeError =
          expectedValue === 0 ? absoluteError : absoluteError / Math.abs(expectedValue);
        const withinTolerance = expectedValue === 0 ? absoluteError === 0 : relativeError <= 1e-11;

        tapeTest.ok(
          Number.isFinite(resultHigh) && Number.isFinite(resultLow),
          `${arithmeticOperation.name} ${arithmeticCase.label} has finite limbs`
        );
        tapeTest.ok(
          withinTolerance,
          `${arithmeticOperation.name} ${arithmeticCase.label} within tolerance ` +
            `(expected=${expectedValue}, result=${result64}, relativeError=${relativeError})`
        );
        if (!withinTolerance) {
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
    const webgpuDevice = await getWebGPUTestDevice();
    if (!webgpuDevice) {
      tapeTest.comment('WebGPU unavailable, skipping fp64 WGSL helper tests');
      tapeTest.end();
      return;
    }
    if (isSoftwareBackedDevice(webgpuDevice)) {
      tapeTest.comment('Skipping slow fp64 integer helpers on software WebGPU');
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
      defines: getFp64IntegerTestDefines(webgpuDevice.info.gpu),
      shaderInputs,
      shaderLayout: {
        bindings: [
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

      const resultBytes = await resultBuffer.readAsync();
      const resultData = new Float32Array(
        resultBytes.buffer,
        resultBytes.byteOffset,
        resultBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
      );
      for (let index = 0; index < helperOperation.cases.length; index++) {
        const helperCase = helperOperation.cases[index];
        const expectedValue = helperOperation.operation(
          Math.fround(helperCase.inputA),
          Math.fround(helperCase.inputB)
        );
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
  const expression =
    operationName === 'sqrt_fp64' ? `${operationName}(inputA)` : `${operationName}(inputA, inputB)`;
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

function buildWGSLIntegerPrimitiveSource(): string {
  return `\
@group(0) @binding(1) var<storage, read> inputData: array<vec2u>;
@group(0) @binding(2) var<storage, read_write> resultData: array<vec4u>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  let inputs = inputData[index];
  let sum = fp64_two_sum_integer_bits(inputs.x, inputs.y);
  let product = fp64_two_prod_integer_bits(inputs.x, inputs.y);
  resultData[index] = vec4u(sum.x, sum.y, product.x, product.y);
}
`;
}

function buildWGSLIntegerSubnormalSource(): string {
  return `\
@group(0) @binding(1) var<storage, read_write> resultData: array<vec4u>;

@compute @workgroup_size(1)
fn main() {
  let minimumNormal = bitcast<f32>(0x00800000u);
  let negativeMinimumNormal = bitcast<f32>(0x80800000u);
  let divisor23 = bitcast<f32>(0x4b000000u);
  let divisor24 = bitcast<f32>(0x4b800000u);
  let squareRoot = sqrt_fp64(vec2f(1.0, bitcast<f32>(0x00000002u)));
  resultData[0] = vec4u(
    bitcast<u32>(fp64_divide_f32_integer(minimumNormal, divisor23)),
    bitcast<u32>(fp64_divide_f32_integer(negativeMinimumNormal, divisor23)),
    bitcast<u32>(fp64_divide_f32_integer(minimumNormal, divisor24)),
    bitcast<u32>(squareRoot.y)
  );
}
`;
}

function buildWGSLFp64u32SubtractSource(): string {
  return `\
@group(0) @binding(1) var<storage, read> inputAData: array<vec2u>;
@group(0) @binding(2) var<storage, read> inputBData: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> resultData: array<u32>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  resultData[index] = sub_fp64u32_to_f32_bits(inputAData[index], inputBData[index]);
}
`;
}

function buildWGSLFp64u32DoubleSingleSubtractSource(): string {
  return `\
@group(0) @binding(1) var<storage, read> inputAData: array<vec2u>;
@group(0) @binding(2) var<storage, read> inputBData: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> resultData: array<vec4u>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  let difference = sub_fp64u32_to_fp64(inputAData[index], inputBData[index]);
  resultData[index] = vec4u(
    bitcast<u32>(difference.x),
    bitcast<u32>(difference.y),
    bitcast<u32>(sign_fp64(difference)),
    bitcast<u32>(compare_fp64(difference, vec2f(0.0)))
  );
}
`;
}

function buildWGSLFp64ComparisonSource(): string {
  return `\
@group(0) @binding(1) var<storage, read> inputData: array<vec4u>;
@group(0) @binding(2) var<storage, read_write> resultData: array<vec4u>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  let input = inputData[index];
  let valueA = vec2f(bitcast<f32>(input.x), bitcast<f32>(input.y));
  let valueB = vec2f(bitcast<f32>(input.z), bitcast<f32>(input.w));
  let normalized = normalize_fp64(valueA);
  resultData[index * 2u] = vec4u(
    bitcast<u32>(normalized.x),
    bitcast<u32>(normalized.y),
    bitcast<u32>(sign_fp64(valueA)),
    bitcast<u32>(compare_fp64(valueA, valueB))
  );
  resultData[index * 2u + 1u] = vec4u(
    select(0u, 1u, is_finite_fp64(valueA)),
    select(0u, 1u, is_nan_fp64(valueA)),
    0u,
    0u
  );
}
`;
}

function getFloat64Words(value: number): [number, number] {
  const dataView = new DataView(new ArrayBuffer(8));
  dataView.setFloat64(0, value, false);
  return [dataView.getUint32(0, false), dataView.getUint32(4, false)];
}

function getFloat32Bits(value: number): number {
  const dataView = new DataView(new ArrayBuffer(4));
  dataView.setFloat32(0, value, false);
  return dataView.getUint32(0, false);
}

function bitcastUint32ToFloat32(value: number): number {
  const dataView = new DataView(new ArrayBuffer(4));
  dataView.setUint32(0, value, false);
  return dataView.getFloat32(0, false);
}

type ExactBinary = {
  coefficient: bigint;
  exponent: number;
};

function getExpectedExactDifferenceF32Bits(inputA: number, inputB: number): number {
  const specialDifference = inputA - inputB;
  if (Number.isNaN(specialDifference)) {
    return 0x7fc00000;
  }
  if (!Number.isFinite(specialDifference)) {
    return getFloat32Bits(specialDifference);
  }

  const difference = subtractExactBinary(decodeFiniteFloat64(inputA), decodeFiniteFloat64(inputB));
  if (difference.coefficient === 0n) {
    return Object.is(inputA, -0) && Object.is(inputB, 0) ? 0x80000000 : 0;
  }
  return Number(roundExactBinaryToFormat(difference, 23, 8, 127));
}

function getExpectedBinary64DifferenceFp64Bits(inputA: number, inputB: number): [number, number] {
  const specialDifference = inputA - inputB;
  if (Number.isNaN(specialDifference)) {
    return [0x7fc00000, 0];
  }
  if (!Number.isFinite(specialDifference)) {
    return [getFloat32Bits(specialDifference), 0];
  }

  const exactDifference = subtractExactBinary(
    decodeFiniteFloat64(inputA),
    decodeFiniteFloat64(inputB)
  );
  if (exactDifference.coefficient === 0n) {
    return [0, 0];
  }

  const roundedBinary64Bits = roundExactBinaryToFormat(exactDifference, 52, 11, 1023);
  const roundedDifference = decodeFiniteBinary64Bits(roundedBinary64Bits);
  const highBits = Number(roundExactBinaryToFormat(roundedDifference, 23, 8, 127));
  const highMagnitude = highBits & 0x7fffffff;
  if (highMagnitude === 0 || highMagnitude >= 0x7f800000) {
    return [highMagnitude === 0 ? 0 : highBits, 0];
  }

  const residual = subtractExactBinary(roundedDifference, decodeFiniteFloat32Bits(highBits));
  const lowBits = Number(roundExactBinaryToFormat(residual, 23, 8, 127));
  return [highBits, lowBits & 0x7fffffff ? lowBits : 0];
}

function decodeFiniteFloat64(value: number): ExactBinary {
  const [highWord, lowWord] = getFloat64Words(value);
  return decodeFiniteBinary64Bits((BigInt(highWord) << 32n) | BigInt(lowWord));
}

function decodeFiniteBinary64Bits(bits: bigint): ExactBinary {
  const sign = bits >> 63n;
  const exponentBits = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & 0xfffffffffffffn;
  const coefficient = exponentBits === 0 ? fraction : (1n << 52n) | fraction;
  return {
    coefficient: sign === 0n ? coefficient : -coefficient,
    exponent: exponentBits === 0 ? -1074 : exponentBits - 1075
  };
}

function decodeFiniteFloat32Bits(bits: number): ExactBinary {
  const sign = bits >>> 31;
  const exponentBits = (bits >>> 23) & 0xff;
  const fraction = bits & 0x7fffff;
  const coefficient = BigInt(exponentBits === 0 ? fraction : 0x800000 | fraction);
  return {
    coefficient: sign === 0 ? coefficient : -coefficient,
    exponent: exponentBits === 0 ? -149 : exponentBits - 150
  };
}

function subtractExactBinary(inputA: ExactBinary, inputB: ExactBinary): ExactBinary {
  const exponent = Math.min(inputA.exponent, inputB.exponent);
  return {
    coefficient:
      (inputA.coefficient << BigInt(inputA.exponent - exponent)) -
      (inputB.coefficient << BigInt(inputB.exponent - exponent)),
    exponent
  };
}

function roundExactBinaryToFormat(
  value: ExactBinary,
  fractionBits: number,
  exponentBits: number,
  exponentBias: number
): bigint {
  const sign = value.coefficient < 0n ? 1n : 0n;
  const magnitude = value.coefficient < 0n ? -value.coefficient : value.coefficient;
  const signShift = BigInt(fractionBits + exponentBits);
  if (magnitude === 0n) {
    return sign << signShift;
  }

  const mostSignificantBit = magnitude.toString(2).length - 1;
  let exponent = value.exponent + mostSignificantBit;
  const maximumExponent = exponentBias;
  const minimumNormalExponent = 1 - exponentBias;
  const infinityExponent = (1n << BigInt(exponentBits)) - 1n;
  if (exponent > maximumExponent) {
    return (sign << signShift) | (infinityExponent << BigInt(fractionBits));
  }

  if (exponent >= minimumNormalExponent) {
    let significand = roundBigIntRightToEven(magnitude, mostSignificantBit - fractionBits);
    if (significand >= 1n << BigInt(fractionBits + 1)) {
      significand >>= 1n;
      exponent++;
      if (exponent > maximumExponent) {
        return (sign << signShift) | (infinityExponent << BigInt(fractionBits));
      }
    }
    const encodedExponent = BigInt(exponent + exponentBias);
    const fractionMask = (1n << BigInt(fractionBits)) - 1n;
    return (
      (sign << signShift) | (encodedExponent << BigInt(fractionBits)) | (significand & fractionMask)
    );
  }

  const minimumSubnormalExponent = minimumNormalExponent - fractionBits;
  const mantissa = roundBigIntRightToEven(magnitude, minimumSubnormalExponent - value.exponent);
  if (mantissa >= 1n << BigInt(fractionBits)) {
    return (sign << signShift) | (1n << BigInt(fractionBits));
  }
  return (sign << signShift) | mantissa;
}

function roundBigIntRightToEven(value: bigint, shift: number): bigint {
  if (shift <= 0) {
    return value << BigInt(-shift);
  }
  const bigintShift = BigInt(shift);
  const truncated = value >> bigintShift;
  const remainder = value - (truncated << bigintShift);
  const halfway = 1n << BigInt(shift - 1);
  return remainder > halfway || (remainder === halfway && (truncated & 1n) === 1n)
    ? truncated + 1n
    : truncated;
}

function makeRawBinary64SubtractCases(
  count: number
): {inputA: number; inputB: number; label: string}[] {
  const cases: {inputA: number; inputB: number; label: string}[] = [];
  let state = 0x91e10da5;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };

  for (let index = 0; index < count; index++) {
    const exponentA = 880 + (next() % 287);
    const highWordA = ((next() & 1) << 31) | (exponentA << 20) | (next() & 0xfffff);
    const lowWordA = next();
    const exponentB = index % 3 === 0 ? exponentA : 880 + (next() % 287);
    const highWordB =
      (index % 3 === 0 ? highWordA & 0x80000000 : (next() & 1) << 31) |
      (exponentB << 20) |
      (next() & 0xfffff);
    const lowWordB = next();
    cases.push({
      inputA: getFloat64FromWords(highWordA >>> 0, lowWordA),
      inputB: getFloat64FromWords(highWordB >>> 0, lowWordB),
      label: `deterministic full-mantissa raw case ${index}`
    });
  }
  return cases;
}

function getFloat64FromWords(highWord: number, lowWord: number): number {
  const dataView = new DataView(new ArrayBuffer(8));
  dataView.setUint32(0, highWord, false);
  dataView.setUint32(4, lowWord, false);
  return dataView.getFloat64(0, false);
}

function getExpectedTwoSumBits(inputA: number, inputB: number): [number, number] {
  const inputABits = getFloat32Bits(inputA);
  const inputBBits = getFloat32Bits(inputB);
  const exponentA = ((inputABits >>> 23) & 0xff) - 150;
  const exponentB = ((inputBBits >>> 23) & 0xff) - 150;
  if (Math.abs(exponentA - exponentB) > 25) {
    return (inputABits & 0x7fffffff) >= (inputBBits & 0x7fffffff)
      ? [inputABits, inputBBits]
      : [inputBBits, inputABits];
  }

  const exactSum = inputA + inputB;
  const sumHigh = Math.fround(exactSum);
  return [getFloat32Bits(sumHigh), getFloat32Bits(Math.fround(exactSum - sumHigh))];
}

function makeIntegerPrimitiveCases(count: number): IntegerPrimitiveCase[] {
  const cases: IntegerPrimitiveCase[] = [];
  let state = 0x6d2b79f5;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };

  for (let index = 0; index < count; index++) {
    const exponentA = (next() % 61) - 30;
    const exponentB = exponentA + (next() % 49) - 24;
    const significandA = 1 + (next() & 0x7fffff) / 0x800000;
    const significandB = 1 + (next() & 0x7fffff) / 0x800000;
    const signA = (next() & 1) === 0 ? 1 : -1;
    const signB = (next() & 1) === 0 ? 1 : -1;
    cases.push({
      label: `fixed random pair ${index}`,
      inputA: Math.fround(signA * significandA * 2 ** exponentA),
      inputB: Math.fround(signB * significandB * 2 ** exponentB)
    });
  }
  return cases;
}

function makeWideExponentPrimitiveCases(count: number): IntegerPrimitiveCase[] {
  const cases: IntegerPrimitiveCase[] = [];
  let state = 0x9e3779b9;
  const next = (): number => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state;
  };

  while (cases.length < count) {
    const exponentA = (next() % 201) - 100;
    const productExponent = (next() % 61) - 30;
    const exponentB = productExponent - exponentA;
    if (exponentB < -120 || exponentB > 120) {
      continue;
    }
    const significandA = 1 + (next() & 0x7fffff) / 0x800000;
    const significandB = 1 + (next() & 0x7fffff) / 0x800000;
    const signA = (next() & 1) === 0 ? 1 : -1;
    const signB = (next() & 1) === 0 ? 1 : -1;
    cases.push({
      label: `wide exponent pair ${cases.length}`,
      inputA: Math.fround(signA * significandA * 2 ** exponentA),
      inputB: Math.fround(signB * significandB * 2 ** exponentB)
    });
  }
  return cases;
}

function getFp64IntegerTestDefines(gpu: string): Record<string, boolean> {
  // On Apple this deliberately exercises automatic platform selection. Other
  // hardware adapters force the path to keep cross-backend coverage. Software
  // adapters only run the compact integer primitive test above because their
  // shader compiler is prohibitively slow for the high-level function matrix.
  return gpu.toLowerCase() === 'apple' ? {} : {LUMA_FP64_INTEGER_ARITHMETIC: true};
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
