# Engine

[Overview](https://luma.gl/next/docs/api-reference/engine.md)[Programming guide](https://luma.gl/next/docs/api-guide/engine.md)[Cookbook](https://luma.gl/next/docs/api-guide/engine/cookbook.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/engine` turns common rendering patterns into reusable classes. `Geometry` describes CPU-side attributes, `ShaderInputs` manages shader-module values, and `Model` connects them to Core resources, pipelines, bindings, and draw calls while tracking redraw needs. The generated Engine API index at `/docs/api-reference/generated/engine` contains every public value and TypeScript type with source links.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use Engine for most rendered applications. Drop to [Core](https://luma.gl/next/docs/api-reference/core.md) when you need exact resource or command control. Use [Shadertools](https://luma.gl/next/docs/api-reference/shadertools.md) to make shader behavior reusable. Add GPU Core only when work becomes a scheduled GPU dataflow; a single `Model` does not need a graph.

## Live example[​](#live-example "Direct link to Live example")

This portable example maps the Engine objects to the Core work they manage.

* Engine

  Geometry data + ShaderInputs-compatible shaders + Model + redraw lifecycle

* Core equivalents

  Buffer + layouts/bindings + RenderPipeline + RenderPass

* Backend

  best-available with WGSL and GLSL shader paths

* Lifecycle

  Create once, draw on demand, destroy on finalize

[Open full page](https://luma.gl/next/examples/tutorials/hello-triangle-geometry)[View source](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-triangle-geometry)

Loading interactive example…

## Core concepts[​](#core-concepts "Direct link to Core concepts")

* resourceA GPU object or logical value that work reads or writes, such as a buffer, texture, pipeline, or graph allocation.

  A GPU object or logical value that work reads or writes, such as a buffer, texture, pipeline, or graph allocation.

* bindingThe connection that makes a buffer, texture, sampler, or uniform block available to shader code.

  The connection that makes a buffer, texture, sampler, or uniform block available to shader code.

* pipelineCompiled shader stages plus fixed GPU state used for rendering or compute work.

  Compiled shader stages plus fixed GPU state used for rendering or compute work.

* passA related sequence of render or compute commands recorded against a defined set of outputs.

  A related sequence of render or compute commands recorded against a defined set of outputs.

* redrawA request to render another frame because visible state changed; it is not necessarily a continuous loop.

  A request to render another frame because visible state changed; it is not necessarily a continuous loop.

* ownershipThe responsibility for destroying a GPU resource and deciding how long it remains valid.

  The responsibility for destroying a GPU resource and deciding how long it remains valid.

The learning spine is: geometry, shader inputs, models, redraw/frame lifecycle, dynamic resources, interaction and picking, scenegraphs, animation, compute helpers, and postprocessing. Engine objects wrap Core resources but do not make ownership disappear.

| Engine concept   | Core work it manages                    |
| ---------------- | --------------------------------------- |
| Geometry         | Buffer data + BufferLayout              |
| ShaderInputs     | Bindings + uniform/storage buffers      |
| Model            | Shaders + RenderPipeline + VertexArray  |
| model.draw(pass) | Pass bindings + draw command            |
| needsRedraw()    | Whether another submission is necessary |

## Feature card[​](#feature-card "Direct link to Feature card")

**Geometry**Keep CPU attributes and shader-facing GPU layouts connected without hiding either side.

**Model**Own the shaders, pipeline, bindings, geometry, and draw contract for one rendered object.

**Shader inputs**Update module props and bindings through one structured interface.

**Demand-driven redraw**Render when visible state changes instead of continuously burning GPU time.

**Interaction and scenes**Compose picking, controls, hierarchy, and reusable scenegraph nodes.

**Animation, compute, and passes**Add time-varying state, GPU transforms, and postprocessing with focused helpers.

## Workflows[​](#workflows "Direct link to Workflows")

1. [Learn the workflow](https://luma.gl/next/docs/api-guide/engine.md)Build the mental model before choosing classes.
2. [Copy a focused recipe](https://luma.gl/next/docs/api-guide/engine/cookbook.md)Start from a complete, small task.
3. [Check the complete API](https://luma.gl/next/docs/api-reference/generated/engine)Confirm exact types, defaults, and ownership.

The [Engine cookbook](https://luma.gl/next/docs/api-guide/engine/cookbook.md) covers rendering, updates, on-demand animation, picking and highlighting, scenes, and shader passes.

## API index[​](#api-index "Direct link to API index")

Reusable geometry, shader inputs, models, redraw state, interaction, animation, compute, and postprocessing.

* Geometry
* Shader inputs
* Model
* Redraw lifecycle
* Picking and scenes
* Animation, compute, and passes

The [generated <!-- -->Engine<!-- --> API index](https://luma.gl/next/docs/api-reference/generated/engine) is the exhaustive, source-linked inventory of every public value and TypeScript export. The curated pages explain how the related families fit together.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* Engine is portable where its underlying Core resources and shaders are portable.
* Provide WGSL and GLSL when the same application must run on WebGPU and WebGL.
* A redraw flag avoids unnecessary rendering only when the application honors it.
* Experimental helpers are labeled in their individual references and may have narrower backend support.

## Related modules[​](#related-modules "Direct link to Related modules")

[Shadertools](https://luma.gl/next/docs/api-reference/shadertools.md)[Engine](https://luma.gl/next/docs/api-reference/engine.md)[Core](https://luma.gl/next/docs/api-reference/core.md)[GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)

* Use [Core](https://luma.gl/next/docs/api-reference/core.md) for direct resource and command control.
* Use [Shadertools](https://luma.gl/next/docs/api-reference/shadertools.md) for modules, hooks, and plugins.
* Use [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md) for scheduled multi-stage GPU work.
