import {expect, test} from 'vitest';
import { createBrowserContext } from '@luma.gl/webgl/context/helpers/create-browser-context';
type ListenerMap = Record<string, Set<EventListener>>;
type MockCanvas = {
  canvas: HTMLCanvasElement;
  dispatchEvent: (type: string, event: Event) => void;
  getListenerCount: (type: string) => number;
};
function createMockCanvas(getContextImpl: (type: string, attributes?: WebGLContextAttributes) => any): MockCanvas {
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
    getContext: (type: string, attributes?: WebGLContextAttributes) => getContextImpl(type, attributes)
  } as unknown as HTMLCanvasElement;
  const getListenerCount = (type: string) => listeners[type]?.size ?? 0;
  return {
    canvas,
    dispatchEvent,
    getListenerCount
  };
}
test('createBrowserContext captures creation errors', () => {
  const mock = createMockCanvas(() => {
    mock.dispatchEvent('webglcontextcreationerror', {
      statusMessage: 'Mock GPU unavailable'
    } as Event);
    return null;
  });
  expect(() => createBrowserContext(mock.canvas, {
    onContextLost: () => {},
    onContextRestored: () => {}
  }, {
    failIfMajorPerformanceCaveat: true
  }), 'throws with captured status message').toThrow(/Failed to create WebGL context: Mock GPU unavailable/);
  expect(mock.getListenerCount('webglcontextcreationerror'), 'creation listener removed after failure').toBe(0);
});
test('createBrowserContext falls back to software renderer', () => {
  const gl = {} as WebGL2RenderingContext & {
    luma?: Record<string, unknown>;
  };
  let creationCalls = 0;
  const mock = createMockCanvas((_type, attributes) => {
    creationCalls += 1;
    if (!attributes?.failIfMajorPerformanceCaveat) {
      return gl;
    }
    return null;
  });
  const context = createBrowserContext(mock.canvas, {
    onContextLost: () => {},
    onContextRestored: () => {}
  }, {
    failIfMajorPerformanceCaveat: false
  });
  expect(context, 'returns context from second creation attempt').toBe(gl);
  expect(creationCalls, 'attempts creation twice before succeeding').toBe(2);
  expect((gl.luma as {
    softwareRenderer?: boolean;
  } | undefined)?.softwareRenderer, 'marks context as software renderer').toBe(true);
  expect(mock.getListenerCount('webglcontextcreationerror'), 'creation listener removed after success').toBe(0);
  expect(mock.getListenerCount('webglcontextlost'), 'context lost listener registered').toBe(1);
  expect(mock.getListenerCount('webglcontextrestored'), 'context restored listener registered').toBe(1);
});
