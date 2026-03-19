# skin

The `skin` shader module provides GPU skinning helpers for skinned meshes,
primarily for glTF-driven animation data.

## Props

### `scenegraphsFromGLTF?: unknown`

glTF scenegraph data used to build the joint matrix palette for the active
skin. When absent, the module supplies an empty joint matrix array.

## Uniforms

The module exposes a joint matrix palette:

```ts
{
  jointMatrix: 'mat4x4<f32>'
}
```

with a legacy top-level array size of `20` matrices via `uniformSizes`.

## Usage

Add the module to your shader and call `getSkinMatrix(weights, joints)` from the
vertex shader to compute the blended skinning matrix for a vertex.

## Shader Functions

### `getSkinMatrix(weights, joints)`

Returns the weighted sum of the current joint matrices for the supplied joint
indices and weights.

## Remarks

- The current module packs up to `20` joints into the uniform block.
- `jointMatrix` uses the legacy top-level array form internally
  (`uniformTypes.jointMatrix` plus `uniformSizes.jointMatrix`), which remains
  supported for compatibility.
- The module is designed around glTF skin data and expects the first skin in the
  supplied `scenegraphsFromGLTF` structure.
