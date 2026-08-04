# TextureTransform

[GPU Computations](https://luma.gl/next/docs/api-guide/engine/transforms.md)[Computation](https://luma.gl/next/docs/api-reference/engine/compute/computation.md)[BufferTransform](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md)[TextureTransform](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md)[Swap](https://luma.gl/next/docs/api-reference/engine/compute/swap.md)

`TextureTransform` is the engine helper for texture-to-texture transform passes. It builds an internal [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md), manages a framebuffer for the target texture, and renders into that texture.

`TextureTransform` is currently exported but marked deprecated in source.

## Usage[​](#usage "Direct link to Usage")

```
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

## Types[​](#types "Direct link to Types")

### `TextureTransformProps`[​](#texturetransformprops "Direct link to texturetransformprops")

```
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

## Properties[​](#properties "Direct link to Properties")

### `device`, `model`, `sampler`[​](#device-model-sampler "Direct link to device-model-sampler")

Owning device, internal fullscreen model, and sampler used for source textures.

### `bindings`[​](#bindings "Direct link to bindings")

Internal binding state for the active transform setup.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: TextureTransformProps)`[​](#constructordevice-device-props-texturetransformprops "Direct link to constructordevice-device-props-texturetransformprops")

Creates the internal model and framebuffer binding state.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the internal model and any owned framebuffers.

### `delete(): void`[​](#delete-void "Direct link to delete-void")

Deprecated alias for `destroy()`.

### `run(options?: RenderPassProps): void`[​](#runoptions-renderpassprops-void "Direct link to runoptions-renderpassprops-void")

Renders one pass into the current target texture framebuffer.

### `getTargetTexture(): Texture`[​](#gettargettexture-texture "Direct link to gettargettexture-texture")

Returns the current output texture.

### `getFramebuffer(): Framebuffer | undefined`[​](#getframebuffer-framebuffer--undefined "Direct link to getframebuffer-framebuffer--undefined")

Returns the framebuffer currently used as the render target.

## Remarks[​](#remarks "Direct link to Remarks")

* The default fragment shader is automatically synthesized from `targetTextureVarying` and `targetTextureChannels` when `fs` is omitted.
* For new work, prefer more explicit render-pass or compute abstractions when possible.
