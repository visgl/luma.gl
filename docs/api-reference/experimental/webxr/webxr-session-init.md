# WebXR Session Init

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`mergeWebXRSessionInit` composes `XRSessionInit` dictionaries from WebXR feature helpers. It de-duplicates feature descriptors, keeps required features out of the optional list, and preserves module-specific fields such as `depthSensing`, `domOverlay`, and `trackedImages`.

## Usage

```typescript
import {
  getWebXRDepthSensingSessionInit,
  mergeWebXRSessionInit
} from '@luma.gl/experimental';

const sessionInit = mergeWebXRSessionInit(
  {requiredFeatures: ['webgpu'], optionalFeatures: ['local-floor', 'depth-sensing']},
  getWebXRDepthSensingSessionInit()
);

const session = await navigator.xr!.requestSession('immersive-ar', sessionInit);
```

## Constants

### `WEBXR_DEFAULT_SESSION_SUPPORT_MODES`

```ts
export const WEBXR_DEFAULT_SESSION_SUPPORT_MODES: readonly XRSessionMode[] = [
  'immersive-vr',
  'immersive-ar',
  'inline'
];
```

## Types

### `WebXRSessionFeatures`

```ts
export type WebXRSessionFeatures = {
  requiredFeatures: readonly string[];
  optionalFeatures: readonly string[];
  requestedFeatures: readonly string[];
};
```

### `WebXRSessionSupport`

```ts
export type WebXRSessionSupport = {
  xr: XRSystem | null;
  isSupported: boolean;
  modes: Partial<Record<XRSessionMode, boolean>>;
  supportedModes: readonly XRSessionMode[];
};
```

## Functions

### `mergeWebXRSessionInit(...sessionInits): XRSessionInit`

Merges any number of `XRSessionInit` dictionaries. Required and optional features are de-duplicated in insertion order. If a feature is required by any input, it is removed from the merged optional feature list.

### `getWebXRSessionFeatures(sessionInit): WebXRSessionFeatures`

Returns normalized required, optional, and combined requested feature lists from one session init.

### `isWebXRSessionFeatureEnabled(session, feature): boolean`

Returns whether `XRSession.enabledFeatures` contains a feature descriptor.

### `getWebXRSessionSupport(props?): Promise<WebXRSessionSupport>`

Checks `XRSystem.isSessionSupported()` for the requested modes. Missing `navigator.xr` and rejected support probes are reported as unsupported.
