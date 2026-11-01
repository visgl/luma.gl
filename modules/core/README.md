# @luma.gl/core

<h1 align="center">luma.gl | <a href="https://luma.gl">Docs</a></h1>

<h5 align="center">luma.gl: WebGPU and WebGL2 Components for GPU Visualization and Compute</h5>

## Overview

luma.gl is a set of WebGPU and WebGL2 components for high-performance GPU-based rendering and computation in the browser.

luma.gl is the GPU engine that powers applications and frameworks like

- [kepler.gl](https://github.com/keplergl/kepler.gl) WebGL based visualization overlays
- [deck.gl](https://github.com/visgl/deck.gl) WebGL based visualization overlays

# Installation, Running Examples etc

For details, please refer to the extensive [online website](https://luma.gl).

## Consolidated module

The portable luma.gl Device API and its WebGL2 and WebGPU implementations.

```typescript
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {webgpuAdapter} from '@luma.gl/core/webgpu';

const device = await luma.createDevice({adapters: [webgpuAdapter, webgl2Adapter]});
```

Backend entry points are also available as `@luma.gl/core/webgl` and
`@luma.gl/core/webgpu`. WebGL constants and types are available from
`@luma.gl/core/webgl-constants`, and optional WebGL debugging helpers from
`@luma.gl/core/webgl-debug`.

Source is organized into `src/api` (portable Device API), `src/shadertypes` (shader types and layouts), `src/webgl`, `src/webgpu`,
and `src/webgl-constants`. Backend implementations import the portable API
internally, so it does not depend on either backend. WGSL interface scanning
lives in the portable API and is shared with shaders.

Shader types, formats, and layout utilities are also available from
`@luma.gl/core/shadertypes`.
