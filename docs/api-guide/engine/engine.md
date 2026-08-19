---
title: Engine programming
description: Build rendered applications around Model, then add updates, redraw, interaction, scenegraphs, animation, compute, and passes only where needed.
---

import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# Engine programming

<EngineDocsTabs group="starting" active="engine-overview" />

## Outcome

Engine packages the most common rendering lifecycle into reusable objects. The central idea is
simple: **a `Model` is a durable draw unit**. It connects geometry, shader code, shader inputs,
bindings, and pipeline state so the application can update values and draw without rebuilding
the underlying Core objects each time.

Start with `Geometry` + `Model`. Add `ShaderInputs`, dynamic resources, picking, scenegraphs,
animation, or compute helpers only when the application needs them. This keeps simple renderers
simple while leaving a path to richer scenes.

## Mental model

Engine sits above Core; it does not replace it:

| Engine concept | What it decides | Core work it manages |
| --- | --- | --- |
| `Geometry` or `GPUGeometry` | Which vertex/index data a model draws | Buffers and vertex layouts |
| `ShaderInputs` | Which module props and resources shaders consume | Uniform buffers and bindings |
| `Model` | Which geometry, shaders, parameters, and instance count form one draw unit | Shaders, render pipeline, binding state, and draw calls |
| `AnimationLoop` | When application callbacks run and a frame is presented | Device frame lifecycle and submission |
| `needsRedraw()` | Whether changed state can affect the next image | An application-readable invalidation signal |

The application still owns the render pass, frame policy, and destruction of objects it creates.
Engine reduces repeated setup; it does not make GPU lifetime or submission implicit.

```text
Geometry ───────┐
ShaderInputs ───┼→ Model → draw into caller-owned RenderPass
Bindings ───────┘    ↑
                    updates mark redraw
```

## Complete workflow

### 1. Create durable scene data

Use `Geometry` for CPU-provided vertex and index data, or `GPUGeometry` when buffers already
live on the GPU. Preserve the source attribute semantics and provide shader-facing layouts at
the model boundary.

### 2. Create one model per reusable draw unit

Give `Model` its geometry, portable WGSL/GLSL shaders where required, topology, parameters,
and bindings. Construct the model once; pipeline and shader factories reuse compatible Core
resources behind the scenes.

### 3. Update values instead of rebuilding

Use `ShaderInputs` for shader-module props, `setBindings()` for resource changes, and dynamic
resources for frequently changing data. Recreate a model only when its structural contract
changes.

### 4. Draw into an application-owned pass

Create a render pass through Core, call `model.draw(renderPass)`, then end and submit the pass.
One pass can contain many model draws. The application decides their order and presentation.

### 5. Render only when the image can change

Treat `needsRedraw()` as an invalidation signal. State changes set it; reading it clears it.
The application or `AnimationLoop` decides whether to request and render a frame.
See [redraw detection](/docs/api-guide/engine/redraw).

### 6. Add higher-level systems selectively

- Add [interaction](/docs/api-guide/engine/interactivity) for orbit controls, GPU picking, and
  hover/selection feedback.
- Add a [scenegraph](/docs/api-guide/engine/scenegraph) when parent/child transforms and
  traversal are genuinely useful.
- Add [animation](/docs/api-guide/engine/animation) for clips, tracks, blending, and morphs.
- Add [compute helpers](/docs/api-guide/engine/transforms) for a bounded compute or transform
  workflow; use GPU Core for a multi-stage scheduled dataflow.

## A minimal rendering shape

```ts
import {Geometry, Model} from '@luma.gl/engine';

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {
    POSITION: {size: 2, value: new Float32Array([-1, -1, 1, -1, 0, 1])}
  }
});

const model = new Model(device, {
  id: 'triangle',
  geometry,
  vs: vertexShader,
  fs: fragmentShader
});

const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
model.draw(renderPass);
renderPass.end();

model.destroy();
```

The exact shader source differs between WebGPU and WebGL 2. The lifecycle does not: create a
durable model, update it, draw it into a pass, and destroy it when its owner is finished.

## Choose the next page

| If you need to… | Continue with… | Conclusion you should reach |
| --- | --- | --- |
| Copy a complete small task | [Engine cookbook](/docs/api-guide/engine/cookbook) | Begin with the smallest complete lifecycle. |
| Pass module props to shaders | [Shader inputs](/docs/api-guide/engine/shader-inputs) | Keep typed module values separate from resource bindings. |
| Avoid idle rendering | [Redraw detection](/docs/api-guide/engine/redraw) | Invalidation is a signal; frame scheduling remains yours. |
| Add camera or object interaction | [Interactivity](/docs/api-guide/engine/interactivity) | Route events first, then derive controls or picking. |
| Organize hierarchical transforms | [Scenegraphs](/docs/api-guide/engine/scenegraph) | Use hierarchy for relationships, not merely as a container. |
| Play and blend authored motion | [Animation](/docs/api-guide/engine/animation) | Advance animation state before deciding to redraw. |
| Run a bounded GPU transform | [Compute helpers](/docs/api-guide/engine/transforms) | Select by backend and data shape. |

## Decisions and tradeoffs

- **One model or a scenegraph?** Prefer a direct list of models until hierarchy, transform
  propagation, or traversal adds value.
- **Continuous loop or on-demand frames?** Render continuously only for active animation or
  streaming. Otherwise schedule a frame when invalidated.
- **Engine helper or Core?** Drop to Core when exact pass, resource, or synchronization control
  is the point of the work.
- **Engine helper or GPU Core?** A helper suits one bounded operation. A graph suits several
  operations with shared resources, dependencies, indirect counts, or multi-frame budgets.

## Common mistakes

- Recreating `Model` for changes that belong in shader inputs, bindings, or dynamic resources.
- Starting an unconditional animation loop for a mostly static view.
- Reading `needsRedraw()` in several places even though reading clears the reason.
- Introducing a scenegraph before the scene has meaningful hierarchy.
- Treating a `Material` as a scenegraph node rather than reusable surface state.
- Forgetting that Engine objects own Core resources and must be destroyed by their owner.

## Next steps

- Start from the [Engine cookbook](/docs/api-guide/engine/cookbook).
- Use the [Engine API overview](/docs/api-reference/engine) to find exact contracts.
- Drop to the [Core programming guide](/docs/api-guide/gpu) for resource and command control.
- Move to [GPU Core](/docs/api-reference/experimental/gpu-core) when the workload becomes
  a scheduled GPU pipeline rather than a collection of draws.
