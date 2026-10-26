# Awake island work queues

Measured on 2026-10-23 with hardware WebGPU on the available Apple Metal 3 adapter.
The machine was not isolated from other work. Raw reports are in
[gpu-physics-awake-islands.json](./gpu-physics-awake-islands.json).

The fixture contains 96 spheres in 48 independent touching pairs, with gravity disabled
and damping/sleep enabled. Both paths use the same 32 solver iterations, 1/120 s step,
8192-slot pair cache, 120 warmup steps and 30 measured steps.

| Measurement | Compact awake queues | Full scan |
| --- | ---: | ---: |
| Retained contact manifolds | 48 | Not counted by scan diagnostics |
| Pair workgroups per iteration | 0 | 128 |
| Body workgroups per iteration | 0 | 2 |
| Median summed GPU work | 0.431 ms | 0.586 ms |
| Median CPU encoding | 1.0 ms | 0.6 ms |
| Median completion including diagnostics | 7.3 ms | 7.8 ms |
| p95 completion including diagnostics | 21.7 ms | 20.6 ms |

Both runs reported finite state and complete execution. The extra queue construction
has a CPU/dispatch cost; reducing solver work does not guarantee lower end-to-end
latency. Tail timings were noisy. This is one workload on one device, not a general
performance qualification or an accuracy comparison against another engine.

Reproduce with a running Vite physics example:

```sh
node scripts/physics/benchmark-rigid-body.mjs --url http://127.0.0.1:5239/ --fixture sleepingIslands --warmup 120 --samples 30
node scripts/physics/benchmark-rigid-body.mjs --url http://127.0.0.1:5239/ --fixture sleepingIslands --warmup 120 --samples 30 --full-scan
```

The interactive stress scene periodically wakes one island. Its GPU regression tests
verify that the whole connected island wakes and that inactive islands are omitted
from iterative work. The benchmark measures the settled phase only.
