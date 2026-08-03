# skin

The `skin` shader module provides GPU skinning helpers for skinned meshes, primarily for glTF-driven animation data.

## Props[​](#props "Direct link to Props")

### `scenegraphsFromGLTF?: unknown`[​](#scenegraphsfromgltf-unknown "Direct link to scenegraphsfromgltf-unknown")

glTF scenegraph data used to build the joint matrix palette for the active skin. When absent, the module supplies an empty joint matrix array.

## Uniforms[​](#uniforms "Direct link to Uniforms")

The module exposes a joint matrix palette:

```
{
  jointMatrix: ['mat4x4<f32>', 20]
}
```

## Usage[​](#usage "Direct link to Usage")

Add the module to your shader and call `getSkinMatrix(weights, joints)` from the vertex shader to compute the blended skinning matrix for a vertex.

## Shader Functions[​](#shader-functions "Direct link to Shader Functions")

### `getSkinMatrix(weights, joints)`[​](#getskinmatrixweights-joints "Direct link to getskinmatrixweights-joints")

Returns the weighted sum of the current joint matrices for the supplied joint indices and weights.

## Remarks[​](#remarks "Direct link to Remarks")

* The current module packs up to `20` joints into the uniform block.
* The module is designed around glTF skin data and expects the first skin in the supplied `scenegraphsFromGLTF` structure.
