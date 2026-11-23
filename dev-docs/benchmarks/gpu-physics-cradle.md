# Cradle step cost and stability

Local Apple WebGPU measurements, 2026-10-21. The raw adapter/browser metadata,
settings, states and diagnostics are in `gpu-physics-cradle-apple.json`. Other GPU
workloads were present; these are comparative observations, not isolated-device
frame-rate guarantees.

The cradle has 12 bodies and five distance joints. All configurations below use
480 Hz steps, restitution threshold zero, ordered solving and rollback protection.
Each timing run advances 360 warm-up steps and measures the next 60 complete steps.

| Discovery | Iterations | Graph nodes | Median GPU work / step | p95 GPU work / step |
| --- | ---: | ---: | ---: | ---: |
| Hierarchical grid | 32 | 14 | 5.25 ms | 10.00 ms |
| All-pairs | 32 | 8 | 3.08 ms | 4.33 ms |
| All-pairs | 16 | 8 | 1.60 ms | 2.26 ms |
| All-pairs | 8 | 8 | 0.86 ms | 2.07 ms |

Repeating the fastest and original configurations in reverse order produced
0.94 ms and 5.35 ms respectively. The observed reduction is about 5.7–6.1 times.
These figures sum timestamped GPU work. End-to-end completion additionally includes
scheduling and a diagnostic readback; it is reported separately in the JSON.

The example now selects all-pairs and eight iterations for the cradle. Eight
iterations reproduced the original 32-iteration stability measurements over 60
simulated seconds: 28,800 complete steps, maximum tether error 0.057 mm, energy
ratio 0.998–1.005 and end-ball position ranges of 1.47 m and 1.41 m during the final
ten seconds. This is a bounded scene result, not a general recommendation to lower
iterations for stacks, mechanisms or poorly conditioned constraints.

## Frame scheduling

The lab previously advanced its wall-clock origin during every pending-fence frame,
discarding that elapsed time. It now accounts for the wait after completion while
retaining the 1/30-second catch-up cap and one pending submission. A ten-second
headless renderer observation on the optimized configuration advanced 5.35 simulated
seconds before the correction and 9.45 afterward (approximately 0.52x versus 0.94x
real time). Displayed step counters are sampled asynchronously and GPU load was not
exclusive; these are diagnostic observations, not precise frame-rate benchmarks.

## Further optimization candidates

1. Batch compatible dispatches within compute passes to reduce repeated pass and
   binding setup while preserving graph resource hazards and diagnostic attribution.
2. Add an optional small-world kernel that keeps state in one workgroup and performs
   several fixed substeps internally. Preserve collision events, capacity checks and
   per-step rollback; this is a separate path from large parallel worlds.
3. Specialize candidate storage and solving for immutable topology, avoiding scans of
   impossible static/static and connected-body pairs. Measure against the current
   small all-pairs path before adding complexity.
4. Develop residual-based solver stopping for broader scenes. Validate contact/joint
   residuals and long-run behavior; fewer iterations alone is not sufficient evidence.

Keep the fine timestep: reverting to 120 Hz was cheaper but spread motion into the
middle balls after repeated impacts. Do not recover frame rate by silently changing
simulation speed or weakening rollback protection.
