# @luma.gl/tables

GPU-resident table primitives for luma.gl.

This module owns reusable table-side GPU objects such as `GPUData`,
`GPUVector`, `GPURecordBatch`, and `GPUTable`, plus table-oriented execution
helpers such as `TableTransform`, `TableComputation`, `TableBufferPlanner`, and
generated-buffer batching utilities. `GPUTableModel` renders preserved table
batches through one model pipeline, while `GPUTableGeometry` exposes a packed
static table as ordinary GPU geometry.

Arrow-specific construction and analysis helpers live in `@luma.gl/arrow`.
Applications that ingest Apache Arrow data should use those adapters to build
the generic GPU table objects exposed here.

See [luma.gl](http://luma.gl) for documentation.
