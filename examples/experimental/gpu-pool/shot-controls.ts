// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Charge from zero over 1.6 seconds, hold at full for 0.35 seconds, then repeat. */
export function getShotCharge(elapsedMilliseconds: number): number {
  const cycle = Math.max(0, elapsedMilliseconds) % 1950;
  return Math.min(100, (cycle / 1600) * 100);
}

/** Only a completed full rack auto-resets; single-ball practice remains repeatable. */
export function shouldRackBalls(mode: string, potted: number, objectBalls: number): boolean {
  return mode === 'rack' && objectBalls > 0 && potted >= objectBalls;
}
