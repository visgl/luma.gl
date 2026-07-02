# RFC: Composable Advanced Screen-Space Effects

## Status

Implemented experimentally for WebGPU.

## Goals

- Compose scene-aware fullscreen effects without adding a monolithic scene renderer.
- Keep scene traversal and G-buffer generation application-owned.
- Support transient intermediate targets and persistent temporal history in one pipeline model.
- Preserve every existing color-only `ShaderPassRenderer` workflow.

## Scene Contract

Applications render matching color, sampled depth, view-space normal/roughness, and unjittered
velocity textures. The initial convention uses `depth24plus`, RGB normals encoded into
`rgba8unorm` with roughness in alpha, and `rg16float` velocity storing
`currentUv - previousUv`.

Projection jitter remains application-owned. Temporal passes receive current and previous jitter
as normalized texture offsets.

## Pipeline Model

`ShaderPassPipeline` continues to own named targets local to that pipeline. A render target can
declare `lifetime: 'history'`, causing `ShaderPassRenderer` to allocate two physical textures.
Before a history target is written in a frame, reads resolve to the previous physical texture.
After the write, later steps resolve the new texture. Physical history swaps only after the entire
render succeeds.

Construction, resize, and `resetHistory()` invalidate history. Targets initialize from the current
`original` texture or a declared clear color.

## Effect Stack

The reference composition order is SSAO, SSR, volumetric fog, outlines, TAA, and motion blur.
Depth-aware bilateral blur is reusable and also cleans the half-resolution SSAO buffer. Each
effect remains an ordinary `ShaderPassPipeline`, so applications may omit or reorder effects.

## Portability

The first shaders are WGSL and the website showcase is WebGPU-only. Formats, fullscreen render
passes, bindings, and resource lifetimes avoid requiring compute shaders or storage textures so a
later WebGL 2 implementation can retain the same public contracts.
