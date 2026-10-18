// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GPUClockCorrelator} from '../../../../src/webgpu/adapter/helpers/gpu-clock-correlator';

test('bounds CPU/GPU offset, tightens recent samples, and expires old estimates', () => {
  const correlator = new GPUClockCorrelator();
  expect(correlator.correlate(100, 110, 1000, 1004)).toMatchObject({
    offsetMilliseconds: -897,
    uncertaintyMilliseconds: 3
  });
  expect(correlator.correlate(120, 124, 1019, 1021)).toMatchObject({
    offsetMilliseconds: -898,
    uncertaintyMilliseconds: 1
  });
  expect(correlator.correlate(1200, 1210, 2100, 2104)).toMatchObject({
    offsetMilliseconds: -897,
    uncertaintyMilliseconds: 3
  });
});

test('rejects impossible samples and resets inconsistent clock intervals', () => {
  const correlator = new GPUClockCorrelator();
  expect(correlator.correlate(10, 11, 100, 105)).toBeUndefined();
  expect(correlator.correlate(NaN, 11, 100, 105)).toBeUndefined();
  correlator.correlate(100, 110, 1000, 1004);
  expect(correlator.correlate(120, 124, 2000, 2002)).toMatchObject({
    offsetMilliseconds: -1879,
    uncertaintyMilliseconds: 1
  });
  // An older readback must not reset the newer clock estimate.
  correlator.correlate(100, 110, 1000, 1004);
  expect(correlator.correlate(130, 140, 2010, 2014)).toMatchObject({
    offsetMilliseconds: -1879,
    uncertaintyMilliseconds: 1
  });
});
