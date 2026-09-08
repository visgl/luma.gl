// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  getExampleMobileQuality,
  getExampleMobileUnsupportedReason,
  getExampleRuntimeEnvironment,
  getMobileExamplePixelRatio,
  preflightExampleSupport,
  type ExampleRuntimeEnvironment
} from '../../examples/example-support';

function makeEnvironment(
  width: number,
  height: number,
  {coarsePointer = true, maxTouchPoints = 5, devicePixelRatio = 3} = {}
): ExampleRuntimeEnvironment {
  const currentWindow = {
    devicePixelRatio,
    innerHeight: height,
    innerWidth: width,
    matchMedia: (query: string) => ({
      matches: query === '(pointer: coarse)' ? coarsePointer : width <= 700 || height <= 500
    })
  } as Pick<Window, 'devicePixelRatio' | 'innerHeight' | 'innerWidth' | 'matchMedia'>;
  return getExampleRuntimeEnvironment(currentWindow, {maxTouchPoints});
}

describe('example mobile support policy', () => {
  test('distinguishes compact desktop layouts from touchscreen phone performance profiles', () => {
    const compactDesktop = makeEnvironment(600, 900, {
      coarsePointer: false,
      maxTouchPoints: 0
    });
    expect(compactDesktop.compactViewport).toBe(true);
    expect(compactDesktop.handheld).toBe(false);

    const phone = makeEnvironment(412, 915);
    expect(phone.compactViewport).toBe(true);
    expect(phone.handheld).toBe(true);
  });

  test('preserves the handheld profile across portrait and landscape orientation changes', () => {
    expect(makeEnvironment(412, 915).handheld).toBe(true);
    expect(makeEnvironment(915, 412).handheld).toBe(true);
  });

  test('caps phone drawing buffers at DPR 2 and approximately 1.5 million pixels', () => {
    expect(getMobileExamplePixelRatio(makeEnvironment(360, 640))).toBe(2);

    const largePhonePixelRatio = getMobileExamplePixelRatio(makeEnvironment(700, 1000));
    expect(largePhonePixelRatio).toBeLessThan(2);
    expect(700 * 1000 * Number(largePhonePixelRatio) ** 2).toBeCloseTo(1_500_000, 5);
  });

  test('applies common reduced-quality workload budgets only to handhelds', () => {
    const mobileQuality = getExampleMobileQuality(
      {mobileMode: 'reduced'},
      makeEnvironment(412, 915)
    );
    expect(mobileQuality).toMatchObject({
      intermediateTargetScale: 0.75,
      maximumSampleCount: 2,
      preferFloatingPointColor: false,
      maximumWorkerCount: 1,
      maximumConcurrentLoadCount: 2,
      maximumResidentRecordCount: 250_000,
      simulationDimensionScale: 0.5,
      simulationIterationScale: 0.5
    });

    const desktopQuality = getExampleMobileQuality(
      {mobileMode: 'reduced'},
      makeEnvironment(1440, 900, {coarsePointer: false, maxTouchPoints: 0})
    );
    expect(desktopQuality.intermediateTargetScale).toBe(1);
    expect(desktopQuality.maximumResidentRecordCount).toBe(1_000_000);
  });

  test('requires both a handheld environment and unsupported declaration to block startup', () => {
    const definition = {
      mobileMode: 'unsupported' as const,
      unsupportedReason: 'This demonstration requires a desktop GPU feature.'
    };
    expect(getExampleMobileUnsupportedReason(definition, makeEnvironment(412, 915))).toBe(
      definition.unsupportedReason
    );
    expect(
      getExampleMobileUnsupportedReason(
        definition,
        makeEnvironment(1440, 900, {coarsePointer: false, maxTouchPoints: 0})
      )
    ).toBeUndefined();
  });

  test('checks backends, features, and limits before application startup', () => {
    const environment = makeEnvironment(412, 915);
    const definition = {
      id: 'experimental/mobile-preflight',
      mobileMode: 'reduced' as const,
      mobileProfile: 'effects' as const,
      requirements: {
        backends: ['webgpu'] as const,
        requiredDeviceFeatures: ['timestamp-query'],
        requiredDeviceLimits: {maxColorAttachments: 5}
      }
    };

    expect(preflightExampleSupport(definition, environment, {backends: ['webgl2']})).toMatchObject({
      supported: false,
      reason: expect.stringContaining('WebGPU')
    });
    expect(
      preflightExampleSupport(definition, environment, {
        backends: ['webgpu'],
        deviceFeatures: [],
        deviceLimits: {maxColorAttachments: 8}
      })
    ).toMatchObject({supported: false, reason: expect.stringContaining('timestamp-query')});
    expect(
      preflightExampleSupport(definition, environment, {
        backends: ['webgpu'],
        deviceFeatures: ['timestamp-query'],
        deviceLimits: {maxColorAttachments: 4}
      })
    ).toMatchObject({supported: false, reason: expect.stringContaining('5 color attachments')});
    expect(
      preflightExampleSupport(definition, environment, {
        backends: ['webgpu'],
        deviceFeatures: ['timestamp-query'],
        deviceLimits: {maxColorAttachments: 8}
      })
    ).toEqual({supported: true});
  });
});
