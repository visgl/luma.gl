// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {CommandEncoder} from '@luma.gl/core';
import {GPURenderable} from '@luma.gl/experimental/gpu-tables';

class TestRenderable extends GPURenderable<[number]> {
  predrawCallCount = 0;
  drawValues: number[] = [];

  override predraw(_commandEncoder: CommandEncoder): void {
    this.predrawCallCount++;
  }

  override draw(value: number): void {
    this.drawValues.push(value);
  }
}

it('GPURenderable tracks redraw reasons and forwards drawBatches', () => {
  const renderable = new TestRenderable();

  expect(renderable.needsRedraw(), 'starts without a redraw reason').toBe(false);
  renderable.setNeedsRedraw('first reason');
  renderable.setNeedsRedraw('second reason');
  expect(renderable.needsRedraw(), 'keeps the first pending redraw reason').toBe('first reason');
  expect(renderable.needsRedraw(), 'clears redraw reason when read').toBe(false);

  renderable.predraw(null as unknown as CommandEncoder);
  renderable.drawBatches(42);
  expect(renderable.predrawCallCount, 'tracks concrete predraw calls').toBe(1);
  expect(renderable.drawValues, 'default drawBatches forwards to draw').toEqual([42]);

  void 0;
});
