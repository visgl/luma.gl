# Hello React - Spinning Cube Example

This example demonstrates how to use luma.gl with React and tests the canvas context race condition fixes.

## What This Example Shows

- How to integrate luma.gl with React using hooks
- Proper device and animation loop lifecycle management in React
- Testing race condition fixes with component mount/unmount
- Using React StrictMode to catch potential issues

## The Bug Fix Being Tested

This example specifically tests fixes for a race condition where:

1. **Orphaned Canvas Context**: When `_reuseDevices` is enabled (common in React apps), the `WebGLDevice` constructor could create a canvas context and then return early when reusing an existing device. The orphaned canvas context's ResizeObserver would continue firing callbacks with an undefined device reference.

2. **Observer Cleanup**: ResizeObserver and IntersectionObserver were not being disconnected when the canvas context was destroyed, causing callbacks to fire after destruction.

## How to Run

```fish
cd examples/tutorials/hello-react
yarn install
yarn start
```

## Testing the Bug Fix

1. Click "Hide Cube" to unmount the component
2. Resize the browser window while the cube is hidden
3. Click "Show Cube" to remount the component
4. Check the console - there should be NO errors
5. Repeat multiple times to verify stability

### What Would Happen Without the Fix

Without the race condition fixes, you would see this error in the console when resizing the window after unmounting:

```
Uncaught TypeError: Cannot read properties of undefined (reading 'maxTextureDimension2D')
    at WebGLCanvasContext.getMaxDrawingBufferSize (canvas-context.js:169:1)
    at WebGLCanvasContext._handleResize (canvas-context.js:267:1)
    at ResizeObserver.eval (canvas-context.js:116:1)
```

## React StrictMode

This example runs in React StrictMode, which intentionally double-mounts components during development. This is perfect for catching race conditions and ensuring proper cleanup!

## Implementation Details

The example uses:
- `useEffect` for managing the device and animation loop lifecycle
- `useRef` to store device and animation loop instances
- Proper cleanup in the effect's return function
- A toggle button to demonstrate mount/unmount behavior
