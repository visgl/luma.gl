# WebXR Hand Gestures

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`getWebXRHandPinch` derives a simple thumb-to-finger pinch gesture from a `WebXRHandTrackingState`. It reads joint matrices resolved by `WebXRHandTrackingManager` and returns distance, midpoint, active state, and normalized strength.

## Usage

```typescript
import {getWebXRHandPinch, WebXRHandTrackingManager} from '@luma.gl/experimental';

const handManager = new WebXRHandTrackingManager();
handManager.setSession(session, referenceSpace);

const handStates = handManager.getHandsState(xrFrame);
for (const handState of handStates || []) {
  const pinch = getWebXRHandPinch(handState);
  if (pinch?.pinchActive) {
    // Use pinch.position or pinch.inputSource as app interaction input.
  }
}
```

## Types

### `WebXRHandPinchProps`

```ts
export type WebXRHandPinchProps = {
  thumbJointName?: XRHandJoint;
  fingerJointName?: XRHandJoint;
  activeDistance?: number;
  strengthDistance?: number;
};
```

### `WebXRHandPinchState`

```ts
export type WebXRHandPinchState = {
  inputSource: XRInputSource;
  handedness: XRHandedness;
  thumbJoint: WebXRHandJointState;
  fingerJoint: WebXRHandJointState;
  distance: number;
  pinchActive: boolean;
  strength: number;
  position: [number, number, number];
};
```

## Functions

### `getWebXRHandPinch(handState: WebXRHandTrackingState, props?: WebXRHandPinchProps): WebXRHandPinchState | null`

Returns pinch state for one tracked hand, or `null` when either configured joint is missing or untracked.

The default gesture compares `thumb-tip` and `index-finger-tip`, marks the pinch active at `0.025` meters or less, and computes strength across a `0.07` meter falloff distance.
