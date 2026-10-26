# Experimental Engine utilities

These opt-in subpaths expose evolving utilities without adding them to the Engine root API.

| Subpath | Utilities |
| --- | --- |
| `@luma.gl/engine/experimental/controls` | Orbit controls, flat-view and rectangle-selection controllers, and the comparison splitter. |
| `@luma.gl/engine/experimental/materials` | Optical lighting, emissive, glass, transmission, caustics, point-light, and reflective material plugins. |
| `@luma.gl/engine/experimental/textures` | HTML-backed textures and packed-pixel encoding and decoding. |
| `@luma.gl/engine/experimental/webxr` | XR sessions, frame scheduling, camera textures, and input rays. |

```ts
import {ComparisonSplitter} from '@luma.gl/engine/experimental/controls';
import {glassMaterial} from '@luma.gl/engine/experimental/materials';
import {HTMLTexture} from '@luma.gl/engine/experimental/textures';
import {WebXRManager} from '@luma.gl/engine/experimental/webxr';
```

These APIs remain experimental. Scene renderers, shadows, transparency, and scene composition are owned by [`@luma.gl/anari`](/docs/api-reference/scene). GPU graph algorithms and graph-based simulations remain in [`@luma.gl/graph`](/docs/api-reference/graph).
