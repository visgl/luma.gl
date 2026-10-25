# Large-world and batch qualification

Run the Physics Batch Lab dev server, then run the benchmark suite from the repository root:

```sh
(cd examples/experimental/physics-batch && yarn start --host 127.0.0.1 --port 5244)
node scripts/physics/batch/run.mjs --url http://127.0.0.1:5244 \
  --cases 1x128,8x128,1x1024,8x1024,1x10000 --frames 120 --repeats 3
```

Open `/` for the interactive Batch Lab. Sparse debris isolates traversal/dispatch
cost; `--scene pile` stresses contacts. Each repetition reverses the mode order across fused ensemble, batched submissions and separate submissions.
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

## Fused ensembles

`GPUPhysicsEnsemble` uses a shared allocation and one graph encoding per step. Domain IDs enter
spatial hashing and exact pair rejection, so coincident instances remain independent without
quadratic cross-world exclusions. It reuses the existing parallel solver and compact active-contact
queues. Repeated references to one cooked mesh share packed geometry within the ensemble.

Ensembles have fixed membership, common solver settings, a shared contact budget and rollback
boundary. They omit the additional reset checkpoint retained by `GPUPhysicsBatch`; recycling is
reported as null. This memory difference is intentional and is not a kernel speedup. Limits are
65,535 total bodies/colliders plus adapter buffer limits. Joints, authored triggers and CCD are
currently rejected. Queries address the entire ensemble; body indices map through `getBodyIndex`.

The three-mode suite supports up to 128 separate worlds; use the interactive ensemble mode for
larger instance counts, or select `--modes ensemble`. For example:

```sh
node scripts/physics/batch/run.mjs --url http://127.0.0.1:5245 --cases 1024x8,1x32768 --modes ensemble --pairs-per-body 2 --frames 40 --repeats 2
```

Pair capacity rounds up to a power of two with a minimum of 64 per template instance; the ensemble
receives the sum rounded up to a power of two. Smaller budgets must pass completion checks before
results are accepted. Shared geometry across separate resident slots and interacting streamed
partitions remain future work.

See [the fused ensemble report](./ENSEMBLE-QUALIFICATION.md) for the 22-run follow-up through 32,768 bodies and 1,024 independent instances.


Active scheduling sweep (actual active counts are rounded up):

```sh
node scripts/physics/batch/run.mjs --url http://127.0.0.1:5245 --cases 128x16 --modes ensemble --active-fractions 0.01,0.1,0.5,1 --frames 60 --repeats 3
```

Throughput counts active body/world steps only. Compare completed-frame p50/p95 as well as
throughput: all modes retain the entire population, and the ensemble still scans/copies some
capacity-sized buffers. Paused sparse instances must remain at their initial analytic positions;
active instances must match ballistic motion and one another. Dense cases check finite states
and active-world equivalence, not contact accuracy. Scheduler status is included in exported JSON.
