# ShaderPassRenderer

`ShaderPassRenderer` applies one or more `ShaderPass` definitions to a source texture and either renders the result back to a texture or draws it to the screen.

Internally it uses [`ClipSpace`](/docs/api-reference/engine/clip-space), [`BackgroundTextureModel`](/docs/api-reference/engine/background-texture-model), and [`SwapFramebuffers`](/docs/api-reference/engine/compute/swap) to manage the pass chain.

The renderer supports two kinds of render targets:

- The shared `previous` chain, implemented as an internal ping-pong framebuffer pair.
- Pass-private named render targets declared on an individual `ShaderPass`.

This lets a pass stage intermediate results without mutating the shared `previous` texture until it explicitly chooses to write back.

## Usage

```typescript
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

## Routing Model

During a single `renderToTexture()` call, every subpass can read from:

- `original`: the original input texture passed to the renderer.
- `previous`: the current shared output of the pass chain. On the first subpass this is the same texture as `original`.
- A named private render target declared by the current `ShaderPass`.

Every subpass can write to:

- `previous`: the shared ping-pong chain. This is the default.
- A named private render target declared by the current `ShaderPass`.

Named render targets are private to one shader pass. They cannot be read by later shader passes in the chain.

## ShaderPass Extensions

`ShaderPassRenderer` understands the following optional `ShaderPass` fields:

```ts
type ShaderPassRenderTarget = {
  scale?: [number, number];
  format?: TextureFormat;
};

type ShaderPassInputSource<RenderTargetNameT extends string = string> =
  | 'original'
  | 'previous'
  | RenderTargetNameT;

type ShaderSubPass<
  UniformsT extends Record<string, UniformValue>,
  BindingNameT extends string = string,
  RenderTargetNameT extends string = string
> = {
  uniforms?: UniformsT;
  inputs?: Partial<
    Record<BindingNameT | 'sourceTexture', ShaderPassInputSource<RenderTargetNameT>>
  >;
  output?: 'previous' | RenderTargetNameT;
};
```

Notes:

- `renderTargets` is declared on the parent `ShaderPass`, not on the renderer.
- `inputs` maps shader binding names to logical texture sources.
- `output` selects the destination render target for that subpass.
- If `inputs` is omitted, the renderer behaves as if `{sourceTexture: 'previous'}` was supplied.
- If `output` is omitted, the renderer behaves as if `'previous'` was supplied.

## Example

This example stages bright pixels into one private target, blurs them into another, and then composites back onto the shared chain:

```ts
const bloomLikePass: ShaderPass<
  {threshold?: number; bloomTexture?: Texture},
  {threshold?: number},
  {bloomTexture?: Texture},
  'extract' | 'blur'
> = {
  name: 'bloomLike',
  renderTargets: {
    extract: {},
    blur: {scale: [0.5, 0.5]}
  },
  passes: [
    {
      sampler: true,
      uniforms: {threshold: 0.7},
      output: 'extract'
    },
    {
      sampler: true,
      inputs: {sourceTexture: 'extract'},
      output: 'blur'
    },
    {
      sampler: true,
      inputs: {
        sourceTexture: 'previous',
        bloomTexture: 'blur'
      },
      output: 'previous'
    }
  ]
};
```

In that final composite subpass:

- `sourceTexture: 'previous'` still refers to the shared chain.
- `bloomTexture: 'blur'` reads the pass-private blurred texture.
- Writing to `previous` advances the global pass chain only after the composite is complete.

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

### `passRenderers`

Internal per-pass renderers. Each one owns any private render targets declared by its `ShaderPass`.

### `textureModel`

Fullscreen background-texture model used when copying or presenting results.

## Methods

### `constructor(device: Device, props: ShaderPassRendererProps)`

Initializes the shader passes, shader inputs, swap framebuffers, and presentation model.

### `destroy(): void`

Destroys owned pass renderers, swap framebuffers, and texture model.

### `resize(size?: [number, number]): void`

Resizes the internal swap framebuffers and all pass-private render targets to match the provided size or the current canvas size.

Private targets respect their declared `scale`. For example, a target with `scale: [0.5, 0.5]` is resized to half width and half height.

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
- Two internal framebuffers are used for ping-pong rendering through the shared `previous` sequence.
- Pass-private render targets are allocated once per `ShaderPassRenderer`, resized with `resize()`, and destroyed with `destroy()`.
- Render-target names `original` and `previous` are reserved and may not be used as private target names.
- Subpasses may read `original`, `previous`, or a private target from the same pass.
- Subpasses may not read a private target owned by a different shader pass.
- The renderer throws if a subpass references an unknown input source or output target.
- The renderer throws if a subpass tries to read from and write to the same private render target in one draw.
