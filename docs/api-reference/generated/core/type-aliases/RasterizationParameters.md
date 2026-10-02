# Type Alias: RasterizationParameters

> **RasterizationParameters** = `_RenderParameters` & `object`

Defined in: [modules/core/src/adapter/types/parameters.ts:78](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L78)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### stripIndexFormat?[​](#stripindexformat "Direct link to stripIndexFormat?")

> `optional` **stripIndexFormat?**: [`IndexFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/IndexFormat.md)

For pipelines with strip topologies ("line-strip" or "triangle-strip"), this determines the index buffer format and primitive restart value ("uint16"/0xFFFF or "uint32"/0xFFFFFFFF). It is not allowed on pipelines with non-strip topologies.

### topology?[​](#topology "Direct link to topology?")

> `optional` **topology?**: [`PrimitiveTopology`](https://luma.gl/docs/api-reference/generated/core/type-aliases/PrimitiveTopology.md)

The type of primitive to be constructed from the vertex inputs. Defaults to "triangle-list".
