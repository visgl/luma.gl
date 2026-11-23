// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Add charge to the selected power, pause at full, then restart at the selection. */
export function getShotCharge(elapsedMilliseconds: number, selectedPower = 0): number {
  const ramp = (100 - selectedPower) * 16;
  const pause = selectedPower === 0 ? 350 : 650;
  const cycle = Math.max(0, elapsedMilliseconds) % (ramp + pause);
  return Math.min(100, selectedPower + cycle / 16);
}

/** Only a completed full rack auto-resets; single-ball practice remains repeatable. */
export function shouldRackBalls(mode: string, potted: number, objectBalls: number): boolean {
  return mode === 'rack' && objectBalls > 0 && potted >= objectBalls;
}
