import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {OITExample} from '@site/src/examples';

# @luma.gl/experimental

<ExperimentalDocsTabs active="overview" />

`@luma.gl/experimental` publishes incubating luma.gl APIs that are usable by applications but may
change or be removed without the compatibility guarantees applied to stable modules.

Install the package alongside matching luma.gl core, engine, and shadertools versions:

```bash
yarn add @luma.gl/experimental @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

## WebXR

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

- [WebXR](/docs/api-reference/experimental/webxr): WebGL-only session, frame, and raw camera helpers.

## GPU Primitives and Command Graphs

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

The [GPU Primitives and Command Graphs guide](/docs/api-reference/experimental/gpu-primitives)
introduces explicit command scheduling, typed table-backed graph views, hierarchical scan, stable
compaction, stable key/value sorting, and GPU-written indirect draw commands.

## Order-independent Transparency

- [`ABufferRenderer`](/docs/api-reference/experimental/a-buffer-renderer) captures, sorts, and
  composites per-pixel fragment lists on WebGPU. It offers the most accurate result but consumes
  bounded storage and performs per-pixel sorting.
- [`WBOITRenderer`](/docs/api-reference/experimental/wboit-renderer) accumulates weighted color and
  revealage on WebGPU or WebGL2. It avoids sorting and storage buffers, but the result is
  approximate and requires two translucent geometry passes.

Both renderers leave scene models, shader inputs, command submission, and fallback selection under
application control.

Compare A-buffer, weighted-blended, and ordinary alpha blending on the same overlapping scene:

<OITExample embedded showStats={false} />

## Hybrid Shadows

[`ShadowMapRenderer`](/docs/api-reference/experimental/shadow-map-renderer) provides WebGPU-only
cascaded directional, spot-array, and point cube-array maps with PCSS filtering. Applications draw
casters through a per-view callback and explicitly multiply the `shadow` module's factors into
their direct-light terms. A companion shader-pass pipeline adds primary-sun contact refinement.

## Packed Pixel Formats

`RGBADecoder` and `TEXTURE_FORMAT_PIXEL_DECODERS` provide the existing experimental helpers for
encoding and decoding packed texture formats.
