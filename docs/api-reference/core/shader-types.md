# Shader Types

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

The `@luma.gl/core` module defines the portable shader type descriptors used by
luma.gl to describe uniform buffers, vertex attributes, and texture formats
across WebGL2 and WebGPU.

This page is the canonical reference for the uniform and shader-module side of
that system:

- `uniformTypes` on [`ShaderModule`](/docs/api-reference/shadertools/shader-module)
- `UniformTypes<T>` validation in `@luma.gl/shadertools`
- nested values flowing through [`ShaderInputs`](/docs/api-reference/engine/shader-inputs),
  [`UniformStore`](/docs/api-reference/core/uniform-store), and
  [`ShaderBlockLayout`](/docs/api-reference/core/shader-block-layout)

For adjacent type families, see:

- [Vertex Formats](/docs/api-reference/core/vertex-formats)
- [Texture Formats](/docs/api-reference/core/texture-formats)
- [Shader Layout](/docs/api-reference/core/shader-layout)

## Reference Table

Use canonical WGSL-style descriptors for uniform leaves, then compose them with
object literals and fixed-size arrays.

| Descriptor | Category | TypeScript value shape | Notes |
| ---------- | -------- | ---------------------- | ----- |
| `'f32'` | Scalar | `number` | 32-bit float scalar |
| `'i32'` | Scalar | `number` | 32-bit signed integer scalar |
| `'u32'` | Scalar | `number` | 32-bit unsigned integer scalar |
| `'f16'` | Scalar | `number` | 16-bit float descriptor |
| `'vec2<f32>'` | Vector | `[number, number]` | 2-component float vector |
| `'vec2<i32>'` | Vector | `[number, number]` | 2-component signed integer vector |
| `'vec2<u32>'` | Vector | `[number, number]` | 2-component unsigned integer vector |
| `'vec2<f16>'` | Vector | `[number, number]` | 2-component half-float vector |
| `'vec3<f32>'` | Vector | `[number, number, number]` | 3-component float vector |
| `'vec3<i32>'` | Vector | `[number, number, number]` | 3-component signed integer vector |
| `'vec3<u32>'` | Vector | `[number, number, number]` | 3-component unsigned integer vector |
| `'vec3<f16>'` | Vector | `[number, number, number]` | 3-component half-float vector |
| `'vec4<f32>'` | Vector | `[number, number, number, number]` | 4-component float vector |
| `'vec4<i32>'` | Vector | `[number, number, number, number]` | 4-component signed integer vector |
| `'vec4<u32>'` | Vector | `[number, number, number, number]` | 4-component unsigned integer vector |
| `'vec4<f16>'` | Vector | `[number, number, number, number]` | 4-component half-float vector |
| `'mat2x2<f32>'` | Matrix | `NumberArray4` | 2 columns, 2 rows |
| `'mat2x3<f32>'` | Matrix | `NumberArray6` | 2 columns, 3 rows |
| `'mat2x4<f32>'` | Matrix | `NumberArray8` | 2 columns, 4 rows |
| `'mat3x2<f32>'` | Matrix | `NumberArray6` | 3 columns, 2 rows |
| `'mat3x3<f32>'` | Matrix | `NumberArray9` | 3 columns, 3 rows |
| `'mat3x4<f32>'` | Matrix | `NumberArray12` | 3 columns, 4 rows |
| `'mat4x2<f32>'` | Matrix | `NumberArray8` | 4 columns, 2 rows |
| `'mat4x3<f32>'` | Matrix | `NumberArray12` | 4 columns, 3 rows |
| `'mat4x4<f32>'` | Matrix | `NumberArray16` or `Matrix4` | 4 columns, 4 rows |
| `{position: 'vec3<f32>', intensity: 'f32'}` | Struct template | `{position: [number, number, number]; intensity: number}` | Property order defines packing order |
| `['f32', 4]` | Array template | `number[]` | Fixed-size array of primitive leaves |
| `['mat4x4<f32>', 64]` | Array template | `NumberArray16[]` | Fixed-size array of matrices |
| `[{position: 'vec3<f32>', intensity: 'f32'}, 4]` | Array template | `{position: [number, number, number]; intensity: number}[]` | Fixed-size array of structs |

Notes:

- array lengths are always explicit
- arrays of arrays are not supported
- property order in struct descriptors is significant
- `ShaderInputs` preserves the nested JavaScript shape at the module boundary

## Composite Type Example

