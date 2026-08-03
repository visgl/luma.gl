# Overview

The `@luma.gl/engine` module contains higher-level rendering and application framework classes built on top of `@luma.gl/core`.

Use the engine module when you want luma.gl to manage the common rendering workflow for you: creating pipelines from shaders, binding buffers and textures, handling redraw state, and issuing draw calls through a small set of reusable classes.

## Start Here[​](#start-here "Direct link to Start Here")

* [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) is the central rendering class and the page most users are looking for when they want the main luma.gl drawing API.
* [`Materials`](https://luma.gl/next/docs/api-guide/engine/materials.md) explains what `Material` and `MaterialFactory` represent in the engine layer.
* [`DynamicBuffer`](https://luma.gl/next/docs/api-reference/engine/dynamic-buffer.md), [`DynamicTexture`](https://luma.gl/next/docs/api-reference/engine/dynamic-texture.md), and [`VideoTexture`](https://luma.gl/next/docs/api-reference/engine/video-texture.md) provide stable engine-level wrappers for GPU resources and live texture sources that can be replaced or initialized over time. Experimental v10 [`@luma.gl/experimental`](https://luma.gl/next/docs/api-reference/experimental.md) WebXR helpers use the same binding-source path for WebXR Raw Camera Access without making WebXR part of the engine module.
* [`ClipSpace`](https://luma.gl/next/docs/api-reference/engine/clip-space.md) and [`BackgroundTextureModel`](https://luma.gl/next/docs/api-reference/engine/background-texture-model.md) provide ready-made fullscreen rendering helpers.
* [`AnimationLoop`](https://luma.gl/next/docs/api-reference/engine/animation-loop.md) manages per-frame rendering and animation state.
* [`Geometry`](https://luma.gl/next/docs/api-reference/engine/geometry.md) and [`Geometries`](https://luma.gl/next/docs/api-reference/engine/geometry/geometries.md) provide reusable mesh and attribute helpers.
* [`GPUGeometry`](https://luma.gl/next/docs/api-reference/engine/geometry/gpu-geometry.md) describes already-uploaded geometry buffers.
* [`Scenegraph`](https://luma.gl/next/docs/api-guide/engine/scenegraph.md), [`GroupNode`](https://luma.gl/next/docs/api-reference/engine/scenegraph/group-node.md), and [`ModelNode`](https://luma.gl/next/docs/api-reference/engine/scenegraph/model-node.md) cover scenegraph organization.
* [`PickingManager`](https://luma.gl/next/docs/api-reference/engine/picking-manager.md) handles object picking and highlight state for models that use the engine picking shader modules.
* [`Computation`](https://luma.gl/next/docs/api-reference/engine/compute/computation.md), [`BufferTransform`](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md), and [`TextureTransform`](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md) cover engine-level compute workflows.
* [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md) applies shader passes to textures for postprocessing pipelines.

## Remarks[​](#remarks "Direct link to Remarks")

* The engine classes are built on top of the abstract API in `@luma.gl/core` and are portable between WebGPU and WebGL backends.
* If you are coming from older luma.gl docs and are looking for `Program`, the current v9 API usually maps that workflow to [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) for higher-level rendering or [`RenderPipeline`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md) for lower-level pipeline control.
* If you specifically need legacy `Program` documentation, use the [porting guide](https://luma.gl/next/docs/legacy/porting-guide) and other legacy docs rather than treating it as the primary v9 API surface.
* If you are coming from older docs looking for `Transform`, the current v9 engine APIs are [`BufferTransform`](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md), [`TextureTransform`](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md), and [`Computation`](https://luma.gl/next/docs/api-reference/engine/compute/computation.md), depending on whether you are targeting WebGL transform feedback, texture-based transforms, or WebGPU compute passes.
