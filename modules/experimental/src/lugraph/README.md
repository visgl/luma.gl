# @luma.gl/experimental/lugraph

`@luma.gl/experimental/lugraph` analyzes connected data directly on a browser WebGPU device. Its
optional, headless graph model preserves existing source and target vertex columns, stable edge
identifiers, optional properties, and original GPU vector chunks without uploading or copying them.

Reusable compressed adjacency supports vertex-degree queries, bounded breadth-first shortest paths,
weakly connected components, and normalized PageRank with dangling-vertex redistribution. Those
operations contribute work to a caller-owned `GPUCommandGraph`; applications retain ownership of
their buffers, rendering, command submission, and any explicitly requested result readback.

See the [luGraph graph analytics guide](/docs/api-reference/experimental/lugraph) for when to use
each operation, complete GPU-resident composition examples, and ownership and capacity contracts.

## Attribution and licensing

The graph data model is inspired by [NVIDIA RAPIDS cuGraph](https://github.com/rapidsai/cugraph)
and the NVIDIA and RAPIDS contributors advancing GPU graph analytics. cuGraph is distributed under
the [Apache License 2.0](https://github.com/rapidsai/cugraph/blob/main/LICENSE).

This module is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation for browser-native WebGPU; it does not copy or translate cuGraph source code.
It does not claim CUDA or cuGraph API compatibility, feature parity, NVIDIA affiliation, or NVIDIA
endorsement.
