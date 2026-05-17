# ShaderExtension

`ShaderExtension` groups reusable shader assembly contributions that can be attached to [`Model`](/docs/api-reference/engine/model) and [`Computation`](/docs/api-reference/engine/compute/computation).

## Type

```ts
export type ShaderExtension = {
  name: string;
  modules?: ShaderModule[];
  defines?: Record<string, boolean>;
  injections?: ShaderExtensionInjection[];
  glsl?: ShaderExtensionVariant;
  wgsl?: ShaderExtensionVariant;
};

export type ShaderExtensionVariant = {
  modules?: ShaderModule[];
  defines?: Record<string, boolean>;
  injections?: ShaderExtensionInjection[];
};

export type ShaderExtensionInjection = {
  target: ShaderExtensionInjectionTarget;
  injection: string;
  order?: number;
};
```

## Resolution

- Top-level `modules`, `defines`, and `injections` are shared.
- `glsl` and `wgsl` fields add backend-specific contributions.
- Backend define keys override same-named shared define keys.
- Injection entries preserve author order within the same `order` value.

## Injection Targets

`ShaderExtension` only accepts named injection targets:

- `vs:#decl`
- `vs:#main-start`
- `vs:#main-end`
- `fs:#decl`
- `fs:#main-start`
- `fs:#main-end`
- named shader hooks such as `vs:OFFSET_POSITION` and `fs:FILTER_COLOR` when the active shader assembly path already exposes those hooks

Raw regex or arbitrary text-replacement targets from lower-level assembler APIs are intentionally not part of `ShaderExtension`.

## Example

```ts
const tintExtension: ShaderExtension = {
  name: 'tint-extension',
  glsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: 'vec4 extension_getTint() { return vec4(1.0, 0.4, 0.2, 1.0); }'
      }
    ]
  },
  wgsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: 'fn extensionGetTint() -> vec4<f32> { return vec4<f32>(1.0, 0.4, 0.2, 1.0); }'
      }
    ]
  }
};
```

For a runnable walkthrough, see [Shader Extensions](/docs/tutorials/shader-extensions).
