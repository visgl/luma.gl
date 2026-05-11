# @luma.gl/arrow

Apache Arrow utilities for luma.gl.

The module can derive GPU `BufferLayout` entries from Arrow schemas and create
GPU-side `ArrowGPUVector`, `ArrowGPUTable`, and `ArrowModel` objects from
compatible Arrow columns. Arrow tables and vectors are construction inputs; the
GPU objects retain GPU buffers plus Arrow-derived type and schema metadata.

See [luma.gl](http://luma.gl) for documentation.
