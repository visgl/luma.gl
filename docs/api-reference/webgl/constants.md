# `@luma.gl/webgl/constants`

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

:::info
In luma.gl versions earlier than v9.3, these exports were provided by `@luma.gl/constants`. Use `@luma.gl/webgl/constants` going forward.
:::

Use this entry point when you need the raw numeric WebGL enums that luma.gl still uses internally for WebGL interop.

```typescript
import {GL} from '@luma.gl/webgl/constants';
import type {GLParameters, GLSamplerParameters} from '@luma.gl/webgl/constants';
```

## Exports

- `GL`: numeric WebGL enum object covering WebGL 2 and supported extension constants.
- WebGL enum-related TypeScript types such as `GLParameters`, `GLExtensions`, `GLTextureTarget`, `GLUniformType`, and related helper types.

## When To Use This

- When calling raw WebGL APIs on `WebGL2RenderingContext`.
- When translating between luma.gl abstractions and numeric WebGL parameters.
- When writing low-level WebGL helpers, tests, or debugging tools.

## Preferred API Style

Most luma.gl application APIs use typed WebGPU-style strings rather than numeric WebGL enums. Prefer those higher-level string APIs unless you are specifically interfacing with raw WebGL.
