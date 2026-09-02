// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {OrbitControls, type OrbitPosition} from '@luma.gl/engine';

it('OrbitControls initializes a bounded orbit around an independently owned target', () => {
  const canvas = makeTestCanvas();
  const target: OrbitPosition = [1, 2, 3];
  const controls = new OrbitControls(canvas, {
    target,
    distance: 20,
    maxDistance: 5,
    yaw: Math.PI / 2,
    pitch: 0
  });

  target[0] = 100;

  expect(controls.props.target, 'copies the caller-owned orbit target').toEqual([1, 2, 3]);
  expect(controls.distance, 'clamps the initial distance to the configured maximum').toBe(5);
  const eyePosition = controls.getEyePosition();
  expect(
    Boolean(
      eyePosition.every((coordinate, coordinateIndex) => {
        return Math.abs(coordinate - [6, 2, 3][coordinateIndex]) < 1e-12;
      })
    ),
    'converts orbit state into a world-space eye'
  ).toBe(true);
  expect(canvas.style.cursor, 'shows the idle orbit cursor').toBe('grab');
  expect(canvas.style.touchAction, 'reserves pointer gestures for orbit interactions').toBe('none');

  controls.destroy();
  void 0;
});

it('OrbitControls advances and bounds automatic rotation using millisecond timestamps', () => {
  const controls = new OrbitControls(makeTestCanvas(), {
    yaw: 0,
    autoRotate: true,
    autoRotateSpeed: 2
  });

  controls.update(1000);
  expect(controls.yaw, 'the first timestamp establishes the animation baseline').toBe(0);

  controls.update(1050);
  expect(controls.yaw, 'converts elapsed milliseconds to seconds').toBe(0.1);

  controls.update(2050);
  expect(
    Boolean(Math.abs(controls.yaw - 0.3) < 1e-12),
    'limits a stalled frame to 100 milliseconds'
  ).toBe(true);

  controls.update(2000);
  expect(
    Boolean(Math.abs(controls.yaw - 0.3) < 1e-12),
    'ignores timestamps that move backward'
  ).toBe(true);

  controls.setAutoRotate(false);
  controls.update(2100);
  expect(
    Boolean(Math.abs(controls.yaw - 0.3) < 1e-12),
    'pauses rotation without resetting the orbit'
  ).toBe(true);

  controls.setAutoRotate(true);
  controls.update(2150);
  expect(
    Boolean(Math.abs(controls.yaw - 0.4) < 1e-12),
    'resumes rotation from the current camera angle'
  ).toBe(true);

  controls.destroy();
  void 0;
});

it('OrbitControls derives its camera up direction from orbit pitch and roll', () => {
  const controls = new OrbitControls(makeTestCanvas(), {
    yaw: Math.PI / 2,
    pitch: 0,
    roll: Math.PI / 2
  });

  const upDirection = controls.getUpDirection();
  expect(
    Boolean(Math.abs(upDirection[0]) < 1e-12),
    'rolls around the current viewing direction'
  ).toBe(true);
  expect(Boolean(Math.abs(upDirection[1]) < 1e-12), 'removes the original vertical component').toBe(
    true
  );
  expect(upDirection[2], 'returns the rolled camera up axis').toBe(-1);

  controls.destroy();
  void 0;
});

