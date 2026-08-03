# Overview

[Overview](https://luma.gl/next/docs/api-reference/shadertools.md)[ShaderModule](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md)[ShaderPlugin](https://luma.gl/next/docs/api-reference/shadertools/shader-plugin.md)[ShaderPass](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md)[ShaderAssembler](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)[Shader Parsing](https://luma.gl/next/docs/api-reference/shadertools/shader-info.md)[WGSL](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md)[Conventions](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)

`@luma.gl/shadertools` provides textual shader assembly utilities and the shader descriptors used by luma.gl engine classes. It does not compile shaders or call WebGL or WebGPU APIs.

Use the [Shader-Level Programming guide](https://luma.gl/next/docs/api-guide/shaders.md) for authoring choices. Use this section for exact shadertools descriptors, assembler methods, WGSL assembly behavior, and built-in module catalogs.

## Reference Pages[​](#reference-pages "Direct link to Reference Pages")

* [`ShaderModule`](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md) describes reusable shader source, uniform descriptors, bindings, dependencies, and injections.
* [`ShaderPass`](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md) describes shader modules that can run through the engine pass renderer.
* [`ShaderPlugin`](https://luma.gl/next/docs/api-reference/shadertools/shader-plugin.md)
* [`ShaderAssembler`](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)
* [`ShaderInfo`](https://luma.gl/next/docs/api-reference/shadertools/shader-info.md)
* [`WGSL Support`](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md)
* [`Shader Module Conventions`](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)

For the uniform descriptor syntax used by shader modules, see [Core Shader Types](https://luma.gl/next/docs/api-reference/core/shader-types.md). For the engine-side module prop and binding bridge, see [`ShaderInputs`](https://luma.gl/next/docs/api-reference/engine/shader-inputs.md).

## Built-in Shader Modules[​](#built-in-shader-modules "Direct link to Built-in Shader Modules")

The API reference contains pages for the built-in shader modules exported by `@luma.gl/shadertools`:

* [`random`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/random.md)
* [`fp32`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp32.md)
* [`fp64`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64.md)
* [`fp64arithmetic`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md)
* [`colors`, `floatColors`, and `storageColors`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/float-colors.md)
* [`dggs`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/dggs.md)
* [`picking`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/picking.md)
* [`skin`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/skin.md)
* [`lighting`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lighting.md)
* [`dirlight`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/dirlight.md)
* [`lambertMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lambert-material.md)
* [`gouraudMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/gouraud-material.md)
* [`phongMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/phong-material.md)
* [`pbrMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md)
