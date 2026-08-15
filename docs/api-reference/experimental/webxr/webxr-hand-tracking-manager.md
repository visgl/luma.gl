# WebXRHandTrackingManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRHandTrackingManager` is the experimental articulated hand helper for luma.gl. It resolves WebXR `XRInputSource.hand` joint spaces into app-reference-space matrices and joint radii using `XRFrame.fillPoses()` and `XRFrame.fillJointRadii()`, with `XRFrame.getJointPose()` as a fallback.

## Usage

```typescript
import {WebXRHandTrackingManager} from '@luma.gl/experimental';

const session = await navigator.xr.requestSession('immersive-vr', {
  optionalFeatures: ['hand-tracking', 'local-floor']
});

const handManager = new WebXRHandTrackingManager();
handManager.setSession(session, webXRManager.referenceSpace);

const handStates = handManager.getHandsState(xrFrame);
const indexTip = handStates?.[0]?.joints.find(joint => joint.jointName === 'index-finger-tip');
```

Request the WebXR `hand-tracking` feature when starting an immersive session:

```typescript
const session = await navigator.xr.requestSession('immersive-vr', {
  optionalFeatures: ['hand-tracking', 'local-floor']
});
```

## Constants

### `WEBXR_HAND_JOINTS`

The ordered list of 25 standard WebXR hand joints, from `wrist` through each thumb, index, middle, ring, and pinky joint.

## Types

### `WebXRHandJointState`

```ts
export type WebXRHandJointState = {
  jointName: XRHandJoint;
  jointSpace: XRJointSpace;
  pose: XRJointPose | null;
  matrix: Float32Array | null;
  radius: number | null;
};
```

### `WebXRHandTrackingState`

```ts
export type WebXRHandTrackingState = {
  xrFrame: XRFrame;
  inputSource: XRInputSource;
  handedness: XRHandedness;
  hand: XRHand;
  joints: readonly WebXRHandJointState[];
  matrices: Float32Array;
  radii: Float32Array;
  allJointsTracked: boolean;
};
```

## Methods

### `constructor()`

Creates an experimental hand-tracking manager.

### `setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null): this`

Attaches or clears the current XR session. A reference space is required for active sessions because joint matrices are resolved into that app space.

### `getHandsState(xrFrame: XRFrame, inputSources?: readonly XRInputSource[]): readonly WebXRHandTrackingState[] | null`

Resolves hand states for all current session input sources, or for a supplied input-source list.

### `getHandState(xrFrame: XRFrame, inputSource: XRInputSource): WebXRHandTrackingState | null`

Resolves one input source if it exposes `XRInputSource.hand`; returns `null` for controller, gaze, or screen input sources without hand tracking.

### `clearSession(): void`

Releases session references without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.
