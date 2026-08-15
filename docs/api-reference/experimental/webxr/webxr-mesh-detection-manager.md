# WebXRMeshDetectionManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRMeshDetectionManager` is the experimental AR mesh-detection helper for luma.gl. It reads `XRFrame.detectedMeshes`, resolves each mesh pose in the app reference space, exposes browser-owned `vertices` and `indices`, and reports added, updated, and removed meshes between XR frames.

Request the WebXR `mesh-detection` feature when starting the AR session:

```ts
import {
  getWebXRMeshDetectionSessionInit,
  WebXRMeshDetectionManager
} from '@luma.gl/experimental';

const session = await navigator.xr!.requestSession('immersive-ar', {
  optionalFeatures: ['local-floor', ...getWebXRMeshDetectionSessionInit().optionalFeatures!]
});

const meshManager = new WebXRMeshDetectionManager();
meshManager.setSession(session, referenceSpace);
```

Then query detected meshes from the active XR frame:

```ts
const meshState = meshManager.getMeshDetectionState(xrFrame);

if (meshState) {
  for (const mesh of meshState.meshes) {
    const matrix = mesh.matrix;
    const vertices = mesh.vertices;
    const indices = mesh.indices;
  }
}
```

## Types

### `WebXRMeshDetectionManagerProps`

```ts
export type WebXRMeshDetectionManagerProps = {
  semanticLabels?: readonly string[];
};
```

`semanticLabels` filters meshes by browser-provided labels, when available.

### `WebXRMeshDetectionState`

```ts
export type WebXRMeshDetectionState = {
  xrFrame: XRFrame;
  session: XRSession;
  meshes: readonly WebXRMeshState[];
  added: readonly WebXRMeshState[];
  updated: readonly WebXRMeshState[];
  removed: readonly WebXRMeshState[];
};
```

`added`, `updated`, and `removed` are derived from mesh object identity and `XRMesh.lastChangedTime` compared with the previous successful call to `getMeshDetectionState()`.

### `WebXRMeshState`

```ts
export type WebXRMeshState = {
  xrMesh: XRMesh;
  pose: XRPose;
  matrix: Float32Array;
  vertices: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  triangleCount: number;
  semanticLabel: string | null;
  lastChangedTime: DOMHighResTimeStamp;
};
```

`vertices` are expressed in `XRMesh.meshSpace`. `matrix` places that mesh space in the app reference space.

## Methods

### `constructor(props?: WebXRMeshDetectionManagerProps)`

Creates an inactive manager. Call `setSession()` after the XR session and app reference space are available.

### `setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null, props?: WebXRMeshDetectionManagerProps): this`

Sets the active session and reference space. Passing `null` clears the active session.

### `getMeshDetectionState(xrFrame: XRFrame): WebXRMeshDetectionState | null`

Returns detected mesh state for the active session, or `null` when the browser did not enable or expose `XRFrame.detectedMeshes`.

### `clearSession(): void`

Removes listeners and clears cached mesh state.

### `destroy(): void`

Clears the active session.

## Helpers

### `getWebXRMeshDetectionSessionInit(props?: WebXRMeshDetectionSessionInitProps): XRSessionInit`

Builds a minimal `XRSessionInit` fragment for requesting the `mesh-detection` feature.
