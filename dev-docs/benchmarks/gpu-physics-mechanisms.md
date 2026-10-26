# Initial ordered mechanisms measurement

This is a reproducible smoke measurement, not performance qualification. The raw
[Apple WebGPU report](./gpu-physics-mechanisms-apple.json) includes adapter, browser,
settings, final state, timing scope and diagnostics. No exclusive GPU ownership was
assumed; other development work was running on the machine.

Command, from the repository root with the Rigid Body Lab running:

```sh
node scripts/physics/benchmark-rigid-body.mjs --url http://127.0.0.1:5233/ --fixture hinge --solver ordered --samples 20 --warmup 60
```

The four-body, one-hinge scene used 32 iterations at 1/120 s with report-only failure
handling. It completed all 80 steps with finite state and complete diagnostics.

| Metric | Median | p95 |
| --- | --- | --- |
| GPU work | 4.83 ms | 5.44 ms |
| GPU span | 5.01 ms | 5.86 ms |
| CPU encoding | 0.30 ms | 0.60 ms |
| Completion including diagnostics readback | 6.60 ms | 10.20 ms |

Compilation took 564 ms. The graph has 11 nodes; constraints add no per-joint graph
node or buffer. Optional rollback copies and validation are not included in this
report-only baseline. Neither the small body count nor the absence of extra nodes
establishes scalable throughput. These costs motivate later parallel joint scheduling
and broader quality/cost profiling. There is no comparison-engine or SOTA claim here.