it('OrbitControls captures pointer drags, clamps pitch, and ignores unrelated pointers', () => {
  const canvas = makeTestCanvas();
  let interactionCount = 0;
  const controls = new OrbitControls(canvas, {
    yaw: 1,
    pitch: 0.2,
    maxPitch: 0.25,
    rotateSpeed: 0.01,
    pitchSpeed: -0.02,
    autoRotate: true,
    autoRotateSpeed: 1,
    onInteractionStart: () => interactionCount++
  });

  canvas.dispatchTestEvent('pointerdown', {
    button: 1,
    pointerId: 9,
    clientX: 10,
    clientY: 20
  });
  expect(interactionCount, 'ignores non-primary mouse buttons').toBe(0);

  controls.update(1000);
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 7,
    clientX: 10,
    clientY: 20
  });

  expect(interactionCount, 'notifies once when the drag begins').toBe(1);
  expect(canvas.hasPointerCapture(7), 'captures the active pointer').toBe(true);
  expect(canvas.style.cursor, 'shows the active drag cursor').toBe('grabbing');

  canvas.dispatchTestEvent('pointermove', {pointerId: 9, clientX: 200, clientY: 200});
  expect(controls.yaw, 'ignores moves from another pointer').toBe(1);

  canvas.dispatchTestEvent('pointermove', {pointerId: 7, clientX: 15, clientY: 23});
  expect(controls.yaw, 'applies horizontal pointer movement').toBe(0.95);
  expect(controls.pitch, 'applies independent pitch speed and its configured limit').toBe(0.25);

  controls.update(1100);
  expect(controls.yaw, 'pauses automatic rotation while dragging').toBe(0.95);

  canvas.dispatchTestEvent('pointerup', {pointerId: 9});
  expect(canvas.hasPointerCapture(7), 'ignores pointer-up events for another pointer').toBe(true);

  canvas.dispatchTestEvent('pointercancel', {pointerId: 7});
  expect(canvas.hasPointerCapture(7), 'releases pointer capture when the drag ends').toBe(false);
  expect(canvas.style.cursor, 'restores the idle orbit cursor').toBe('grab');

  controls.update(1200);
  expect(controls.yaw, 'resumes automatic rotation after the drag ends').toBe(1.05);

  controls.destroy();
  void 0;
});

it('OrbitControls consumes wheel gestures and keeps zoom inside configured bounds', () => {
  const canvas = makeTestCanvas();
  let interactionCount = 0;
  let preventedWheelCount = 0;
  const controls = new OrbitControls(canvas, {
    distance: 10,
    minDistance: 5,
    maxDistance: 12,
    zoomSpeed: 0.01,
    onInteractionStart: () => interactionCount++
  });

  canvas.dispatchTestEvent('wheel', {
    deltaY: 1000,
    preventDefault: () => preventedWheelCount++
  });
  expect(controls.distance, 'clamps wheel zoom to the maximum distance').toBe(12);

  canvas.dispatchTestEvent('wheel', {
    deltaY: -1000,
    preventDefault: () => preventedWheelCount++
  });
  expect(controls.distance, 'clamps wheel zoom to the minimum distance').toBe(5);
  expect(interactionCount, 'notifies for both camera interactions').toBe(2);
  expect(preventedWheelCount, 'prevents the browser from scrolling the canvas').toBe(2);

  controls.destroy();
  void 0;
});

it('OrbitControls optionally pans its target while shift-dragging', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas, {
    target: [1, 2, 3],
    yaw: 0,
    pitch: 0,
    distance: 10,
    enablePan: true,
    panSpeed: 0.01
  });

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 3,
    clientX: 0,
    clientY: 0
  });
  canvas.dispatchTestEvent('pointermove', {
    pointerId: 3,
    clientX: 2,
    clientY: 3,
    shiftKey: true
  });

  expect(controls.props.target, 'pans the target in camera space').toEqual([0.8, 2.3, 3]);
  expect(controls.yaw, 'does not rotate while panning').toBe(0);

  controls.destroy();
  void 0;
});

it('OrbitControls pans in the rolled camera screen axes', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas, {
    target: [0, 0, 0],
    yaw: 0,
    pitch: 0,
    roll: Math.PI / 2,
    distance: 10,
    enablePan: true,
    panSpeed: 0.1
  });

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 5,
    clientX: 0,
    clientY: 0
  });
  canvas.dispatchTestEvent('pointermove', {
    pointerId: 5,
    clientX: 2,
    clientY: 3,
    shiftKey: true
  });

  const target = controls.props.target;
  expect(Math.abs(target[0] - 3), 'maps vertical input along the rolled up axis').toBeLessThan(
    1e-12
  );
  expect(Math.abs(target[1] - 2), 'maps horizontal input along the rolled right axis').toBeLessThan(
    1e-12
  );
  expect(Math.abs(target[2]), 'keeps the pan inside the rolled screen plane').toBeLessThan(1e-12);

  controls.destroy();
  void 0;
});

