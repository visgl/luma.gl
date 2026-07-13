// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {CommandEncoder} from '@luma.gl/core';
import {GPURenderable} from '@luma.gl/tables';

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

test('GPURenderable tracks redraw reasons and forwards drawBatches', t => {
  const renderable = new TestRenderable();

  t.equal(renderable.needsRedraw(), false, 'starts without a redraw reason');
  renderable.setNeedsRedraw('first reason');
  renderable.setNeedsRedraw('second reason');
  t.equal(renderable.needsRedraw(), 'first reason', 'keeps the first pending redraw reason');
  t.equal(renderable.needsRedraw(), false, 'clears redraw reason when read');

  renderable.predraw(null as unknown as CommandEncoder);
  renderable.drawBatches(42);
  t.equal(renderable.predrawCallCount, 1, 'tracks concrete predraw calls');
  t.deepEqual(renderable.drawValues, [42], 'default drawBatches forwards to draw');

  t.end();
});
