// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {createTemporalScene, measureRegion, OUTPUT_SIZE, psnr} from './temporal-scene-test-utils';

it('static: 64 frames >=27 dB and >=3 dB improvement; native TAA improves raw input', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const fixture = createTemporalScene(device);
  try {
    fixture.render(0);
    const first = await fixture.readOutput();
    for (let frame = 1; frame < 64; frame++) fixture.render(frame);
    const reference = await fixture.readReference();
    const initial = psnr(first, reference);
    const converged = psnr(await fixture.readOutput(), reference);
    const native = createTemporalScene(device, OUTPUT_SIZE);
    try {
      native.render(0);
      const raw = await native.readInput();
      for (let frame = 1; frame < 16; frame++) native.render(frame);
      const nativeReference = await native.readReference();
      const nativeInitial = psnr(raw, nativeReference);
      const nativeConverged = psnr(await native.readOutput(), nativeReference);
      expect(converged, '64-frame PSNR >=27 dB').toBeGreaterThanOrEqual(27);
      expect(converged - initial, 'gain >=3 dB').toBeGreaterThanOrEqual(3);
      expect(nativeConverged, 'native TAA beats raw jittered frame').toBeGreaterThan(nativeInitial);
    } finally {
      native.destroy();
    }
  } finally {
    fixture.destroy();
  }
});

it('motion: 48 frames >=22 dB and correct velocity beats negated velocity by >=3 dB', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const scores: number[] = [];
  for (const velocitySign of [1, -1]) {
    const fixture = createTemporalScene(device);
    try {
      for (let frame = 0; frame < 48; frame++) {
        fixture.render(frame, {motion: [1.5, -0.5], velocitySign});
      }
      scores.push(psnr(await fixture.readOutput(), await fixture.readReference()));
    } finally {
      fixture.destroy();
    }
  }
  expect(scores[0], 'correct velocity PSNR >=22 dB').toBeGreaterThanOrEqual(22);
  expect(scores[0] - scores[1], 'sign-sensitive margin >=3 dB').toBeGreaterThanOrEqual(3);
});

it('disocclusion: exact rejection mask, revealed MAE <0.01 and depth control >=0.02 worse', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const outputs: Float32Array[] = [];
  // Separate histories ensure every observation is of the FIRST removal frame.
  for (const mode of ['rejected', 'control', 'debug', 'fresh']) {
    const fixture = createTemporalScene(device);
    try {
      for (let frame = 0; frame < 32; frame++) fixture.render(frame);
      fixture.render(
        32,
        {rectangle: false, rectangleDepth: mode === 'control'},
        {debugView: mode === 'debug' ? 'disocclusion' : 'none', reset: mode === 'fresh'}
      );
      outputs.push(await fixture.readOutput());
    } finally {
      fixture.destroy();
    }
  }
  // Stay several render pixels inside the old rectangle to exclude depth dilation boundaries.
  const revealed: [number, number, number, number] = [40, 30, 60, 46];
  const untouched: [number, number, number, number] = [74, 30, 88, 46];
  const white = new Float32Array(outputs[2].length).fill(1);
  const black = new Float32Array(outputs[2].length);
  const revealedMask = measureRegion(outputs[2], white, revealed).maximum;
  const untouchedMask = measureRegion(outputs[2], black, untouched).maximum;
  // The fresh reconstruction uses IDENTICAL current jitter/color. Comparing to it isolates
  // history residue from inevitable single-frame aliasing against a supersampled reference.
  const rejectedError = measureRegion(outputs[0], outputs[3], revealed).mean;
  const controlError = measureRegion(outputs[1], outputs[3], revealed).mean;
  expect(revealedMask, 'revealed area is white').toBe(0);
  expect(untouchedMask, 'untouched area is black').toBe(0);
  expect(rejectedError, 'revealed MAE <0.01').toBeLessThan(0.01);
  expect(controlError - rejectedError, 'depth control adds >=0.02 MAE').toBeGreaterThanOrEqual(
    0.02
  );
});

it('reset: true matches frame 1 within 1/255 in every RGBA component', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const fixture = createTemporalScene(device);
  try {
    fixture.render(0);
    const first = await fixture.readOutput();
    for (let frame = 1; frame < 32; frame++) fixture.render(frame);
    // Reuse frame zero's jitter, so only the presence of accumulated history differs.
    fixture.render(0, {}, {reset: true});
    const result = await fixture.readOutput();
    const maximum = result.reduce(
      (error, value, index) => Math.max(error, Math.abs(value - first[index])),
      0
    );
    expect(maximum, 'reset error <=1/255').toBeLessThanOrEqual(1 / 255);
  } finally {
    fixture.destroy();
  }
});

