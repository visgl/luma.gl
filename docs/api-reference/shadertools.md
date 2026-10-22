# Shadertools

[Overview](https://luma.gl/docs/api-reference/shadertools.md)[Programming guide](https://luma.gl/docs/api-guide/shaders.md)[Cookbook](https://luma.gl/docs/api-guide/shaders/cookbook.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/shadertools` assembles reusable shader behavior. It resolves module dependencies, typed props and bindings, hooks, injections, plugins, and passes into shader source. It does not create a device or compile shaders itself. The generated Shadertools API index at `/docs/api-reference/generated/shadertools` contains every public descriptor, helper, built-in module, and type with source links.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use Shadertools when shader behavior must be shared, configured, or composed. Use plain WGSL or GLSL for a tiny one-off shader. Move up to [Engine](https://luma.gl/docs/api-reference/engine.md) when the assembled shader needs geometry, inputs, a pipeline, and draw lifecycle management.

## Live example[​](#live-example "Direct link to Live example")

Toggle the module behavior in the running example and compare the reusable module inputs with the assembled WGSL/GLSL application that Engine submits.

* Inspect

  Dependencies, module props, assembled source, uniforms, and rendered output

* Composition

  ShaderModule descriptors consumed through ShaderInputs and Model

* Portability

  Parallel WGSL and GLSL paths on the best available backend

* Cost

  Assembly happens before pipeline creation; steady-state draws reuse the result

[Open full page](https://luma.gl/examples/tutorials/shader-modules)[View source](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/shader-modules)

\[x]Include lighting module

* Dependencies

  color → lighting

* Hook

  `fragmentColor(baseColor)`

* Injection

  lighting::shade

* Uniforms

  lighting.intensity

Assembled teaching source

```
// module: color
fn applyColor(base: vec3<f32>) -> vec3<f32> { return base; }

// module: lighting
fn shade(base: vec3<f32>) -> vec3<f32> { return applyColor(base) * 0.85; }
```

Loading interactive example…

## Core concepts[​](#core-concepts "Direct link to Core concepts")

* shader moduleReusable shader behavior with source, dependencies, typed props or bindings, and optional injection points.

  Reusable shader behavior with source, dependencies, typed props or bindings, and optional injection points.

* bindingThe connection that makes a buffer, texture, sampler, or uniform block available to shader code.

  The connection that makes a buffer, texture, sampler, or uniform block available to shader code.

* hookA named extension point in shader source that modules or plugins may call or implement.

  A named extension point in shader source that modules or plugins may call or implement.

* injectionShader source inserted at a declared hook or source location during assembly.

  Shader source inserted at a declared hook or source location during assembly.

* pluginA configurable shader extension that selects modules, bindings, and source changes for a rendering feature.

  A configurable shader extension that selects modules, bindings, and source changes for a rendering feature.

* pipelineCompiled shader stages plus fixed GPU state used for rendering or compute work.

  Compiled shader stages plus fixed GPU state used for rendering or compute work.

The learning spine is: modules and dependencies; uniforms and bindings; hooks and injections; assembly; plugins and passes; portability; then the built-in module and pass catalogs.

## Feature card[​](#feature-card "Direct link to Feature card")

**Modules and dependencies**Package shader behavior once and assemble dependencies in deterministic order.

**Typed props and bindings**Describe CPU-facing configuration and shader-visible resources together.

**Hooks and injections**Extend stable shader contracts without copying whole shader programs.

**Plugins**Bundle modules, bindings, and source changes into configurable rendering features.

**Shader passes**Describe reusable fullscreen image operations for postprocessing workflows.

**WGSL and GLSL paths**Share one feature model while supplying source for WebGPU and WebGL 2.

## Workflows[​](#workflows "Direct link to Workflows")

1. [Learn the workflow](https://luma.gl/docs/api-guide/shaders.md)Build the mental model before choosing classes.
2. [Copy a focused recipe](https://luma.gl/docs/api-guide/shaders/cookbook.md)Start from a complete, small task.
3. [Check the complete API](https://luma.gl/docs/api-reference/generated/shadertools)Confirm exact types, defaults, and ownership.

The [Shadertools cookbook](https://luma.gl/docs/api-guide/shaders/cookbook.md) covers authoring modules, exposing props, adding hooks, injecting source, composing dependencies, creating plugins, and defining passes.

## API index[​](#api-index "Direct link to API index")

Composable shader modules, dependencies, hooks, injections, plugins, passes, and portable assembly.

* Modules and dependencies
* Props and bindings
* Hooks and injections
* Assembly
* Plugins and passes
* Portability and catalogs

The [generated <!-- -->Shadertools<!-- --> API index](https://luma.gl/docs/api-reference/generated/shadertools) is the exhaustive, source-linked inventory of every public value and TypeScript export. The curated pages explain how the related families fit together.

Keep the [shader module catalog](https://luma.gl/docs/api-reference/shadertools/shader-modules/random.md) and [shader pass catalog](https://luma.gl/docs/api-reference/shadertools/shader-passes/image-processing.md) separate from the teaching path; use them after choosing the relevant descriptor family.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* A module may provide WGSL, GLSL, or both. The selected backend requires a compatible source path.
* Shadertools assembles text and metadata; Core adapters perform validation and compilation.
* Dependency order is deterministic, but conflicting hook or binding contracts remain author errors.
* Plugins should state their source, binding, and backend requirements explicitly.

## Related modules[​](#related-modules "Direct link to Related modules")

[Shadertools](https://luma.gl/docs/api-reference/shadertools.md)[Engine](https://luma.gl/docs/api-reference/engine.md)[Core](https://luma.gl/docs/api-reference/core.md)[GPU Core](https://luma.gl/docs/api-reference/experimental/gpu-core.md)

* Use [Engine](https://luma.gl/docs/api-reference/engine.md) to bind module props and draw a `Model`.
* Use [Core](https://luma.gl/docs/api-reference/core.md) for the resources and pipelines that compile assembled source.
* Shader modules can also be consumed by GPU Core render and compute nodes.
