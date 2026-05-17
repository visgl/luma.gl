# @luma.gl/text/text-3d

3D text geometry helpers are exposed from the dedicated `@luma.gl/text/text-3d` entry point.

```ts
import {TextGeometry, parseFont} from '@luma.gl/text/text-3d'
import helvetiker from './fonts/helvetiker_regular.typeface.json'

const font = parseFont(helvetiker)
const geometry = new TextGeometry('Hello luma.gl', {
  font,
  align: 'center',
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
