# @luma.gl/text

Experimental text utilities for generating 3D text geometries compatible with the luma.gl engine. The implementation adapts THREE.js text and extrusion utilities for creating vertex data from typeface JSON fonts.

## Usage

```ts
import {TextGeometry, parseFont} from '@luma.gl/text'
import helvetiker from './fonts/helvetiker_regular.typeface.json'

const font = parseFont(helvetiker)
const geometry = new TextGeometry('Hello luma.gl', {
  font,
  size: 24,
  depth: 4,
  curveSegments: 8,
  bevelEnabled: true,
  bevelThickness: 1,
  bevelSize: 0.5,
  bevelSegments: 2
})
```

The resulting `TextGeometry` exposes position, normal, and UV attributes ready for consumption by luma.gl models.
