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
  await expect(pacer.trackSubmission(Promise.resolve())).rejects.toThrow();
  signal.resolve();
  await tracked;
  expect(pacer.lastSubmissionMilliseconds).toBe(20);
  time = 39;
  expect(pacer.isReady()).toBe(false);
  time = 40;
  expect(pacer.isReady()).toBe(true);

  const slow = pacer.trackSubmission(Promise.resolve());
  time = 140;
  await slow;
  expect(pacer.lastSubmissionMilliseconds).toBe(100);
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

test('drops stale cooldown and timing after a workload change without overlapping submissions', async () => {
  let time = 0;
  const pacer = new GPUCommandGraphSubmissionPacer({now: () => time});
  const signal = Promise.withResolvers<void>();
  const tracked = pacer.trackSubmission(signal.promise);
  pacer.resetCooldown();
  expect(pacer.isReady()).toBe(false);
  time = 50;
  signal.resolve();
  await tracked;
  expect(pacer.lastSubmissionMilliseconds).toBeNull();
  expect(pacer.isReady()).toBe(true);
});
