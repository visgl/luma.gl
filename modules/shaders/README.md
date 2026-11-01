# @luma.gl/shaders

This is the shader module system module for luma.gl.

See [luma.gl](http://luma.gl) for documentation.

## Language-specific assembly

```ts
import type {ShaderAssembler} from '@luma.gl/shaders';
import {GLSLShaderAssembler} from '@luma.gl/shaders/glsl';
import {WGSLShaderAssembler} from '@luma.gl/shaders/wgsl';
```

The shared abstract contract owns modules, hooks and transpiler registration. Each language entry
loads its own assembly backend. Root exports retain their constructor identity. Construct assemblers explicitly; no global factory is provided.
The existing WGSL scanner remains available from `/wgsl`.

## Standalone contracts

This package does not depend on `@luma.gl/core`. Import resource-free shader layouts,
shader types, type decoders, uniform block layouts and sampler options from
`@luma.gl/shaders/types`. Core retains its existing exports through these implementations.
WGSL interface and binding scanners are available from `@luma.gl/shaders/wgsl`.
GPU resources are created and bound by execution adapters. The area-light
`createAreaLightLTCTextures` helper is available from `@luma.gl/engine`.
