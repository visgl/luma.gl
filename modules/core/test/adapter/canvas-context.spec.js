// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import { CanvasContext, PresentationContext } from '@luma.gl/core';
import { isBrowser } from '@probe.gl/env';
import { getTestDevices, getWebGLTestDevice } from '@luma.gl/test-utils';
/** Mock CanvasContext */
class TestCanvasContext extends CanvasContext {
    handle = null;
    [Symbol.toStringTag] = 'TestCanvasContext';
    // @ts-expect-error
    device = {
        limits: { maxTextureDimension2D: 1024 },
        props: {
            onResize: () => { },
            onDevicePixelRatioChange: () => { },
            onVisibilityChange: () => { },
            onPositionChange: () => { }
        }
    };
    _getCurrentFramebuffer() {
        throw new Error('test');
    }
    _configureDevice() {
        // Mock update device
    }
}
/** Mock PresentationContext */
class TestPresentationContext extends PresentationContext {
    [Symbol.toStringTag] = 'TestPresentationContext';
    // @ts-expect-error
    device = {
        limits: { maxTextureDimension2D: 1024 },
        props: {
            onResize: () => { },
            onDevicePixelRatioChange: () => { },
            onVisibilityChange: () => { },
            onPositionChange: () => { }
        }
    };
    present() { }
    _getCurrentFramebuffer() {
        throw new Error('test');
    }
    _configureDevice() {
        // Mock update device
    }
}
function createCanvasContextSpyDevice() {
    const calls = { onResize: 0, onVisibilityChange: 0 };
    return {
        calls,
        device: {
            limits: { maxTextureDimension2D: 1024 },
            props: {
                onResize: () => {
                    calls.onResize++;
                },
                onVisibilityChange: () => {
                    calls.onVisibilityChange++;
                },
                onDevicePixelRatioChange: () => { },
                onPositionChange: () => { }
            }
        }
    };
}
function createContextSuite(label, createContext) {
    test(`${label}#_handleIntersection does not call callbacks when destroyed`, t => {
        if (!isBrowser()) {
            t.end();
            return;
        }
        const { calls, device } = createCanvasContextSpyDevice();
        const canvasContext = createContext();
        // @ts-expect-error read only
        canvasContext.device = device;
        canvasContext._handleIntersection([
            { target: canvasContext.canvas, isIntersecting: false }
        ]);
        t.equal(calls.onVisibilityChange, 1, 'visibility change is observed when context is active');
        calls.onVisibilityChange = 0;
        // @ts-expect-error read only
        canvasContext.destroyed = true;
        canvasContext._handleIntersection([
            { target: canvasContext.canvas, isIntersecting: true }
        ]);
        t.equal(calls.onVisibilityChange, 0, 'destroyed context does not emit visibility events');
        t.end();
    });
    test(`${label}#_handleResize does not call callbacks when destroyed`, t => {
        if (!isBrowser()) {
            t.end();
            return;
        }
        const { calls, device } = createCanvasContextSpyDevice();
        const canvasContext = createContext();
        // @ts-expect-error read only
        canvasContext.device = device;
        canvasContext._handleResize([
            {
                target: canvasContext.canvas,
                contentBoxSize: [{ inlineSize: 10, blockSize: 20 }]
            }
        ]);
        t.equal(calls.onResize, 1, 'resize is observed when context is active');
        calls.onResize = 0;
        // @ts-expect-error read only
        canvasContext.destroyed = true;
        canvasContext._handleResize([
            {
                target: canvasContext.canvas,
                contentBoxSize: [{ inlineSize: 20, blockSize: 40 }]
            }
        ]);
        t.equal(calls.onResize, 0, 'destroyed context does not emit resize events');
        t.end();
    });
    test(`${label}#destroy is idempotent`, t => {
        if (!isBrowser()) {
            t.end();
            return;
        }
        const calls = { resizeObserverDisconnect: 0, intersectionObserverDisconnect: 0 };
        const canvasContext = createContext();
        // @ts-expect-error read only
        canvasContext._resizeObserver = {
            disconnect: () => {
                calls.resizeObserverDisconnect++;
            }
        };
        // @ts-expect-error read only
        canvasContext._intersectionObserver = {
            disconnect: () => {
                calls.intersectionObserverDisconnect++;
            }
        };
        t.doesNotThrow(() => {
            canvasContext.destroy();
            canvasContext.destroy();
        }, 'destroying twice should be safe');
        t.equal(calls.resizeObserverDisconnect, 1, 'resize observer disconnected exactly once');
        t.equal(calls.intersectionObserverDisconnect, 1, 'intersection observer disconnected exactly once');
        t.end();
    });
    test(`${label}#destroy cancels deferred DPR timer`, t => {
        if (!isBrowser()) {
            t.end();
            return;
        }
        const globalScope = globalThis;
        const originalSetTimeout = globalScope.setTimeout;
        const originalClearTimeout = globalScope.clearTimeout;
        let capturedTimeoutId = null;
        let capturedCallback = null;
        let clearTimeoutCalls = 0;
        globalScope.setTimeout = (callback) => {
            capturedCallback = callback;
            capturedTimeoutId = 1;
            return capturedTimeoutId;
        };
        globalScope.clearTimeout = (id) => {
            clearTimeoutCalls++;
            t.equal(id, capturedTimeoutId, 'clearTimeout called with deferred DPR timer id');
        };
        try {
            const canvasContext = createContext();
            canvasContext.destroy();
            t.equal(clearTimeoutCalls, 1, 'deferred DPR timer is canceled on destroy');
            if (capturedCallback) {
                t.doesNotThrow(() => capturedCallback(), 'DPR callback after destroy should not crash');
            }
            else {
                t.fail('DPR callback should be scheduled by constructor');
            }
            t.doesNotThrow(() => {
                canvasContext.destroy();
            }, 'destroy can still be called after callback has been handled');
        }
        finally {
            globalScope.setTimeout = originalSetTimeout;
            globalScope.clearTimeout = originalClearTimeout;
        }
        t.end();
    });
}
test('CanvasContext#defined', t => {
    t.ok(CanvasContext, 'CanvasContext defined');
    // t.ok(new WEBGLCanvasContext()), 'Context creation ok');
    t.end();
});
test('CanvasContext', t => {
    if (isBrowser()) {
        let canvasContext = new TestCanvasContext();
        t.ok(canvasContext);
        canvasContext = new TestCanvasContext({ useDevicePixels: false });
        t.ok(canvasContext);
        t.deepEqual(canvasContext.getDevicePixelSize(), [800, 600]);
    }
    t.end();
});
test('PresentationContext#defined', t => {
    t.ok(PresentationContext, 'PresentationContext defined');
    t.end();
});
createContextSuite('CanvasContext', () => new TestCanvasContext());
createContextSuite('PresentationContext', () => new TestPresentationContext());
test('CanvasContext#destroy nulls device to catch later access', t => {
    if (!isBrowser()) {
        t.end();
        return;
    }
    const canvasContext = new TestCanvasContext();
    canvasContext.destroy();
    // @ts-expect-error
    t.equal(canvasContext.device, null, 'destroyed context device should be null');
    t.end();
});
test('CanvasContext#getDevicePixelRatio', async (t) => {
    const windowPixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const TEST_CASES = [
        {
            name: 'useDevicePixels: true: should use window.devicePixelRatio or 1',
            useDevicePixels: true,
            expected: windowPixelRatio
            // TODO - would require mocking window.devicePixelRatio
            // },
            // {
            //   name: 'useDevicePixels: false: should use 1',
            //   useDevicePixels: false,
            //   expected: 1
            // },
            // {
            //   name: 'Non Finite useDevicePixels null: should use 1',
            //   useDevicePixels: null,
            //   expected: 1
            // },
            // {
            //   name: 'Non valid useDevicePixels 0: should use 1',
            //   useDevicePixels: 0,
            //   expected: 1
            // },
            // {
            //   name: 'Non valid useDevicePixels negative: should use 1',
            //   useDevicePixels: -3.2,
            //   expected: 1
            // },
            // {
            //   name: 'Valid useDevicePixels, should use it',
            //   useDevicePixels: 1.5,
            //   expected: 1.5
        }
    ];
    for (const device of await getTestDevices()) {
        TEST_CASES.forEach(tc => {
            const result = device.getDefaultCanvasContext().getDevicePixelRatio(tc.useDevicePixels);
            t.equal(result, tc.expected, tc.name);
        });
    }
    t.end();
});
// TODO - can these tests be moved up into canvas-context.spec?
const LOW_DPR = 0.5;
const HIGH_DPR = 4;
const HIGH_DPR_FRACTION = 2.5;
const MAP_TEST_CASES = [
    {
        name: 'device pixel ratio 1',
        drawingBufferWidth: 10,
        drawingBufferHeight: 10,
        clientWidth: 10,
        clientHeight: 10,
        ratio: 1,
        windowPositions: [
            [0, 0],
            [2, 2],
            [9, 9]
        ],
        devicePositionsInverted: [
            {
                x: 0,
                y: 9,
                width: 1,
                height: 1
            },
            {
                x: 2,
                y: 7,
                width: 1,
                height: 1
            },
            {
                x: 9,
                y: 0,
                width: 1,
                height: 1
            }
        ],
        devicePositions: [
            {
                x: 0,
                y: 0,
                width: 1,
                height: 1
            },
            {
                x: 2,
                y: 2,
                width: 1,
                height: 1
            },
            {
                x: 9,
                y: 9,
                width: 1,
                height: 1
            }
        ]
    },
    {
        name: 'device pixel ratio 1, 1X1 window',
        drawingBufferWidth: 1,
        drawingBufferHeight: 1,
        clientWidth: 1,
        clientHeight: 1,
        ratio: 1,
        windowPositions: [[0, 0]],
        devicePositionsInverted: [
            {
                x: 0,
                y: 0,
                width: 1,
                height: 1
            }
        ],
        devicePositions: [
            {
                x: 0,
                y: 0,
                width: 1,
                height: 1
            }
        ]
    },
    {
        name: 'device pixel ratio > 1',
        drawingBufferWidth: 10 * HIGH_DPR,
        drawingBufferHeight: 10 * HIGH_DPR,
        clientWidth: 10,
        clientHeight: 10,
        ratio: HIGH_DPR,
        yInvert: true,
        windowPositions: [
            [0, 0],
            [2, 2],
            [9, 9]
        ],
        // 0 4 8 12 16 20 24 28 32 36 40
        // 0 1 2 3  4  5  6  7  8  9
        devicePositionsInverted: [
            {
                x: 0,
                y: 36,
                width: 4,
                height: 4
            },
            {
                x: 8,
                y: 28,
                width: 4,
                height: 4
            },
            {
                x: 36,
                y: 0,
                width: 4,
                height: 4
            }
        ],
        devicePositions: [
            {
                x: 0,
                y: 0,
                width: 4,
                height: 4
            },
            {
                x: 8,
                y: 8,
                width: 4,
                height: 4
            },
            {
                x: 36,
                y: 36,
                width: 4,
                height: 4
            }
        ]
    },
    {
        name: 'device pixel ratio > 1 (fraction)',
        drawingBufferWidth: 10 * HIGH_DPR_FRACTION,
        drawingBufferHeight: 10 * HIGH_DPR_FRACTION,
        clientWidth: 10,
        clientHeight: 10,
        ratio: HIGH_DPR_FRACTION,
        yInvert: true,
        windowPositions: [
            [0, 0],
            [2, 2],
            [9, 9]
        ],
        // round (2.5) = 3
        // CSS size :   10X10
        // Device size: 25X25
        // CSS:           0  1    2   3    4   5   6  7   8  9   10
        // Device:        0  3    5   8   10  13   15 18  20 23  25
        // Device Ynvert: 24 21   19  16  14  11   9  6   4  1   -1
        devicePositionsInverted: [
            {
                x: 0,
                y: 22,
                width: 3,
                height: 3
            },
            {
                x: 5,
                y: 17,
                width: 3,
                height: 3
            },
            {
                x: 23,
                y: 0,
                width: 2,
                height: 2
            }
        ],
        devicePositions: [
            {
                x: 0,
                y: 0,
                width: 3,
                height: 3
            },
            {
                x: 5,
                y: 5,
                width: 3,
                height: 3
            },
            {
                x: 23,
                y: 23,
                width: 2,
                height: 2
            }
        ]
    },
    {
        name: 'device pixel ratio < 1',
        drawingBufferWidth: 10 * LOW_DPR,
        drawingBufferHeight: 10 * LOW_DPR,
        clientWidth: 10,
        clientHeight: 10,
        ratio: LOW_DPR,
        yInvert: true,
        windowPositions: [
            [0, 0],
            [1, 1],
            [2, 2],
            [8, 8]
        ],
        devicePositionsInverted: [
            {
                x: 0,
                y: 4,
                width: 1,
                height: 1
            },
            {
                x: 1,
                y: 4,
                width: 1,
                height: 1
            },
            {
                x: 1,
                y: 3,
                width: 1,
                height: 1
            },
            {
                x: 4,
                y: 0,
                width: 1,
                height: 1
            }
        ],
        devicePositions: [
            {
                x: 0,
                y: 0,
                width: 1,
                height: 1
            },
            // [1, 1] and [2, 2] point to the same pixel
            {
                x: 1,
                y: 1,
                width: 1,
                height: 1
            },
            {
                x: 1,
                y: 1,
                width: 1,
                height: 1
            },
            {
                x: 4,
                y: 4,
                width: 1,
                height: 1
            }
        ]
    }
];
test.skip('WebGLCanvasContext#cssToDevicePixels', async (t) => {
    // Create a fresh device since are going to modify it
    const canvasContextDevice = await getWebGLTestDevice();
    const canvasContext = canvasContextDevice?.canvasContext;
    MAP_TEST_CASES.forEach(tc => {
        if (canvasContext) {
            configureCanvasContext(canvasContext, tc);
        }
        tc.windowPositions.forEach((wPos, i) => {
            // by default yInvert is true
            t.deepEqual(canvasContext?.cssToDevicePixels(tc.windowPositions[i]), tc.devicePositionsInverted[i], `${tc.name}(yInvert=true): device pixel should be ${JSON.stringify(tc.devicePositionsInverted[i])} for window position ${tc.windowPositions[i]}`);
            t.deepEqual(canvasContext?.cssToDevicePixels(tc.windowPositions[i], false), tc.devicePositions[i], `${tc.name}(yInvert=false): device pixel should match`);
        });
    });
    t.end();
});
test.skip('WebGLCanvasContext#cssToDeviceRatio', async (t) => {
    const canvasContextDevice = await getWebGLTestDevice();
    const canvasContext = canvasContextDevice?.canvasContext;
    MAP_TEST_CASES.forEach(tc => {
        if (canvasContext) {
            configureCanvasContext(canvasContext, tc);
        }
        t.equal(canvasContext?.cssToDeviceRatio(), tc.ratio, 'cssToDeviceRatio should return correct value');
    });
    t.end();
});
