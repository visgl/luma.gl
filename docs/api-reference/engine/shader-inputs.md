# ShaderInputs

ShaderInputs holds uniform and binding values for one or more shader modules,
- It can generate binary data for any uniform buffer
- It can manage a uniform buffer for each block
- It can update managed uniform buffers with a single call
- It performs some book keeping on what has changed to minimize unnecessary writes to uniform buffers.

## Usage

TBA

## Types

### `ShaderModuleInputs`

Minimal ShaderModule subset, we don't need shader code etc

```ts
export type ShaderModuleInputs<
  PropsT extends Record<string, unknown> = Record<string, unknown>,
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>,
  BindingsT extends Record<string, BindingValue> = Record<string, BindingValue>
> = {
  defaultUniforms?: UniformsT;
  getUniforms?: (props?: any, oldProps?: any) => Record<string, BindingValue | UniformValue>;

  /** Not used. Used to access props type */
  props?: PropsT;

  bindings?: Record<
    keyof BindingsT,
    {
      location: number;
      type: 'texture' | 'sampler' | 'uniforms';
    }
  >;

  uniformTypes?: any;
};
```

```ts
export class ShaderInputs<
  ShaderPropsT extends Partial<Record<string, Record<string, unknown>>> = Partial<
    Record<string, Record<string, unknown>>
  >
```

## Methods

### constructor

Create a new UniformStore instance

```ts
  constructor(modules: {[P in keyof ShaderPropsT]?: ShaderModuleInputs<ShaderPropsT[P]>})
```

- modules: A mao of shader modules.

### `destroy()`

Destroys all resources created by this `ShaderInputs` instance.

  ```ts
  destroy(): void {}
  ```

### `setProps()`

Sets shader module props (which sets uniforms and bindings).

```ts
setProps(props: Partial<{[P in keyof ShaderPropsT]?: Partial<ShaderPropsT[P]>}>): void {
```

### getModules()

Return the map of modules

```ts
getModules(): ShaderModule[]
```

### getUniformValues()

Get all uniform values for all modules

```ts
getUniformValues(): Partial<Record<keyof ShaderPropsT, Record<string, UniformValue>>>
```

### getBindingValues()

Merges all bindings for the shader (from the various modules)

```ts
getBindingValues(): Record<string, Texture | Sampler>
```
