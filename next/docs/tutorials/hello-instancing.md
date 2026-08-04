# Hello Instancing

[Overview](https://luma.gl/next/docs/tutorials.md)[Triangle](https://luma.gl/next/docs/tutorials/hello-triangle.md)[Cube](https://luma.gl/next/docs/tutorials/hello-cube.md)[Instancing](https://luma.gl/next/docs/tutorials/hello-instancing.md)

**Goal:** draw multiple copies of one geometry with one model and one draw call.

<!-- -->

## Shared and per-instance data[​](#shared-and-per-instance-data "Direct link to Shared and per-instance data")

Instancing separates attributes by update frequency:

* Vertex positions use the default `vertex` step mode and repeat for every instance.
* Colors and offsets use `stepMode: 'instance'`, so the GPU advances those values once per triangle rather than once per vertex.

The model sets `vertexCount: 3` and `instanceCount: 4`. The resulting draw processes the same three positions four times, pairing each copy with a different color and offset.

## Buffer layout is the contract[​](#buffer-layout-is-the-contract "Direct link to Buffer layout is the contract")

`bufferLayout` maps JavaScript buffer names to shader attributes and describes the stored format. A layout mismatch can read the correct bytes with the wrong stride or component count, so keep memory formats such as `float32x2` separate from shader-facing types.

The example includes both WGSL and GLSL. The portable application constructs identical buffers and bindings for either backend.

**Runnable source**[View on GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-instancing)

```
// Loading canonical example source…
```

## When to use instancing[​](#when-to-use-instancing "Direct link to When to use instancing")

Instancing is a strong fit when many objects share geometry and shader logic but differ in transforms, colors, picking identifiers, or other small records. It reduces draw-call overhead and avoids duplicating shared vertex data.

## Summary[​](#summary "Direct link to Summary")

You used per-vertex and per-instance buffers in one model. Continue with [Shader Modules](https://luma.gl/next/docs/tutorials/shader-modules.md) to package shader behavior for reuse, or [Lighting](https://luma.gl/next/docs/tutorials/lighting.md) to apply that composition to materials.
