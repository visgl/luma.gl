---
title: Performance and qualification
description: Measure complete simulation cost and retain an explicit numerical quality budget.
---

# Performance and qualification

Optimize complete application frames, not just one broad-phase kernel. Simulation,
rendering, shadow passes, CPU encoding and synchronization share the frame budget.
A 60 Hz interactive example has about 16.7 ms per frame; spending all of it on physics
leaves no margin for rendering or timing variation.

## Find the bottleneck

| Measurement | What it reveals |
| --- | --- |
| CPU encoding time | Graph traversal, dispatch preparation and application overhead |
| GPU simulation timestamps | Broad phase, collision generation, solving and publication costs |
| Rendering and shadow time | Tessellation, overdraw, resolution and repeated geometry work |
| Queue depth and fence latency | Backlog and CPU/GPU synchronization |
| Simulated seconds / wall seconds | Whether the application actually keeps up |
| p50/p95 frame and step times | Typical cost and the margin needed for spikes |

Use **GPU Graph** for logical operations and **GPU Graph Timeline** for timings. One
logical solver node may issue many dispatches. Fewer graph nodes alone do not prove less work.
Measure after compilation/warm-up and include difficult impact frames, not only a settled pile.

## Preserve quality while reducing cost

- Choose the solver and broad phase for the contact workload. A small reference scene
  and a large parallel pile need different execution strategies.
- Compare fixed timesteps against measured numerical tolerances. A 60 Hz step can be
  sufficient for some scenes; a fast, thin or elastic interaction may need smaller steps or CCD.
- Tune iterations independently from timestep. Fewer iterations may reduce cost while
  increasing constraint error, penetration or jitter.
- Keep state GPU-resident and read compact diagnostics asynchronously.
- Remove wasted rendering work. Boxes need box triangles, not thousands of collapsed
  sphere vertices; shadow casters should use the same economy and current GPU poses.
- Reuse allocations and bound in-flight work. Queueing more frames does not make the
  simulation faster and increases interaction latency.

The wrecking-ball example qualifies both 60 Hz and 120 Hz for pre-impact pile stability,
block displacement, suspension length and complete diagnostics. Its default 60 Hz setting
is a scene-specific quality choice, not a new global solver default or a general CCD claim.

## Qualification is part of optimization

Check both positive behavior and failure cases. Useful measurements include penetration,
settling drift, energy behavior, joint error, missed fast impacts, event loss and capacity
overflow. Compare equivalent workloads and quality budgets when comparing solvers or engines.

`getCapacityInfo()` estimates planned allocation. Runtime diagnostics report whether bounded
work completed. With rollback enabled, rejected steps retain the previous state; successful
publication does not mean every attempted step succeeded. Check lifetime counters rather
than just the latest rendered frame. Other failure policies can publish incomplete work.

The [collision matrix](/docs/api-reference/graph/gpu-physics-collision-coverage),
[Physics Stress Lab](/examples/experimental/physics-stress), and
[roadmap](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md)
provide the current evidence and remaining boundaries. Record device/backend, settings,
scene counts and failure counters with every performance claim.

The [G7 glTF physics qualification report](https://github.com/visgl/luma.gl/blob/master/dev-docs/benchmarks/gltf-physics-g7.md)
records which draft features have passing evidence, how the upstream samples were
checked, and the hardware and workload limits of the measurements.
