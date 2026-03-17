# ShaderPassRenderer

`ShaderPassRenderer` applies one or more `ShaderPass` definitions to a source texture and either renders the result back to a texture or draws it to the screen.

Internally it uses [`ClipSpace`](/docs/api-reference/engine/clip-space), [`BackgroundTextureModel`](/docs/api-reference/engine/background-texture-model), and [`SwapFramebuffers`](/docs/api-reference/engine/compute/swap) to manage the pass chain.

## Usage

```typescript
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

## Types

### `ShaderPassRendererProps`

```ts
export type ShaderPassRendererProps = {
  shaderPasses: ShaderPass[];
  shaderInputs?: ShaderInputs;
};
```

## Properties

### `shaderInputs`

Shader-input manager used to store pass uniforms.

### `swapFramebuffers`

Double-buffered framebuffer pair used while running the pass chain.

### `textureModel`

Fullscreen background-texture model used when copying or presenting results.

## Methods

### `constructor(device: Device, props: ShaderPassRendererProps)`

Initializes the shader passes, shader inputs, swap framebuffers, and presentation model.

### `destroy(): void`

Destroys owned pass renderers, swap framebuffers, and texture model.

### `resize(size?: [number, number]): void`

Resizes the internal swap framebuffers to match the provided size or the current canvas size.

### `renderToScreen(options): boolean`

Runs the pass chain and then draws the result into the device's current framebuffer.

```ts
renderToScreen(options: {
  sourceTexture: DynamicTexture;
  uniforms?: any;
  bindings?: any;
}): boolean
```

Returns `false` when the source texture is not ready yet.

### `renderToTexture(options): Texture | null`

Runs the pass chain and returns the output texture.

```ts
renderToTexture(options: {
  sourceTexture: DynamicTexture;
  uniforms?: any;
  bindings?: any;
}): Texture | null
```

## Remarks

- The current implementation expects `sourceTexture` to be a `DynamicTexture`.
- Two internal framebuffers are used for ping-pong rendering through the pass sequence.
