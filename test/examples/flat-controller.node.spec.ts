// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  FlatController,
  type FlatControllerPick,
  type FlatViewState,
  type RectangleSelection,
  RectangleSelectController
} from '@luma.gl/experimental';

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

  test('captures Shift-drag rectangle selection without panning the flat view', () => {
    const canvasTarget = new EventTarget();
    const capturedPointers = new Set<number>();
    const canvas = Object.assign(canvasTarget, {
      style: {cursor: '', touchAction: ''},
      getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100}),
      setPointerCapture: (pointerId: number) => capturedPointers.add(pointerId),
      hasPointerCapture: (pointerId: number) => capturedPointers.has(pointerId),
      releasePointerCapture: (pointerId: number) => capturedPointers.delete(pointerId)
    }) as unknown as HTMLCanvasElement;
    let view: FlatViewState = {xMin: 0, xMax: 1000, yMin: 0, yMax: 200};
    let selection: RectangleSelection | null = null;
    const flatController = new FlatController(canvas, {
      getView: () => view,
      getBounds: () => ({xMin: 0, xMax: 1000, yMin: 0, yMax: 200}),
      onViewChange: nextView => {
        view = nextView;
      }
    });
    const rectangleController = new RectangleSelectController(canvas, {
      getView: () => view,
      onSelect: nextSelection => {
        selection = nextSelection;
      }
    });

    canvas.dispatchEvent(makePointerEvent('pointerdown', 10, 20, {shiftKey: true}));
    canvas.dispatchEvent(makePointerEvent('pointermove', 70, 80, {shiftKey: true}));
    canvas.dispatchEvent(makePointerEvent('pointerup', 70, 80, {shiftKey: true}));

    expect(view).toEqual({xMin: 0, xMax: 1000, yMin: 0, yMax: 200});
    expect(selection).toMatchObject({
      xMin: 100,
      xMax: 700,
      yMin: 40,
      yMax: 160,
      clientLeft: 10,
      clientTop: 20,
      clientWidth: 60,
      clientHeight: 60
    });

    rectangleController.destroy();
    flatController.destroy();
  });

  test('does not publish wheel interaction after zoom reaches the bounds', () => {
    const canvasTarget = new EventTarget();
    const canvas = Object.assign(canvasTarget, {
      style: {cursor: '', touchAction: ''},
      getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100})
    }) as unknown as HTMLCanvasElement;
    let view: FlatViewState = {xMin: 25, xMax: 75, yMin: 0, yMax: 100};
    let interactionCount = 0;
    let viewChangeCount = 0;
    const controller = new FlatController(canvas, {
      getView: () => view,
      getBounds: () => ({xMin: 0, xMax: 100, yMin: 0, yMax: 100}),
      onInteractionStart: () => interactionCount++,
      onViewChange: nextView => {
        viewChangeCount++;
        view = nextView;
      }
    });

    canvas.dispatchEvent(makeWheelEvent(50, 100_000));
    expect(view).toEqual({xMin: 0, xMax: 100, yMin: 0, yMax: 100});
    expect(interactionCount).toBe(1);
    expect(viewChangeCount).toBe(1);

    canvas.dispatchEvent(makeWheelEvent(50, 100_000));
    expect(interactionCount).toBe(1);
    expect(viewChangeCount).toBe(1);

    controller.destroy();
  });

  test('treats floating-point noise at the maximum zoom range as bounded', () => {
    const canvasTarget = new EventTarget();
    const canvas = Object.assign(canvasTarget, {
      style: {cursor: '', touchAction: ''},
      getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100})
    }) as unknown as HTMLCanvasElement;
    let interactionCount = 0;
    let viewChangeCount = 0;
    const controller = new FlatController(canvas, {
      getView: () => ({
        xMin: 0,
        xMax: 100 - Number.EPSILON * 100,
        yMin: 0,
        yMax: 100
      }),
      getBounds: () => ({xMin: 0, xMax: 100, yMin: 0, yMax: 100}),
      onInteractionStart: () => interactionCount++,
      onViewChange: () => viewChangeCount++
    });

    canvas.dispatchEvent(makeWheelEvent(50, 100));
    expect(interactionCount).toBe(0);
    expect(viewChangeCount).toBe(0);

    controller.destroy();
  });
});

function makePointerEvent(
  type: string,
  clientX: number,
  clientY: number,
  options: {shiftKey?: boolean} = {}
): Event {
  const event = new Event(type, {cancelable: true});
  Object.defineProperties(event, {
    clientX: {value: clientX},
    clientY: {value: clientY},
    pointerId: {value: 1},
    button: {value: 0},
    shiftKey: {value: options.shiftKey ?? false}
  });
  return event;
}

function makeWheelEvent(clientX: number, deltaY: number): Event {
  const event = new Event('wheel', {cancelable: true});
  Object.defineProperties(event, {
    clientX: {value: clientX},
    deltaY: {value: deltaY}
  });
  return event;
}
