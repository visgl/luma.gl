# `@luma.gl/core/webgl-constants`

[Overview](https://luma.gl/docs/api-reference/webgl.md)[Constants](https://luma.gl/docs/api-reference/webgl/constants.md)[WebGPU adapter](https://luma.gl/docs/api-reference/webgpu.md)

From v9.3

info

Before v9.3, these exports were provided by `@luma.gl/constants`; v9.3 and v9.4 used `@luma.gl/webgl/constants`. Starting in v10, use `@luma.gl/core/webgl-constants`.

Use this entry point when you need the raw numeric WebGL enums that luma.gl still uses internally for WebGL interop.

```
import {GL} from '@luma.gl/core/webgl-constants';

import type {GLParameters, GLSamplerParameters} from '@luma.gl/core/webgl-constants';
```

## Exports[​](#exports "Direct link to Exports")

* `GL`: numeric WebGL enum object covering WebGL 2 and supported extension constants.
* WebGL enum-related TypeScript types such as `GLParameters`, `GLExtensions`, `GLTextureTarget`, `GLUniformType`, and related helper types.

## When To Use This[​](#when-to-use-this "Direct link to When To Use This")

* When calling raw WebGL APIs on `WebGL2RenderingContext`.
* When translating between luma.gl abstractions and numeric WebGL parameters.
* When writing low-level WebGL helpers, tests, or debugging tools.

## Preferred API Style[​](#preferred-api-style "Direct link to Preferred API Style")

Most luma.gl application APIs use typed WebGPU-style strings rather than numeric WebGL enums. Prefer those higher-level string APIs unless you are specifically interfacing with raw WebGL.
