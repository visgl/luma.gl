# Robot arm at matched accuracy

How much does an ordered GPU step cost when an arm must actually hold a load? This sweep uses one or four one-meter, one-kilogram links and a separate fixed payload. Gravity acts downward. The target is horizontal, in free space. The example adds a work stop for contact experiments.

The gravitational moment on a joint with N downstream links is 9.81 × (payload mass × N + N²/2) N·m. Preloading each force drive by the opposing moment divided by stiffness provides an independent horizontal equilibrium reference. All configurations get six simulated seconds to settle. Each of the next 30 steps must meet **4 cm tool error, 1 cm link-anchor drift and 10% shoulder torque error**. A run must also finish every step with complete diagnostics.

The table reports the lowest observed p95 amongst qualifying configurations at each frequency. Each sample measures CPU encoding, submission and a GPU completion fence. State and torque readbacks occur outside the timer. The interactive renderer is disabled. Times are milliseconds per step on one Apple Metal WebGPU adapter, Chromium 151. A 120 Hz simulation needs two steps per 60 Hz frame.

| Links | Payload | 60 Hz iterations · p50 / p95 | 120 Hz iterations · p50 / p95 |
| --- | --- | --- | --- |
| 1 | 0.5 kg | 8 · 1.0 / 1.6 ms | 8 · 0.9 / 1.8 ms |
| 1 | 3 kg | 32 · 1.9 / 2.9 ms | 8 · 0.9 / 1.9 ms |
| 4 | 0.5 kg | No qualifying run | 64 · 8.4 / 9.3 ms |
| 4 | 3 kg | No qualifying run | 64 · 8.5 / 9.4 ms |

The four-link, 3 kg fixture at 120 Hz and 32 iterations reached 1.3 cm tool error but missed the anchor and torque budgets. At 64 iterations it qualified, with a p95 above the 8.33 ms fixed-step interval. This is a concrete target for a reduced-coordinate tree solver. The timings do not establish a cross-adapter performance envelope.

[All 24 configurations and adapter metadata](./robot-arm-apple.json). Reproduce the sweep from the repository root with the Rigid Body Lab’s Vite server running:

```sh
node scripts/physics/benchmark-robot-arm.mjs http://127.0.0.1:5312/
```

The GPU regression suite also commands a target step at 60 and 120 Hz, measures settling and overshoot, checks torque saturation, and presses the four-link arm against a stop before lifting clear.

## Reduced-coordinate tree comparison

The two solvers ran on the same Apple Metal WebGPU adapter in Chromium, using the same 3 kg load, body inertias, gravity, spring gains, torque caps, 120 Hz timestep and six-second warmup. The tree models the stationary support as a fixed base and the payload as a welded link. This fixture measures a suspended arm in free space. The ordered pipeline also performs collision discovery; the tree workload has no collision pass.

| Solver | 30-step p50 / p95 | Max tip error | Max link-anchor drift | Max shoulder torque error | Original gates |
| --- | --- | --- | --- | --- | --- |
| Ordered, 64 iterations | 8.4 / 10.8 ms | 5.08 mm | 9.55 mm | 2.01% | Pass |
| Reduced-coordinate | 0.6 / 0.9 ms | 0.0072 mm | 0.00014 mm | 0.0011% | Pass |

The first 30 samples reproduce the original accuracy window. Continuing to 240 samples, the reduced-coordinate step took **1.0 ms p95** versus an 8.33 ms budget. It stayed within all three accuracy limits. Ordered took 9.9 ms p95 and its worst anchor drift and torque error reached 11.0 mm and 21.5%. Timing includes CPU encoding, submission and waiting for GPU completion. This establishes 120 Hz physics headroom for this desktop workload. Rendering, collisions, mobile hardware and other tree sizes need independent measurements.

A separate −0.24 rad elbow command moved the payload in both simulations. Two simulated seconds later ordered and reduced-coordinate elbow angles were −0.244 and −0.247 rad, with tool errors of 2.1 and 7.3 cm. These transient samples are outside the static-hold qualification. [Raw measurements](./articulated-tree-apple.json).

```sh
node scripts/physics/benchmark-robot-arm.mjs http://127.0.0.1:5312/ --compare-tree
```
