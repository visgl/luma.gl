# @luma.gl/constants

`@luma.gl/constants` publishes the typed `GL` constant table and WebGL parameter types used by luma.gl's WebGL adapter and low-level integrations.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Most applications should prefer portable luma.gl string descriptors such as texture formats, primitive topologies, and render parameters. Import raw constants when integrating with a WebGL 2 API that requires numeric enums.

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {GL, type GLBlendFunction} from '@luma.gl/constants';



const sourceFactor: GLBlendFunction = GL.SRC_ALPHA;

gl.blendFunc(sourceFactor, GL.ONE_MINUS_SRC_ALPHA);
```

## Public API[​](#public-api "Direct link to Public API")

* `GL` contains WebGL numeric constants.
* Exported `GL*` types describe texture targets, formats, primitives, data types, parameters, limits, extensions, and blend or stencil operations.

The same constant table is also documented in the [WebGL constants reference](https://luma.gl/next/docs/api-reference/webgl/constants.md).

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

These constants describe WebGL integration. They do not imply that a portable Core API method accepts the corresponding numeric value, and they do not replace WebGPU enums.

## Related modules[​](#related-modules "Direct link to Related modules")

* [`@luma.gl/webgl`](https://luma.gl/next/docs/api-reference/webgl.md)
* [`@luma.gl/core`](https://luma.gl/next/docs/api-reference/core.md)
* [WebGPU versus WebGL](https://luma.gl/next/docs/api-guide/background/webgpu-vs-webgl.md)
