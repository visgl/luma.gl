# Shader Types

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

luma.gl uses string-based shader type descriptors to describe uniform buffers,
vertex attributes, and texture formats in a portable way across WebGL2 and
WebGPU.

This page focuses on the uniform and shader-module side of that system:

- `uniformTypes` on [`ShaderModule`](/docs/api-reference/shadertools/shader-module)
- `UniformTypes<T>` inference from TypeScript uniform shapes
- nested struct and array values flowing through [`ShaderInputs`](/docs/api-reference/engine/shader-inputs),
  [`UniformStore`](/docs/api-reference/core/uniform-store), and
  [`UniformBufferLayout`](/docs/api-reference/core/uniform-buffer-layout)

For adjacent type families, see:

- [Vertex Formats](/docs/api-reference/core/vertex-formats)
- [Texture Formats](/docs/api-reference/core/texture-formats)
- [Shader Layout](/docs/api-reference/core/shader-layout)

## Primitive Shader Types

Primitive uniform leaves remain simple strings:

```ts
{
  enabled: 'i32',
  ambientColor: 'vec3<f32>',
  modelMatrix: 'mat4x4<f32>'
}
```

Common examples include:

- scalars: `'f32'`, `'i32'`, `'u32'`
- vectors: `'vec2<f32>'`, `'vec3<f32>'`, `'vec4<f32>'`
- matrices: `'mat3x3<f32>'`, `'mat4x4<f32>'`

These descriptors must match the order and types declared in the shader's
uniform block.

## Composite Shader Types

luma.gl also supports recursive composite descriptors for uniforms:

- structs use object literals
- fixed-size arrays use `[elementType, length]`

Example:

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

## `UniformTypes<T>` Inference

`@luma.gl/shadertools` exports `UniformTypes<T>` to type-check `uniformTypes`
against your declared uniform value shape.

```ts
import type {ShaderModule, UniformTypes} from '@luma.gl/shadertools';
import type {NumberArray16} from '@math.gl/core';

type Uniforms = {
  color: [number, number, number, number];
  light: {
    position: [number, number, number];
    range: number;
  };
  jointMatrix: NumberArray16[];
};

const uniformTypes = {
  color: 'vec4<f32>',
  light: {
    position: 'vec3<f32>',
    range: 'f32'
  },
  jointMatrix: 'mat4x4<f32>'
} as const satisfies Required<UniformTypes<Omit<Uniforms, 'jointMatrix'>>>;
```

This catches mismatches at compile time, for example:

- scalar descriptors where a tuple requires a vector
- wrong field descriptors inside structs
- wrong element descriptors inside arrays

## Arrays and `uniformSizes`

The recommended array syntax is the canonical composite form:

```ts
lights: [{color: 'vec3<f32>', intensity: 'f32'}, 4]
```

For backward compatibility, luma.gl still accepts legacy top-level array
declarations using `uniformSizes`:

```ts
uniformTypes: {
  jointMatrix: 'mat4x4<f32>'
},
uniformSizes: {
  jointMatrix: 64
}
```

Internally both forms normalize to the same layout model.

Notes:

- `uniformSizes` is only a legacy alias for top-level arrays
- fixed array length must always be explicit
- runtime-sized uniform arrays are not portable on the WebGL2/WebGPU uniform-buffer path

## From Module Props to Packed Uniform Buffers

The data flow is:

1. `ShaderModule.uniformTypes` declares the shader-facing layout
2. application code updates nested values through `ShaderInputs.setProps()`
3. `ShaderInputs` preserves the nested JS shape per module
4. `UniformStore` and `UniformBufferLayout` flatten leaf values internally
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

This is what makes modules like [`lighting`](/docs/api-reference/shadertools/shader-modules/lighting)
work with a nested `lights` array at the public API boundary.

## Limitations

Current portable uniform-buffer support is intentionally conservative:

- nested structs are supported
- one-dimensional fixed-size arrays are supported
- arrays of structs are supported
- structs containing fixed-size arrays are supported
- arrays of arrays are not supported
- runtime-sized uniform arrays are not supported

Also note:

- property order in struct descriptors is significant and defines packing order
- primitive leaf values still use the existing string descriptors
- composite shader type support here is about uniforms, not texture formats or vertex formats

## Example

```ts
import type {ShaderModule} from '@luma.gl/shadertools';

type ClusterUniforms = {
  cluster: {
    center: [number, number, number];
    lights: {
      position: [number, number, number];
      intensity: number;
    }[];
  };
};

export const clusterModule = {
  name: 'cluster',
  uniformTypes: {
    cluster: {
      center: 'vec3<f32>',
      lights: [
        {
          position: 'vec3<f32>',
          intensity: 'f32'
        },
        8
      ]
    }
  }
} as const satisfies ShaderModule<{}, ClusterUniforms>;
```

Application code can then update only the fields it cares about:

```ts
shaderInputs.setProps({
  cluster: {
    cluster: {
      lights: [undefined, {intensity: 0.5}]
    }
  }
});
```

The nested update is merged by schema before being packed into the backing
uniform buffer.
