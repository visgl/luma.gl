# WebXR Bounds

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`getWebXRBoundsState` is an experimental helper for reading room-scale bounds from a `bounded-floor` reference space. It converts `XRBoundedReferenceSpace.boundsGeometry` into numeric points and derives simple center, size, and radius metrics for teleport limits, floor overlays, and room-scale UI.

## Usage

```typescript
import {getWebXRBoundsState, isPointInWebXRBounds} from '@luma.gl/experimental';

await webXRManager.setSession(session, {
  referenceSpaceTypes: ['bounded-floor', 'local-floor', 'local']
});

const boundsState = getWebXRBoundsState(webXRManager.referenceSpace);
if (!boundsState || isPointInWebXRBounds(teleportTarget, boundsState.bounds)) {
  // Move within the bounded room, or allow movement when no bounds are available.
}
```

Request `bounded-floor` as an optional feature when starting an immersive session:

```typescript
const session = await navigator.xr.requestSession('immersive-vr', {
  optionalFeatures: ['bounded-floor', 'local-floor']
});
```

## Types

### `WebXRBoundsPoint`

```ts
export type WebXRBoundsPoint = [x: number, y: number, z: number];
```

### `WebXRBoundsState`

```ts
export type WebXRBoundsState = {
  referenceSpace: XRBoundedReferenceSpace;
  boundsGeometry: readonly DOMPointReadOnly[];
  bounds: readonly WebXRBoundsPoint[];
  center: WebXRBoundsPoint;
  size: WebXRBoundsPoint;
  radius: number;
};
```

## Functions

### `getWebXRBoundsState(referenceSpace: XRReferenceSpace | null): WebXRBoundsState | null`

Returns bounded reference-space geometry and derived metrics, or `null` when the current reference space is not bounded.

### `isWebXRBoundedReferenceSpace(referenceSpace: XRReferenceSpace | null): referenceSpace is XRBoundedReferenceSpace`

Returns whether a reference space exposes `boundsGeometry`.

### `isPointInWebXRBounds(point: readonly [number, number, number], bounds: readonly WebXRBoundsPoint[]): boolean`

Returns whether a point lies inside the horizontal X/Z polygon defined by `bounds`.