it('OrbitControls pinch zooms with two touch pointers inside configured bounds', () => {
  const canvas = makeTestCanvas();
  let interactionCount = 0;
  const controls = new OrbitControls(canvas, {
    distance: 10,
    minDistance: 5,
    maxDistance: 15,
    onInteractionStart: () => interactionCount++
  });

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 1,
    pointerType: 'touch',
    clientX: 0,
    clientY: 20
  });
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 2,
    pointerType: 'touch',
    clientX: 100,
    clientY: 20
  });

  expect(interactionCount, 'a second finger continues the existing camera interaction').toBe(1);
  expect(canvas.hasPointerCapture(1), 'captures the first touch pointer').toBe(true);
  expect(canvas.hasPointerCapture(2), 'captures the second touch pointer').toBe(true);

  canvas.dispatchTestEvent('pointermove', {pointerId: 2, clientX: 250, clientY: 20});
  expect(controls.distance, 'spreading touch points zooms in to the minimum distance').toBe(5);

  canvas.dispatchTestEvent('pointermove', {pointerId: 2, clientX: 50, clientY: 20});
  expect(controls.distance, 'bringing touch points together respects the maximum distance').toBe(
    15
  );

  controls.destroy();
  expect(canvas.hasPointerCapture(1), 'disposal releases the first touch pointer').toBe(false);
  expect(canvas.hasPointerCapture(2), 'disposal releases the second touch pointer').toBe(false);
  void 0;
});

it('OrbitControls rolls its up direction with a two-finger twist across the angle boundary', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas, {
    yaw: 1,
    roll: 0.5,
    distance: 10,
    enableRotate: true,
    enableZoom: false
  });

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 1,
    pointerType: 'touch',
    clientX: 0,
    clientY: 0
  });
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 2,
    pointerType: 'touch',
    clientX: -100,
    clientY: 1
  });
  canvas.dispatchTestEvent('pointermove', {
    pointerId: 2,
    clientX: -100,
    clientY: -1
  });

  const expectedRoll = 0.5 + 2 * Math.atan2(1, 100);
  expect(
    Boolean(Math.abs(controls.roll - expectedRoll) < 1e-12),
    'uses the shortest roll across -pi'
  ).toBe(true);
  expect(controls.yaw, 'leaves the orbit yaw unchanged').toBe(1);
  expect(controls.distance, 'rotates independently of disabled pinch zoom').toBe(10);

  canvas.dispatchTestEvent('pointerup', {pointerId: 2});
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 3,
    pointerType: 'touch',
    clientX: 100,
    clientY: 0
  });
  expect(
    Boolean(Math.abs(controls.roll - expectedRoll) < 1e-12),
    'starts a new twist without reusing the previous pinch angle'
  ).toBe(true);

  controls.destroy();
  void 0;
});

it('OrbitControls pans with the center of a two-finger touch gesture', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas, {
    target: [0, 0, 0],
    yaw: 0,
    pitch: 0,
    distance: 10,
    enableRotate: false,
    enablePan: true,
    enableZoom: false,
    panSpeed: 0.01
  });

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 3,
    pointerType: 'touch',
    clientX: 0,
    clientY: 0
  });
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 4,
    pointerType: 'touch',
    clientX: 100,
    clientY: 0
  });
  canvas.dispatchTestEvent('pointermove', {pointerId: 3, clientX: 10, clientY: 20});
  canvas.dispatchTestEvent('pointermove', {pointerId: 4, clientX: 110, clientY: 20});

  expect(controls.props.target, 'moves the target with the touch midpoint').toEqual([-1, 2, 0]);
  expect(controls.distance, 'respects independently disabled touch zoom').toBe(10);
  expect(controls.roll, 'respects independently disabled up-axis rotation').toBe(0);

  canvas.dispatchTestEvent('pointerup', {pointerId: 4});
  expect(canvas.hasPointerCapture(4), 'releases the lifted touch pointer').toBe(false);
  expect(canvas.hasPointerCapture(3), 'keeps the remaining touch pointer active').toBe(true);

  canvas.dispatchTestEvent('pointermove', {pointerId: 3, clientX: 20, clientY: 20});
  expect(
    Boolean(controls.yaw < 0),
    'continues one-finger orbiting without a pointer-position jump'
  ).toBe(true);

  controls.destroy();
  void 0;
});

