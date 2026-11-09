# RenderKernel

Import `RenderKernel` alongside `Kernel` from `@luma.gl/graph`. Neither class is exported by engine or core.

RenderKernel owns compiled shaders and a cached render pipeline. It accepts already assembled GLSL on WebGL or WGSL on WebGPU. Shader assembly, uniforms, geometry ownership, and graph scheduling stay with the caller.

```typescript
import {RenderKernel} from '@luma.gl/graph';

const kernel = new RenderKernel(device, {
  vertexSource,
  fragmentSource,
  shaderLayout,
  bufferLayout,
  colorAttachmentFormats: ['rgba32float']
});
const vertexArray = device.createVertexArray({
  shaderLayout: kernel.pipeline.shaderLayout,
  bufferLayout
});
kernel.draw(renderPass, {bindings, vertexArray, vertexCount: 3});
```

## Backend behavior

- Direct and indexed draws work on WebGL and WebGPU. Supply a complete binding set and vertex array for each draw.
- WebGL requires a fragment shader, including for transform-feedback pipelines; a trivial fragment shader can be used with a discard render pass.
- WebGL supports transform feedback, compatibility uniforms, and per-draw topology/parameters through the existing render-pass draw options. Supplying `instanceCount` selects instanced drawing unless `isInstanced` is explicitly provided.
- Indexed and non-indexed indirect draws remain WebGPU-only and reject WebGL before changing pass state.
- WebGPU supports vertex-only pipelines. Set attachment formats to match the target render pass; unlike Model, RenderKernel does not infer them from a framebuffer.
- `createAsync()` uses the existing shader/pipeline factory compilation lifecycle. `draw()` returns false if the backend is not ready to draw.

The caller owns vertex arrays, buffers, textures, passes, and command submission. `destroy()` releases the kernel's shader and pipeline references and is idempotent.

## Graph use

Flow-particle simulation uses RenderKernel directly on both backends. It retains its existing shaders, two state textures, uniform buffer, and ping-pong stepping logic, and supplies the current field/state bindings per draw. It no longer depends on GPUVectorModel.
