# Context Properties

luma.gl provides several helper functions for testing properties of a WebGL context:

- `getContextLimits`: get resource limits for a context
- `getGLContextInfo`: get various properties of a gl context (using WebGL enums as keys)
- `getContextInfo`: get various properties of a gl context (using strings as keys)

## Usage

````
Check a certain limit (whether through an extension under WebGL 1 or through WebGL 2)
```js
import GL from '@luma.gl/constants';
import {getContextLimits} from '@luma.gl/webgl';
const limits = getContextLimits(gl);
if (limits[GL.MAX_COLOR_ATTACHMENTS] > 0) { // it will be 0 for WebGL 1
   ...
}
````

There are a few additional capability query functions sprinkled through the luma.gl API. In particular, WebGL 2 specific classes have an `isSupported` method that duplicates some of the queryies that can be made using the capability system

```js
import {Query} from '@luma.gl/webgl';
if (Query.isSupported(gl)) {
  ...
}
```

## Functions

### getContextLimits(gl)

Returns an object with limits, each limit is an object with multiple values

- `value` - the value of the limit in the current context
- `webgl1` - the minimum allowed value of the limit for WebGL 1 contexts
- `webgl2` - the minimum allowed value of the limit for WebGL 2 contexts

### WebGL Limits

In addition to capabilities, luma.gl can also query the context for all limits.

| Limits                                | WebGL 2 | WebGL 1 | Description                                                                                                         |
| ------------------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `GL.ALIASED_LINE_WIDTH_RANGE`         |         | [1, 1]  |                                                                                                                     |
| `GL.ALIASED_POINT_SIZE_RANGE`         |         | [1, 1]  |                                                                                                                     |
| `GL.MAX_TEXTURE_SIZE`                 | 2048    | 64      |                                                                                                                     |
| `GL.MAX_CUBE_MAP_TEXTURE_SIZE`        |         | 16      |                                                                                                                     |
| `GL.MAX_TEXTURE_IMAGE_UNITS`          |         | 8       |                                                                                                                     |
| `GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS` |         | 8       |                                                                                                                     |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS`   |         | 0       |                                                                                                                     |
| `GL.MAX_RENDERBUFFER_SIZE`            |         | 1       |                                                                                                                     |
| `GL.MAX_VARYING_VECTORS`              |         | 8       |                                                                                                                     |
| `GL.MAX_VERTEX_ATTRIBS`               |         | 8       |                                                                                                                     |
| `GL.MAX_VERTEX_UNIFORM_VECTORS`       |         | 128     |                                                                                                                     |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS`     |         | 16      |                                                                                                                     |
| `GL.MAX_VIEWPORT_DIMS`                |         | [0, 0]  |                                                                                                                     |
| `GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT`   | 1.0     | 1.0     | ['EXT_texture_filter_anisotropic'](https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_filter_anisotropic) |

| WebGL 2 Limits                                     | WebGL 2 | WebGL 1 (mock) | Description |
| -------------------------------------------------- | ------- | -------------- | ----------- |
| `GL.MAX_3D_TEXTURE_SIZE`                           | `256`   | `0`            |             |
| `GL.MAX_ARRAY_TEXTURE_LAYERS`                      | `256`   | `0`            |             |
| `GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL`                 | `0`     | `0`            |             |
| `GL.MAX_COLOR_ATTACHMENTS`                         | `4`     | `0`            |             |
| `GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS`      | `0`     | `0`            |             |
| `GL.MAX_COMBINED_UNIFORM_BLOCKS`                   | `0`     | `0`            |             |
| `GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS`        | `0`     | `0`            |             |
| `GL.MAX_DRAW_BUFFERS`                              | `4`     | `0`            |             |
| `GL.MAX_ELEMENT_INDEX`                             | `0`     | `0`            |             |
| `GL.MAX_ELEMENTS_INDICES`                          | `0`     | `0`            |             |
| `GL.MAX_ELEMENTS_VERTICES`                         | `0`     | `0`            |             |
| `GL.MAX_FRAGMENT_INPUT_COMPONENTS`                 | `0`     | `0`            |             |
| `GL.MAX_FRAGMENT_UNIFORM_BLOCKS`                   | `0`     | `0`            |             |
| `GL.MAX_FRAGMENT_UNIFORM_COMPONENTS`               | `0`     | `0`            |             |
| `GL.MAX_PROGRAM_TEXEL_OFFSET`                      | `0`     | `0`            |             |
| `GL.MAX_SAMPLES`                                   | `0`     | `0`            |             |
| `GL.MAX_SERVER_WAIT_TIMEOUT`                       | `0`     | `0`            |             |
| `GL.MAX_TEXTURE_LOD_BIAS`                          | `0`     | `0`            |             |
| `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | `0`     | `0`            |             |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS`       | `0`     | `0`            |             |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS`    | `0`     | `0`            |             |
| `GL.MAX_UNIFORM_BLOCK_SIZE`                        | `0`     | `0`            |             |
| `GL.MAX_UNIFORM_BUFFER_BINDINGS`                   | `0`     | `0`            |             |
| `GL.MAX_VARYING_COMPONENTS`                        | `0`     | `0`            |             |
| `GL.MAX_VERTEX_OUTPUT_COMPONENTS`                  | `0`     | `0`            |             |
| `GL.MAX_VERTEX_UNIFORM_BLOCKS`                     | `0`     | `0`            |             |
| `GL.MAX_VERTEX_UNIFORM_COMPONENTS`                 | `0`     | `0`            |             |
| `GL.MIN_PROGRAM_TEXEL_OFFSET`                      | `0`     | `0`            |             |
| `GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT`               | `0`     | `0`            |             |

### getGLContextInfo(gl)

Returns an object with following parameters as keys and corresponding value for each key.

| parameter                     |
| ----------------------------- |
| 'GL.VENDOR'                   |
| 'GL.RENDERER'                 |
| 'GL.UNMASKED_VENDOR_WEBGL'    |
| 'GL.UNMASKED_RENDERER_WEBGL'  |
| 'GL.VERSION'                  |
| 'GL.SHADING_LANGUAGE_VERSION' |

### getContextInfo(gl)

Returns an object containing following details.

- vendor: info[GL.UNMASKED_VENDOR_WEBGL] || info[GL.VENDOR],
- renderer: info[GL.UNMASKED_RENDERER_WEBGL] || info[GL.RENDERER],
- version: info[GL.VERSION],
- shadingLanguageVersion: info[GL.SHADING_LANGUAGE_VERSION],
- info,
- limits,
- webgl1MinLimits: gl.luma.webgl1MinLimits,
- webgl2MinLimits: gl.luma.webgl2MinLimits

## Remarks

- WebGL 1 only supports one color buffer format (RBG32F is deprecated)
- WebGL 2 supports multiple color buffer formats
- Some extensions will not be enabled until they have been queries. luma always queries on startup to enable, app only needs to query again it wants to test platform.
- The capability detection system works regardless of whether the app is running in a browser or in headless mode under Node.js.
- Naturally, given that queries to driver and GPU are typically expensive in WebGL, the capabilities system will cache any queries.