it('responsiveness: a removed 3 px line leaves the history sooner at 1; static PSNR loss <=0.5 dB', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  // The line and its two flanks. The flanks keep a stale line longest: there the history
  // neighbourhood holds both colours, so the sample validation trusts it.
  const region: [number, number, number, number] = [13, 3, 21, 13];
  const metrics: {
    staleFrames: number;
    staticPsnr: number;
    thinLinePeak: number;
  }[] = [];
  for (const responsiveness of [0, 0.5, 1]) {
    const tuning = {responsiveness};
    let staticPsnr = 0;
    let thinLinePeak = 0;
    let staleFrames = 257;
    let fixture = createTemporalScene(device);
    try {
      for (let frame = 0; frame < 64; frame++) fixture.render(frame, {}, tuning);
      staticPsnr = psnr(await fixture.readOutput(), await fixture.readReference());
    } finally {
      fixture.destroy();
    }
    // A line of one output pixel is half a render pixel. Only the accumulation can show it.
    fixture = createTemporalScene(device);
    try {
      for (let frame = 0; frame < 64; frame++) fixture.render(frame, {lineWidth: 1}, tuning);
      const result = await fixture.readOutput();
      const reference = await fixture.readReference();
      let resultPeak = 0;
      let referencePeak = 0;
      for (let horizontal = 14; horizontal < 20; horizontal++) {
        const index = (8 * OUTPUT_SIZE[0] + horizontal) * 4;
        resultPeak = Math.max(resultPeak, result[index]);
        referencePeak = Math.max(referencePeak, reference[index]);
      }
      // The background luminance of the band is 0.2.
      thinLinePeak = (resultPeak - 0.2) / (referencePeak - 0.2);
    } finally {
      fixture.destroy();
    }
    fixture = createTemporalScene(device);
    try {
      for (let frame = 0; frame < 64; frame++) fixture.render(frame, {lineWidth: 3}, tuning);
      const before = await fixture.readOutput();
      for (let elapsed = 1; elapsed <= 256; elapsed++) {
        fixture.render(63 + elapsed, {lineWidth: 0}, tuning);
        const reference = await fixture.readReference();
        if (elapsed === 1) {
          expect(
            measureRegion(before, reference, region).maximum,
            'the line was in the history'
          ).toBeGreaterThan(0.25);
        }
        if (measureRegion(await fixture.readOutput(), reference, region).maximum < 4 / 255) {
          staleFrames = elapsed;
          break;
        }
      }
    } finally {
      fixture.destroy();
    }
    metrics.push({staleFrames, staticPsnr, thinLinePeak});
  }
  for (const metric of metrics) {
    expect(metric.staleFrames, 'the residual falls below 4/255 in 256 frames').toBeLessThanOrEqual(
      256
    );
  }
  expect(metrics[2].staleFrames, 'responsiveness 1 is at least 2x faster').toBeLessThanOrEqual(
    metrics[0].staleFrames / 2
  );
  expect(metrics[1].staleFrames, 'responsiveness 0.5 is faster').toBeLessThan(
    metrics[0].staleFrames
  );
  expect(metrics[2].staticPsnr, 'static PSNR loss <=0.5 dB').toBeGreaterThanOrEqual(
    metrics[0].staticPsnr - 0.5
  );
  expect(metrics[0].thinLinePeak, 'the default keeps a one-pixel line').toBeGreaterThan(0.6);
  // The evidence gate: without it, responsiveness 1 erases the line (peak below 0.1).
  expect(
    metrics[2].thinLinePeak,
    'responsiveness 1 keeps part of a one-pixel line'
  ).toBeGreaterThan(0.2);
});

it('kernel sweep: 0.75 and 0.85 both converge >=27 dB', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const metrics: {kernelSharpness: number; converged: number}[] = [];
  for (const kernelSharpness of [0.75, 0.85]) {
    const fixture = createTemporalScene(device);
    try {
      for (let frame = 0; frame < 64; frame++) fixture.render(frame, {}, {kernelSharpness});
      const result = await fixture.readOutput();
      const reference = await fixture.readReference();
      metrics.push({
        kernelSharpness,
        converged: psnr(result, reference)
      });
    } finally {
      fixture.destroy();
    }
  }
  // The option must reach the shader: on this scene the narrower kernel is sharper.
  expect(
    metrics[1].converged - metrics[0].converged,
    'kernel 0.85 is >=0.3 dB above kernel 0.75 on this scene'
  ).toBeGreaterThanOrEqual(0.3);
  for (const metric of metrics) {
    expect(
      metric.converged,
      `kernel ${metric.kernelSharpness}: PSNR >=27 dB`
    ).toBeGreaterThanOrEqual(27);
  }
});
