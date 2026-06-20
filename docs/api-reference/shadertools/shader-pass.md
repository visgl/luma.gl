# ShaderPass

`ShaderPass` is a [`ShaderModule`](/docs/api-reference/shadertools/shader-module)
that can be executed as a standalone fullscreen texture-processing stage.
`ShaderPass` and `ShaderPassPipeline` are descriptors from
`@luma.gl/shadertools`; [`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer)
is the engine class that executes them.

For the authoring model, see
[Shader Passes](/docs/api-guide/shaders/shader-passes).

## Usage

```typescript
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass, myShaderPassPipeline]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

Use a plain `ShaderPass` when subpasses only need the logical `original` or
`previous` texture sources. Use a `ShaderPassPipeline` when later steps need
named intermediate render targets.

## Types

### `ShaderPass`

```ts
export type ShaderPass<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = PickUniforms<PropsT>,
  BindingsT extends Record<string, Binding> = PickBindings<PropsT>,
  RenderTargetNameT extends string = never
> = ShaderModule<PropsT, UniformsT, BindingsT> & {
  passes?: ShaderSubPass<UniformsT, Extract<keyof BindingsT, string>, RenderTargetNameT>[];
};
```

`ShaderPass` inherits all `ShaderModule` fields and may add `passes`.

### `ShaderSubPass`

```ts
export type ShaderSubPass<
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>,
  BindingNameT extends string = string,
  RenderTargetNameT extends string = string
> = {
  action?: 'filter' | 'sample';
  sampler?: boolean;
  filter?: boolean;
  uniforms?: UniformsT;
  inputs?: Partial<
    Record<BindingNameT | 'sourceTexture', ShaderPassInputSource<RenderTargetNameT>>
  >;
  output?: 'previous' | RenderTargetNameT;
};
```

| Property | Description |
| --- | --- |
| `action?` | Whether the subpass filters each pixel or performs its own sampling. |
| `sampler?`, `filter?` | Legacy pass behavior flags. |
| `uniforms?` | Uniform values applied to this subpass. |
| `inputs?` | Shader binding names routed to logical texture sources. |
| `output?` | Logical output target. Defaults to `previous`. |

### `ShaderPassInputSource`

```ts
export type ShaderPassInputSource<TargetNameT extends string = string> =
  | 'original'
  | 'previous'
  | TargetNameT;
```

### `ShaderPassRenderTarget`

```ts
export type ShaderPassRenderTarget = {
  scale?: [number, number];
  format?: TextureFormat;
};
```

### `ShaderPassPipeline`

```ts
export type ShaderPassPipeline<TargetNameT extends string = string> = {
  name: string;
  renderTargets?: Record<TargetNameT, ShaderPassRenderTarget>;
  steps: ShaderPassPipelineStep<TargetNameT>[];
};
```

### `ShaderPassPipelineStep`

```ts
export type ShaderPassPipelineStep<TargetNameT extends string = string> = {
  shaderPass: ShaderPass<any, any, any, any>;
  inputs?: Record<string, ShaderPassInputSource<TargetNameT>>;
  output?: 'previous' | TargetNameT;
  uniforms?: Record<string, UniformValue>;
};
```

`ShaderPassPipeline` owns named render targets. A plain `ShaderPass` does not.
For routing validation, draw-time uniforms and bindings, resize behavior, and
presentation methods, see
[`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer).

## Related Pages

- [Shader Passes guide](/docs/api-guide/shaders/shader-passes)
- [`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer)
- [Shader Pass Catalog](/docs/api-reference/shadertools/shader-passes/image-processing)
