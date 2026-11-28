# Persistent survivor queue measurements

Native Apple WebGPU (`metal-3`), measured on 2026-11-27 on a shared host.
[Repeat samples](advection-survivor-scheduling.json) retain adapter metadata, accuracy,
work, memory, GPU time and end-to-end wall time. Each variant discards one warmup
and retains five samples, alternating forward/reverse scheduling and batch order.

The fixture uses 65,536 stable slots, uniform velocity on a 1×1 Cartesian C-grid,
a 0.64-second horizon, maximum timestep 0.01 seconds, one attempt per dispatch and
1e-5 local tolerance. The sparse release has 1,024 active slots; all other slots
start outside the domain. Every variant has maximum position error 7.94e-7 and
matched accepted/rejected integration work.

| Active fraction | Batch | Dense wall ms | Full-scan active wall ms | Persistent wall ms | Dense / persistent |
| --- | ---: | ---: | ---: | ---: | ---: |
| 100% | 1 | 65.62 | 85.98 | 61.18 | 1.07× |
| 100% | 16 | 37.74 | 47.78 | 23.82 | 1.58× |
| 1/64 | 1 | 80.42 | 77.90 | 54.26 | 1.48× |
| 1/64 | 16 | 38.28 | 40.82 | 14.92 | 2.57× |

**The batched sparse case shows an end-to-end improvement**, not just fewer GPU
workgroups: persistent samples span 13.60–17.90 ms versus 33.40–42.20 ms dense.
Its mean is 61% below dense and 63% below full-scan active scheduling (2.74×). Compute
time also drops from 25.24 ms dense / 25.27 ms active to 3.26 ms persistent. Dense and
persistent launch 40,960 and 1,024 integration workgroups respectively; persistent
adds one full-slot initialization scan instead of 80 repeated scans.

The fully active batched mean improves too, but its samples overlap. The sparse
single-dispatch repeat also improves, while fully active single-dispatch samples
overlap. Dense remains the default: these five samples on one adapter are evidence
for this fixture, not a universal speedup.

This repeat ran after this worktree's build, Node and GPU suites finished and its
animated preview closed. Other activity on the shared host was not controlled.
The [initial run](advection-survivor-scheduling-initial.json), which overlapped local
validation, measured 36.14 / 53.80 / 24.92 ms for sparse batch-16 dense / active /
persistent (1.45× over dense). Both runs show an end-to-end benefit in that case,
but their differing absolute timings and single-dispatch results demonstrate host
variability. Comparisons above use only matched variants within the repeat, not
measurements from the previous PR or a mixture of runs.

Wall time includes initialization, survivor maintenance, queue resets, full previous
state copies, encoding, submission, counter synchronization and optional timing
readback. GPU time covers compute passes only, excluding copies. Allocation, final
particle readback and rendering are excluded. Persistent queue/command storage is
524,332 bytes versus 262,172 for full-scan active; both use 44 counter-staging bytes
per dispatch versus 36 dense. Raw memory fields exclude shared fields, kernels,
fixed statistics/reset storage and timing snapshots.

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true yarn test-headless --no-coverage --silent=false --testNamePattern='persistent scheduling' modules/graph/test/experimental/simulation/scientific-flow-benchmark.spec.ts
```
