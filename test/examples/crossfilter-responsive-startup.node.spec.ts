// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {describe, expect, test, vi} from 'vitest';
import MillionRowCrossfilterAnimationLoopTemplate from '../../examples/showcase/million-row-crossfilter/app';
import {
  makeCrossfilterDataset,
  makeCrossfilterDatasetAsync
} from '../../examples/showcase/million-row-crossfilter/crossfilter-data';

describe('Million-Row Crossfilter Explorer responsive startup', () => {
  test('keeps template construction free of synchronous million-row generation and GPU uploads', () => {
    const createBuffer = vi.fn();
    const device = {type: 'webgpu', createBuffer} as unknown as Device;
    const animationProps = {
      device,
      crossfilterRowCount: 1_048_576
    } as AnimationProps;

    const template = new MillionRowCrossfilterAnimationLoopTemplate(animationProps);

    expect(createBuffer).not.toHaveBeenCalled();
    expect(() => template.onFinalize()).not.toThrow();
  });

  test('keeps progressively generated columns identical to the original deterministic population', async () => {
    const progress: number[] = [];
    const yieldControl = vi.fn(async () => {});
    const expectedDataset = makeCrossfilterDataset({rowCount: 73, seed: 2048});

    const actualDataset = await makeCrossfilterDatasetAsync({
      rowCount: 73,
      seed: 2048,
      batchRowCount: 16,
      yieldControl,
      onProgress: (completedRowCount, totalRowCount) => {
        expect(totalRowCount).toBe(73);
        progress.push(completedRowCount);
      }
    });

    expect(actualDataset).toEqual(expectedDataset);
    expect(progress).toEqual([16, 32, 48, 64, 73]);
    expect(yieldControl).toHaveBeenCalledTimes(4);
  });

  test('stops generating rows immediately when navigation aborts a cooperative startup', async () => {
    const controller = new AbortController();
    const progress: number[] = [];
    const yieldControl = vi.fn(async () => controller.abort());

    await expect(
      makeCrossfilterDatasetAsync({
        rowCount: 128,
        batchRowCount: 32,
        signal: controller.signal,
        yieldControl,
        onProgress: completedRowCount => progress.push(completedRowCount)
      })
    ).rejects.toMatchObject({name: 'AbortError'});

    expect(progress).toEqual([32]);
    expect(yieldControl).toHaveBeenCalledTimes(1);
  });

  test('rejects a previously cancelled startup without allocating or reporting any batches', async () => {
    const controller = new AbortController();
    controller.abort();
    const onProgress = vi.fn();
    const yieldControl = vi.fn(async () => {});

    await expect(
      makeCrossfilterDatasetAsync({
        rowCount: 128,
        batchRowCount: 32,
        signal: controller.signal,
        yieldControl,
        onProgress
      })
    ).rejects.toMatchObject({name: 'AbortError'});

    expect(onProgress).not.toHaveBeenCalled();
    expect(yieldControl).not.toHaveBeenCalled();
  });

  test.each([
    0,
    -1,
    1.5,
    Number.NaN
  ])('rejects invalid cooperative batch row count %i', async batchRowCount => {
    await expect(makeCrossfilterDatasetAsync({rowCount: 16, batchRowCount})).rejects.toThrow(
      'positive, integral batch row count'
    );
  });
});
