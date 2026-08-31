// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {OrbitControls as EngineOrbitControls} from '@luma.gl/engine';
import {OrbitControls} from '../../src/controls/orbit-controls';

it('OrbitControls preserves the experimental compatibility re-export', () => {
  expect(OrbitControls, 'both packages expose the same engine-owned class').toBe(
    EngineOrbitControls
  );
  void 0;
});

it('OrbitControls advances auto-rotation from elapsed milliseconds', () => {
  const controls = new OrbitControls(makeTestCanvas(), {
    yaw: 0,
    autoRotate: true,
    autoRotateSpeed: 0.08
  });

  controls.update(1000);
  controls.update(1100);

  expect(controls.yaw, 'uses 100 elapsed milliseconds as 0.1 seconds').toBe(0.008);
  controls.destroy();
  void 0;
});

it('OrbitControls updates camera configuration without resetting manual state', () => {
  const controls = new OrbitControls(makeTestCanvas(), {
    distance: 10,
    minDistance: 2,
    maxDistance: 20,
    yaw: 0.4,
    pitch: 0.2
  });

  controls.setProps({target: [3, 4, 5], distance: 1, yaw: 0.8, maxPitch: 0.5, pitch: 1});

  expect(controls.props.target, 'updates the camera target').toEqual([3, 4, 5]);
  expect(controls.distance, 'clamps the requested zoom to the current minimum').toBe(2);
  expect(controls.yaw, 'updates the requested yaw').toBe(0.8);
  expect(controls.pitch, 'clamps the requested pitch').toBe(0.5);

  controls.setProps({minDistance: 0.5});
  expect(controls.distance, 'preserves the current zoom when only its limits change').toBe(2);

  controls.destroy();
  void 0;
});

function makeTestCanvas(): HTMLCanvasElement {
  return {
    style: {cursor: '', touchAction: ''},
    addEventListener: () => {},
    removeEventListener: () => {},
    hasPointerCapture: () => false,
    setPointerCapture: () => {},
    releasePointerCapture: () => {}
  } as unknown as HTMLCanvasElement;
}
