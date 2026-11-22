// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GPUCommandGraphSubmissionPacer} from '@luma.gl/graph/gpu-core';

test('waits for completion and adapts cooldown from observed queue time', async () => {
  let time = 0;
  const pacer = new GPUCommandGraphSubmissionPacer({
    now: () => time,
    dutyCycle: 0.5,
    minimumCooldownMilliseconds: 4,
    maximumCooldownMilliseconds: 40
  });
  const signal = Promise.withResolvers<void>();
  expect(pacer.isReady()).toBe(true);
  const tracked = pacer.trackSubmission(signal.promise);
  time = 20;
  expect(pacer.isReady()).toBe(false);
  await expect(pacer.trackSubmission(Promise.resolve())).rejects.toThrow('already being tracked');
  signal.resolve();
  await tracked;
  time = 39;
  expect(pacer.isReady()).toBe(false);
  time = 40;
  expect(pacer.isReady()).toBe(true);

  const slow = pacer.trackSubmission(Promise.resolve());
  time = 140;
  await slow;
  time = 179;
  expect(pacer.isReady()).toBe(false);
  time = 180;
  expect(pacer.isReady()).toBe(true);
});

test('allows later work after a rejected submission and applies the minimum cooldown', async () => {
  let time = 0;
  const pacer = new GPUCommandGraphSubmissionPacer({now: () => time});
  await expect(pacer.trackSubmission(Promise.reject(new Error('device lost')))).rejects.toThrow(
    'device lost'
  );
  expect(pacer.isReady()).toBe(false);
  time = 8;
  expect(pacer.isReady()).toBe(true);
  await pacer.trackSubmission(Promise.resolve());
  time = 15;
  expect(pacer.isReady()).toBe(false);
  time = 16;
  expect(pacer.isReady()).toBe(true);
});
