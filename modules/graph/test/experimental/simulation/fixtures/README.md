# GFS Atlantic trajectory qualification

`gfs-atlantic.json` contains a 31 × 31 regular sample-center grid covering
85°W–55°W, 20°N–50°N, with rows ordered south to north. Eastward and northward
velocities are metres per second. All samples in this crop are valid.

The two snapshots are NOAA GFS **model** 10 m winds at 2016-11-20 00:00 and 06:00
UTC, archived by [Mapbox webgl-wind](https://github.com/mapbox/webgl-wind/tree/b1f6468d90d2f39763a8795a5042f316a32ff3c8).
They are not observations. The archive encodes components in 8-bit PNG channels;
this fixture preserves that quantization and does not qualify trajectories against
unquantized GFS or actual weather. Retain [Mapbox's ISC notice](MAPBOX-LICENSE.txt)
when redistributing this derived fixture.

## Provenance and preprocessing

The pinned revision is `b1f6468d90d2f39763a8795a5042f316a32ff3c8`.
The upstream `data/download.sh` selects 10 m UGRD/VGRD from NOAA NOMADS.
Its `data/prepare.js` shifts longitude by 180°, omits the final southern row,
and floors each component into an 8-bit channel. For the archived 360 × 180
images, column `longitude + 180` and row `90 - latitude` select each sample.
The generator crops these samples, reverses latitude row order, decodes R/G using
the snapshot's component ranges, rounds decimal serialization to six places and
uses Float32 values for both GPU input and reference sampling. Source PNG/JSON
SHA-256 hashes are retained in the fixture and checked before regeneration.

## Independent reference

The generator implements double-precision bilinear spatial sampling, linear
interpolation across the six-hour pair, geographic unit conversion using a
6,371,008.8 m sphere, and classical fixed-step RK4. It does not import or execute
the GPU Fehlberg implementation. Initial positions match float32-normalized GPU
seeds. Hourly positions at a 15-second timestep are stored; comparison with
30-second integration differs by at most 0.0013 m across these releases.

The GPU test checks all four releases at seven hourly horizons, with a 1 m local
RK45 tolerance, 300-second maximum step and bounded two-attempt dispatches.
Every retained point must be within 5 m of the independent reference. The bound
covers this quantized fixture and configuration; it is not a global error guarantee
or a claim of parity with Parcels. Runtime/hardware sweeps and observational-data
qualification remain follow-ups.

## Reproduce

Download these four files from the pinned repository's `demo/wind/` directory:
`2016112000.png`, `2016112000.json`, `2016112006.png`, `2016112006.json`.
Then, from the repository root:

```bash
node scripts/advection/generate-gfs-fixture.mjs /path/to/downloaded/files
yarn test-headless --no-coverage modules/graph/test/experimental/simulation/scientific-flow-real-data.spec.ts
```

The generator uses the development-only `pngjs` dependency. Normal tests use only
the checked-in fixture and require no network, Python environment or data service.
