# WebXRReferenceSpaceManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRReferenceSpaceManager` is an experimental helper for tracking `XRReferenceSpace` reset events. Resets can happen when the native origin or effective origin changes, so apps can use this state to rebuild cached anchors, floor overlays, teleport limits, or diagnostics after the browser reports a discontinuity.

## Usage

```typescript
import {WebXRReferenceSpaceManager} from '@luma.gl/experimental';

const referenceSpaceManager = new WebXRReferenceSpaceManager();

referenceSpaceManager.setReferenceSpace(referenceSpace);

const state = referenceSpaceManager.getReferenceSpaceState();
if (state?.lastResetEvent) {
  // Rebuild cached scene state that depends on the old reference-space origin.
}
```

## Types

### `WebXRReferenceSpaceResetState`

```ts
export type WebXRReferenceSpaceResetState = {
  referenceSpace: XRReferenceSpace;
  resetCount: number;
  lastResetEvent: XRReferenceSpaceEvent | null;
  transform: XRRigidTransform | null;
  matrix: Float32Array | null;
};
```

## Methods

### `setReferenceSpace(referenceSpace: XRReferenceSpace | null): this`

Attaches or clears the current reference space. When a reference space is attached, the manager listens for `reset` events.

### `getReferenceSpaceState(): WebXRReferenceSpaceResetState | null`

Returns the current reference-space state, including the reset count and last reset transform, or `null` when no reference space is attached.

### `getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace | null`

Calls `XRReferenceSpace.getOffsetReferenceSpace()` on the active reference space when the browser exposes it. Returns `null` when no active reference space or offset API is available.

### `clearReferenceSpace(): void`

Removes event listeners and clears the active reference-space state.

### `destroy(): void`

Clears the current reference-space wrapper.

## Functions

### `makeWebXRReferenceSpaceState(referenceSpace, resetCount, lastResetEvent): WebXRReferenceSpaceResetState`

Creates a reference-space state snapshot from a reference space and its last reset event.
