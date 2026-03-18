// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {
  getTransformPlatformInfo,
  runArithmeticCases,
  runHelperDiagnostics,
  ArithmeticOperationName,
  ArithmeticTestCase,
  HelperDiagnosticCase
} from './fp64-test-utils-transform';

type PlatformDiagnosticMap = {
  all?: ArithmeticOperationName[];
  appleMetal?: ArithmeticOperationName[];
  intel?: ArithmeticOperationName[];
};

type ArithmeticCaseDefinition = ArithmeticTestCase & {
  diagnosticOperations?: PlatformDiagnosticMap;
};

type ArithmeticOperationConfig = {
  operationName: ArithmeticOperationName;
  binary: boolean;
  operation: (inputA: number, inputB: number) => number;
};

type HelperOperationConfig = {
  operationName: 'split' | 'quickTwoSum' | 'twoSum' | 'twoSub' | 'twoProd';
  binary: boolean;
  testCases: HelperDiagnosticCase[];
};

const ARITHMETIC_CASES: ArithmeticCaseDefinition[] = [
  {label: 'integer pair', inputA: 2, inputB: 2},
  {
    label: 'small decimal pair',
    inputA: 0.1,
    inputB: 0.1,
    diagnosticOperations: {appleMetal: ['sum_fp64', 'mul_fp64', 'div_fp64']}
  },
  {
    label: 'tiny plus huge',
    inputA: 3.0e-19,
    inputB: 3.3e13,
    diagnosticOperations: {appleMetal: ['sum_fp64', 'sub_fp64']}
  },
  {label: 'subnormal plus medium', inputA: 9.9e-40, inputB: 1.7e3},
  {label: 'tiny pair', inputA: 1.5e-36, inputB: 1.7e-16},
  {label: 'tiny plus integer', inputA: 9.4e-26, inputB: 51},
  {
    label: 'tiny plus unit interval',
    inputA: 6.7e-20,
    inputB: 0.93,
    diagnosticOperations: {appleMetal: ['sum_fp64', 'sub_fp64']}
  },
  {
    label: 'large product overflow candidate',
    inputA: 2.4e3,
    inputB: 5.9e31,
    reason: 'mul_fp64 overflows fp32 representation in the high part',
    diagnosticOperations: {
      all: ['mul_fp64'],
      intel: ['sqrt_fp64'],
      appleMetal: ['sum_fp64', 'sub_fp64']
    }
  },
  {
    label: 'large over medium',
    inputA: 1.4e9,
    inputB: 6.3e5,
    reason: 'historically unstable on Intel and Apple in mul/div paths',
    diagnosticOperations: {
      intel: ['div_fp64', 'sqrt_fp64'],
      appleMetal: ['mul_fp64', 'div_fp64']
    }
  },
  {
    label: 'large over tiny',
    inputA: 3.0e9,
    inputB: 4.3e-23,
    diagnosticOperations: {
      intel: ['div_fp64', 'sqrt_fp64'],
      appleMetal: ['div_fp64']
    }
  },
  {
    label: 'tiny over tinier',
    inputA: 1.7e-19,
    inputB: 2.7e-27,
    diagnosticOperations: {intel: ['div_fp64'], appleMetal: ['div_fp64']}
  },
  {
    label: 'fraction over tiny',
    inputA: 0.3,
    inputB: 3.2e-16,
    diagnosticOperations: {
      intel: ['div_fp64', 'sqrt_fp64'],
      appleMetal: ['div_fp64']
    }
  },
  {
    label: 'very large pair',
    inputA: 4.1e30,
    inputB: 8.2e15,
    reason: 'mul_fp64 overflows fp32 representation in the high part',
    diagnosticOperations: {
      all: ['mul_fp64'],
      intel: ['div_fp64', 'sqrt_fp64'],
      appleMetal: ['div_fp64']
    }
  },
  {
    label: 'large product with sqrt drift',
    inputA: 6.2e3,
    inputB: 6.3e10,
    diagnosticOperations: {
      intel: ['sqrt_fp64'],
      appleMetal: ['sum_fp64', 'mul_fp64', 'sub_fp64']
    }
  },
  {
    label: 'medium over tiny fractional',
    inputA: 2.5e2,
    inputB: 5.1e-21,
    diagnosticOperations: {intel: ['sqrt_fp64'], appleMetal: ['div_fp64']}
  },
  {
    label: 'medium over large integer',
    inputA: 96,
    inputB: 1.7e4,
    diagnosticOperations: {intel: ['sqrt_fp64'], appleMetal: ['div_fp64']}
  },
  {
    label: 'fraction over huge',
    inputA: 0.27,
    inputB: 2.3e16,
    diagnosticOperations: {
      intel: ['sqrt_fp64'],
      appleMetal: ['sum_fp64', 'mul_fp64', 'sub_fp64']
    }
  },
  {
    label: 'integer over tiny decimal',
    inputA: 18,
    inputB: 9.1e-9,
    diagnosticOperations: {intel: ['sqrt_fp64'], appleMetal: ['div_fp64']}
  }
];

