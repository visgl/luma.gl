# WebXRReferenceSpaceManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRReferenceSpaceManager` is an experimental helper for tracking `XRReferenceSpace` reset events. Resets can happen when the native origin or effective origin changes, so apps can use this state to rebuild cached anchors, floor overlays, teleport limits, or diagnostics after the browser reports a discontinuity.

The teleport helpers turn a floor-space target into an `XRRigidTransform` origin offset and optional offset reference space. By default they invert the target X/Z coordinates and preserve viewer height, matching common room-scale teleport behavior.

## Usage

```typescript
import {WebXRReferenceSpaceManager} from '@luma.gl/experimental';

const referenceSpaceManager = new WebXRReferenceSpaceManager();

referenceSpaceManager.setReferenceSpace(referenceSpace);

const state = referenceSpaceManager.getReferenceSpaceState();
if (state?.lastResetEvent) {
  // Rebuild cached scene state that depends on the old reference-space origin.
}

const teleportState = referenceSpaceManager.getTeleportReferenceSpace(floorHit, {
  bounds: boundsState?.bounds
});
if (teleportState) {
  referenceSpace = teleportState.offsetReferenceSpace;
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

### `WebXRTeleportOffsetProps`

```ts
export type WebXRTeleportOffsetProps = {
  bounds?: readonly WebXRBoundsPoint[] | null;
  preserveY?: boolean;
  invert?: boolean;
  orientation?: DOMPointInit;
};
```

### `WebXRTeleportState`

```ts
export type WebXRTeleportState = {
  referenceSpace: XRReferenceSpace;
  offsetReferenceSpace: XRReferenceSpace;
  originOffset: XRRigidTransform;
  target: NumberArray3;
  translation: NumberArray3;
};
```

## Methods

### `setReferenceSpace(referenceSpace: XRReferenceSpace | null): this`

Attaches or clears the current reference space. When a reference space is attached, the manager listens for `reset` events.

### `getReferenceSpaceState(): WebXRReferenceSpaceResetState | null`

Returns the current reference-space state, including the reset count and last reset transform, or `null` when no reference space is attached.

### `getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace | null`

Calls `XRReferenceSpace.getOffsetReferenceSpace()` on the active reference space when the browser exposes it. Returns `null` when no active reference space or offset API is available.

### `getTeleportReferenceSpace(target, props?): WebXRTeleportState | null`

Creates a teleport origin offset and applies it to the active reference space. Returns `null` when no active reference space is attached, the browser lacks offset-reference-space support, `XRRigidTransform` is unavailable, or the target is outside supplied bounds.

### `clearReferenceSpace(): void`

Removes event listeners and clears the active reference-space state.

### `destroy(): void`

Clears the current reference-space wrapper.

## Functions

### `makeWebXRReferenceSpaceState(referenceSpace, resetCount, lastResetEvent): WebXRReferenceSpaceResetState`

Creates a reference-space state snapshot from a reference space and its last reset event.

### `getWebXRTeleportState(referenceSpace, target, props?): WebXRTeleportState | null`

Creates a teleport origin offset and returns the offset reference space state for a supplied reference space.

### `makeWebXRTeleportOffset(target, props?): XRRigidTransform | null`

Creates an `XRRigidTransform` offset for a teleport target. Returns `null` when `XRRigidTransform` is unavailable or supplied bounds reject the target.

### `getWebXRTeleportTranslation(target, props?): NumberArray3`

Returns the translation used for a teleport offset. Defaults to `[-target.x, 0, -target.z]`; set `preserveY: false` to include Y and `invert: false` to keep the target sign.

### `isWebXRTeleportTargetAllowed(target, bounds?): boolean`

Returns `true` when no bounds are supplied or the target is inside the supplied bounded-floor polygon.
