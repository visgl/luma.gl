# @luma.gl/arrow

Apache Arrow adapters for luma.gl GPU table objects.

This module owns Arrow-specific upload, preparation, and compatibility metadata.
It creates the generic `GPUData`, `GPUVector`, `GPURecordBatch`, `GPUTable`, and
`GPUSchema` objects exported by `@luma.gl/experimental/gpu-tables`; it does not define parallel
Arrow-side GPU table classes.

The package supports Apache Arrow 17 and later. `ArrowTextRenderer` dynamically recognizes
`Utf8View` and `Dictionary<Utf8View>` columns when the installed runtime provides them and lowers
their view buffers to the established UTF-8 text preparation paths.

`ArrowInputSchema` keeps Arrow source resolution and conversion policy in this
module while validating final prepared vectors against a tables-owned
`GPUInputSchema`.

This is a private workspace package used by internal examples and integration tests.
