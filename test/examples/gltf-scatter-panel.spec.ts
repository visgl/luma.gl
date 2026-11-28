// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {expect, test, vi} from 'vitest';
import ScatterExample from '../../examples/gltf/features/app';

test('scatter load failures remain outside the selected model and attribution tabs', async () => {
  const device = await getWebGLTestDevice();
  expect(device).toBeTruthy();
  if (!device) return;
  const canvas = device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
  document.body.append(canvas);
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Reference unavailable'));
  const load = vi.spyOn(ScatterExample.prototype, 'loadGLTF');
  let example: ScatterExample | undefined;
  try {
    example = new ScatterExample({device} as AnimationProps, 'scatter');
    await load.mock.results[0].value;
    const error = document.getElementById('error');
    expect(error?.textContent).toContain('Reference unavailable');
    expect(error?.closest('[aria-hidden]')).toBeNull();
    expect(error && getComputedStyle(error).display).not.toBe('none');
    const attributions = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent === 'Attributions'
    );
    expect(attributions).toBeTruthy();
    attributions!.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
    await vi.waitFor(() =>
      expect(document.getElementById('error')?.closest('[aria-hidden]')).toBeNull()
    );
  } finally {
    example?.onFinalize();
    load.mockRestore();
    fetchMock.mockRestore();
    canvas.remove();
  }
});
