# GPU Crossfilter

<!-- -->

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/experimental/gpu-crossfilter` coordinates linked selections across GPU-resident maps, scatterplots, histograms, categorical summaries, and application-defined views. Brush one view, update its selection, and encode the same command graph again: source rows, selection masks, aggregations, and stable visible-row identifiers remain on the GPU.

GPU Crossfilter is an experimental, renderer-independent WebGPU controller. It does not ship a dashboard framework, dataframe importer, or charting library; applications retain ownership of their source vectors, output buffers, user interface, rendering, command submission, and optional readback.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use GPU Crossfilter when several views must share interactive selections over the same GPU-resident rows. Use GPU Dataframe directly for a one-shot query without self-excluding linked views.

## Try the million-row explorer[​](#try-the-million-row-explorer "Direct link to Try the million-row explorer")

The embedded [Million-Row Crossfilter Explorer](https://luma.gl/examples/showcase/million-row-crossfilter) links a GPU-rendered map, scatterplot, three self-excluding histograms, and categorical cohorts across 1,048,576 synthetic rows. Start it when you are ready to allocate a WebGPU device; ordinary visits to this documentation do not import the example registry or initialize the dashboard.

* Demonstrates

  linked selections · self-excluding histograms · stable compaction

* Input

  1,048,576 GPU-resident synthetic rows

* GPU output

  Per-view masks, distributions, cohorts, and visible row IDs

* CPU readback

  One compact dashboard summary

* Execution

  Deferred startup and invalidation-driven updates

* Compatibility

  WebGPU

[Open full page](https://luma.gl/examples/showcase/million-row-crossfilter)[View source](https://github.com/visgl/luma.gl/tree/master/examples/showcase/million-row-crossfilter)[Inspect graph](https://luma.gl/examples/showcase/million-row-crossfilter?panel=graph)

Optional interactive WebGPU explorer**Explore one million linked GPU-resident rows.**&#x42;rush a map, scatterplot, or histogram and watch every linked view update together.Launch interactive explorer →

Brush the map or scatterplot, adjust a histogram range, and try the preset scenarios. The source columns and linked masks stay on the GPU; the example explicitly reads only one compact summary buffer to update its visible counts and distributions.

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

import {GPUCrossfilter} from '@luma.gl/experimental/gpu-crossfilter';



const graph = new GPUCommandGraph(device);

const longitude = graph.importGPUVector('longitude', longitudeVector);

const latitude = graph.importGPUVector('latitude', latitudeVector);

const value = graph.importGPUVector('value', valueVector);

const category = graph.importGPUVector('category', categoryVector);



const filter = new GPUCrossfilter(graph, {

  id: 'linked-dashboard',

  dimensions: [

    {id: 'map', kind: 'bounds', x: longitude, y: latitude},

    {id: 'value', kind: 'range', input: value},

    {id: 'category', kind: 'range', input: category}

  ],

  views: [

    {

      id: 'distribution',

      kind: 'histogram',

      dimension: 'value',

      input: value,

      domain: [0, 100],

      output: histogramCounts

    },

    {id: 'cohorts', kind: 'group', keys: category, output: categoryCounts},

    {

      id: 'visible-rows',

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

filter.setRange('value', [20, 40]);

filter.setRange('category', [categoryId, categoryId]);



const encoder = device.createCommandEncoder({id: 'linked-dashboard-update'});

compiled.encode(encoder, {parameters: undefined});

device.submit(encoder.finish());
```

`range` selects inclusive scalar endpoints. `bounds` selects an inclusive axis-aligned rectangle. All active dimensions intersect; exact categorical selection can be expressed as an identical minimum and maximum unsigned category identifier.

Histogram and group views exclude their own associated selection by default, retaining the available distribution while that view is brushed. Set `includeOwnSelection: true` when a view should include its own predicate. Visibility views publish stable compacted row identifiers and a visible count; mask views publish source-aligned selection flags for custom rendering or compute work.

Selections accept packed `float32`, `sint32`, and `uint32` scalar inputs. Chunked `GPUVector` inputs retain their original ordered chunk boundaries; chunking is not distributed or multi-GPU execution. Call `filter.clear(dimensionId)`, `filter.clearAll()`, or `filter.destroy()` as the application updates or releases its selections.

## Core concepts and data model[​](#core-concepts-and-data-model "Direct link to Core concepts and data model")

* Dimensions own active range or rectangular selection state.
* Views consume every applicable dimension and may exclude their own dimension while brushed.
* Masks remain source-row aligned; compact visibility outputs retain stable source identifiers.
* Chunked inputs preserve their ordered source topology.
* The application owns graph compilation, encoding, submission, rendering, and compact readback.

## Operations and API index[​](#operations-and-api-index "Direct link to Operations and API index")

