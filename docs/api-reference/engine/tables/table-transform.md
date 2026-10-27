# TableTransform

`TableTransform` executes WebGL transform feedback over GPU table batches. It consumes a
generic `GPUTable`, merges the table attribute layouts into the underlying
`BufferTransform`, accepts already-created `GPUVector` inputs, and can run one
preserved GPU batch at a time. Use `makeGPUTableFromArrowTable()` before construction
when the source data starts as an Arrow table:

```ts
import {TableTransform} from '@luma.gl/engine/tables';

const transform = new TableTransform(device, {
  vs,
  varyings,
  shaderLayout,
  table: makeGPUTableFromArrowTable(device, arrowTable, {shaderLayout}),
  tableCount: 'vertex'
});

transform.dispatchBatches({
  outputBuffers: (batch, batchIndex) => makeOutputBuffers(batch, batchIndex)
});
```

For a compute-like update path, pass `inputVectors` plus
`copyOutputToInputVectors`. `outputs` is inferred from the copy map when it is
omitted:

```ts
import {TableTransform} from '@luma.gl/engine/tables';

const transform = new TableTransform(device, {
  vs,
  shaderLayout,
  inputVectors: {
    particlePositions,
    particleVelocities
  },
  copyOutputToInputVectors: {
    nextParticlePositions: 'particlePositions',
    nextParticleVelocities: 'particleVelocities'
  }
});
```

Transform feedback writes a dense output stream, so automatic copy-back targets
tightly packed, directly bindable GPUVectors. It can not scatter-copy into
padded or interleaved rows.

Use `TableTransform` only for attribute-backed WebGL transform feedback. It is
not a storage-buffer compute abstraction.

Relevant public types:

| Type | Meaning |
| --- | --- |
| `TableTransformProps` | Construction props, including `table`, `inputVectors`, `copyOutputToInputVectors`, and `tableCount`. |
| `TableTransformBatchOptions` | `dispatchBatches()` options, including fixed or per-batch `outputBuffers`. |


The class and its `TableTransformProps`, `TableTransformBatchOptions`, and `TableTransformOutputCopyMap` types are owned by `@luma.gl/engine/tables`. Table data and schema types remain in `@luma.gl/graph/gpu-tables`.
