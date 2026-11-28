# Persistent survivor queue measurements

Native Apple WebGPU (`metal-3`), measured on 2026-11-27 on a shared host.
[Raw samples](advection-survivor-scheduling.json) retain adapter metadata, accuracy,
work, memory, GPU time and end-to-end wall time. Each variant discards one warmup
and retains five samples, alternating forward/reverse scheduling and batch order.

The fixture uses 65,536 stable slots, uniform velocity on a 1×1 Cartesian C-grid,
a 0.64-second horizon, maximum timestep 0.01 seconds, one attempt per dispatch and
1e-5 local tolerance. The sparse release has 1,024 active slots; all other slots
start outside the domain. Every variant has maximum position error 7.94e-7 and
matched accepted/rejected integration work.

| Active fraction | Batch | Dense wall ms | Full-scan active wall ms | Persistent wall ms | Dense / persistent |
| --- | ---: | ---: | ---: | ---: | ---: |
| 100% | 1 | 155.04 | 167.32 | 148.86 | 1.04× |
| 100% | 16 | 48.86 | 56.38 | 35.76 | 1.37× |
| 1/64 | 1 | 135.60 | 149.26 | 130.08 | 1.04× |
| 1/64 | 16 | 36.14 | 53.80 | 24.92 | 1.45× |

**The batched sparse case shows an end-to-end improvement**, not just fewer GPU
workgroups: persistent samples span 20.40–29.10 ms versus 30.90–40.40 ms dense.
Its mean is 31% below dense and 54% below full-scan active scheduling. Compute time
also drops from 12.44 ms dense / 20.16 ms active to 2.75 ms persistent. Dense and
persistent launch 40,960 and 1,024 integration workgroups respectively; persistent
adds one full-slot initialization scan instead of 80 repeated scans.

The fully active batched mean improves too, but its samples overlap. Single-dispatch
wall samples are noisy and overlap substantially; the approximately 4% mean
improvement does not establish a clear benefit. Dense remains the default. These
five samples on one adapter are evidence for this fixture, not a universal speedup.
No comparison mixes measurements from the previous PR with this run.

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
