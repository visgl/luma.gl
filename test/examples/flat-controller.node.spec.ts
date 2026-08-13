// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {FlatController, type FlatControllerPick, type FlatViewState} from '@luma.gl/experimental';

describe('FlatController', () => {
  test('pans with the content under the pointer and separates hover from click picking', () => {
    const canvasTarget = new EventTarget();
    const canvas = Object.assign(canvasTarget, {
      style: {cursor: '', touchAction: ''},
      getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100}),
      setPointerCapture: () => {},
      hasPointerCapture: () => false,
      releasePointerCapture: () => {}
    }) as unknown as HTMLCanvasElement;
    let view: FlatViewState = {xMin: 10, xMax: 60, yMin: 20, yMax: 60};
    const picks: FlatControllerPick[] = [];
    const controller = new FlatController(canvas, {
      getView: () => view,
      getBounds: () => ({xMin: 0, xMax: 100, yMin: 0, yMax: 100}),
      onViewChange: nextView => {
        view = nextView;
      },
      onPick: pick => picks.push(pick)
    });

    canvas.dispatchEvent(makePointerEvent('pointerdown', 50, 50));
    canvas.dispatchEvent(makePointerEvent('pointermove', 50, 60));
    canvas.dispatchEvent(makePointerEvent('pointerup', 50, 60));
    expect(view.yMin).toBe(16);
    expect(view.yMax).toBe(56);
    expect(picks).toHaveLength(0);

    canvas.dispatchEvent(makePointerEvent('pointermove', 25, 40));
    expect(picks.at(-1)).toMatchObject({intent: 'hover', x: 22.5, y: 32});
    canvas.dispatchEvent(makePointerEvent('pointerdown', 25, 40));
    canvas.dispatchEvent(makePointerEvent('pointerup', 25, 40));
    expect(picks.at(-1)).toMatchObject({intent: 'select', x: 22.5, y: 32});

    controller.destroy();
  });
});

function makePointerEvent(type: string, clientX: number, clientY: number): Event {
  const event = new Event(type);
  Object.defineProperties(event, {
    clientX: {value: clientX},
    clientY: {value: clientY},
    pointerId: {value: 1}
  });
  return event;
}
