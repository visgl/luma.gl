// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cleanEvaluate, GPUTableEvaluator, sequence} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#sequence#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const TEST_CASES: {title: string; table: GPUTableEvaluator; expected: TestData}[] = [
      {
        title: 'count form',
        table: sequence(5),
        expected: {value: [0, 1, 2, 3, 4], type: 'sint32', size: 1}
      },
      {
        title: 'count start step form',
        table: sequence(3, 2, 3),
        expected: {value: [2, 5, 8], type: 'sint32', size: 1}
      },
      {
        title: 'descending step form',
        table: sequence(4, 7, -2),
        expected: {value: [7, 5, 3, 1], type: 'sint32', size: 1}
      }
    ];

    for (const testCase of TEST_CASES) {
      await cleanEvaluate(device, testCase);
      await testCase.table.readValue();
      expect(verifyTableValue(testCase.table, testCase.expected), testCase.title).toBe(null);
      testCase.table.destroy();
    }
  });
}
