// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {FocusController} from '../../examples/deck/depth-of-field/focus-controller';

describe('riverfront depth-of-field focus', () => {
  test('tours different buildings every five seconds and stops after a selection', () => {
    const focus = new FocusController();
    focus.updateSelection(0, [1, 2, 3, 4]);
    const first = focus.selectedIndex;
    focus.updateSelection(4.99, [1, 2, 3, 4]);
    expect(focus.selectedIndex).toBe(first);
    focus.updateSelection(5, [1, 2, 3, 4]);
    expect(focus.selectedIndex).not.toBe(first);
    focus.select(2);
    focus.updateSelection(100, [1, 2, 3, 4]);
    expect(focus.selectedIndex).toBe(2);
    expect(focus.automatic).toBe(false);
    focus.setAutomatic(true, 100);
    focus.updateSelection(104.99, [1, 2, 3, 4]);
    expect(focus.selectedIndex).toBe(2);
    focus.updateSelection(105, [1, 2, 3, 4]);
    expect(focus.selectedIndex).not.toBe(2);
  });
  test('eases continuously, converges, and gives the same result at different frame rates', () => {
    const focus = new FocusController();
    expect(focus.updateDistance(0, 200)).toBe(200);
    expect(focus.updateDistance(0, 800)).toBe(200);
    const halfway = focus.updateDistance(0.5, 800);
    expect(halfway).toBeGreaterThan(200);
    expect(halfway).toBeLessThan(800);
    expect(focus.updateDistance(8, 800)).toBeCloseTo(800, 1);
    const fine = new FocusController();
    const coarse = new FocusController();
    fine.updateDistance(0, 200);
    coarse.updateDistance(0, 200);
    let fineDistance = 200;
    for (let index = 1; index <= 60; index++) fineDistance = fine.updateDistance(index / 60, 800);
    expect(coarse.updateDistance(1, 800)).toBeCloseTo(fineDistance, 8);
  });
  test('handles empty or single visible-building sets without losing manual focus', () => {
    const focus = new FocusController();
    focus.updateSelection(0, []);
    expect(focus.selectedIndex).toBe(-1);
    focus.updateSelection(1, [7]);
    focus.updateSelection(6, [7]);
    expect(focus.selectedIndex).toBe(7);
    focus.select(9);
    focus.updateSelection(20, []);
    expect(focus.selectedIndex).toBe(9);
  });
});
