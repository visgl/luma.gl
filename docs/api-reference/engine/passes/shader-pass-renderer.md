# ShaderPassRenderer

`ShaderPassRenderer` applies one or more `ShaderPass` or `ShaderPassPipeline` definitions to a source texture and either renders the result back to a texture or draws it to the screen.

Internally it uses [`ClipSpace`](/docs/api-reference/engine/clip-space), [`BackgroundTextureModel`](/docs/api-reference/engine/background-texture-model), and [`SwapFramebuffers`](/docs/api-reference/engine/compute/swap) to manage the pass chain.

## Usage

```typescript
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass, myShaderPassPipeline]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

## Routing Model

The renderer always provides two logical texture sources:

- `original`: the original input texture passed to `renderToTexture()`
- `previous`: the current shared output of the pass chain

Plain `ShaderPass` objects may route subpasses only against those logical sources.

`ShaderPassPipeline` adds pipeline-global named render targets that any later step in that pipeline may read:

```ts
type ShaderPassPipeline<TargetNameT extends string = string> = {
  name: string;
  renderTargets?: Record<TargetNameT, ShaderPassRenderTarget>;
  steps: ShaderPassPipelineStep<TargetNameT>[];
};

type ShaderPassPipelineStep<TargetNameT extends string = string> = {
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

## Example

This example extracts highlights into one named target, runs an existing blur pass into another, then composites back to `previous`:

```ts
const bloomPipeline: ShaderPassPipeline<'extract' | 'blurred'> = {
  name: 'bloom',
  renderTargets: {
    extract: {},
    blurred: {scale: [0.5, 0.5]}
  },
  steps: [
    {
      shaderPass: brightExtractPass,
      inputs: {sourceTexture: 'original'},
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

## Types

### `ShaderPassRendererProps`

```ts
export type ShaderPassRendererProps = {
  shaderPasses: (ShaderPass | ShaderPassPipeline)[];
  shaderInputs?: ShaderInputs;
};
```

## Properties

### `shaderInputs`

Shader-input manager used to store pass uniforms.

### `swapFramebuffers`

Double-buffered framebuffer pair used while running the shared `previous` chain.

### `passRenderers`

Internal per-entry renderers. A renderer for a `ShaderPassPipeline` owns that pipeline's named render targets.

### `textureModel`

Fullscreen background-texture model used when copying or presenting results.

## Methods

### `constructor(device: Device, props: ShaderPassRendererProps)`

Initializes the shader passes, shader inputs, swap framebuffers, and presentation model.

### `destroy(): void`

Destroys owned pass renderers, swap framebuffers, and texture model.

### `resize(size?: [number, number]): void`

Resizes the internal swap framebuffers and all pipeline render targets to match the provided size or the current canvas size.

Named targets respect their declared `scale`. For example, a target with `scale: [0.5, 0.5]` is resized to half width and half height.

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
- Named render targets are declared only on `ShaderPassPipeline`, not on `ShaderPass`.
- Target names `original` and `previous` are reserved and may not be used as pipeline target names.
- A plain `ShaderPass` used outside a pipeline may only reference `original` and `previous`.
- The renderer throws if a pass or pipeline step references an unknown input source or output target.
- The renderer throws if a subpass tries to read from and write to the same named render target in one draw.
