# TextureTransform

`TextureTransform` is the engine helper for texture-to-texture transform passes.
It builds an internal [`Model`](/docs/api-reference/engine/model), manages a framebuffer for the target texture, and renders into that texture.

`TextureTransform` is currently exported but marked deprecated in source.

## Usage

```typescript
import {TextureTransform} from '@luma.gl/engine';

const transform = new TextureTransform(device, {
  vs: VERTEX_SHADER,
  targetTexture,
  targetTextureChannels: 4,
  targetTextureVarying: 'outColor',
  sourceTextures: {
    sourceTexture
  }
});

transform.run();
```

## Types

### `TextureTransformProps`

```ts
export type TextureTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs'];
  inject?: Record<string, string>;
  framebuffer?: Framebuffer;
  sourceBuffers?: Record<string, Buffer>;
  sourceTextures?: Record<string, Texture>;
  targetTexture: Texture;
  targetTextureChannels: 1 | 2 | 3 | 4;
  targetTextureVarying: string;
};
```

`inject`, `framebuffer`, `sourceBuffers`, and `sourceTextures` are retained mainly for backward compatibility and are marked deprecated in source comments.

## Properties

### `device`, `model`, `sampler`

Owning device, internal fullscreen model, and sampler used for source textures.

### `bindings`

Internal binding state for the active transform setup.

## Methods

### `constructor(device: Device, props: TextureTransformProps)`

Creates the internal model and framebuffer binding state.

### `destroy(): void`

Destroys the internal model and any owned framebuffers.

### `delete(): void`

Deprecated alias for `destroy()`.

### `run(options?: RenderPassProps): void`

Renders one pass into the current target texture framebuffer.

### `getTargetTexture(): Texture`

Returns the current output texture.

### `getFramebuffer(): Framebuffer | undefined`

Returns the framebuffer currently used as the render target.

## Remarks

- The default fragment shader is automatically synthesized from `targetTextureVarying` and `targetTextureChannels` when `fs` is omitted.
- For new work, prefer more explicit render-pass or compute abstractions when possible.
