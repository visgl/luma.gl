# Persistence

Accumulate the current frame into a fading history texture to create luminous motion trails and long-exposure visualizations. `persistenceEffect` keeps history ownership explicit so applications can control reset behavior and ping-pong resources.

### Persistence

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/persistence)Info

InfoSource

Electron trails renderings persist across multiple frames.

Uses multiple luma.gl `Framebuffer`s to hold previously rendered data between frames.

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property                 | Value                                      |
| ------------------------ | ------------------------------------------ |
| Export                   | `persistenceEffect`                        |
| Shader uniform namespace | `persistence`                              |
| Backends                 | WebGPU and WebGL2                          |
| Render passes            | One fullscreen color-filter pass per frame |
| Required binding         | Application-owned `persistenceTexture`     |

## Usage[​](#usage "Direct link to Usage")

```
import type {Texture} from '@luma.gl/core';

import {ShaderPassRenderer} from '@luma.gl/engine';

import {persistenceEffect} from '@luma.gl/effects';



const accumulationRenderers = [

  new ShaderPassRenderer(device, {shaderPasses: [persistenceEffect]}),

  new ShaderPassRenderer(device, {shaderPasses: [persistenceEffect]})

];



let previousAccumulationTexture = clearedHistoryTexture;



function accumulateFrame(frameIndex: number, currentSceneTexture: Texture): Texture {

  const renderer = accumulationRenderers[frameIndex % accumulationRenderers.length];

  previousAccumulationTexture = renderer.renderToTexture({

    sourceTexture: currentSceneTexture,

    bindings: {persistenceTexture: previousAccumulationTexture}

  });

  return previousAccumulationTexture;

}
```

Alternating renderers prevents one pass from sampling and writing the same internal output texture. Clear or replace the history whenever canvas dimensions or scene ownership change.

## Parameters[​](#parameters "Direct link to Parameters")

The current implementation has no public scalar uniforms. Its visual response is defined by the following fixed shader behavior:

| Behavior                    | Value          | Purpose                                                       |
| --------------------------- | -------------- | ------------------------------------------------------------- |
| Current-frame color boost   | `4`            | Keeps sparse bright samples visible in the accumulated image. |
| Previous-color contribution | `0.9`          | Produces gradually decaying trails.                           |
| Previous-alpha decay        | `0.9`          | Preserves coverage while reducing stale history over time.    |
| Output RGB range            | Clamped to `1` | Prevents repeated accumulation from exceeding display range.  |

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

The shader adds one fullscreen pass and samples the caller-supplied previous accumulation. Unlike named-history `ShaderPassPipeline` effects, the standalone pass does not allocate, clear, or rotate history automatically. Use a cleared initial texture and explicitly avoid read/write aliasing.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Motion Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/motion-blur.md) follows current per-pixel velocity instead of accumulating previous images.
* [Temporal Antialiasing](https://luma.gl/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md) validates history with scene depth and motion vectors.
* [Bloom](https://luma.gl/docs/api-reference/shadertools/shader-passes/bloom.md) can add stabilized photographic glow to bright accumulated trails.
