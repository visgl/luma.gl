# gpu-trace implementation roadmap

This maintainer roadmap tracks implementation work for `@luma.gl/experimental/gpu-trace`. User-facing
algorithm contracts and current behavior belong in the
[gpu-trace algorithm documentation](../../docs/api-reference/experimental/gpu-trace-algorithms.md).

| Tranche | Current status | Remaining exit work |
| --- | --- | --- |
| 1 — Adaptive GPU query planner | **Complete.** Resumable graph execution, multidimensional budgets, immutable dry-run plans, oversized-step diagnostics, cancellation, explicit latency priorities, per-operation queue-time feedback, and coherent progressive publication are implemented and showcased | Closed |
| 2 — 25M reference workload | Chunked 25M capacity contracts, static work/memory telemetry, overview renderer measurements, preflight confirmation, and an opt-in 21-second seven-scenario validation runner with a downloadable JSON report are implemented | Record and publish a reference Desktop MAX adapter profile; wire the short run into an explicitly selected browser workflow rather than ordinary page load |
| 3 — Unified hierarchical trace index | **Complete.** Package hierarchy, incremental builder, compact chunk indexes, level selection, and one stable conservative candidate publication shared by exact, density, representatives, labels, dependencies, and picking | Closed; analytical interval execution remains owned by tranche 6 |
| 4 — GPU causal analysis | Exact cycle-safe parent paths, slack, masks, diagnostics, workload estimates, and planned resumable scheduling are implemented and showcased | General dependency-DAG CPM, causal slices, and wait attribution |
| 5 — Trace comparison and anomaly scoring | **Complete.** Group comparison and explicit peer-baseline scoring compose in one graph, execute through bounded planned steps, tint aggregate groups, and publish lazy chunked per-span anomaly masks directly into exact and representative rendering | Closed; persistent real-trace fixtures remain production-platform work in tranche 10 |
| 6 — GPU trace analytics | **Complete.** Viewport analytics use an independent hierarchical temporal query and candidate-driven fused accumulation; measured and confirmed full-trace scopes retain canonical and resumable scans. Built-in and operation-dictionary grouping, histograms, time buckets, cross-filter controls, compact outputs, average concurrency, lane utilization, active lane-time, and idle lane-time are implemented | Closed |
| 7 — Out-of-core streaming | Deferred | Deliberately excluded from the current implementation sequence |
| 8 — Semantic rendering | **Complete.** Exact, density, representative, and wide-span LODs; fitted labels; a hierarchy-backed minimap; stable dependency corridors; shared picking; and immediate hover emphasis are implemented | Closed |
| 9A — Generic GPU Core adaptive execution | **Complete.** Graph preflight, counters, node timings, learned execution budgets, conditional work, adapter-isolated calibration profiles, and equivalent-kernel selection are implemented; `GPUScan` consumes the selector and the trace viewer persists measured samples | Closed; add new equivalent variants only where measurements justify them |
| 9B — gpu-trace autotuning policies | Renderer-specific frame histories and trace workload telemetry are implemented | Use 9A decisions for temporal-query kernels, dependency admission, analytics batch sizes, and semantic rendering thresholds |
| 10 — Production platform | Public `gpu-trace` exports, algorithm/API pages, validation flags, CPU-oracle fixtures, graph telemetry, example preflights, and a versioned 25M reference-validation artifact are in place | Persist reference artifacts, add real-trace fixtures, and define API graduation criteria |
