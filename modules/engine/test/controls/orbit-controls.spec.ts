// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {OrbitControls, type OrbitPosition} from '@luma.gl/engine';

test('OrbitControls initializes a bounded orbit around an independently owned target', t => {
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

  t.deepEqual(controls.props.target, [1, 2, 3], 'copies the caller-owned orbit target');
  t.equal(controls.distance, 5, 'clamps the initial distance to the configured maximum');
  const eyePosition = controls.getEyePosition();
  t.ok(
    eyePosition.every((coordinate, coordinateIndex) => {
      return Math.abs(coordinate - [6, 2, 3][coordinateIndex]) < 1e-12;
    }),
    'converts orbit state into a world-space eye'
  );
  t.equal(canvas.style.cursor, 'grab', 'shows the idle orbit cursor');
  t.equal(canvas.style.touchAction, 'none', 'reserves pointer gestures for orbit interactions');

  controls.destroy();
  t.end();
});

test('OrbitControls advances and bounds automatic rotation using millisecond timestamps', t => {
  const controls = new OrbitControls(makeTestCanvas(), {
    yaw: 0,
    autoRotate: true,
    autoRotateSpeed: 2
  });

  controls.update(1000);
  t.equal(controls.yaw, 0, 'the first timestamp establishes the animation baseline');

  controls.update(1050);
  t.equal(controls.yaw, 0.1, 'converts elapsed milliseconds to seconds');

  controls.update(2050);
  t.ok(Math.abs(controls.yaw - 0.3) < 1e-12, 'limits a stalled frame to 100 milliseconds');

  controls.update(2000);
  t.ok(Math.abs(controls.yaw - 0.3) < 1e-12, 'ignores timestamps that move backward');

  controls.setAutoRotate(false);
  controls.update(2100);
  t.ok(Math.abs(controls.yaw - 0.3) < 1e-12, 'pauses rotation without resetting the orbit');

  controls.setAutoRotate(true);
  controls.update(2150);
  t.ok(Math.abs(controls.yaw - 0.4) < 1e-12, 'resumes rotation from the current camera angle');

  controls.destroy();
  t.end();
});

test('OrbitControls captures pointer drags, clamps pitch, and ignores unrelated pointers', t => {
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
  t.equal(interactionCount, 0, 'ignores non-primary mouse buttons');

  controls.update(1000);
  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 7,
    clientX: 10,
    clientY: 20
  });

  t.equal(interactionCount, 1, 'notifies once when the drag begins');
  t.equal(canvas.hasPointerCapture(7), true, 'captures the active pointer');
  t.equal(canvas.style.cursor, 'grabbing', 'shows the active drag cursor');

  canvas.dispatchTestEvent('pointermove', {pointerId: 9, clientX: 200, clientY: 200});
  t.equal(controls.yaw, 1, 'ignores moves from another pointer');

  canvas.dispatchTestEvent('pointermove', {pointerId: 7, clientX: 15, clientY: 23});
  t.equal(controls.yaw, 0.95, 'applies horizontal pointer movement');
  t.equal(controls.pitch, 0.25, 'applies independent pitch speed and its configured limit');

  controls.update(1100);
  t.equal(controls.yaw, 0.95, 'pauses automatic rotation while dragging');

  canvas.dispatchTestEvent('pointerup', {pointerId: 9});
  t.equal(canvas.hasPointerCapture(7), true, 'ignores pointer-up events for another pointer');

  canvas.dispatchTestEvent('pointercancel', {pointerId: 7});
  t.equal(canvas.hasPointerCapture(7), false, 'releases pointer capture when the drag ends');
  t.equal(canvas.style.cursor, 'grab', 'restores the idle orbit cursor');

  controls.update(1200);
  t.equal(controls.yaw, 1.05, 'resumes automatic rotation after the drag ends');

  controls.destroy();
  t.end();
});

test('OrbitControls consumes wheel gestures and keeps zoom inside configured bounds', t => {
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
  t.equal(controls.distance, 12, 'clamps wheel zoom to the maximum distance');

  canvas.dispatchTestEvent('wheel', {
    deltaY: -1000,
    preventDefault: () => preventedWheelCount++
  });
  t.equal(controls.distance, 5, 'clamps wheel zoom to the minimum distance');
  t.equal(interactionCount, 2, 'notifies for both camera interactions');
  t.equal(preventedWheelCount, 2, 'prevents the browser from scrolling the canvas');

  controls.destroy();
  t.end();
});

