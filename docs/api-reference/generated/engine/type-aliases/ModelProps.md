# Type Alias: ModelProps

> **ModelProps** = `Omit`<[`GPUVectorModelProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md), `"geometry"`> & `object`

Defined in: [modules/engine/src/model/model.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L20)

Properties for the high-level rendering model.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### geometry?[​](#geometry "Direct link to geometry?")

> `optional` **geometry?**: [`GPUVectorGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md) | [`GPUGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `Geometry` | `null`

Geometry adapted into GPU attributes, buffer layouts, topology, and draw counts.

### material?[​](#material "Direct link to material?")

> `optional` **material?**: [`Material`](https://luma.gl/docs/api-reference/generated/engine/classes/Material.md)

Material-owned group-3 bindings and uniforms.