it('OrbitControls disables up-axis rotation without disabling orbit or zoom', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas, {
    yaw: 0,
    distance: 10,
    enableRotate: false
  });

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 7,
    pointerType: 'touch',
    clientX: 0,
    clientY: 0
  });
  canvas.dispatchTestEvent('pointermove', {pointerId: 7, clientX: 20, clientY: 0});
  expect(controls.yaw, 'continues one-finger orbiting').toBe(-0.12);

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 8,
    pointerType: 'touch',
    clientX: 120,
    clientY: 0
  });
  canvas.dispatchTestEvent('pointermove', {pointerId: 8, clientX: 20, clientY: 200});

  expect(controls.roll, 'ignores two-finger up-axis rotation').toBe(0);
  expect(Boolean(controls.distance < 10), 'continues to apply pinch zoom').toBe(true);

  controls.destroy();
  void 0;
});

it('OrbitControls releases every touch pointer when interactions are disabled', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas);

  for (const pointerId of [5, 6]) {
    canvas.dispatchTestEvent('pointerdown', {
      button: 0,
      pointerId,
      pointerType: 'touch',
      clientX: pointerId * 10,
      clientY: 0
    });
  }

  controls.setProps({enabled: false});

  expect(canvas.hasPointerCapture(5), 'releases the first active touch pointer').toBe(false);
  expect(canvas.hasPointerCapture(6), 'releases the second active touch pointer').toBe(false);
  expect(canvas.style.cursor, 'restores the idle cursor after cancelling the gesture').toBe('grab');

  controls.destroy();
  void 0;
});

it('OrbitControls disables camera interactions and wheel zoom independently', () => {
  const canvas = makeTestCanvas();
  let interactionCount = 0;
  let preventedWheelCount = 0;
  const controls = new OrbitControls(canvas, {
    yaw: 0,
    distance: 10,
    enabled: false,
    autoRotate: true,
    autoRotateSpeed: 0.08,
    onInteractionStart: () => interactionCount++
  });
  const wheelEvent = {
    deltaY: 100,
    preventDefault: () => preventedWheelCount++
  };

  controls.update(1000);
  controls.update(1100);
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 9,
    clientX: 5,
    clientY: 6
  });
  canvas.dispatchTestEvent('wheel', wheelEvent);

  expect(controls.yaw, 'disabled controls do not auto-rotate').toBe(0);
  expect(canvas.hasPointerCapture(9), 'disabled controls do not capture pointers').toBe(false);
  expect(preventedWheelCount, 'disabled controls do not consume wheel events').toBe(0);
  expect(interactionCount, 'disabled controls do not notify interactions').toBe(0);

  controls.setProps({enabled: true, enableZoom: false});
  canvas.dispatchTestEvent('wheel', wheelEvent);
  expect(preventedWheelCount, 'disabled zoom does not consume wheel events').toBe(0);

  controls.setProps({enableZoom: true});
  canvas.dispatchTestEvent('wheel', wheelEvent);
  expect(preventedWheelCount, 'enabled zoom consumes wheel events').toBe(1);
  expect(interactionCount, 'enabled zoom notifies the interaction').toBe(1);
  expect(Boolean(controls.distance > 10), 'enabled zoom changes the camera distance').toBe(true);

  controls.update(1200);
  expect(controls.yaw, 're-enabled controls resume auto-rotation').toBe(0.008);

  controls.destroy();
  void 0;
});

it('OrbitControls cancels active pointer capture when disabled', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas, {
    yaw: 0,
    autoRotate: true,
    autoRotateSpeed: 1
  });

  controls.update(1000);
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 12,
    clientX: 10,
    clientY: 20
  });
  expect(canvas.hasPointerCapture(12), 'captures the active pointer').toBe(true);
  expect(canvas.style.cursor, 'shows the active drag cursor').toBe('grabbing');

  controls.setProps({enabled: false});
  expect(canvas.hasPointerCapture(12), 'releases pointer capture while disabling').toBe(false);
  expect(canvas.style.cursor, 'restores the idle orbit cursor').toBe('grab');

  canvas.dispatchTestEvent('pointermove', {
    pointerId: 12,
    clientX: 30,
    clientY: 40
  });
  controls.update(1100);
  expect(controls.yaw, 'disabled controls ignore movement and auto-rotation').toBe(0);

  controls.setProps({enabled: true});
  controls.update(1200);
  expect(controls.yaw, 're-enabled controls resume without a stale drag').toBe(0.1);

  controls.destroy();
  void 0;
});

