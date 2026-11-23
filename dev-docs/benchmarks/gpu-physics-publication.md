# GPU pose/bounds publication baseline

Measured October 24, 2026 with `scripts/physics/benchmark-publication.mjs`: 10,000
bodies, 30 measured samples after three warmups, 1,760,000 allocated input/output
bytes. Every output origin and horizontal AABB extent was checked against an
independent identity-rotation/offset-COM reference. Readback verification happens
outside the timed path; timestamps and a completion fence are measurement overhead.

| Adapter | CPU encode p95 | GPU publication p95 | Submission completion p95 |
| --- | ---: | ---: | ---: |
| Apple, Metal 3, nonfallback | 0.40 ms | 0.36 ms | 4.20 ms |
| SwiftShader, fallback | 0.30 ms | 9.94 ms | 11.60 ms |

Raw samples and browser versions are in
[gpu-physics-publication-hardware.json](./gpu-physics-publication-hardware.json) and
[gpu-physics-publication-software.json](./gpu-physics-publication-software.json).
The gate requires correct outputs and p95 timestamp work below 16.67 ms. The G6
profile additionally requires a nonfallback adapter. Software is portability evidence,
not a second hardware platform.

This isolates the publication kernel. It excludes collision detection, solving,
rendering, scene traversal, authoring edits and bounds collection. It is neither a
10,000-body full-simulation frame-rate claim nor a cross-vendor qualification.

Reproduce against the local authored-scene stress Vite server:

```sh
node scripts/physics/benchmark-publication.mjs --url http://127.0.0.1:5241/ > publication.json
node scripts/physics/benchmark-publication.mjs --url http://127.0.0.1:5241/ --software-gpu > publication-software.json
```
