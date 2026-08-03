# Type Alias: QuerySetProps

> **QuerySetProps** = [`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/query-set.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L15)

Properties for creating a QuerySet

* 'timestamp' - query the GPU timestamp counter at the start and end of render passes timestamp queries are available if the 'timestamp-query' feature is present.
* 'occlusion' - query the number of fragment samples that pass all per-fragment tests for a set of drawing commands including scissor, sample mask, alpha to coverage, stencil, and depth tests

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### count[​](#count "Direct link to count")

> **count**: `number`

The number of queries managed by the query set

### type[​](#type "Direct link to type")

> **type**: `"occlusion"` | `"timestamp"`

The type of query set occlusion - query the number of fragment samples that pass all the per-fragment tests for a set of drawing commands, including scissor, sample mask, alpha to coverage, stencil, and depth tests timestamp - query the GPU timestamp counter. Timestamp queries are available if the `timestamp-query` feature is present.
