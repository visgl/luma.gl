# @luma.gl/experimental/luxfilter

GPU-resident, linked-view crossfiltering for luma.gl.

`LuxFilter` coordinates interactive selections across maps, histograms, grouped
summaries, scatterplots, and other views of the same GPU-resident rows. Brush one
view, update its dimension, and encode the existing command graph again: all
selection masks, aggregation, and stable row compaction remain on the GPU.

## Create linked dimensions and views

Dimensions describe independent selections. A `range` dimension selects scalar
values between two endpoints; a `bounds` dimension selects rows whose `x` and
`y` coordinates fall inside a rectangle. Dimensions consume typed graph data or
vector views and share one source-row topology.

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {LuxFilter} from '@luma.gl/experimental/luxfilter';

const graph = new GPUCommandGraph(device);
const longitude = graph.importGPUVector('longitude', longitudeVector);
const latitude = graph.importGPUVector('latitude', latitudeVector);
const value = graph.importGPUVector('value', valueVector);

const filter = new LuxFilter(graph, {
  id: 'linked-dashboard',
  dimensions: [
    {id: 'map', kind: 'bounds', x: longitude, y: latitude},
    {id: 'histogram', kind: 'range', input: value}
  ],
  views: [
    {
      id: 'distribution',
      kind: 'histogram',
      dimension: 'histogram',
      input: value,
      domain: [0, 100],
      output: histogramCounts
    },
    {
      id: 'scatterplot',
      kind: 'visibility',
      output: visibleSourceIds,
      count: visibleCount
    }
  ],
  outputMask: combinedSelectionMask
});

filter.addToGraph(graph);
const compiled = graph.compile();

filter.setBounds('map', [minimumLongitude, minimumLatitude, maximumLongitude, maximumLatitude]);
filter.setRange('histogram', [minimumValue, maximumValue]);

const encoder = device.createCommandEncoder({id: 'linked-dashboard-update'});
compiled.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());
```

The source vectors and output views in this example are allocated and owned by
the application. A single compiled graph can be encoded repeatedly as selection
parameters change; updating a brush does not require rebuilding the graph,
submitting work implicitly, or reading source rows back to the CPU.

## Linked-view outputs

Four view kinds expose different GPU-resident representations of the current
selection:

- `histogram` counts scalar rows into caller-owned bins.
- `group` aggregates dense categorical keys into caller-owned counts, sums,
  minima, maxima, or means.
- `visibility` publishes stable compacted source-row IDs and their count for
  scatterplots, maps, or indirect rendering.
- `mask` publishes a caller-owned source-aligned selection mask for custom
  compute or rendering passes.

Visibility views can retain application-defined identifiers by passing a
source-aligned `sourceIds` view, or generate consecutive identifiers beginning
at `firstSourceIndex`. These options are mutually exclusive. An optional
visibility `outputMask` additionally publishes that view's canonical,
source-aligned selection without replacing its compacted IDs or count.

The combined selection is also available through `filter.mask`.
`filter.getViewMask(viewId)` exposes the source-aligned mask used by an
individual view.

By default, a histogram or group view associated with a dimension excludes that
dimension's own predicate when calculating its distribution. Other active
dimensions still apply. This familiar crossfilter behavior keeps the complete
available distribution visible while the user adjusts that view's brush. Set
`includeOwnSelection: true` on a view when it should include its own dimension's
selection instead.

## Update or clear selections

```ts
filter.setRange('histogram', [20, 40]);
filter.setBounds('map', [-122.53, 37.70, -122.35, 37.84]);
filter.clear('histogram');
filter.clearAll();
```

Encode and submit the compiled graph after each interaction, or coalesce
multiple updates into the same frame. Selection state is transferred to small
GPU control buffers; predicates, Boolean mask composition, histogram and group
aggregation, and row compaction all execute as explicit `GPUCommandGraph`
passes.

Chunked `GPUVector` inputs retain their original ordered chunk and batch
boundaries. Source-aligned masks and compacted visibility outputs use matching
topology; no input rows are concatenated, copied to the CPU, or implicitly
repacked.

Call `filter.destroy()` when the controller is no longer needed to release
resources it owns. Imported source vectors, caller-owned outputs, command
submission, and any optional readback remain under application control.

## Flagship example

[Million-Row Crossfilter Explorer](../../../../examples/showcase/million-row-crossfilter)
links a GPU-rendered map, scatterplot, three self-excluding histograms, and
categorical cohorts across one million synthetic GPU-resident rows. Geographic
brushes, scatterplot selections, histogram ranges, category filters, and
multi-dimensional presets all reuse one compiled command graph without reading
source rows back to the CPU. Displayed histogram bins, group counts, and the
selected-row total share one small packed summary readback; static point clouds
redraw only after a selection or layout changes.

## Attribution

LuxFilter is inspired by [NVIDIA RAPIDS cuXfilter](https://github.com/rapidsai/cuxfilter) and the
RAPIDS contributors who pioneered GPU-accelerated crossfiltering across coordinated views of large
datasets. It independently adapts those interaction patterns to luma.gl and browser-native WebGPU;
it is not a code port, compatible Python API, or NVIDIA/RAPIDS successor.

The [LuxFilter API reference](/docs/api-reference/experimental/luxfilter) includes the live
Million-Row Crossfilter Explorer and a detailed feature comparison with cuXfilter's final
[26.06 release](https://docs.rapids.ai/api/cuxfilter/stable/).