const ARITHMETIC_OPERATIONS: ArithmeticOperationConfig[] = [
  {
    operationName: 'sum_fp64',
    binary: true,
    operation: (inputA, inputB) => inputA + inputB
  },
  {
    operationName: 'sub_fp64',
    binary: true,
    operation: (inputA, inputB) => inputA - inputB
  },
  {
    operationName: 'mul_fp64',
    binary: true,
    operation: (inputA, inputB) => inputA * inputB
  },
  {
    operationName: 'div_fp64',
    binary: true,
    operation: (inputA, inputB) => inputA / inputB
  },
  {
    operationName: 'sqrt_fp64',
    binary: false,
    operation: inputA => Math.sqrt(inputA)
  }
];

const HELPER_DIAGNOSTICS: HelperOperationConfig[] = [
  {
    operationName: 'split',
    binary: false,
    testCases: [
      {label: 'simple decimal', inputA: 0.1},
      {label: 'large magnitude', inputA: 3.3e13},
      {label: 'subnormal edge', inputA: 9.9e-40}
    ]
  },
  {
    operationName: 'quickTwoSum',
    binary: true,
    testCases: [
      {label: 'ordered decimal inputs', inputA: 1.0, inputB: 1.0e-7},
      {label: 'large plus tiny', inputA: 3.3e13, inputB: 3.0e-19}
    ]
  },
  {
    operationName: 'twoSum',
    binary: true,
    testCases: [
      {label: 'decimal pair', inputA: 0.1, inputB: 0.1},
      {label: 'mixed magnitude pair', inputA: 6.7e-20, inputB: 0.93}
    ]
  },
  {
    operationName: 'twoSub',
    binary: true,
    testCases: [
      {label: 'decimal difference', inputA: 0.1, inputB: 0.1},
      {label: 'mixed magnitude subtraction', inputA: 3.3e13, inputB: 3.0e-19}
    ]
  },
  {
    operationName: 'twoProd',
    binary: true,
    testCases: [
      {
        label: 'decimal product',
        inputA: 0.1,
        inputB: 0.1,
        reason: 'targets Apple precision collapse observed in mul_fp64'
      },
      {
        label: 'large by medium',
        inputA: 2.4e3,
        inputB: 5.9e5,
        reason: 'checks code-elimination and split normalization in twoProd'
      }
    ]
  }
];

function splitCasesForOperation(
  operationName: ArithmeticOperationName,
  platformInfo: ReturnType<typeof getTransformPlatformInfo>
): {mustPassCases: ArithmeticTestCase[]; diagnosticCases: ArithmeticTestCase[]} {
  const mustPassCases: ArithmeticTestCase[] = [];
  const diagnosticCases: ArithmeticTestCase[] = [];

  for (const arithmeticCase of ARITHMETIC_CASES) {
    const isDiagnostic = Boolean(
      arithmeticCase.diagnosticOperations?.all?.includes(operationName) ||
        (platformInfo.isAppleMetal &&
          arithmeticCase.diagnosticOperations?.appleMetal?.includes(operationName)) ||
        (platformInfo.isIntel &&
          arithmeticCase.diagnosticOperations?.intel?.includes(operationName))
    );

    const testCase = {
      label: arithmeticCase.label,
      inputA: arithmeticCase.inputA,
      inputB: arithmeticCase.inputB,
      reason: arithmeticCase.reason
    };
    if (isDiagnostic) {
      diagnosticCases.push(testCase);
    } else {
      mustPassCases.push(testCase);
    }
  }

  return {mustPassCases, diagnosticCases};
}

for (const arithmeticOperation of ARITHMETIC_OPERATIONS) {
  test(`fp64#${arithmeticOperation.operationName}`, async tapeTest => {
    const webGLDevice = await getWebGLTestDevice();
    const platformInfo = getTransformPlatformInfo(webGLDevice);
    const {mustPassCases, diagnosticCases} = splitCasesForOperation(
      arithmeticOperation.operationName,
      platformInfo
    );

    tapeTest.comment(`Platform ${platformInfo.label}`);

    await runArithmeticCases(webGLDevice, {
      ...arithmeticOperation,
      testCases: mustPassCases,
      tapeTest,
      caseKind: 'must-pass'
    });

    await runArithmeticCases(webGLDevice, {
      ...arithmeticOperation,
      testCases: diagnosticCases,
      tapeTest,
      caseKind: 'diagnostic',
      includeScalarOutputs: true
    });

    tapeTest.end();
  });
}

for (const helperOperation of HELPER_DIAGNOSTICS) {
  test(`fp64#${helperOperation.operationName} diagnostic`, async tapeTest => {
    const webGLDevice = await getWebGLTestDevice();
    const platformInfo = getTransformPlatformInfo(webGLDevice);
    tapeTest.comment(`Platform ${platformInfo.label}`);

    await runHelperDiagnostics(webGLDevice, {
      ...helperOperation,
      tapeTest
    });

    tapeTest.end();
  });
}
