// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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
