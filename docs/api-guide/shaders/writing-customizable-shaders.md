import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Writing Customizable Shaders

<ShaderLevelDocsTabs active="writing-customizable-shaders" />

Customizable shaders keep one readable base shader while allowing optional
features to add behavior. The base shader should own the pipeline interface and
main flow. Attached code should use a small, named extension surface rather than
copying or searching arbitrary shader text.

## Extension Choices

| Need | Mechanism | Why |
| --- | --- | --- |
| Add reusable source, uniforms, bindings, or dependencies. | `ShaderModule` | The feature has shader-facing data or helper code of its own. |
| Let optional code participate at a semantic point in base flow. | Shader hook | The base shader names and calls the extension point. |
| Add declarations or a short statement at a standard source location. | Named injection | The change is structural and does not need a custom callback contract. |
| Declare shader-facing vertex inputs for optional render behavior. | `ShaderPlugin.vertexInputs` | The plugin declares names and types while the caller keeps buffer ownership. |
| Ship reusable optional behavior to callers. | `ShaderPlugin` | The caller attaches one descriptor to `Model` or `Computation`. |

Prefer plugins at application boundaries. Use hooks inside the shader design
when a base shader needs a deliberate callback point.

## Hook Pattern

A hook has three parts:

1. The assembler registers a stage-prefixed hook signature.
2. The base shader calls the generated hook function.
3. A module or plugin injects ordered source into that hook.

```typescript
import {ShaderAssembler} from '@luma.gl/shadertools';

const shaderAssembler = ShaderAssembler.getDefaultShaderAssembler();
shaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');
```

```glsl
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  OFFSET_POSITION(gl_Position);
}
```

If nothing injects into the hook, the generated hook body is empty. That lets
the base shader call the hook unconditionally.

## Plugin Pattern

A plugin is the reusable attachment unit. It can contribute modules, defines,
shader-facing vertex inputs, and named injections, with `glsl` and `wgsl`
variants where the shader syntax differs.

```typescript
import type {ShaderPlugin} from '@luma.gl/shadertools';

const tintPlugin: ShaderPlugin = {
  name: 'tint-plugin',
  glsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: 'vec4 plugin_getTint() { return vec4(1.0, 0.4, 0.2, 1.0); }'
      }
    ]
  },
  wgsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: 'fn pluginGetTint() -> vec4<f32> { return vec4<f32>(1.0, 0.4, 0.2, 1.0); }'
      }
    ]
  }
};
```

The model opts in explicitly:

```typescript
import {Model} from '@luma.gl/engine';

const model = new Model(device, {
  source: wgslSource,
  vs: glslVertexSource,
  fs: glslFragmentSource,
  plugins: [tintPlugin]
});
```

## Design Rules

- Give hooks semantic names such as `OFFSET_POSITION` or `FILTER_COLOR`.
- Keep hook arguments narrow; pass the value the extension should modify.
- Use `#decl` for functions, structs, and globals; use `#main-*` only for small
  statements tied to entry-point flow.
- Use injection `order` only when features have a real ordering contract.
- Keep arbitrary regex injections as a lower-level assembler escape hatch, not a
  public plugin contract.
- Keep plugin `vertexInputs` shader-facing only; the caller still owns buffer
  layout and attribute data.
- Treat plugins as shader composition, not as a render lifecycle. They do not
  create or update buffers, run layer lifecycle methods, or schedule extra
  passes.
- Put reusable shader-facing data in modules, then let plugins attach those
  modules when the behavior is optional.

For exact hook, injection, and plugin fields, see
[`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler) and
[`ShaderPlugin`](/docs/api-reference/shadertools/shader-plugin). For runnable
examples, see [Shader Hooks](/docs/tutorials/shader-hooks) and
[Shader Plugins](/docs/tutorials/shader-plugins). The
[Arrow ShaderPlugin Filtering example](/examples/arrow/arrow-filtering) shows a
plugin-declared scalar attribute backed by a caller-owned `GPUTable` on WebGL 2
and WebGPU.