| Surface                      | Responsibility                                                |
| ---------------------------- | ------------------------------------------------------------- |
| `GPUCrossfilter`             | Declares linked dimensions and views in one command graph     |
| `setRange()` / `setBounds()` | Updates control state without rebuilding graph topology       |
| `clear()` / `clearAll()`     | Removes one or all active predicates                          |
| Histogram view               | Publishes a dense self-excluding distribution                 |
| Group view                   | Publishes dense grouped count, sum, minimum, maximum, or mean |
| Visibility view              | Publishes stable compacted source IDs and a count             |
| Mask view                    | Publishes source-aligned selection flags                      |

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* GPUCrossfilter is experimental and WebGPU-only.
* Scalar dimensions currently use packed `float32`, `sint32`, or `uint32` values.
* Group keys and capacities are explicit; preserving chunks is not distributed execution.
* Dashboard layout, rendering, data import, and synchronization are outside the module.

## Attribution and feature comparison[​](#attribution-and-feature-comparison "Direct link to Attribution and feature comparison")

GPUCrossfilter is inspired by [NVIDIA RAPIDS cuXfilter](https://github.com/rapidsai/cuxfilter), whose contributors demonstrated how GPU-resident dataframes, coordinated visualizations, and linked selections can make large-scale exploratory analysis feel immediate. cuXfilter itself acknowledged the original [JavaScript Crossfilter](https://github.com/crossfilter/crossfilter); GPUCrossfilter brings that family of ideas back into the browser with modern WebGPU execution.

We gratefully acknowledge NVIDIA and the RAPIDS contributors for that pioneering work. cuXfilter is distributed under the [Apache License 2.0](https://github.com/rapidsai/cuxfilter/blob/main/LICENSE). GPUCrossfilter is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE) vis.gl implementation; it does not copy or translate cuXfilter source code. It is not a CUDA port, compatible Python API, feature-parity claim, or NVIDIA/RAPIDS successor project, and is neither affiliated with nor endorsed by NVIDIA.

The comparison below reflects the official cuXfilter [26.06 documentation](https://docs.rapids.ai/api/cuxfilter/stable/), [DataFrame and dashboard API](https://docs.rapids.ai/api/cuxfilter/stable/api_reference/dataframe/), [chart integrations](https://docs.rapids.ai/api/cuxfilter/stable/user_guide/charts/), [multi-GPU guide](https://docs.rapids.ai/api/cuxfilter/stable/user_guide/dask-cudf-support/), and [RAPIDS sunset notice](https://docs.rapids.ai/notices/rsn0060/).

| Capability              | NVIDIA RAPIDS cuXfilter                                                                 | luma.gl GPUCrossfilter                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Primary interface       | Python `cuxfilter.DataFrame` and `dashboard()` in notebooks or Bokeh applications       | TypeScript `GPUCrossfilter` controller inside a browser application                                     |
| GPU platform            | CUDA, cuDF, and NVIDIA GPUs                                                             | A browser-supported WebGPU adapter and luma.gl GPU command graphs                                       |
| Source data             | cuDF or Dask-cuDF dataframes; Arrow files and tables through `from_arrow()`             | Caller-owned typed graph views and `GPUVector` chunks; no built-in dataframe, file, or Arrow importer   |
| Linked interaction      | Coordinated chart and widget selections across dataframe dimensions                     | Inclusive scalar ranges and rectangular brushes; active dimensions intersect                            |
| Input value types       | cuDF-supported numeric, string, and datetime columns, subject to chart support          | Packed `float32`, `sint32`, and `uint32`; categorical keys use `uint32`                                 |
| Aggregation             | GPU dataframe filtering, grouping, and chart-specific aggregation                       | GPU histograms plus dense grouped count, sum, minimum, maximum, and mean                                |
| Selection outputs       | Filtered cuDF exports and queried dataframe indices                                     | GPU-resident masks, stable compacted source identifiers, and visible-row counts                         |
| Visualization ecosystem | Bokeh, Datashader, deck.gl, Panel widgets, and table integrations                       | Renderer-independent GPU outputs; applications provide charts, maps, and scatterplots                   |
| Dashboard composition   | Built-in chart collections, widgets, layouts, themes, and notebook/server presentation  | Filtering primitives only; applications own layout, controls, rendering, and lifecycle                  |
| GPU data boundary       | cuDF data lives with the Python/CUDA application; charts consume their required results | Uploaded source rows, masks, and aggregates stay on the local GPU; compact display readback is explicit |
| Scaling model           | Single-GPU cuDF or distributed, multi-GPU Dask-cuDF                                     | One WebGPU device; preserves source chunks without claiming multi-GPU execution                         |
| Deployment              | Jupyter notebooks, Bokeh-backed applications, and documented multi-user deployments     | A browser application; no Python process or dashboard server is required                                |
| Project status          | Final RAPIDS release 26.06; subsequently sunset and archived                            | Experimental optional `@luma.gl/experimental/gpu-crossfilter` entry point                               |

The projects solve related interaction problems in different environments. GPUCrossfilter does not provide cuXfilter feature parity, a migration layer, built-in chart integrations, or distributed GPU execution.

See GPU Primitives and Command Graphs for the underlying compute infrastructure and [GPU Coordinate Projection](https://luma.gl/docs/api-reference/experimental/gpu-project.md) for another browser-native GPU data workflow.
