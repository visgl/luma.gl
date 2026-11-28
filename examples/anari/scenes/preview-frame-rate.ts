// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Measures rendered preview frames over wall-clock time, including skipped animation ticks. */
export class PreviewFrameRate {
  private windowStart?: number;
  private renderedFrames = 0;

  constructor(private readonly indicator: HTMLElement | null) {}

  tick(time: number): void {
    this.windowStart ??= time;
    const elapsed = time - this.windowStart;
    if (elapsed < 500) return;

    const framesPerSecond = (this.renderedFrames * 1000) / elapsed;
    if (this.indicator) {
      this.indicator.textContent = framesPerSecond.toFixed(framesPerSecond < 10 ? 1 : 0);
    }
    this.windowStart = time;
    this.renderedFrames = 0;
  }

  recordFrame(): void {
    this.renderedFrames++;
  }
}
