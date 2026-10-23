# GPU Physics Stress Lab

Run `yarn start` here. Fourteen bounded scenarios exercise automatic pair-budget recovery,
dense mixed-size contacts, a 100:1 stack, ballistic convergence and sphere/static CCD.
Additional scenarios show sparse-contact compaction, rotated geometry, sustained eight-box stacks and offset COM stacks. Settings select the solver, compact/full-scan pair work and timestep. Reset reconstructs initial conditions. Export
report records adapter identity, configuration, accepted ticks, retries, replay work,
completion latency, capacity and final state.

The GPU runs physics; a CPU pose readback feeds a diagnostic projection; mesh-opening scenes use an oblique view. Box
silhouettes show authored extents with projected Y rotation; this is not a general 3D silhouette. Do not interpret this view as
an accurate collision overlay or its timing as a rendering-throughput benchmark.
Completion latency includes diagnostic readback; retries also include compilation and
all replayed steps. Graph Timeline shows CPU encoding without GPU timestamp queries.

The runner allows at least 30 simulated seconds before stopping after two quiet seconds, with a selectable 30-second, one-minute or two-minute limit. The default limit is two minutes. Reports include last-step pair workgroups and queue counts. It grows pair and traversal
budgets only; numerical failures, fixed mesh-task exhaustion, CCD impact exhaustion
and unsupported geometry remain explicit failures. A 100:1 stack is an adversarial
fixture, not an advertised supported mass ratio.

Geometry Torture adds scaled cooked hulls and original triangle surfaces with a real opening.
Fast Motion Lab adds capsule/cylinder ricochets, sphere/mesh opening and rim trajectories,
and intentional impact-budget rejection. Select scenarios in Settings, or use
`?scene=geometryConvex`, `?scene=geometryOpenings`, `?scene=fastPrimitives`,
`?scene=fastMesh` or `?scene=fastBudget`. Reset reconstructs the starting state.
Gold trails join sampled centers; they do not reconstruct between-impact paths.

CCD applies to selected centered spheres against static obstacles only. Rotating
and dynamic obstacles remain discrete. Meshes are two-sided triangle surfaces, not
solid volumes. Rejection is expected in the budget scenario; no partial step is accepted.

Numerical qualification fixtures keep their independently documented duration.
