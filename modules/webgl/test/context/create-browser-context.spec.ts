// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {createBrowserContext} from '@luma.gl/webgl/context/helpers/create-browser-context';

type ListenerMap = Record<string, Set<EventListener>>;

type MockCanvas = {
  canvas: HTMLCanvasElement;
  dispatchEvent: (type: string, event: Event) => void;
  getListenerCount: (type: string) => number;
};

function createMockCanvas(
  getContextImpl: (type: string, attributes?: WebGLContextAttributes) => any
): MockCanvas {
  const listeners: ListenerMap = {};

  const dispatchEvent = (type: string, event: Event) => {
    for (const listener of listeners[type] || []) {
      if (typeof listener === 'function') {
        listener(event);
      } else if (listener && typeof (listener as any).handleEvent === 'function') {
        (listener as any).handleEvent(event);
      }
    }
  };

  const canvas = {
    addEventListener: (type: string, listener: EventListener) => {
      listeners[type] = listeners[type] || new Set<EventListener>();
      listeners[type].add(listener);
    },
    removeEventListener: (type: string, listener: EventListener) => {
      listeners[type]?.delete(listener);
    },
    getContext: (type: string, attributes?: WebGLContextAttributes) =>
      getContextImpl(type, attributes)
  } as unknown as HTMLCanvasElement;

  const getListenerCount = (type: string) => listeners[type]?.size ?? 0;

  return {canvas, dispatchEvent, getListenerCount};
}

test('createBrowserContext captures creation errors', t => {
  const mock = createMockCanvas(() => {
    mock.dispatchEvent('webglcontextcreationerror', {
      statusMessage: 'Mock GPU unavailable'
    } as Event);
    return null;
  });

  t.throws(
    () =>
      createBrowserContext(
        mock.canvas,
        {onContextLost: () => {}, onContextRestored: () => {}},
        {failIfMajorPerformanceCaveat: true}
      ),
    /Failed to create WebGL context: Mock GPU unavailable/,
    'throws with captured status message'
  );
  t.equals(
    mock.getListenerCount('webglcontextcreationerror'),
    0,
    'creation listener removed after failure'
  );
  t.end();
});

test('createBrowserContext falls back to software renderer', t => {
  const gl = {} as WebGL2RenderingContext & {luma?: Record<string, unknown>};
  let creationCalls = 0;
  const mock = createMockCanvas((_type, attributes) => {
    creationCalls += 1;
    if (!attributes?.failIfMajorPerformanceCaveat) {
      return gl;
    }
    return null;
  });

  const context = createBrowserContext(
    mock.canvas,
    {onContextLost: () => {}, onContextRestored: () => {}},
    {failIfMajorPerformanceCaveat: false}
  );

  t.equals(context, gl, 'returns context from second creation attempt');
  t.equals(creationCalls, 2, 'attempts creation twice before succeeding');
  t.deepEquals(gl.luma, {softwareRenderer: true}, 'marks context as software renderer');
  t.equals(
    mock.getListenerCount('webglcontextcreationerror'),
    0,
    'creation listener removed after success'
  );
  t.equals(mock.getListenerCount('webglcontextlost'), 1, 'context lost listener registered');
  t.equals(
    mock.getListenerCount('webglcontextrestored'),
    1,
    'context restored listener registered'
  );
  t.end();
});
