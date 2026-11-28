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

## Press and lift at 120 Hz

Four one-meter links press a 3 kg welded sphere onto a finite, frictionless work stop for two seconds, then lift for two seconds. Both solvers receive the same elbow targets (+0.65 and −0.3 rad), gains, 25 N·m press cap and 300 N·m lift cap. The other three joints hold zero with a 300 N·m cap. The shoulder needs more than 150 N·m to support this arm horizontally.

| Solver | Step p50 / p95 | Peak sampled penetration | Supported center height | Height after lift |
| --- | --- | --- | --- | --- |
| Ordered, 64 iterations | 10.9 / 15.2 ms | 25.38 mm | 1.2880 m | 2.0335 m |
| Reduced-coordinate | 0.4 / 1.5 ms | 0.0041 mm | 1.2900 m | 2.0977 m |

Both completed all 480 steps, seated within 2 cm of 1.29 m, stayed within the 3 cm sampled penetration limit and raised the center above 2 m. The tree reported 52.7 N while supported and zero after lifting. Each timing includes encoding, submission and the GPU completion fence. The 464 samples omit the first eight steps of each phase and exclude rendering and diagnostic reads. Height was sampled every eight steps. Only the reduced-coordinate solver met the 8.33 ms p95 latency budget on this adapter. [Raw measurements](./arm-contact-apple.json).

Start the Rigid Body Lab and run the comparison against its local URL:

```sh
node scripts/physics/benchmark-arm-contact.mjs http://127.0.0.1:5317/
```

## Two-finger pick and place

Two driven spherical fingertips squeeze a free 1 kg box. A four-axis mechanism raises the box, slews one radian to a marked destination, lowers it and opens the fingers. Each solver gets the same smooth targets, link inertias, torque caps, pad friction (0.9), bench friction (0.65) and six phases of 180 fixed steps. A second trial removes pad friction while keeping bench friction.

| Solver | Step p50 / p95 | Height after lift / carry | Max radial slip | Max bench penetration | Landing error |
| --- | --- | --- | --- | --- | --- |
| Reduced-coordinate | 0.8 / 2.0 ms | 0.748 / 0.742 m | 5.1 mm | 1.2 mm | 12.5 cm |
| Ordered, 64 iterations | 9.8 / 12.4 ms | 0.603 / 0.701 m | 12.7 mm | 4.1 mm | 8.2 cm |

The 900 timed steps per run include drive updates, encoding, submission and waiting for GPU completion. Rendering and diagnostic reads are excluded. Both solvers completed 1,080 steps, lifted and carried above 0.58 m, kept radial slip below 5 cm and released within 25 cm of the destination at a resting center height within 6 cm of 0.24 m. With zero pad friction both payloads remained at bench height during lift. Only reduced-coordinate met the 8.33 ms p95 budget on this Apple WebGPU adapter.

Slip measures change in distance from the payload center to the fingertip midpoint relative to the end of grip. Bench penetration uses the projected vertical extent of the oriented box. Both are sampled every 12 steps. Ordered landed closer to the mark and settled with a lower center height. These runs qualify one discrete contact fixture and adapter. [Raw measurements](./gripper-apple.json).

```sh
node scripts/physics/benchmark-gripper.mjs http://127.0.0.1:5330/
```

### Grasp parameter sweep

The **Grasp Sweep** tab in the gripper lab runs 18 independent reduced-coordinate mechanisms in one GPU command graph. The experiment crosses payload masses of 0.5, 1 and 3 kg, pad friction coefficients of 0, 0.35 and 0.9, and finger torque caps of 8 and 32 N·m. Each link in the results grid opens the same parameters in the interactive 3D lab.

A trial earns **placed** if it completes all 1,080 fixed steps, lifts and carries above 0.58 m, and finishes within 25 cm of the destination and 6 cm of the reference resting center height. A missed placement and a numerical failure are reported separately. Hover a result to inspect lift height and landing error.

Each tree owns its state and contributes a dispatch per step. Four steps for all trials share an encoder, submission and completion fence. The reported world-steps per second includes drive writes and fenced simulation work and excludes compilation, rendering and phase-end readbacks. The sweep shares the live 3D lab’s device, so rendering can affect measured throughput.

In the standalone Apple WebGPU baseline, the graph processed 3,042 world-steps/s. Four of 18 workpieces met the placement gates. Both 0.5 and 1 kg placed at 32 N·m with friction 0.35 and 0.9. All zero-friction controls missed. The 3 kg, 32 N·m, 0.9 trial lifted to 0.69 m but missed the destination by 0.85 m.

