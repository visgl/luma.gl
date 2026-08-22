# Optional WebGPU and WGSL features

WebGPU exposes optional capabilities through three related but distinct channels. Applications should select an implementation path only after checking every capability that path requires.

| Capability channel         | When it is selected                                        | luma.gl discovery API             | Shader declaration                                              |
| -------------------------- | ---------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| WebGPU device features     | Requested when the `GPUDevice` is created                  | `device.features`                 | Usually `enable feature_name;` when the feature extends WGSL    |
| WGSL language features     | Supplied dynamically by the browser's WGSL implementation  | `device.wgslLanguageFeatures`     | `requires feature_name;` documents and validates the dependency |
| Device limits and metadata | Fixed by the selected adapter and requested device profile | `device.limits` and `device.info` | Used to choose constants, layouts, and dispatch dimensions      |

These channels are not interchangeable. A device feature can be supported by the adapter but absent from the created device because it was not requested. A WGSL language feature is not part of the device descriptor and cannot be requested there. A supported shader feature can still be unusable for a particular algorithm when a required device limit is too small.

## Request device features during creation[​](#request-device-features-during-creation "Direct link to Request device features during creation")

luma.gl WebGPU devices default to the portable `core` feature level. Request only the optional features an application can use when a targeted configuration is preferable:

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/webgpu';



const device = await luma.createDevice({

  type: 'webgpu',

  adapters: [webgpuAdapter],

  optionalFeatures: ['subgroups', 'timestamp-query']

});
```

`optionalFeatures` requests the named features when the selected adapter supports them. Unsupported entries are ignored so that device creation can succeed with a portable fallback. Always inspect the created device rather than assuming the request was satisfied:

```
const canUseSubgroupOperations = device.features.has('subgroups');

const canMeasureGPUTime = device.features.has('timestamp-query');
```

Device features cannot be added to an existing device. If code later needs a supported feature that was not requested, it must create another device with that feature in its creation options.

### Feature levels[​](#feature-levels "Direct link to Feature levels")

Use `featureLevel` to select a broader feature and limit policy:

| Feature level      | Intended use                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'core'`           | Default portable WebGPU profile. Optional adapter features are not requested unless listed in `optionalFeatures`.                                                              |
| `'max'`            | Requests every feature and maximum limit exposed by the selected adapter. Useful for capability-rich examples, diagnostics, and applications with several optional fast paths. |
| `'compatibility'`  | Requests the WebGPU compatibility profile.                                                                                                                                     |
| `'best-available'` | Starts with a compatibility adapter and upgrades it to core when supported.                                                                                                    |

`'max'` means “request everything this adapter supports,” not “guarantee every feature defined by WebGPU.” Feature-dependent code must still check `device.features`. Targeted libraries generally prefer `optionalFeatures` because it records their actual requirements and avoids requesting unrelated capabilities.

## Discover WGSL language features dynamically[​](#discover-wgsl-language-features-dynamically "Direct link to Discover WGSL language features dynamically")

WGSL language features describe syntax or semantics implemented by the browser's WGSL frontend. They are exposed by `navigator.gpu.wgslLanguageFeatures`; luma.gl snapshots that set as `device.wgslLanguageFeatures` for convenient capability selection:

```
const hasStableSubgroupIds = device.wgslLanguageFeatures.has('subgroup_id');
```

They are not passed to `luma.createDevice()` or `GPUAdapter.requestDevice()`. A `requires` directive does not enable a language feature; it declares that the module depends on functionality the implementation already exposes. Shader creation fails when a required language feature is missing.

```
requires subgroup_id;
```

The set is implementation-wide rather than adapter-specific. It can change between browser versions, so applications should discover it at runtime instead of inferring support from a browser name or version.

## `enable` and `requires` serve different purposes[​](#enable-and-requires-serve-different-purposes "Direct link to enable-and-requires-serve-different-purposes")

WGSL distinguishes hardware-oriented enable-extensions from dynamically available language extensions:

* `enable` opts a shader module into functionality backed by a requested WebGPU device feature. For example, `enable subgroups;` requires the created device to expose the `subgroups` feature.
* `requires` states that the shader depends on a WGSL language feature. For example, `requires subgroup_id;` validates that stable subgroup identifiers are available.

Some shader paths need both. A subgroup scan that addresses shared memory by subgroup ID uses this complete gate:

```
const canUseSubgroupScan =

  device.features.has('subgroups') &&

  device.wgslLanguageFeatures.has('subgroup_id');



const source = canUseSubgroupScan

  ? /* wgsl */ `

      enable subgroups;

      requires subgroup_id;



      @compute @workgroup_size(256) fn main(

        @builtin(subgroup_invocation_id) subgroupInvocationId: u32,

        @builtin(subgroup_size) subgroupSize: u32,

        @builtin(subgroup_id) subgroupId: u32

      ) {

        // Subgroup implementation

      }

    `

  : portableSource;
```

