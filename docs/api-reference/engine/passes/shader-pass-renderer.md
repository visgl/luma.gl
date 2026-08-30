import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';
import {BloomExample} from '@site/src/examples';

# ShaderPassRenderer

<EngineDocsTabs group="fullscreen" active="shader-pass-renderer" />

`ShaderPassRenderer` applies one or more `ShaderPass` or `CompositeShaderPass` definitions to a source texture and either renders the result back to a texture or draws it to the screen.

Internally it uses [`ClipSpace`](/docs/api-reference/engine/clip-space), [`BackgroundTextureModel`](/docs/api-reference/engine/background-texture-model), and [`SwapFramebuffers`](/docs/api-reference/engine/compute/swap) to manage the pass chain.

For the descriptor types, see
[`ShaderPass`](/docs/api-reference/shadertools/shader-pass). For the authoring
model, see [Shader Passes](/docs/api-guide/shaders/shader-passes).

<BloomExample embedded showStats={false} />

## Usage

```typescript
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass, myCompositeShaderPass]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

Per-draw uniforms and extra bindings can be supplied when a pass needs frame-specific inputs:

```typescript
renderer.renderToScreen({
  sourceTexture: sceneColorTexture,
  bindings: {depthTexture: sceneDepthTexture},
  uniforms: {
    dof: {
      depthRange: [0.1, 30],
      focusDistance: 3,
      blurCoefficient: 0.9,
      pixelsPerMillimeter: 42
    }
  }
});
```

## Routing Model

The renderer always provides two logical texture sources:

- `original`: the original input texture passed to `renderToTexture()`
- `previous`: the current shared output of the pass chain

Plain `ShaderPass` objects may route subpasses only against those logical sources.

`CompositeShaderPass` adds owned named render targets that any later step in that composite pass may read:

```ts
type CompositeShaderPass<TargetNameT extends string = string> = {
  name: string;
  renderTargets?: Record<TargetNameT, ShaderPassRenderTarget>;
  steps: CompositeShaderPassStep<TargetNameT>[];
};

type ShaderPassRenderTarget = {
  scale?: [number, number];
  format?: TextureFormat;
  sampler?: SamplerProps;
};

