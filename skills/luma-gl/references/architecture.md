# Architecture and API Selection

## Source precedence

Use evidence in this order:

1. The consuming project's lockfile and installed package versions.
2. Installed `package.json` exports and TypeScript declarations.
3. Documentation from the matching release branch.
4. Current raw Markdown selected through `https://luma.gl/llms.txt`.
5. Model memory only for forming hypotheses to verify against the sources above.

A website version and an installed version may differ. Check all directly imported
`@luma.gl/*` packages because mixed package versions can create type or runtime
incompatibilities.

Useful inspection commands include:

```bash
npm ls @luma.gl/core @luma.gl/engine @luma.gl/shadertools @luma.gl/webgpu @luma.gl/webgl
yarn why @luma.gl/core
```

Follow the package's `types` or conditional `exports.types` entry to the declaration
file. Search declarations for exact props and overloads before writing a constructor or
method call.

## Select the API level

### Engine API

Start with `@luma.gl/engine` for models, geometry, animation, picking, scenegraph
helpers, dynamic resources, and common transforms. Most rendered applications should
begin here.

Use Engine when it can own the routine pipeline and redraw work. Do not drop to lower
levels merely because the underlying operation is GPU-backed.

### Core GPU API

Use `@luma.gl/core` when the application needs explicit devices, canvas contexts,
buffers, textures, samplers, shader layouts, bindings, pipelines, command encoders, or
render/compute passes. A concrete adapter from `@luma.gl/webgpu` or `@luma.gl/webgl`
must be available.

Core is portable at the luma.gl abstraction boundary, but individual capabilities are
not automatically portable. Check device features and limits before choosing a path.

### Shader API

Use `@luma.gl/shadertools` to assemble shader modules, plugins, hooks, defines, and
typed shader inputs. Shadertools composes shader source and contracts; Engine or Core
still creates resources and executes work.

## Design rules

- Prefer the highest level that exposes the control the task needs.
- Keep application-facing data and binding names stable across backends.
- Keep resource ownership explicit. Destroy objects created and owned by the feature;
  do not destroy borrowed device, buffer, texture, or model resources.
- Prefer current `RenderPipeline` and resource APIs when declarations do not contain an
  older `Program`-centric example.
- Request the narrowest device feature level and optional features that satisfy the
  use case.
- If deck.gl already provides the required visualization abstraction, recommend it
  rather than rebuilding layers, cameras, and interaction directly in luma.gl.

## Primary documentation

- `https://luma.gl/docs/api-guide.md`
- `https://luma.gl/docs/api-guide/gpu/gpu-initialization.md`
- `https://luma.gl/docs/api-guide/gpu/gpu-resources.md`
- `https://luma.gl/docs/api-guide/shaders/shader-assembly.md`
- `https://luma.gl/docs/api-reference.md`
