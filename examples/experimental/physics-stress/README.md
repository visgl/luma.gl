# GPU Physics Stress Lab

Run `yarn start` here. Nine bounded scenarios exercise automatic pair-budget recovery,
dense mixed-size contacts, a 100:1 stack, ballistic convergence and sphere/static CCD.
Additional scenarios show sparse-contact compaction, rotated geometry, sustained eight-box stacks and offset COM stacks. Settings select the solver, compact/full-scan pair work and timestep. Reset reconstructs initial conditions. Export
report records adapter identity, configuration, accepted ticks, retries, replay work,
completion latency, capacity and final state.

The GPU runs physics; a CPU pose readback feeds a diagnostic front projection. Box
silhouettes show authored extents with projected Y rotation; this is not a general 3D silhouette. Do not interpret this view as
an accurate collision overlay or its timing as a rendering-throughput benchmark.
Completion latency includes diagnostic readback; retries also include compilation and
all replayed steps. Graph Timeline shows CPU encoding without GPU timestamp queries.

The runner stops after 240 ticks, or six simulated seconds for the sustained stack scenarios. Reports include last-step pair workgroups and queue counts. It grows pair and traversal
budgets only; numerical failures, fixed mesh-task exhaustion, CCD impact exhaustion
and unsupported geometry remain explicit failures. A 100:1 stack is an adversarial
fixture, not an advertised supported mass ratio.
