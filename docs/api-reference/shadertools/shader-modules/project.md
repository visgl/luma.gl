# projection

The `projection` shader module shares view and projection matrices across GLSL shaders.
Import it from `@luma.gl/shadertools` and include it in the model's `modules`.
The module name used by `ShaderInputs` is `projection`.

## Props

| Property | Type | Initial value |
| --- | --- | --- |
| `viewMatrix` | 4×4 matrix | Identity |
| `projectionMatrix` | 4×4 matrix | Identity |
| `cameraPositionWorld` | Three-component vector | `[0, 0, 0]` |

Pass both matrices together to recompute `viewProjectionMatrix`:

```ts
model.shaderInputs.setProps({projection: {viewMatrix, projectionMatrix, cameraPositionWorld}});
```

## Vertex shader functions

- `project_world_to_clipspace(vec3 position)` applies the view-projection matrix.
- `project_view_to_clipspace(vec3 position)` applies the projection matrix.
- `project_model_to_clipspace_Model(vec3 position, mat4 modelMatrix)` applies model and view-projection transforms.
- `project_to_clipspace(vec3 position)` applies the view-projection matrix.
- `project_setPosition(vec4 position)` and `project_setNormal(vec3 normal)` publish world-space varyings.

## Fragment shader functions

`project_getPosition_World()` and `project_getNormal_World()` read the varyings published
by the vertex shader.

## Compatibility

This module supplies GLSL source. For portable WGSL/GLSL projection, use the projection
contract supplied by your rendering pipeline. See
[Writing portable shaders](/docs/api-guide/shaders/writing-portable-shaders).
