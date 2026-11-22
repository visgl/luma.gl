// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getTableAttitude} from '../../examples/experimental/gpu-sphere-world/table-controls';
import {expect, test} from 'vitest';

test('table telemetry identifies a neutral, single-axis and compound slope from solver gravity', () => {
  expect(getTableAttitude([0, 0, -9.81])).toEqual({roll: 0, pitch: 0, tilt: 0});

  /** Positive local X produces positive roll and no pitch. */
  const right = getTableAttitude([1, 0, -1]);
  expect(right).toEqual({roll: 45, pitch: 0, tilt: 45});

  /** Equal perpendicular components produce a steeper radial slope than either axis alone. */
  const diagonal = getTableAttitude([1, -1, -1]);
  expect(diagonal.roll).toBeCloseTo(45);
  expect(diagonal.pitch).toBeCloseTo(-45);
  expect(diagonal.tilt).toBeCloseTo(54.7356);
});
