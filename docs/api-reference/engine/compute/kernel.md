# Kernel and RenderKernel

## Overview

`Kernel` and `RenderKernel` are lightweight WebGPU execution objects for already assembled WGSL.
They own compiled shaders and cached pipelines while leaving shader assembly, uniform policy,
geometry ownership, scene state, and command-graph scheduling to higher-level APIs.

## Motivation

`Computation` and `Model` provide valuable engine conveniences, but many low-level GPU algorithms do
not need those conveniences. A graph primitive that already owns its WGSL source generally needs
only to compile a pipeline, bind resources, and dispatch or draw.

Using `Computation` for that job couples low-level GPU algorithms to shadertools modules,
`ShaderInputs`, `UniformStore`, mutable binding state, and other engine policy. The kernel classes
separate the minimal execution mechanism from those higher-level concerns.

This separation is useful both for command-graph internals and for applications that want a thin
WebGPU execution helper without adopting `Model` or `Computation`.

## Kernel

`Kernel` wraps one immutable WebGPU compute program:

```ts
const kernel = new Kernel(device, {
  source,
  shaderLayout
});

kernel.dispatch(computePass, {
  bindings: {input, output},
  x: workgroupCount
});
```

Bindings are supplied per dispatch rather than retained as mutable kernel state. Direct and indirect
dispatch are supported.

## RenderKernel

`RenderKernel` is the render-side counterpart. It owns vertex/fragment shaders and a render pipeline,
while bindings and vertex arrays are supplied per draw:

```ts
const kernel = new RenderKernel(device, {
  vertexSource,
  fragmentSource,
  shaderLayout,
  bufferLayout
});

kernel.draw(renderPass, {
  bindings,
  vertexArray,
  vertexCount
});
```

It also supports non-indexed and indexed indirect draws.

## What kernels do not do

The kernel layer deliberately does not own:

- shadertools module/plugin assembly
- `ShaderInputs` or uniform stores
- geometry or application data
- animation or scenegraph state
- command graphs or scheduling
- draw/dispatch policy beyond recording the requested command

Higher-level APIs remain free to compose these facilities around kernels.

## Relationship to Model and Computation

The intended layering is:

```text
shader assembly / uniforms / model policy
                  ↓
       Computation / Model
                  ↓
       minimal kernel execution
                  ↓
              WebGPU
```

The initial implementation lives in `@luma.gl/engine` while this boundary is validated. A later
refactor can decide whether the minimal kernel layer belongs in a lower-level package without
changing its responsibilities.
