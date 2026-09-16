# arisia Kernel execution migration

## Scope

GPU core primitives now compile generated WGSL with the existing engine `Kernel`. Every dispatch
supplies its complete current bindings, including indirect dispatch. The migration preserves shader
sources, physical resource ownership, chunk topology, command ordering, and dispatch dimensions.

The shared chunk, dense, spatial, finite-difference, and reduction helpers use this path, as do the
atomic primitives and device-owned FFT2D implementation. Shader assembly, `ShaderInputs`, and
`UniformStore` are no longer dependencies of GPU core execution. An architecture test protects this
boundary. No replacement public execution wrapper is introduced.

Mixed graphs can still contain engine `Computation` nodes from higher-level consumers. Each WebGPU
compute pipeline must own its mutable default bindings; a shared empty object allowed one pipeline's
bindings to contaminate others, which became observable when mixing these two execution APIs.
Regression coverage checks mixed passes, pipeline sharing, repeated graph encoding with rebound
buffers, asynchronous compilation, and destruction while another graph retains the shared pipeline.

## Reproducible baseline

Run the opt-in comparison with:

```sh
yarn test-browser-benchmarks modules/gpgpu/test/gpu-core/gpu-kernel-benchmark.spec.ts
```

For the software-backed CI configuration, prefix the command with `CI=true`. The benchmark emits a `GPU_KERNEL_BASELINE` JSON annotation containing device information and
nearest-rank timing distributions. Add `--reporter=verbose` to display annotations in the terminal.
It uses identical complete WGSL, layouts, output sizes, and 64 dispatches per graph for both paths.
Three warmup iterations precede nine measured iterations, alternating path order. Each path retains
an executable to keep its shader/pipeline cache references alive while graph compilation is measured.
GPU output is checked after every encoding. Timings report:

- warm graph compilation per node, excluding graph construction and destruction;
- CPU graph encoding per dispatch, excluding submission and readback;
- GPU time per dispatch only when timestamp queries are available.

These are execution-overhead baselines, not numerical-kernel throughput or cold compilation results.
Timing assertions are deliberately absent. Software GPU timings must not be treated as hardware
performance claims, and heterogeneous or fragmented workloads need separate measurements.

### Initial software-GPU observation

A local Chromium/SwiftShader run on 2026-09-16, using the maximum test-device feature profile,
reported these medians (microseconds):

| Measurement | Computation | Kernel |
| --- | ---: | ---: |
| Warm compilation per node | 43.75 | 3.13 |
| CPU encoding per dispatch | 7.81 | 9.37 |
| GPU timestamp per dispatch | 1.01 | 0.56 |

The main observed gain is reduced warm compilation overhead. CPU encoding was slightly slower in
this run. The tiny software-GPU intervals and coarse browser CPU timer make these directional
observations, not throughput guarantees. Both paths execute identical WGSL; hardware and larger
workload measurements are needed before claiming GPU execution gains.

## Next execution tranche

FFT2D and device-owned CG/PCG/reduction helpers still retain their existing public buffer lifecycles.
Move them onto graph/program resource planning together. Kernel migration alone neither completes
that work nor removes the dependency on luma core: `Kernel` still uses luma's device, shader, pipeline,
and compute-pass resources. Native WebGPU independence remains a later explicit boundary change.
