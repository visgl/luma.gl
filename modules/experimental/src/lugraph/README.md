# @luma.gl/experimental/lugraph

`@luma.gl/experimental/lugraph` provides an optional, headless graph data model over existing,
caller-owned GPU table vectors. Its current foundation preserves source and target vertex columns,
optional edge weights and stable identifiers, property tables, and original chunk boundaries. It
does not upload or copy source data, submit GPU work, render graphs, or provide a graph application.

## Attribution and licensing

The graph data model is inspired by [NVIDIA RAPIDS cuGraph](https://github.com/rapidsai/cugraph)
and the NVIDIA and RAPIDS contributors advancing GPU graph analytics. cuGraph is distributed under
the [Apache License 2.0](https://github.com/rapidsai/cugraph/blob/main/LICENSE).

This module is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation for browser-native WebGPU; it does not copy or translate cuGraph source code.
It does not claim CUDA or cuGraph API compatibility, feature parity, NVIDIA affiliation, or NVIDIA
endorsement.
