# TextureTransform

`TextureTransform` creates a render pipeline for texture-producing GPU work. It renders into a target texture through an internal framebuffer and exposes the produced texture after each run.

This class is deprecated, but it is still useful when maintaining existing workflows that treat fragment shading as a compute step.

## Usage

```ts
import {TextureTransform} from '@luma.gl/gpgpu';

const transform = new TextureTransform(device, {
  vs: GLSL_VERTEX_SHADER,
  fs: GLSL_FRAGMENT_SHADER,
  vertexCount: 6,
  sourceTextures: {
    sourceTexture
  },
  targetTexture,
  targetTextureChannels: 4,
  targetTextureVarying: 'color'
});

transform.run();
const resultTexture = transform.getTargetTexture();
```

## Types

### `TextureTransformProps`

`TextureTransformProps` extends `ModelProps` except that `fs` is optional.

| Property | Type | Description |
| --- | --- | --- |
| `fs?` | `ModelProps['fs']` | Optional fragment shader. Defaults to a passthrough fragment shader that writes `targetTextureVarying`. |
| `inject?` | `Record<string, string>` | Deprecated injection map. |
| `framebuffer?` | `Framebuffer` | Deprecated externally supplied framebuffer. |
| `sourceBuffers?` | `Record<string, Buffer>` | Deprecated source-buffer map. |
| `sourceTextures?` | `Record<string, Texture>` | Deprecated source-texture map. |
| `targetTexture` | `Texture` | Texture that receives the transform output. |
| `targetTextureChannels` | `1 \| 2 \| 3 \| 4` | Number of channels written by the default fragment shader. |
| `targetTextureVarying` | `string` | Shader output variable consumed by the default fragment shader. |

## Properties

### `device`

Owning device.

### `model`

Underlying `Model` used to run the draw call.

### `sampler`

Nearest-neighbor clamp sampler applied to source textures.

### `bindings`

Internal binding records that track source resources, target textures, and framebuffers.

## Methods

### `constructor(device: Device, props: TextureTransformProps)`

Creates the model, sampler, and framebuffer bindings needed to render into `targetTexture`.

### `run(options?: RenderPassProps): void`

Draws once into the current target framebuffer, then submits the device queue.

### `getTargetTexture(): Texture`

Returns the current output texture.

### `getFramebuffer(): Framebuffer | undefined`

Returns the framebuffer currently wrapping the target texture.

### `destroy(): void`

Destroys the model and any internally created framebuffers.

### `delete(): void`

Deprecated alias for `destroy()`.

## Remarks

- `TextureTransform` uses render passes, not WebGPU compute pipelines.
- The class creates and recreates an internal framebuffer when `targetTexture` changes.
- For new WebGPU-first compute code, prefer [`Computation`](/docs/api-reference/gpgpu/computation).
