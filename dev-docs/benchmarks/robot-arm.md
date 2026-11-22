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
