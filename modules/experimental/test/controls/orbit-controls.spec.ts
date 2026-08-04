// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {OrbitControls} from '../../src/controls/orbit-controls';

test('OrbitControls advances auto-rotation from elapsed milliseconds', t => {
  const controls = new OrbitControls(makeTestCanvas(), {
    yaw: 0,
    autoRotate: true,
    autoRotateSpeed: 0.08
  });

  controls.update(1000);
  controls.update(1100);

  t.equal(controls.yaw, 0.008, 'uses 100 elapsed milliseconds as 0.1 seconds');
  controls.destroy();
  t.end();
});

test('OrbitControls updates camera configuration without resetting manual state', t => {
  const controls = new OrbitControls(makeTestCanvas(), {
    distance: 10,
    minDistance: 2,
    maxDistance: 20,
    yaw: 0.4,
    pitch: 0.2
  });

  controls.setProps({target: [3, 4, 5], distance: 1, yaw: 0.8, maxPitch: 0.5, pitch: 1});

  t.deepEqual(controls.props.target, [3, 4, 5], 'updates the camera target');
  t.equal(controls.distance, 2, 'clamps the requested zoom to the current minimum');
  t.equal(controls.yaw, 0.8, 'updates the requested yaw');
  t.equal(controls.pitch, 0.5, 'clamps the requested pitch');

  controls.setProps({minDistance: 0.5});
  t.equal(controls.distance, 2, 'preserves the current zoom when only its limits change');

  controls.destroy();
  t.end();
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
