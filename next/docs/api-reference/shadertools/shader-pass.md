# ShaderPass

[Overview](https://luma.gl/next/docs/api-reference/shadertools.md)[ShaderModule](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md)[ShaderPlugin](https://luma.gl/next/docs/api-reference/shadertools/shader-plugin.md)[ShaderPass](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md)[ShaderAssembler](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)[Shader Parsing](https://luma.gl/next/docs/api-reference/shadertools/shader-info.md)[WGSL](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md)[Conventions](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)

`ShaderPass` is a [`ShaderModule`](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md) that can be executed as a standalone fullscreen texture-processing stage. `ShaderPass` and `ShaderPassPipeline` are descriptors from `@luma.gl/shadertools`; [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md) is the engine class that executes them.

For the authoring model, see [Shader Passes](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md).

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass, myShaderPassPipeline]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

Use a plain `ShaderPass` when subpasses only need the logical `original` or `previous` texture sources. Use a `ShaderPassPipeline` when later steps need named intermediate render targets.

## Types[​](#types "Direct link to Types")

### `ShaderPass`[​](#shaderpass-1 "Direct link to shaderpass-1")

```
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

### `ShaderSubPass`[​](#shadersubpass "Direct link to shadersubpass")

```
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

| Property              | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `action?`             | Whether the subpass filters each pixel or performs its own sampling. |
| `sampler?`, `filter?` | Legacy pass behavior flags.                                          |
| `uniforms?`           | Uniform values applied to this subpass.                              |
| `inputs?`             | Shader binding names routed to logical texture sources.              |
| `output?`             | Logical output target. Defaults to `previous`.                       |

### `ShaderPassInputSource`[​](#shaderpassinputsource "Direct link to shaderpassinputsource")

```
export type ShaderPassInputSource<TargetNameT extends string = string> =
  | 'original'
  | 'previous'
  | TargetNameT;
```

### `ShaderPassRenderTarget`[​](#shaderpassrendertarget "Direct link to shaderpassrendertarget")

```
export type ShaderPassRenderTarget = {
  scale?: [number, number];
  format?: TextureFormat;
  lifetime?: 'transient' | 'history';
  initialize?: 'original' | {clearColor: [number, number, number, number]};
};
```

`history` targets retain the last successfully rendered value through an internal ping-pong pair. When one step reads and writes the same history target, it reads the previous frame and writes the current frame. `initialize` controls the first value after construction, resize, or reset.

### `ShaderPassPipeline`[​](#shaderpasspipeline "Direct link to shaderpasspipeline")

```
export type ShaderPassPipeline<TargetNameT extends string = string> = {
  name: string;
  renderTargets?: Record<TargetNameT, ShaderPassRenderTarget>;
  steps: ShaderPassPipelineStep<TargetNameT>[];
};
```

### `ShaderPassPipelineStep`[​](#shaderpasspipelinestep "Direct link to shaderpasspipelinestep")

```
export type ShaderPassPipelineStep<TargetNameT extends string = string> = {
  shaderPass: ShaderPass<any, any, any, any>;
  inputs?: Record<string, ShaderPassInputSource<TargetNameT>>;
  output?: 'previous' | TargetNameT;
  uniforms?: Record<string, UniformValue>;
};
```

`ShaderPassPipeline` owns named render targets. A plain `ShaderPass` does not. For routing validation, draw-time uniforms and bindings, resize behavior, and presentation methods, see [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md).

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [Shader Passes guide](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md)
* [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md)
* [Shader Pass Catalog](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/image-processing.md)
