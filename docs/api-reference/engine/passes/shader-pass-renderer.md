# ShaderPassRenderer

A` ShaderPassRenderer` takes an source texture and applies a sequence of `ShaderPasses` and returns an output texture that can be rendered to the screen.

The primary purpose is to run postprocessing effects on rendered contents.

Remarks:
- A `ShaderPassRenderer` instance will create two textures of the same size as the input texture. For a high resolution, high DPI screen these textures can consume considerable memory, which is a potential concern for mobile applications.

## Usage

TBA

## Types

### `ShaderPassRendererProps`

```ts
export type ShaderPassRendererProps = {
  /** List of ShaderPasses to apply to the sourceTexture */
  shaderPasses: ShaderPass[];
  /** Optional typed ShaderInputs object for setting uniforms */
  shaderInputs: ShaderInputs;
};
``

## Methods

### constructor

```ts
new ShaderPassRenderer(device: Device, props: ShaderPassRendererProps);
```

###  `destroy()`

Destroys any resources created by the `ShaderPassRenderer` (the two textures)

### `resize()`

Resizes the internal textures.

```ts
resize(width: number, height: number);
```

### `renderToTexture()`

```ts
renderToTexture(options: {sourceTexture: AsyncTexture; uniforms; bindings}): Texture | null;
```
A` ShaderPassRenderer` takes an source texture and applies a sequence of `ShaderPasses` and returns an output texture of the same size that can be rendered to the screen.

Returns: the rendered `Texture` which can now be rendered to the screen, or `null` if the initial texture is an async texture that has not yet been loaded.
