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
