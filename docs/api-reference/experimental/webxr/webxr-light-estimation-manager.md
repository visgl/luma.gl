# WebXRLightEstimationManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRLightEstimationManager` is the experimental AR lighting helper for luma.gl. It requests an `XRLightProbe`, resolves `XRFrame.getLightEstimate()` values, exposes the probe pose in the app reference space, and can wrap a WebGL reflection cube-map handle as a borrowed luma [`Texture`](/docs/api-reference/core/resources/texture) when the application supplies the cube-map size.

Request the WebXR `light-estimation` feature when starting the AR session:

```ts
import {
  getWebXRLightEstimationSessionInit,
  WebXRLightEstimationManager
} from '@luma.gl/experimental';

const session = await navigator.xr!.requestSession('immersive-ar', {
  optionalFeatures: ['local-floor', ...getWebXRLightEstimationSessionInit().optionalFeatures!]
});

const lightManager = new WebXRLightEstimationManager({reflectionFormat: 'preferred'});
await lightManager.setSession(session, referenceSpace);
```

Then query the light state from the active XR frame:

```ts
const lightState = lightManager.getLightEstimationState(xrFrame);

if (lightState) {
  const direction = lightState.primaryLightDirection;
  const intensity = lightState.primaryLightIntensity;
  const sphericalHarmonics = lightState.sphericalHarmonicsCoefficients;
}
```

## Types

### `WebXRLightEstimationManagerProps`

```ts
export type WebXRLightEstimationManagerProps = {
  reflectionFormat?: XRReflectionFormat | 'preferred';
  reflectionCubeMapSize?: number;
  textureFormat?: TextureFormat;
  textureUsage?: number;
};
```

`reflectionFormat` defaults to `'srgba8'`. Use `'preferred'` to request `XRSession.preferredReflectionFormat` when the browser exposes it.

`reflectionCubeMapSize` is intentionally explicit. The WebXR light-estimation API exposes a WebGL cube-map handle through `XRWebGLBinding.getReflectionCubeMap()`, but it does not expose the texture dimensions. Without a supplied size, luma.gl returns the raw `WebGLTexture` handle and leaves `reflectionCubeMapTexture` as `null`.

### `WebXRLightEstimationState`

```ts
export type WebXRLightEstimationState = {
  xrFrame: XRFrame;
  session: XRSession;
  lightProbe: XRLightProbe;
  lightEstimate: XRLightEstimate;
  probePose: XRPose | null;
  matrix: Float32Array | null;
  sphericalHarmonicsCoefficients: Float32Array;
  primaryLightDirection: [number, number, number];
  primaryLightIntensity: [number, number, number];
  reflectionCubeMap: WebGLTexture | null;
  reflectionCubeMapTexture: Texture | null;
  reflectionRevision: number;
};
```

`reflectionRevision` increments when the probe emits `reflectionchange`.

## Methods

### `constructor(props?: WebXRLightEstimationManagerProps)`

Creates an inactive manager. Call `setSession()` after the XR session and app reference space are available.

### `setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null, props?: WebXRLightEstimationManagerProps): Promise<this>`

Requests an `XRLightProbe` from the session and listens for session end cleanup. Passing `null` clears the active session.

### `setWebGLBinding(device: Device | null, xrWebGLBinding: WebXRLightEstimationBinding | null): this`

Connects the manager to `XRWebGLBinding.getReflectionCubeMap()`. Reflection cube maps are browser-owned handles; any luma texture wrapper created for them is marked borrowed and destroyed when the session or binding is cleared.

### `getLightEstimationState(xrFrame: XRFrame): WebXRLightEstimationState | null`

Returns the current light estimate for the active probe, or `null` when the session, probe, or browser frame does not provide an estimate.

### `clearSession(): void`

Removes listeners and destroys borrowed reflection texture wrappers.

### `destroy(): void`

Clears the active session and binding.

## Helpers

### `getWebXRLightEstimationSessionInit(props?: WebXRLightEstimationSessionInitProps): XRSessionInit`

Builds a minimal `XRSessionInit` fragment for requesting the `light-estimation` feature.

### `getWebXRReflectionTextureFormat(reflectionFormat?: XRReflectionFormat | 'preferred' | null): TextureFormat`

Maps WebXR reflection formats to luma texture formats:

- `'srgba8'` and `'preferred'` map to `'rgba8unorm-srgb'`.
- `'rgba16f'` maps to `'rgba16float'`.
