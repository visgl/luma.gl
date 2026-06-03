// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder} from '@luma.gl/core';

/** Base class for GPU-backed renderable objects that need explicit predraw handling. */
export abstract class GPURenderable<DrawArguments extends unknown[] = unknown[]> {
  private needsRedrawReason: false | string = false;

  /** Runs pre-render GPU work such as compute passes or uniform buffer uploads. */
  abstract predraw(commandEncoder: CommandEncoder): void;

  /** Draws this renderable. */
  abstract draw(...drawArguments: DrawArguments): void;

  /** Draws all batches for renderers that keep multiple GPU table batches. */
  drawBatches(...drawArguments: DrawArguments): void {
    this.draw(...drawArguments);
  }

  /** Returns and clears the pending redraw reason. */
  needsRedraw(): false | string {
    const reason = this.needsRedrawReason;
    this.needsRedrawReason = false;
    return reason;
  }

  /** Marks this renderable as needing redraw, retaining the first pending reason. */
  setNeedsRedraw(reason: string): void {
    this.needsRedrawReason ||= reason;
  }
}
