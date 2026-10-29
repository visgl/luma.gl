# @luma.gl/arrow

Apache Arrow adapters for luma.gl GPU table objects.

This module owns Arrow-specific upload, preparation, and compatibility metadata.
It creates the generic `GPUData`, `GPUVector`, `GPURecordBatch`, `GPUTable`, and
`GPUSchema` objects exported by `@luma.gl/graph/gpu-tables`; it does not define parallel
Arrow-side GPU table classes.

The package supports Apache Arrow 17 and later. `ArrowTextRenderer` dynamically recognizes
`Utf8View` and `Dictionary<Utf8View>` columns when the installed runtime provides them and lowers
their view buffers to the established UTF-8 text preparation paths.

`ArrowInputSchema` keeps Arrow source resolution and conversion policy in this
module while validating final prepared vectors against a tables-owned
`GPUInputSchema`.

See [luma.gl](https://luma.gl/docs/api-reference/arrow) for documentation.

## Conversion implementation boundaries

Primitive GPU data/vector adapters and conversion planning are implemented separately from
graph record-batch/table adapters. The primitive dependency closure uses core, gpgpu, and
shadertools without engine or graph, including its public TypeScript types.

GPU matrix, temporal, DGGS, and path preparation uses gpgpu `Kernel` execution with an explicitly
owned WGSL assembler. Rendering integration remains in the existing Arrow renderer adapters.
The `@luma.gl/arrow` export names and conversion behavior are unchanged by this internal split.