test('OrbitControls optionally pans its target while shift-dragging', t => {
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

  t.deepEqual(controls.props.target, [0.8, 2.3, 3], 'pans the target in camera space');
  t.equal(controls.yaw, 0, 'does not rotate while panning');

  controls.destroy();
  t.end();
});

test('OrbitControls disables camera interactions and wheel zoom independently', t => {
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

  t.equal(controls.yaw, 0, 'disabled controls do not auto-rotate');
  t.equal(canvas.hasPointerCapture(9), false, 'disabled controls do not capture pointers');
  t.equal(preventedWheelCount, 0, 'disabled controls do not consume wheel events');
  t.equal(interactionCount, 0, 'disabled controls do not notify interactions');

  controls.setProps({enabled: true, enableZoom: false});
  canvas.dispatchTestEvent('wheel', wheelEvent);
  t.equal(preventedWheelCount, 0, 'disabled zoom does not consume wheel events');

  controls.setProps({enableZoom: true});
  canvas.dispatchTestEvent('wheel', wheelEvent);
  t.equal(preventedWheelCount, 1, 'enabled zoom consumes wheel events');
  t.equal(interactionCount, 1, 'enabled zoom notifies the interaction');
  t.ok(controls.distance > 10, 'enabled zoom changes the camera distance');

  controls.update(1200);
  t.equal(controls.yaw, 0.008, 're-enabled controls resume auto-rotation');

  controls.destroy();
  t.end();
});

test('OrbitControls cancels active pointer capture when disabled', t => {
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
  t.equal(canvas.hasPointerCapture(12), true, 'captures the active pointer');
  t.equal(canvas.style.cursor, 'grabbing', 'shows the active drag cursor');

  controls.setProps({enabled: false});
  t.equal(canvas.hasPointerCapture(12), false, 'releases pointer capture while disabling');
  t.equal(canvas.style.cursor, 'grab', 'restores the idle orbit cursor');

  canvas.dispatchTestEvent('pointermove', {
    pointerId: 12,
    clientX: 30,
    clientY: 40
  });
  controls.update(1100);
  t.equal(controls.yaw, 0, 'disabled controls ignore movement and auto-rotation');

  controls.setProps({enabled: true});
  controls.update(1200);
  t.equal(controls.yaw, 0.1, 're-enabled controls resume without a stale drag');

  controls.destroy();
  t.end();
});

test('OrbitControls updates camera configuration, preserves live state, and resets fitted poses', t => {
  const controls = new OrbitControls(makeTestCanvas(), {
    yaw: 0.1,
    pitch: 0.2,
    distance: 8,
    maxDistance: 20
  });
  const target: OrbitPosition = [3, 4, 5];

  controls.setProps({
    target,
    yaw: 0.7,
    pitch: 1,
    maxPitch: 0.5,
    distance: 25,
    maxDistance: 15
  });
  target[0] = 100;

  t.deepEqual(controls.props.target, [3, 4, 5], 'copies dynamically updated orbit targets');
  t.equal(controls.yaw, 0.7, 'applies the updated yaw immediately');
  t.equal(controls.pitch, 0.5, 'clamps pitch against its updated limit');
  t.equal(controls.distance, 15, 'clamps distance against its updated limit');

  controls.setProps({minDistance: 2});
  t.equal(controls.distance, 15, 'preserves the live distance when only its limits change');

  controls.yaw = 0;
  controls.pitch = 0;
  controls.distance = 4;
  controls.reset();

  t.equal(controls.yaw, 0.7, 'resets to the latest configured yaw');
  t.equal(controls.pitch, 0.5, 'resets to the latest bounded pitch');
  t.equal(controls.distance, 15, 'resets to the latest bounded distance');

  controls.destroy();
  t.end();
});

test('OrbitControls destroys listeners, restores canvas styles, and releases active capture', t => {
  const canvas = makeTestCanvas();
  const controls = new OrbitControls(canvas);

  canvas.dispatchTestEvent('pointerdown', {
    button: 0,
    pointerId: 4,
    clientX: 0,
    clientY: 0
  });
  t.equal(canvas.listenerCount(), 5, 'registers pointer and wheel listeners');
  t.equal(canvas.hasPointerCapture(4), true, 'captures the active pointer');

  controls.destroy();

  t.equal(canvas.listenerCount(), 0, 'removes every registered pointer and wheel listener');
  t.equal(canvas.hasPointerCapture(4), false, 'releases an active pointer before disposal');
  t.equal(canvas.style.cursor, 'crosshair', 'restores the previous canvas cursor');
  t.equal(canvas.style.touchAction, 'pan-x', 'restores the previous touch-action policy');
  t.end();
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
