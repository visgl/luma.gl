# Overview

The `@luma.gl/engine` module contains higher-level rendering and application framework classes built on top of `@luma.gl/core`.

Use the engine module when you want luma.gl to manage the common rendering workflow for you:
creating pipelines from shaders, binding buffers and textures, handling redraw state, and issuing draw calls through a small set of reusable classes.

## Start Here

- [`Model`](/docs/api-reference/engine/model) is the central rendering class and the page most users are looking for when they want the main luma.gl drawing API.
- [`Materials`](/docs/api-guide/engine/materials) explains what `Material` and `MaterialFactory` represent in the engine layer.
- [`ClipSpace`](/docs/api-reference/engine/clip-space) and [`BackgroundTextureModel`](/docs/api-reference/engine/background-texture-model) provide ready-made fullscreen rendering helpers.
- [`AnimationLoop`](/docs/api-reference/engine/animation-loop) manages per-frame rendering and animation state.
- [`Geometry`](/docs/api-reference/engine/geometry) and [`Geometries`](/docs/api-reference/engine/geometry/geometries) provide reusable mesh and attribute helpers.
- [`GPUGeometry`](/docs/api-reference/engine/geometry/gpu-geometry) describes already-uploaded geometry buffers.
- [`Scenegraph`](/docs/api-guide/engine/scenegraph), [`GroupNode`](/docs/api-reference/engine/scenegraph/group-node), and [`ModelNode`](/docs/api-reference/engine/scenegraph/model-node) cover scenegraph organization.
- [`PickingManager`](/docs/api-reference/engine/picking-manager) handles color-picking style selection for models that use the picking shader module.
- [`Computation`](/docs/api-reference/engine/compute/computation), [`BufferTransform`](/docs/api-reference/engine/compute/buffer-transform), and [`TextureTransform`](/docs/api-reference/engine/compute/texture-transform) cover engine-level compute workflows.
- [`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer) applies shader passes to textures for postprocessing pipelines.

## Remarks

- The engine classes are built on top of the abstract API in `@luma.gl/core` and are portable between WebGPU and WebGL backends.
- If you are coming from older luma.gl docs and are looking for `Program`, the current v9 API usually maps that workflow to [`Model`](/docs/api-reference/engine/model) for higher-level rendering or [`RenderPipeline`](/docs/api-reference/core/resources/render-pipeline) for lower-level pipeline control.
- If you specifically need legacy `Program` documentation, use the [porting guide](/docs/legacy/porting-guide) and other legacy docs rather than treating it as the primary v9 API surface.
- If you are coming from older docs looking for `Transform`, the current v9 engine APIs are [`BufferTransform`](/docs/api-reference/engine/compute/buffer-transform), [`TextureTransform`](/docs/api-reference/engine/compute/texture-transform), and [`Computation`](/docs/api-reference/engine/compute/computation), depending on whether you are targeting WebGL transform feedback, texture-based transforms, or WebGPU compute passes.
