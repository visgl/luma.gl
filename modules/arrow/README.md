# @luma.gl/arrow

Apache Arrow adapters for luma.gl GPU table objects.

This module owns Arrow-specific upload, preparation, and compatibility metadata.
It creates the generic `GPUData`, `GPUVector`, `GPURecordBatch`, `GPUTable`, and
`GPUSchema` objects exported by `@luma.gl/tables`; it does not define parallel
Arrow-side GPU table classes.

See [luma.gl](https://luma.gl/docs/api-reference/arrow) for documentation.
