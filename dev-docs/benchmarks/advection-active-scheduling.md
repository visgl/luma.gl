# RK45 active scheduling cost

Measured on 2026-11-27 with native Apple WebGPU (`metal-3`), on a shared host.
[Raw samples](advection-active-scheduling.json) retain adapter metadata, work,
error, memory, GPU duration and wall duration.

65,536 stable slots, a 1×1 Cartesian C-grid with uniform velocity, a 0.64-second
horizon, maximum timestep 0.01 seconds, one trial per dispatch and tolerance 1e-5.
The sparse case has 1,024 active slots; the others start outside the domain.
Each variant discards one warmup and retains two samples with reversed order.
Maximum position error is 7.94e-7 for every variant. Both scheduling modes perform
identical accepted/rejected integration work.

| Active fraction | Dispatch batch | Dense wall ms | Active wall ms | Dense integration groups | Active integration groups |
| --- | ---: | ---: | ---: | ---: | ---: |
| 100% | 1 | 87.00 | 102.80 | 33,280 | 33,280 |
| 100% | 16 | 33.50 | 42.75 | 40,960 | 33,280 |
| 1/64 | 1 | 83.20 | 111.95 | 33,280 | 1,024 |
| 1/64 | 16 | 38.05 | 41.95 | 40,960 | 1,024 |

Active scheduling eliminates most sparse integration workgroups, but does **not**
improve end-to-end time in this inexpensive field. Full-slot scans, status atomics,
extra graph encodings and timing readbacks outweigh the savings. Dense remains the
default. Persistent survivor queues are a separate roadmap tranche.

Wall time includes queue reset/scan, integration, submission, counter synchronization
and optional timestamp readback. GPU time includes scan and integration compute
passes, but excludes reset copies. Allocation, final particle readback and rendering
are excluded. The queue/commands add 262,172 bytes; each dispatch adds eight staging
bytes compared with dense batching. Raw memory fields exclude shared fields,
kernels, fixed statistics storage and timing snapshots. Two samples on one busy
adapter are not a hardware-general performance claim.

Reproduce from the repository root:

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true yarn test-headless --no-coverage --silent=false modules/graph/test/experimental/simulation/scientific-flow-benchmark.spec.ts
```
