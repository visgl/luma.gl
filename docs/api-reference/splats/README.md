---
title: Gaussian splats
description: GPU-native Gaussian splat rendering, streaming, shading, picking, and formats in luma.gl.
---

import {GaussianSplatsExample} from '@site/src/examples';
import {SplatsDocsTabs} from '@site/src/components/docs/splats-docs-tabs';

# @luma.gl/splats

<SplatsDocsTabs active="overview" />

`@luma.gl/splats` provides experimental GPU-native Gaussian splat rendering. It owns prepared
splat data, directional spherical harmonics, semantic filtering, GPU picking, hierarchy traversal,
bounded residency, decoded Khronos glTF attributes, covariance projection, depth ordering, and
render models without depending on Apache Arrow, loaders.gl, glTF packages, or deck.gl.

Install the published experimental module with `yarn add @luma.gl/splats`. Its APIs may evolve
without a 9.4 semver compatibility promise.

## Interactive Gaussian splat showcase

Explore a deterministic generated Gaussian scene without downloading a third-party capture.
WebGPU projects, orders, and draws each progressively added batch through a GPU command graph.

<GaussianSplatsExample embedded embeddedHeight={640} showStats={false} />

[Open the full Gaussian splat showcase](/examples/showcase/gaussian-splats).

## Choose a topic

| Topic | Use it for |
| --- | --- |
| [Renderers](/docs/api-reference/splats/renderers) | Prepared, command-graph, segmented, and paged rendering contracts. |
| [Data and shading](/docs/api-reference/splats/data-and-shading) | Source columns, covariance, spherical harmonics, semantics, and updates. |
| [Picking and scenes](/docs/api-reference/splats/picking-and-scenes) | GPU picking and mixed mesh-and-splat scenes. |
| [Streaming and residency](/docs/api-reference/splats/streaming-and-residency) | Bounded residency, hierarchy traversal, and foveated LOD. |
| [Formats and loaders](/docs/api-reference/splats/formats-and-loaders) | Khronos glTF splats, 3D Tiles, SPZ, Arrow, and loaders. |

## Limits and compatibility

The graph renderer, GPU ordering, hierarchy traversal, and storage-backed features require WebGPU.
Use the prepared SplatRenderer path when WebGL 2 compatibility or caller-provided source ordering
is required. The package is published with an experimental API.

## Related modules

- [glTF](/docs/api-reference/gltf)
- [Arrow](/docs/api-reference/arrow)
- Experimental GPU primitives
