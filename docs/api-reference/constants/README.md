---
title: "@luma.gl/constants"
description: Typed WebGL constants and compatibility types used by luma.gl and low-level integrations.
---

# @luma.gl/constants

`@luma.gl/constants` publishes the typed `GL` constant table and WebGL parameter types used by
luma.gl's WebGL adapter and low-level integrations.

## When to use it

Most applications should prefer portable luma.gl string descriptors such as texture formats,
primitive topologies, and render parameters. Import raw constants when integrating with a WebGL 2
API that requires numeric enums.

## Quick start

```ts
import {GL, type GLBlendFunction} from '@luma.gl/constants';

const sourceFactor: GLBlendFunction = GL.SRC_ALPHA;
gl.blendFunc(sourceFactor, GL.ONE_MINUS_SRC_ALPHA);
```

## Public API

- `GL` contains WebGL numeric constants.
- Exported `GL*` types describe texture targets, formats, primitives, data types, parameters,
  limits, extensions, and blend or stencil operations.

The same constant table is also documented in the
[WebGL constants reference](/docs/api-reference/webgl/constants).

## Limits and compatibility

These constants describe WebGL integration. They do not imply that a portable Core API method
accepts the corresponding numeric value, and they do not replace WebGPU enums.

## Related modules

- [`@luma.gl/webgl`](/docs/api-reference/webgl)
- [`@luma.gl/core`](/docs/api-reference/core)
- [WebGPU versus WebGL](/docs/api-guide/background/webgpu-vs-webgl)
