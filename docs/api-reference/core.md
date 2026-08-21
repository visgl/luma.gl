# Core GPU API

[Overview](https://luma.gl/docs/api-reference/core.md)[Programming guide](https://luma.gl/docs/api-guide/gpu.md)[Cookbook](https://luma.gl/docs/api-guide/gpu/cookbook.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/core` is the portable GPU layer. It gives applications one API for devices, resources, pipelines, passes, command submission, presentation, and readback across WebGPU and WebGL 2 adapters.

The curated pages explain workflows and portability. The [generated API index](https://luma.gl/docs/api-reference/generated/core.md) is the exact, source-linked TypeScript contract.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use Core when you need direct control over GPU memory, formats, bindings, passes, or command submission. Start one layer higher with [Engine](https://luma.gl/docs/api-reference/engine.md) when a `Model` can manage those details. Move one layer higher still to GPU scheduling when several operations need dependency scheduling, transient storage, indirect work, or multi-frame execution.

## Live example[​](#live-example "Direct link to Live example")

The example is intentionally dormant until activated. It selects the best available adapter, creates a buffer, constructs a portable model pipeline, records a render pass, submits a draw, and releases its resources when unmounted.

* Flow

  resource → shader/pipeline → render pass → submitted draw

* Backend

  best-available; the running example reports WebGPU or WebGL

* Shaders

  Equivalent WGSL and GLSL paths

* Ownership

  The example destroys both Model and Buffer

[Open full page](https://luma.gl/examples/tutorials/hello-triangle-geometry)[View source](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-triangle-geometry)

Loading interactive example…

## Core concepts[​](#core-concepts "Direct link to Core concepts")

* resourceA GPU object or logical value that work reads or writes, such as a buffer, texture, pipeline, or graph allocation.

  A GPU object or logical value that work reads or writes, such as a buffer, texture, pipeline, or graph allocation.

* ownershipThe responsibility for destroying a GPU resource and deciding how long it remains valid.

  The responsibility for destroying a GPU resource and deciding how long it remains valid.

* bindingThe connection that makes a buffer, texture, sampler, or uniform block available to shader code.

  The connection that makes a buffer, texture, sampler, or uniform block available to shader code.

* layoutA declaration of how values are arranged in memory or exposed to shader stages.

  A declaration of how values are arranged in memory or exposed to shader stages.

* pipelineCompiled shader stages plus fixed GPU state used for rendering or compute work.

  Compiled shader stages plus fixed GPU state used for rendering or compute work.

* passA related sequence of render or compute commands recorded against a defined set of outputs.

  A related sequence of render or compute commands recorded against a defined set of outputs.

* encoderAn object that records GPU commands before they are submitted together.

  An object that records GPU commands before they are submitted together.

* submissionSending recorded command buffers to the GPU queue for execution.

  Sending recorded command buffers to the GPU queue for execution.

The learning spine is: choose an adapter and create a `Device`; create and own resources; describe memory layouts and bindings; create pipelines; encode passes; submit work; then present or read results back. A resource is durable GPU state, while an encoder and its passes record a particular unit of work.

1. declare usage
2. create
3. upload
4. encode
5. submit
6. reuse
7. destroy

## Feature card[​](#feature-card "Direct link to Feature card")

**Portable adapters**Choose WebGPU or WebGL 2 without changing the application-facing device model.

**Explicit resources**Control GPU memory, usage flags, ownership, updates, and destruction.

**Layouts and bindings**Connect typed application data to shader-visible attributes, uniforms, textures, and storage.

**Pipelines and passes**Compile reusable GPU state and encode bounded render or compute work.

**Submission and presentation**Submit command buffers, present canvas frames, and read results back deliberately.

**Capabilities and validation**Inspect backend limits and features before selecting an implementation path.

## Workflows[​](#workflows "Direct link to Workflows")

1. [Learn the workflow](https://luma.gl/docs/api-guide/gpu.md)Build the mental model before choosing classes.
2. [Copy a focused recipe](https://luma.gl/docs/api-guide/gpu/cookbook.md)Start from a complete, small task.
3. [Check the complete API](https://luma.gl/docs/api-reference/generated/core.md)Confirm exact types, defaults, and ownership.

The [Core cookbook](https://luma.gl/docs/api-guide/gpu/cookbook.md) has compact recipes for initialization, upload, render, compute, readback, resize, and recovery from validation or device errors.

## API index[​](#api-index "Direct link to API index")

Portable GPU resources, commands, passes, submission, presentation, and readback.

* Device and adapters
* Resources and ownership
* Layouts and bindings
* Pipelines
* Encoding and submission
* Presentation and readback

The [generated <!-- -->Core<!-- --> API index](https://luma.gl/docs/api-reference/generated/core.md) is the exhaustive, source-linked inventory of every public value and TypeScript export. The curated pages explain how the related families fit together.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* Import at least one adapter; `@luma.gl/core` does not choose a backend by itself.
* Use `type: 'best-available'` when either WebGPU or WebGL 2 is acceptable.
* WebGPU-only features must be capability-checked. The abstract API does not emulate every WebGPU feature on WebGL.
* Resource ownership remains explicit: destroy objects that your code creates and owns.

## Related modules[​](#related-modules "Direct link to Related modules")

[Shadertools](https://luma.gl/docs/api-reference/shadertools.md)[Engine](https://luma.gl/docs/api-reference/engine.md)[Core](https://luma.gl/docs/api-reference/core.md)

* Move up to [Engine](https://luma.gl/docs/api-reference/engine.md) for managed models and redraw state.
* Move down to [Shadertools](https://luma.gl/docs/api-reference/shadertools.md) to author reusable shader behavior.
* Add GPU scheduling for multi-operation scheduling.
