# WebXRDepthSensingManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRDepthSensingManager` is the experimental AR depth-sensing helper for luma.gl. It resolves CPU depth data from `XRFrame.getDepthInformation(view)` and WebGL depth data from `XRWebGLBinding.getDepthInformation(view)`, wrapping browser-owned WebGL depth textures as borrowed luma [`Texture`](/docs/api-reference/core/resources/texture) objects.

## Usage

```typescript
import {WebXRDepthSensingManager, getWebXRDepthSensingSessionInit} from '@luma.gl/experimental';

const session = await navigator.xr.requestSession('immersive-ar', {
  ...getWebXRDepthSensingSessionInit(),
  optionalFeatures: ['depth-sensing', 'local-floor']
});

const depthManager = new WebXRDepthSensingManager();
depthManager.setSession(session);
depthManager.setWebGLBinding(device, xrWebGLBinding);

const depthState = depthManager.getDepthState(
  xrFrame,
  frameState.views.map(view => view.xrView)
);
const firstDepthTexture = depthState?.views[0]?.texture;
```

When requesting `depth-sensing`, WebXR requires a `depthSensing` object with usage and data-format preferences:

```typescript
const sessionInit = {
  optionalFeatures: ['depth-sensing'],
  depthSensing: {
    usagePreference: ['cpu-optimized', 'gpu-optimized'],
    dataFormatPreference: ['luminance-alpha', 'float32', 'unsigned-short']
  }
};
```

## Types

### `WebXRDepthSensingManagerProps`

```ts
export type WebXRDepthSensingManagerProps = {
  textureFormat?: TextureFormat;
  textureUsage?: number;
};
```

### `WebXRDepthSensingSessionInitProps`

```ts
export type WebXRDepthSensingSessionInitProps = {
  required?: boolean;
  usagePreference?: XRDepthUsage[];
  dataFormatPreference?: XRDepthDataFormat[];
  depthTypeRequest?: XRDepthType[];
  matchDepthView?: boolean;
};
```

### `WebXRDepthViewState`

```ts
export type WebXRDepthViewState = {
  xrView: XRView;
  depthInformation: XRDepthInformation;
  cpuDepthInformation: XRCPUDepthInformation | null;
  webGLDepthInformation: XRWebGLDepthInformation | null;
  texture: Texture | null;
  width: number;
  height: number;
  rawValueToMeters: number;
  normDepthBufferFromNormView: XRRigidTransform;
  matrix: Float32Array;
  textureType: XRTextureType | null;
  imageIndex: number | null;
};
```

### `WebXRDepthState`

```ts
export type WebXRDepthState = {
  xrFrame: XRFrame;
  session: XRSession;
  views: readonly WebXRDepthViewState[];
};
```

## Methods

### `constructor(props?: WebXRDepthSensingManagerProps)`

Creates an experimental depth-sensing manager.

### `setSession(session: XRSession | null): this`

Attaches or clears the current XR session. Session end clears borrowed texture wrappers.

### `setWebGLBinding(device: Device | null, xrWebGLBinding: XRWebGLBinding | null): this`

Attaches a WebGL device and `XRWebGLBinding` for GPU-optimized depth sensing. Omit this for CPU-only depth access.

### `getDepthState(xrFrame: XRFrame, xrViews: readonly XRView[]): WebXRDepthState | null`

Resolves depth information for the supplied XR views. Returns `null` when depth sensing is inactive, unsupported, unavailable for the current frame, or when all supplied views lack depth data.

### `clearSession(): void`

Releases session references and destroys borrowed luma texture wrappers without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers and WebGL binding references.

## Functions

### `getWebXRDepthSensingSessionInit(props?: WebXRDepthSensingSessionInitProps): XRSessionInit`

Builds a minimal `XRSessionInit` fragment for requesting the WebXR `depth-sensing` feature with valid `depthSensing` preferences.

### `getWebXRDepthTextureFormat(depthDataFormat?: XRDepthDataFormat | null): TextureFormat`

Maps WebXR depth data formats to luma texture-format metadata: `luminance-alpha` to `rg8unorm`, `float32` to `r32float`, and `unsigned-short` to `r16uint`.
