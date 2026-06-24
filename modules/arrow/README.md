# @luma.gl/arrow

Apache Arrow adapters for luma.gl GPU table objects.

This module owns Arrow-specific upload, preparation, and compatibility metadata.
It creates the generic `GPUData`, `GPUVector`, `GPURecordBatch`, `GPUTable`, and
`GPUSchema` objects exported by `@luma.gl/tables`; it does not define parallel
Arrow-side GPU table classes.

`ArrowInputSchema` keeps Arrow source resolution and conversion policy in this
module while validating final prepared vectors against a tables-owned
`GPUInputSchema`.

See [luma.gl](https://luma.gl/docs/api-reference/arrow) for documentation.
