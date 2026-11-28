# Two-arm gantry

Two independently anchored forks lift, hold, translate and set down a free 4 kg beam with its center of mass 0.35 m toward the right fork. Both solvers run the same drives at 120 Hz. The part count includes the beam and dynamic stock boxes parked on either side. The forks manipulate one beam at either scale. This measures spatial rejection and world stepping as the inventory grows.

Open `gantry.html` in the Rigid Body World example. Choose **Lift beam**, then **Transfer beam** to place it on the receiving stands. **Release left** withdraws one support during the hold. Moving the ballast in Settings restarts the experiment. The load display sums contact impulses at each fork.

## Reproduction

Start the example with `yarn workspace luma.gl-examples-experimental-gpu-rigid-body-world start --port 5342`. From the repository root run:

```sh
node scripts/physics/benchmark-gantry.mjs http://127.0.0.1:5342/
node scripts/physics/benchmark-gantry.mjs http://127.0.0.1:5342/ --256
node scripts/physics/benchmark-gantry.mjs http://127.0.0.1:5342/ --ordered
node scripts/physics/benchmark-gantry.mjs http://127.0.0.1:5342/ --ordered --256
```

Each lane executes 512 steps in headless Chromium. The timing includes actuator updates, encoding, submission and waiting for GPU completion. Compilation, the first 20 steps, rendering and diagnostic reads are excluded. The ordered reference uses 64 iterations. The reduced formulation uses a joint-space solve plus eight world iterations. Its two roots share one articulated candidate index. Both must carry within 6 cm of the requested height and place within 6 cm horizontally and 3 cm vertically. During the stationary hold the right fork must carry more load, and total reaction must be within 3 N of 39.24 N. Ordered force is estimated from the steady lift spring deflection after subtracting the weight of the carriage and fork. Reduced force is measured directly from the contact rows.

The WebGPU regression also reverses root registration and checks that both supports persist, all eight rows warm-start, and their forces sum to the beam weight. The benchmark accepts `--reverse` and `--single` for registration-order and single-point experiments.

## Apple GPU results

Chromium WebGPU core, Metal 3, one run per lane, 492 timed steps. These are synchronized wall-clock measurements on a shared development machine. Re-run locally to assess another adapter or the effect of background load.

| Dynamic parts | Solver | Median step | p95 step | Hold reaction, left / right | Beam height after transfer |
| ---: | --- | ---: | ---: | ---: | ---: |
| 64 | Reduced | 3.0 ms | 6.4 ms | 14.61 / 24.63 N | 0.959 m |
| 64 | Ordered | 68.8 ms | 75.5 ms | 14.09 / 27.12 N | 0.918 m |
| 256 | Reduced | 3.5 ms | 7.3 ms | 14.61 / 24.63 N | 0.959 m |
| 256 | Ordered | 260.2 ms | 279.3 ms | 13.92 / 26.63 N | 0.918 m |

All four lanes passed the physical tolerances. The 120 Hz wall-clock budget is 8.33 ms. Reduced met it at p95 in both runs. Its beam settled 2.72 cm short of the receiving target. Ordered placed within 0.2 cm horizontally, with about 4.2 cm of sag after translation. A preliminary 16-iteration ordered run sagged about 28 cm during transfer at both scales, which motivated the higher-accuracy reference. [Raw snapshots and timings](two-arm-gantry-apple.json)
