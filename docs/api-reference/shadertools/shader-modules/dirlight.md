# dirlight

The `dirlight` shader module is a lightweight alternative to the full
[`lighting`](/docs/api-reference/shadertools/shader-modules/lighting) module.
It applies a single directional-light dot product and is intended for simple
materials or examples that do not need multiple light sources.

## Props

### `lightDirection?: [number, number, number]`

Direction of the light in world space.

## Usage

In the vertex shader, pass the transformed normal to the module:

```glsl
dirlight_setNormal(normalize(worldNormal));
```

In the fragment shader, filter the output color:

```glsl
fragColor = dirlight_filterColor(fragColor);
```

## Uniforms

```ts
{
  lightDirection: 'vec3<f32>'
}
```

The default light direction is `[1, 1, 2]`.

## Shader Functions

### `dirlight_setNormal(normal)`

Stores the surface normal for later lighting evaluation.

### `dirlight_filterColor(color)`

Applies a single directional Lambert-style term to the input color.

## Remarks

- `dirlight` is intentionally simple and does not share the `lighting` module's
  multi-light uniform layout.
- If you need ambient light, multiple lights, or shared scene lighting across
  several material modules, use [`lighting`](/docs/api-reference/shadertools/shader-modules/lighting) instead.