Checking only `subgroups` is insufficient for that shader because the subgroup operations and the stable subgroup ID come from different capability channels. Conversely, an algorithm that uses subgroup operations without `subgroup_id` should not require the language feature unnecessarily.

## Limits and subgroup size[​](#limits-and-subgroup-size "Direct link to Limits and subgroup size")

Optional shader paths often depend on limits in addition to named features. Read limits from the created device and reject or adapt workloads that exceed them:

```
const workgroupSize = Math.min(256, device.limits.maxComputeInvocationsPerWorkgroup);
```

When the adapter reports subgroup bounds, luma.gl exposes them as `device.info.subgroupMinSize` and `device.info.subgroupMaxSize`. Do not hard-code a subgroup width or assume that subgroup invocation order matches `local_invocation_index`. Implementations can choose different subgroup sizes, and WGSL does not define a general mapping between those index spaces.

`GPUCommandGraph` snapshots graph-relevant values in `compiledGraph.capabilities`, including timestamp-query support, both subgroup gates, subgroup-size bounds, compute limits, and whether the adapter appears to be software-backed. This lets graph contributors choose a path during compilation without reaching into backend-specific handles.

## Recommended capability-selection pattern[​](#recommended-capability-selection-pattern "Direct link to Recommended capability-selection pattern")

For every optional implementation path:

1. Request all required device features when creating the device.
2. Check the created device's features, WGSL language features, and relevant limits together.
3. Select the complete shader and resource layout before compiling the pipeline or command graph.
4. Retain a portable path with the same observable result.
5. Report the selected path in diagnostics and validate optimized paths against the same oracle.
6. Benchmark the full workload; fewer shader instructions or barriers do not guarantee a faster bandwidth-bound operation.

The experimental GPU primitives follow this pattern. Every subgroup path requires the `subgroups` device feature. Paths that address workgroup data using subgroup indices also require the `subgroup_id` WGSL language feature; ballot- and shuffle-only paths do not. If a complete path is unavailable, the same public operation records its portable shader.

| Primitive or consumer                                                                                                       | Subgroup work                                                     | Optimized scope                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`GPUScan`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scan.md)                                 | Native prefix collectives reduce workgroup barriers               | Unsegmented scans                                                        |
| [`GPUReduction`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-reduction.md)                       | Native reductions merge each subgroup before shared-memory totals | Every reduction level; also PageRank and automatic histogram domains     |
| Indexed range compaction                                                                                                    | Native prefix collectives compute local range offsets             | `GPUIndexedRangeCompaction` and `GPUPartitionedIndexedRangeCompaction`   |
| [`GPUSort`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-sort.md)                                 | Register shuffles handle subgroup-local bitonic stages            | Local bitonic networks through 256 rows, including `GPUBatchSort` chunks |
| [`GPUSegmentedSort`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-segmented-sort.md)              | The same shuffle network runs for every packed segment            | Segments through 256 rows                                                |
| [`GPUHistogram`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-histogram.md)                       | Equal-bin lanes coalesce into one local atomic update             | Histograms with at most 16 bins                                          |
| [`GPUGridBinning`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-grid-binning.md)                  | Equal-cell lanes coalesce into one local atomic update            | Grids with at most 16 cells                                              |
| [`GPUGridAggregation`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-grid-aggregation.md)          | Equal-cell lanes combine weights before statistic atomics         | Aggregations with at most 16 cells                                       |
| [`GPUGroupAggregation`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md)        | Equal-key lanes coalesce count or statistic atomics               | Aggregations with at most 16 groups                                      |
| [`GPUIndexPickingTarget`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-index-picking-target.md)   | Valid region hits reserve one output block per subgroup           | Region-result publication                                                |
| [`GPUSceneDrawGeneration`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation.md) | Eligible and published rows coalesce diagnostic counter atomics   | Required and published counts plus collision reporting                   |
| `GPUChunkedIndexedScatter`                                                                                                  | Equal-destination routes reserve contiguous output blocks         | Scatters with at most 16 chunks                                          |

The narrow keyed-atomic thresholds are deliberate: the coalescing shader has bounded work proportional to the number of possible keys. Larger outputs retain the existing workgroup-local or direct global atomic implementations. The live GPU Sort and GPU Data Analysis examples request the `'max'` feature level, validate results against CPU oracles, and therefore exercise these paths on supporting browsers without changing their public controls.

## Related references[​](#related-references "Direct link to Related references")

* [WebGPU adapter overview and feature levels](https://luma.gl/next/docs/api-reference/webgpu.md)
* [luma.gl device feature table](https://luma.gl/next/docs/api-reference/core/device-features.md)
* [luma.gl device limits](https://luma.gl/next/docs/api-reference/core/device-limits.md)
* [luma.gl device information](https://luma.gl/next/docs/api-reference/core/device-info.md)
* [WGSL language extensions and directives](https://gpuweb.github.io/gpuweb/wgsl/#language-extensions-sec)
* [WebGPU optional capabilities](https://www.w3.org/TR/webgpu/#optional-capabilities)
