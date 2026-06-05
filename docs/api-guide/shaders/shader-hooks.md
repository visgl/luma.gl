import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Shader Hooks

<ShaderLevelDocsTabs active="shader-hooks" />

Shader hooks let a base shader expose named callback points that shader modules
can customize later. The base shader stays readable and reusable, while attached
modules can add behavior without copying or rewriting the original shader
source.

Hooks are useful when the application owns the overall shader flow but optional
modules need to modify a value such as a position, color, material input, or
picking result. The base shader calls the hook; modules provide ordered
injections for that hook.

```glsl
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  OFFSET_POSITION(gl_Position);
}
```

Register the hook with the assembler and let modules inject into it:

```typescript
import {ShaderAssembler} from '@luma.gl/shadertools';

const shaderAssembler = ShaderAssembler.getDefaultShaderAssembler();
shaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};
```

The assembler gathers hook implementations from attached modules and patches
them into the assembled shader at build time. If no module injects into a hook,
the generated hook function is a no-op, so the base shader can call it
unconditionally.

Modules can also inject into standard named points:

| Key | Shader | Description |
| --- | --- | --- |
| `vs:#decl` | Vertex | Inject declarations near the top of the vertex shader. |
| `vs:#main-start` | Vertex | Inject at the beginning of the vertex main function. |
| `vs:#main-end` | Vertex | Inject at the end of the vertex main function. |
| `fs:#decl` | Fragment | Inject declarations near the top of the fragment shader. |
| `fs:#main-start` | Fragment | Inject at the beginning of the fragment main function. |
| `fs:#main-end` | Fragment | Inject at the end of the fragment main function. |

Use hooks for deliberate extension points. Use ordinary module source when a
module only needs to contribute reusable functions or declarations. For the
runnable example, see the [Shader Hooks tutorial](/docs/tutorials/shader-hooks).
For the full assembler API, see
[`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler).
