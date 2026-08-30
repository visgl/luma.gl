import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {WebGLDocsTabs} from '@site/src/components/docs/webgl-docs-tabs';

# `@luma.gl/webgl/constants`

<WebGLDocsTabs active="constants" />

<DocumentationBadges>
  <DocumentationBadge tone="version">From v9.3</DocumentationBadge>
</DocumentationBadges>

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
