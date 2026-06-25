import {ShadertoolsDocsTabs} from '@site/src/components/docs/shadertools-docs-tabs';

# Overview

<ShadertoolsDocsTabs active="overview" />

`@luma.gl/shadertools` provides textual shader assembly utilities and the
shader descriptors used by luma.gl engine classes. It does not compile shaders
or call WebGL or WebGPU APIs.

Use the [Shader-Level Programming guide](/docs/api-guide/shaders) for authoring
choices. Use this section for exact shadertools descriptors, assembler methods,
WGSL assembly behavior, and built-in module catalogs.

## Reference Pages

- [`ShaderModule`](/docs/api-reference/shadertools/shader-module) describes reusable
  shader source, uniform descriptors, bindings, dependencies, and injections.
- [`ShaderPass`](/docs/api-reference/shadertools/shader-pass) describes shader
  modules that can run through the engine pass renderer.
- [`ShaderPlugin`](/docs/api-reference/shadertools/shader-plugin)
- [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler)
- [`ShaderInfo`](/docs/api-reference/shadertools/shader-info)
- [`WGSL Support`](/docs/api-reference/shadertools/wgsl-support)
- [`Shader Module Conventions`](/docs/api-reference/shadertools/shader-conventions)

For the uniform descriptor syntax used by shader modules, see
[Core Shader Types](/docs/api-reference/core/shader-types). For the engine-side
module prop and binding bridge, see
[`ShaderInputs`](/docs/api-reference/engine/shader-inputs).

## Built-in Shader Modules

The API reference contains pages for the built-in shader modules exported by `@luma.gl/shadertools`:

- [`random`](/docs/api-reference/shadertools/shader-modules/random)
- [`fp32`](/docs/api-reference/shadertools/shader-modules/fp32)
- [`fp64`](/docs/api-reference/shadertools/shader-modules/fp64)
- [`fp64arithmetic`](/docs/api-reference/shadertools/shader-modules/fp64-arithmetic)
- [`colors`, `floatColors`, and `storageColors`](/docs/api-reference/shadertools/shader-modules/float-colors)
- [`dggs`](/docs/api-reference/shadertools/shader-modules/dggs)
- [`picking`](/docs/api-reference/shadertools/shader-modules/picking)
- [`skin`](/docs/api-reference/shadertools/shader-modules/skin)
- [`lighting`](/docs/api-reference/shadertools/shader-modules/lighting)
- [`dirlight`](/docs/api-reference/shadertools/shader-modules/dirlight)
- [`lambertMaterial`](/docs/api-reference/shadertools/shader-modules/lambert-material)
- [`gouraudMaterial`](/docs/api-reference/shadertools/shader-modules/gouraud-material)
- [`phongMaterial`](/docs/api-reference/shadertools/shader-modules/phong-material)
- [`pbrMaterial`](/docs/api-reference/shadertools/shader-modules/pbr-material)