### Bin picking

Run `node scripts/physics/benchmark-gripper.mjs http://127.0.0.1:5335/ --bin` against the local gripper lab. Both lanes use the same one-kilogram boxes, tray, finger geometry and drive trajectory. The reduced tree exchanges impulses with an eight-iteration world. The ordered solver uses 64 iterations for the arm and all counterparts together. Each timing includes drive updates, encoding, submission and a completion fence. Each simulated step represents 1/120 s.

| Apple WebGPU fixture | Reduced p95 | Ordered p95 | Outcome |
| --- | ---: | ---: | --- |
| Center pickup | 3.3 ms | 25.1 ms | Both placed and lifted the same block again. Landing errors were 2.1 and 6.9 cm respectively. |
| 3.5 cm offset pickup | 3.7 ms | 23.5 ms | Both placed and regrasped. Maximum radial slip was 1.8 and 3.7 cm respectively. |
| Frictionless center pickup | 3.7 ms | 25.9 ms | Both left the selected block on the bench. |
| Split grip | 4.2 ms | 25.1 ms | The reduced solver identified a different block under each fingertip. The ordered benchmark records trajectories only. |
| Drop onto another block | 3.8 ms | 26.6 ms | The reduced load settled at 0.671 m on its neighbor. The ordered load rolled out of the tray and off the bench. |

All five reduced cases stayed within the 8.33 ms physics-step budget on this adapter. The rendered center scenario separately recorded a 16.7 ms median and 17.7 ms p95 browser animation-frame interval over 180 callbacks during a cycle. The single-workpiece reference rerun measured 2.2 ms and 14.7 ms p95 for reduced and ordered with rubber pads. The ordered drop remains an open quality gap. The benchmark exits with a failure code when a scenario misses its quality gates. [Raw bin-picking measurements](./bin-picking-apple.json).

### Crowded bin

A four-link arm picks, carries, places and regrasps a 1 kg box in a seeded workcell containing 64 dynamic parts. Both solvers use the same fixed 1/120 s step, link geometry, trajectories, inertias and torque caps. The reduced tree couples four authored colliders to an eight-iteration parallel world. The ordered reference solves contacts and articulated constraints together with 64 iterations. Both use world-space grid discovery for box/box contacts.

| Apple WebGPU run | Full step p50 / p95 | Landing error | Max grip slip | Max neighbor displacement |
| --- | ---: | ---: | ---: | ---: |
| 64 parts, reduced | 2.0 / 4.3 ms | 2.0 cm | 3.4 mm | 2.8 mm |
| 64 parts, ordered | 180.4 / 301.7 ms | 8.7 cm | 14.6 mm | 2.8 mm |
| 256 parts, reduced | 8.1 / 14.8 ms | 2.0 cm | 3.4 mm | 14.6 mm |

Each run completed 1,584 steps. Timing covers 1,044 steps from grip through release and includes drive updates, command encoding, submission and a GPU completion fence. Rendering and periodic diagnostic readbacks are excluded. After release both 64-part solvers grasped the same block again. The reduced lane tested at most 12 candidate pairs at the sampled points and reused both fingertip contacts during carry. Neighbor movement is sampled every 12 steps relative to the first sample.

The matched 64-part run met the 8.33 ms p95 budget on this Apple Metal adapter. Two repeats on the shared host measured 12.4 and 10.2 ms p95 during concurrent work. Real-time headroom depends on system load. The 256-part fixture qualifies placement and is above budget at p95. [64-part measurements](./crowded-bin-64-apple.json) and [256-part measurements](./crowded-bin-256-apple.json).

```sh
node scripts/physics/benchmark-gripper.mjs http://127.0.0.1:5335/ --crowded
node scripts/physics/benchmark-gripper.mjs http://127.0.0.1:5335/ --scale
```

In the forearm-stop control, both fingertip contacts persisted while the third link contact stopped the carry at approximately (1.55, 0.31) m. The open carry reached (−0.05, 1.58) m. For the earlier ordered drop discrepancy, the raised fingers release approximately 18 cm beyond the lowered pickup radius. Moving the receiving block beneath the release reduced the miss, but the ordered load still rolled off the block. The original free-drop fixture remains an open ordered quality regression. The crowded stack scenario separately uses a controlled approach before opening the fingers.
