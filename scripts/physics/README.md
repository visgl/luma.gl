# GPU physics qualification

The executable profile in `qualification-profile.json` tracks the pinned, unratified
physics proposals separately from engine quality requirements. Import, GPU behavior,
work budgets, and performance are separate checks. Loading a sample is not evidence
that all its physics features work.

Generate Vitest JSON reports using the repository test projects, for example:

```sh
yarn exec vitest run --project node modules/gltf/test/physics --reporter=json --outputFile=/tmp/physics-import.json
yarn exec vitest run --project headless modules/gpgpu/test/gpu-physics --reporter=json --outputFile=/tmp/physics-gpu.json
node --test scripts/physics/qualification-report.test.mjs
```

GPU tests must explicitly skip when WebGPU is unavailable. A skipped or absent test
is missing evidence, never a behavior pass. A failed run takes precedence over a
passing retry supplied in the same report set.

Start the glTF Physics example's Vite server, then run the isolated broad-phase
benchmark against its local URL:

```sh
node scripts/physics/benchmark-broad-phase.mjs --url http://127.0.0.1:5197/ --count 10000 --samples 20 > /tmp/physics-discovery.json
node scripts/physics/qualification-report.mjs /tmp/physics-import.json /tmp/physics-gpu.json /tmp/physics-discovery.json
```

The benchmark disables the example entry point in its own browser page. It reports
adapter identity, device limits, software fallback, logical allocated buffer bytes,
graph node count, compilation time, CPU encoding, completion/readback latency, and
GPU timestamps when supported. Three warmup steps precede the requested samples.
`--software` requests a software baseline; it cannot satisfy hardware qualification.
Use `--fixture sparse` for separated objects and `--fixture dense` to exercise output
and traversal budgets. Incomplete discovery exits with status 2 and reports its
counters. Pair identity is checked outside the timed region.

These timings cover **broad-phase discovery only**. They do not qualify full rigid-body
simulation, a contact solver, rendering, or continuous collision detection. Keep raw
reports with the device and browser information when comparing measurements.

The combined qualification report exits with status 2 until every required G1–G3
check has evidence. It also reports the remaining G4–G7 features, without allowing
them to be mistaken for implemented support. Update selectors when tests change;
missing selectors deliberately fail qualification instead of silently passing.
