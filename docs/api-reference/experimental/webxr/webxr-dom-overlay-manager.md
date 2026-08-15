# WebXRDOMOverlayManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRDOMOverlayManager` is the experimental DOM overlay helper for luma.gl. It tracks `XRSession.domOverlayState`, keeps the overlay root associated with the active session, and suppresses `beforexrselect` on overlay UI so DOM controls do not also trigger XR world selection.

## Usage

```typescript
import {WebXRDOMOverlayManager, getWebXRDOMOverlaySessionInit} from '@luma.gl/experimental';

const overlayRoot = document.getElementById('xr-ui');
const session = await navigator.xr.requestSession('immersive-ar', {
  ...getWebXRDOMOverlaySessionInit(overlayRoot),
  optionalFeatures: ['dom-overlay', 'local-floor']
});

const overlayManager = new WebXRDOMOverlayManager({root: overlayRoot});
overlayManager.setSession(session);
const overlayState = overlayManager.getOverlayState();
```

Request the WebXR `dom-overlay` feature with a root element:

```typescript
const sessionInit = {
  optionalFeatures: ['dom-overlay'],
  domOverlay: {root: overlayRoot}
};
```

## Types

### `WebXRDOMOverlayManagerProps`

```ts
export type WebXRDOMOverlayManagerProps = {
  root?: Element | null;
  suppressXRSelectEvents?: boolean;
};
```

### `WebXRDOMOverlaySessionInitProps`

```ts
export type WebXRDOMOverlaySessionInitProps = {
  required?: boolean;
};
```

### `WebXRDOMOverlayState`

```ts
export type WebXRDOMOverlayState = {
  session: XRSession;
  root: Element | null;
  type: XRDOMOverlayType;
};
```

## Methods

### `constructor(props?: WebXRDOMOverlayManagerProps)`

Creates an experimental DOM overlay manager.

### `setSession(session: XRSession | null, props?: WebXRDOMOverlayManagerProps): this`

Attaches or clears the current XR session. When `suppressXRSelectEvents` is true, the manager calls `preventDefault()` for `beforexrselect` events on the overlay root.

### `getOverlayState(): WebXRDOMOverlayState | null`

Returns active DOM overlay state, or `null` when the browser did not enable the feature.

### `clearSession(): void`

Releases session references and removes overlay event listeners without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.

## Functions

### `getWebXRDOMOverlaySessionInit(root: Element, props?: WebXRDOMOverlaySessionInitProps): XRSessionInit`

Builds a minimal `XRSessionInit` fragment for requesting `dom-overlay` with a root element.
