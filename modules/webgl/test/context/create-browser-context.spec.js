// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import { createBrowserContext } from '@luma.gl/webgl/context/helpers/create-browser-context';
function createMockCanvas(getContextImpl) {
    const listeners = {};
    const dispatchEvent = (type, event) => {
        for (const listener of listeners[type] || []) {
            if (typeof listener === 'function') {
                listener(event);
            }
            else if (listener && typeof listener.handleEvent === 'function') {
                listener.handleEvent(event);
            }
        }
    };
    const canvas = {
        addEventListener: (type, listener) => {
            listeners[type] = listeners[type] || new Set();
            listeners[type].add(listener);
        },
        removeEventListener: (type, listener) => {
            listeners[type]?.delete(listener);
        },
        getContext: (type, attributes) => getContextImpl(type, attributes)
    };
    const getListenerCount = (type) => listeners[type]?.size ?? 0;
    return { canvas, dispatchEvent, getListenerCount };
}
test('createBrowserContext captures creation errors', t => {
    const mock = createMockCanvas(() => {
        mock.dispatchEvent('webglcontextcreationerror', {
            statusMessage: 'Mock GPU unavailable'
        });
        return null;
    });
    t.throws(() => createBrowserContext(mock.canvas, { onContextLost: () => { }, onContextRestored: () => { } }, { failIfMajorPerformanceCaveat: true }), /Failed to create WebGL context: Mock GPU unavailable/, 'throws with captured status message');
    t.equals(mock.getListenerCount('webglcontextcreationerror'), 0, 'creation listener removed after failure');
    t.end();
});
test('createBrowserContext falls back to software renderer', t => {
    const gl = {};
    let creationCalls = 0;
    const mock = createMockCanvas((_type, attributes) => {
        creationCalls += 1;
        if (!attributes?.failIfMajorPerformanceCaveat) {
            return gl;
        }
        return null;
    });
    const context = createBrowserContext(mock.canvas, { onContextLost: () => { }, onContextRestored: () => { } }, { failIfMajorPerformanceCaveat: false });
    t.equals(context, gl, 'returns context from second creation attempt');
    t.equals(creationCalls, 2, 'attempts creation twice before succeeding');
    t.equals(gl.luma?.softwareRenderer, true, 'marks context as software renderer');
    t.equals(mock.getListenerCount('webglcontextcreationerror'), 0, 'creation listener removed after success');
    t.equals(mock.getListenerCount('webglcontextlost'), 1, 'context lost listener registered');
    t.equals(mock.getListenerCount('webglcontextrestored'), 1, 'context restored listener registered');
    t.end();
});
