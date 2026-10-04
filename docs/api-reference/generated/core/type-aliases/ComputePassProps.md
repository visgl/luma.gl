# Type Alias: ComputePassProps

> **ComputePassProps** = [`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L11)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### beginTimestampIndex?[​](#begintimestampindex "Direct link to beginTimestampIndex?")

> `optional` **beginTimestampIndex?**: `number`

QuerySet index to write begin timestamp to. No timestamp is written if not provided.

### endTimestampIndex?[​](#endtimestampindex "Direct link to endTimestampIndex?")

> `optional` **endTimestampIndex?**: `number`

QuerySet index to write end timestamp to. No timestamp is written if not provided.

### timestampQuerySet?[​](#timestampqueryset "Direct link to timestampQuerySet?")

> `optional` **timestampQuerySet?**: [`QuerySet`](https://luma.gl/docs/api-reference/generated/core/classes/QuerySet.md)

QuerySet to write beging/end timestamps to