type CompositeShaderPassStep<TargetNameT extends string = string> = {
  shaderPass: ShaderPass;
  inputs?: Record<string, ShaderPassInputSource<TargetNameT>>;
  output?: 'previous' | TargetNameT;
  uniforms?: Record<string, UniformValue>;
};
```

Each step runs an existing `ShaderPass`:

- `step.inputs` is applied to the first subpass of the referenced pass.
- `step.output` is applied to the last subpass of the referenced pass.
- `step.uniforms` is merged into every subpass as a base layer.

This lets the renderer orchestrate existing passes without turning `ShaderPass.passes` into nested effects.

## Runtime Inputs

At draw time, the renderer merges three uniform layers for each shader pass:

- values already stored in `shaderInputs`
- uniforms declared on the pass or composite-pass step
- `options.uniforms` passed to `renderToTexture()` / `renderToScreen()`

Bindings follow a similar pattern:

- bindings already stored in `shaderInputs` for the current shader pass
- `options.bindings` passed to the draw call

This makes it practical to keep one renderer alive while swapping in frame-specific resources such
as a freshly rendered depth texture or a `VideoTexture`.

When you call `shaderInputs.setProps({[passName]: {...}})`, any texture bindings in that object are
stored as defaults for that specific shader pass. `ShaderPassRenderer` resolves those defaults per
pass, then layers `options.bindings` on top for per-frame overrides.

## Example

This example extracts highlights into one named target, runs an existing blur pass into another, then composites back to `previous`:

```ts
const bloomPipeline: CompositeShaderPass<'extract' | 'blurred'> = {
  name: 'bloom',
  renderTargets: {
    extract: {},
    blurred: {scale: [0.5, 0.5]}
  },
  steps: [
    {
      shaderPass: brightExtractPass,
      inputs: {sourceTexture: 'previous'},
      output: 'extract',
      uniforms: {threshold: 0.8}
    },
    {
      shaderPass: gaussianBlur,
      inputs: {sourceTexture: 'extract'},
      output: 'blurred',
      uniforms: {radius: 12}
    },
    {
      shaderPass: bloomCompositePass,
      inputs: {
        sourceTexture: 'previous',
        bloomTexture: 'blurred'
      },
      output: 'previous',
      uniforms: {intensity: 1.5}
    }
  ]
};
```

Using `previous` for the primary color input makes the composite pass compose in its declared position
in `shaderPasses`. `original` remains available for an intentional bypass of preceding effects.

## Types

### `ShaderPassRendererProps`

```ts
export type ShaderPassRendererProps = {
  shaderPasses: (ShaderPass | CompositeShaderPass)[];
  shaderInputs?: ShaderInputs;
  colorFormat?: TextureFormatColor;
  flipY?: boolean;
};
```

`colorFormat` controls the shared `previous` ping-pong textures and defaults to
`device.preferredColorFormat`. Use `rgba16float` when HDR-producing passes must retain values
above 1.0 until a later tone-mapping pass.

`flipY` controls texture sampling in the fullscreen copies and every shader subpass. It defaults
to `true` on WebGPU so framebuffer attachments retain a consistent top-left screen orientation
through intermediate render targets. Set it explicitly when integrating textures with a different
origin convention.

## Properties

### `shaderInputs`

Shader-input manager used to store pass uniforms.

### `swapFramebuffers`

Double-buffered framebuffer pair used while running the shared `previous` chain.

### `passRenderers`

Internal per-entry renderers. A renderer for a `CompositeShaderPass` owns that composite pass's named render targets.

### `textureModel`

Fullscreen background-texture model used when copying or presenting results.

## Methods

### `constructor(device: Device, props: ShaderPassRendererProps)`

Initializes the shader passes, shader inputs, swap framebuffers, and presentation model.

### `destroy(): void`

Destroys owned pass renderers, swap framebuffers, and texture model.

### `resize(size?: [number, number]): void`

Resizes the internal swap framebuffers and all composite-pass render targets to match the provided size or the current canvas size.

Named targets respect their declared `scale`. For example, a target with `scale: [0.5, 0.5]` is resized to half width and half height.

Set `sampler: {minFilter: 'linear', magFilter: 'linear'}` on downsampled color targets when they
will be upsampled later. Linear sampling prevents block-shaped bloom halos while leaving existing
nearest-sampled passes unchanged.

Resizing invalidates history targets whose allocation size changes.

### `resetHistory(): void`

Invalidates every history target. The next render initializes each target from its declared
`initialize` value without reallocating it.

### `renderToScreen(options): boolean`

Runs the pass chain and then draws the result into the device's current framebuffer.

```ts
renderToScreen(options: {
  sourceTexture: DynamicTexture | Texture;
  uniforms?: Record<string, Record<string, unknown>>;
  bindings?: Record<string, Binding | TextureBindingSource>;
  resetHistory?: boolean;
}): boolean
```

Returns `false` when the source texture is not ready yet.

### `renderToTexture(options): Texture | null`

Runs the pass chain and returns the output texture.

```ts
renderToTexture(options: {
  sourceTexture: DynamicTexture | Texture;
  uniforms?: Record<string, Record<string, unknown>>;
  bindings?: Record<string, Binding | TextureBindingSource>;
  resetHistory?: boolean;
}): Texture | null
```

### `encodeToScreen(commandEncoder, options): boolean`

Records the pass chain and final presentation into a caller-owned command encoder.

```ts
encodeToScreen(
  commandEncoder: CommandEncoder,
  options: ShaderPassRendererRenderOptions
): boolean
```

This method only records commands. The caller remains responsible for finishing and submitting the
encoder. The encoder must belong to the renderer's device, and no render or compute pass may be
active when this method is called. Returns `false` when the source texture is not ready yet.

### `encodeToTexture(commandEncoder, options): Texture | null`

Records the pass chain into a caller-owned command encoder and returns the renderer-owned output
texture.

```ts
encodeToTexture(
  commandEncoder: CommandEncoder,
  options: ShaderPassRendererRenderOptions
): Texture | null
```

This method does not finish or submit the encoder. The encoder must belong to the renderer's device,
and no render or compute pass may be active. The returned texture is valid after the recorded command
buffer has been submitted.

## Remarks

- `sourceTexture` may be a `DynamicTexture` or a ready `Texture`.
- `uniforms` may supply per-draw shader module uniforms keyed by shader pass name.
- `bindings` may supply per-draw texture bindings or texture binding sources keyed by shader binding name.
- `renderToScreen()` and `renderToTexture()` are convenience wrappers that record onto
  `device.commandEncoder`; use the `encodeTo*()` variants when composing with a command graph or
  another caller-owned encoder.
- Two internal framebuffers are used for ping-pong rendering through the shared `previous` sequence.
- Named render targets are declared only on `CompositeShaderPass`, not on `ShaderPass`.
- Target names `original` and `previous` are reserved and may not be used as composite-pass target names.
- A plain `ShaderPass` may only reference `original` and `previous`.
- The renderer throws if a pass or composite-pass step references an unknown input source or output target.
- The renderer throws if a subpass tries to read from and write to the same named render target in one draw.
- A `history` target is the exception: same-target reads resolve to the previous physical texture,
  and the write becomes visible to later steps only after that draw succeeds.
- History textures swap only after the complete pass chain succeeds.
