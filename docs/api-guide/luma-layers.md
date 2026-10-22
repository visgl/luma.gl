# How luma.gl fits together

[Choose a layer](https://luma.gl/docs/api-guide.md)[How layers fit](https://luma.gl/docs/api-guide/luma-layers.md)[Design philosophy](https://luma.gl/docs/api-guide/background/api-design.md)[Learning resources](https://luma.gl/docs/api-guide/background/learning-resources.md)[WebGPU vs WebGL](https://luma.gl/docs/api-guide/background/webgpu-vs-webgl.md)

The luma.gl layers solve different parts of one GPU application. They compose, but they are not mandatory steps: a small application can use Core directly, an ordinary rendered scene often starts with Engine, and GPU Core becomes useful only when the GPU workflow itself needs scheduling.

ShadertoolsEngineCoreGPU Core

**Connect data and shaders through Model.**

Geometry describes attributes, ShaderInputs owns module values, and Model manages pipelines, bindings, draw state, and redraw needs.

## One rendered application, four views[​](#one-rendered-application-four-views "Direct link to One rendered application, four views")

Consider a colored triangle whose color behavior is reusable:

1. **Shadertools** defines the color module, its typed props, dependencies, and WGSL/GLSL source.
2. **Engine** gives `Model` the geometry and `ShaderInputs`, creates compatible bindings, and tracks whether another draw is needed.
3. **Core** owns the buffer, shader and pipeline resources, render pass, command encoding, submission, presentation, and destruction.
4. **GPU Core**, if the application later adds culling, compaction, indirect drawing, and analysis, schedules those operations and their intermediate resources.

## Move up or down deliberately[​](#move-up-or-down-deliberately "Direct link to Move up or down deliberately")

| If you need…                                                 | Start with… | Move when…                                        |
| ------------------------------------------------------------ | ----------- | ------------------------------------------------- |
| Reusable hooks, injections, or shader dependencies           | Shadertools | Engine must bind inputs and draw                  |
| Geometry, models, redraw, picking, animation, or passes      | Engine      | Core-level resource control is necessary          |
| Buffers, textures, pipelines, passes, and submission         | Core        | Several GPU operations need shared scheduling     |
| Hazards, transient aliasing, indirect work, or frame budgets | GPU Core    | A single pass or model is simpler without a graph |

## The WebGPU ideas that unlock graphs[​](#the-webgpu-ideas-that-unlock-graphs "Direct link to The WebGPU ideas that unlock graphs")

GPU Core is not mysterious machinery. A few WebGPU capabilities make the design practical:

* **Storage buffers** let compute stages share large structured results without CPU copies.
* **Indirect draw and dispatch** let GPU-produced counts control later work.
* **Explicit command encoding** makes work order and resource access visible enough to validate and schedule.
* **Compute shaders** make scans, compaction, sorting, indexing, and aggregation first-class GPU work.

GPU Core names and composes those capabilities. WebGL applications can still use Core, Engine, and Shadertools without adopting the graph layer.

## Where to continue[​](#where-to-continue "Direct link to Where to continue")

* [Shadertools overview](https://luma.gl/docs/api-reference/shadertools.md)
* [Engine overview](https://luma.gl/docs/api-reference/engine.md)
* [Core overview](https://luma.gl/docs/api-reference/core.md)
* [GPU Core tutorial](https://luma.gl/docs/api-reference/experimental/gpu-core/tutorial.md)