it('OrbitControls updates camera configuration, preserves live state, and resets fitted poses', () => {
  const controls = new OrbitControls(makeTestCanvas(), {
    yaw: 0.1,
    pitch: 0.2,
    roll: 0.3,
    distance: 8,
    maxDistance: 20
  });
  const target: OrbitPosition = [3, 4, 5];

  controls.setProps({
    target,
    yaw: 0.7,
    pitch: 1,
    roll: 0.6,
    maxPitch: 0.5,
    distance: 25,
    maxDistance: 15
  });
  target[0] = 100;

  expect(controls.props.target, 'copies dynamically updated orbit targets').toEqual([3, 4, 5]);
  expect(controls.yaw, 'applies the updated yaw immediately').toBe(0.7);
  expect(controls.pitch, 'clamps pitch against its updated limit').toBe(0.5);
  expect(controls.roll, 'applies the updated roll immediately').toBe(0.6);
  expect(controls.distance, 'clamps distance against its updated limit').toBe(15);

  controls.setProps({minDistance: 2});
  expect(controls.distance, 'preserves the live distance when only its limits change').toBe(15);

  controls.yaw = 0;
  controls.pitch = 0;
  controls.roll = 0;
  controls.distance = 4;
  controls.reset();

  expect(controls.yaw, 'resets to the latest configured yaw').toBe(0.7);
  expect(controls.pitch, 'resets to the latest bounded pitch').toBe(0.5);
  expect(controls.roll, 'resets to the latest configured roll').toBe(0.6);
  expect(controls.distance, 'resets to the latest bounded distance').toBe(15);

  controls.destroy();
  void 0;
});

it('OrbitControls destroys listeners, restores canvas styles, and releases active capture', () => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas);

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 4,
    clientX: 0,
    clientY: 0
  });
  expect(canvas.listenerCount(), 'registers pointer and wheel listeners').toBe(5);
  expect(canvas.hasPointerCapture(4), 'captures the active pointer').toBe(true);

  controls.destroy();

  expect(canvas.listenerCount(), 'removes every registered pointer and wheel listener').toBe(0);
  expect(canvas.hasPointerCapture(4), 'releases an active pointer before disposal').toBe(false);
  expect(canvas.style.cursor, 'restores the previous canvas cursor').toBe('crosshair');
  expect(canvas.style.touchAction, 'restores the previous touch-action policy').toBe('pan-x');
  void 0;
});

type TestCanvas = HTMLCanvasElement & {
  dispatchTestEvent: (eventName: string, event: Record<string, unknown>) => void;
  listenerCount: () => number;
};

function makeTestCanvas(): TestCanvas {
  const listeners = new Map<string, Set<EventListener>>();
  const capturedPointers = new Set<number>();

  return {
    style: {cursor: 'crosshair', touchAction: 'pan-x'},
    addEventListener: (eventName: string, listener: EventListener): void => {
      const eventListeners = listeners.get(eventName) ?? new Set<EventListener>();
      eventListeners.add(listener);
      listeners.set(eventName, eventListeners);
    },
    removeEventListener: (eventName: string, listener: EventListener): void => {
      listeners.get(eventName)?.delete(listener);
    },
    hasPointerCapture: (pointerId: number): boolean => capturedPointers.has(pointerId),
    setPointerCapture: (pointerId: number): void => {
      capturedPointers.add(pointerId);
    },
    releasePointerCapture: (pointerId: number): void => {
      capturedPointers.delete(pointerId);
    },
    dispatchTestEvent: (eventName: string, event: Record<string, unknown>): void => {
      for (const listener of listeners.get(eventName) ?? []) {
        listener(event as unknown as Event);
      }
    },
    listenerCount: (): number =>
      [...listeners.values()].reduce((listenerCount, eventListeners) => {
        return listenerCount + eventListeners.size;
      }, 0)
  } as unknown as TestCanvas;
}