```ts
const uniformTypes = {
  camera: {
    position: 'vec3<f32>',
    exposure: 'f32'
  },
  lights: [
    {
      color: 'vec3<f32>',
      position: 'vec3<f32>',
      intensity: 'f32'
    },
    4
  ]
} as const;
```

The corresponding TypeScript uniform values stay nested:

```ts
type Uniforms = {
  camera: {
    position: [number, number, number];
    exposure: number;
  };
  lights: {
    color: [number, number, number];
    position: [number, number, number];
    intensity: number;
  }[];
};
```

## TypeScript Type Inference

`@luma.gl/shadertools` exports `UniformTypes<T>` to validate `uniformTypes`
against your declared uniform value shape.

When a module is declared with both `uniformTypes` and a typed
`ShaderModule<PropsT, UniformsT>`, luma.gl can type-check several boundaries
automatically:

- the `uniformTypes` object itself is checked against `UniformsT`
- `getUniforms(props, prevUniforms)` is typed from `PropsT` and `UniformsT`
- [`ShaderInputs.setProps()`](/docs/api-reference/engine/shader-inputs) is typed
  from the module's `PropsT`, so nested struct and array props are checked at
  the app boundary

Example:

```ts
import type {ShaderModule, UniformTypes} from '@luma.gl/shadertools';
import {ShaderInputs} from '@luma.gl/engine';
import type {NumberArray16} from '@math.gl/core';

type Uniforms = {
  color: [number, number, number, number];
  light: {
    position: [number, number, number];
    range: number;
  };
  jointMatrix: NumberArray16[];
};

type Props = {
  color?: [number, number, number, number];
  light?: {
    position?: [number, number, number];
    range?: number;
  };
  jointMatrix?: NumberArray16[];
};

const module = {
  name: 'example',
  uniformTypes: {
    color: 'vec4<f32>',
    light: {
      position: 'vec3<f32>',
      range: 'f32'
    },
    jointMatrix: ['mat4x4<f32>', 64]
  },
  getUniforms: (props, previousUniforms) => props
} as const satisfies ShaderModule<Props, Uniforms>;

const shaderInputs = new ShaderInputs({example: module});

shaderInputs.setProps({
  example: {
    light: {
      position: [1, 2, 3]
    }
  }
});
```

This catches mismatches at compile time, for example:

- scalar descriptors where a tuple requires a vector
- wrong field descriptors inside structs
- wrong element descriptors inside arrays
- invalid nested values passed through `ShaderInputs.setProps()`

## From Module Props to Packed Uniform Buffers

The data flow is:

1. `ShaderModule.uniformTypes` declares the shader-facing layout
2. application code updates nested values through `ShaderInputs.setProps()`
3. `ShaderInputs` preserves the nested JavaScript shape per module
4. `UniformStore` and `ShaderBlockWriter` flatten leaf values internally
5. the final buffer is packed using std140-compatible rules

That means application code works with values like:

```ts
shaderInputs.setProps({
  lighting: {
    lights: [
      {type: 'ambient', color: [255, 255, 255], intensity: 0.15},
      {
        type: 'spot',
        color: [255, 120, 10],
        position: [2, 4, 3],
        direction: [-2, -4, -3],
        innerConeAngle: 0.2,
        outerConeAngle: 0.55
      }
    ]
  }
});
```

while internal packing works with flattened leaf paths such as:

- `light.transform.position`
- `lights[0].intensity`

## `ShaderInputs` and Composite Uniforms

[`ShaderInputs`](/docs/api-reference/engine/shader-inputs) uses the declared
`uniformTypes` schema when deciding whether a returned value is a uniform or a
binding.

That matters for composite values because plain objects no longer imply
"binding":

- if a key exists in `module.uniformTypes`, it is treated as a uniform even when
  the value is a struct or array
- only keys outside `uniformTypes` are treated as bindings

This is what makes modules like
[`lighting`](/docs/api-reference/shadertools/shader-modules/lighting) work
with a nested `lights` array at the public API boundary.

## Limitations

Current portable uniform-buffer support is intentionally conservative:

- nested structs are supported
- one-dimensional fixed-size arrays are supported
- arrays of structs are supported
- structs containing fixed-size arrays are supported
- arrays of arrays are not supported
- runtime-sized uniform arrays are not supported

Also note:

- primitive leaf values still use the string descriptors listed above
- composite shader type support here is about uniforms, not texture formats or vertex formats
- `ShaderBlockLayout`, `ShaderBlockWriter`, and `UniformStore` are runtime packing utilities, not sources of TypeScript inference
