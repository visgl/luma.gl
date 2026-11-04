# Function: simplifyMesh()

> **simplifyMesh**(`options`): [`MeshSimplificationResult`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MeshSimplificationResult.md)

Defined in: [modules/engine/src/geometry/mesh-simplification.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/mesh-simplification.ts#L63)

Simplifies an indexed triangle mesh through deterministic endpoint-only quadric edge collapses.

The returned indices always reference existing source vertices. Positions, UV coordinates, normals, joint indices, joint weights, morph deltas, and other original attributes therefore remain shared and unchanged across every generated detail level.

## Parameters[​](#parameters "Direct link to Parameters")

### options[​](#options "Direct link to options")

[`MeshSimplificationOptions`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MeshSimplificationOptions.md)

## Returns[​](#returns "Direct link to Returns")

[`MeshSimplificationResult`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MeshSimplificationResult.md)
