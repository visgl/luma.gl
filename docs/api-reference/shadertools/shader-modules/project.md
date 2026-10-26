# projection

The internal `projection` shader module shares view and projection matrices across GLSL shaders.
It is not exported by `@luma.gl/shadertools`, and the package exposes no import subpath for it.
This page describes the source implementation rather than a supported public API.
Applications should use the projection contract supplied by their rendering pipeline; see
[Writing portable shaders](/docs/api-guide/shaders/writing-portable-shaders).

## Props

| Property | Type | Initial value |
| --- | --- | --- |
| `viewMatrix` | 4×4 matrix | Identity |
| `projectionMatrix` | 4×4 matrix | Identity |
| `cameraPositionWorld` | Three-component vector | `[0, 0, 0]` |

Internal users pass both matrices together to recompute `viewProjectionMatrix`:

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
