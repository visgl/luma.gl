# Large-world and batch qualification

Run the Physics Stress Lab dev server, then run the benchmark suite from the repository root:

```sh
(cd examples/experimental/physics-stress && yarn start --host 127.0.0.1 --port 5244)
node scripts/physics/batch/run.mjs --url http://127.0.0.1:5244 \
  --cases 1x128,8x128,1x1024,8x1024,1x10000 --frames 120 --repeats 3
```

Open `/batch.html` for the interactive Batch Lab. Sparse debris isolates traversal/dispatch
cost; `--scene pile` stresses contacts. Each repetition reverses the submission-mode order.
One-world cases measure single-world latency; many-world cases measure aggregate throughput.
Do not compare different body counts, solver settings or simulated time as batching speedups.

Reports include fence-completed p50/p95 batch latency, encoding/submission latency, body-steps/s,
setup and GPU slot-reset times, world buffers, reset snapshots and compiled graph transients.
No CPU pose readback, diagnostics, rendering or reset work is inside the timed region.
Completion diagnostics are checked after each frame. Use one step per frame when checking
transient diagnostic failures. The persistent rollback policy also latches rejected steps.

Buffer bytes are logical allocations, not measured VRAM. Pipeline/driver allocations and
compilation peaks are excluded. The resident budget is checked before world allocation and
again after graph compilation reveals scratch allocation; it is not a hard process-memory cap.
Measurements on a busy development host are exploratory. Run the same suite on the supported
adapter matrix before declaring G10 qualified. This suite does not establish collision accuracy;
retain the matched Box3D quality suite and the geometry/CCD qualification gates.

The implementation amortizes compilation/allocation through template-slot reuse. Worlds retain
separate solver graphs and state, and GPU cooked geometry is not shared across slots yet. A single
command buffer is not necessarily faster: separate submissions can overlap CPU encoding with
GPU execution. `planSubmissions()` permits bounded groups instead of enforcing one policy.

See [the October 25 qualification report](./QUALIFICATION.md) for measured results and limits.
