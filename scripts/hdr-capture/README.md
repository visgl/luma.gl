# HDR gain-map JPEG capture

This directory turns paired HDR and SDR render readbacks into one backward-compatible JPEG. The
JPEG contains an authored SDR base image plus a gain map with both ISO 21496-1 and Ultra HDR XMP
metadata. Gain-map-aware software reconstructs the HDR rendition; other JPEG readers show the SDR
base.

The encoder is intentionally separate from Playwright's normal screenshot path. Browser screenshots
are display-referred SDR and cannot preserve values above `1.0` from an `rgba16float` render target.

## Inputs

The preferred path accepts two raw files from the same rendered frame:

- HDR: tightly packed, little-endian RGBA binary16 (`rgba16float`), linear transfer, Display P3
  primaries by default. Each row must contain exactly `width * 8` bytes.
- SDR: tightly packed RGBA8888 (`rgba8`), sRGB transfer, Display P3 primaries by default. Each row
  must contain exactly `width * 4` bytes.

Both files must have identical dimensions, orientation, framing, and animation state. Remove WebGPU
copy-buffer row padding before writing them. The wrapper checks exact byte lengths and rejects padded
or truncated files.

The HDR scale follows libultrahdr's linear convention: `1.0` is the 203-nit SDR reference white. For
the default 1000-nit target, the intended peak is therefore approximately `1000 / 203 = 4.926`.
Values are not rescaled by this wrapper.

An authored SDR JPEG can replace the raw SDR input. Its dimensions are checked and its compressed
bytes become the base image without recompression. Its ICC profile and `--sdr-gamut` must describe
the actual pixels.

## Build the pinned encoder

The wrapper targets [google/libultrahdr v1.5.1](https://github.com/google/libultrahdr/releases/tag/v1.5.1)
at commit `a8166d65171aef43cb4bc211538ee6619a9af680`.

Requirements are Git, CMake 3.15 or newer, and a C++17 compiler. The build downloads the pinned
libjpeg-turbo dependency through libultrahdr's CMake configuration:

```sh
bash scripts/hdr-capture/build-libultrahdr.sh
```

The default build lives in `.cache/hdr-capture/`, which is ignored by Git. Set
`HDR_CAPTURE_CACHE_DIR` to place it elsewhere. The build enables both metadata forms:

```text
-DUHDR_WRITE_ISO=ON -DUHDR_WRITE_XMP=ON
```

This matters because upstream CMake enables ISO metadata by default but not XMP. Android's
[compatibility guidance](https://developer.android.com/media/platform/hdr-image-format#iso-21496-1-compatibility)
recommends writing both. The wrapper verifies that both namespaces are present in every output.

To use another compatible build, pass `--ultrahdr-app /path/to/ultrahdr_app` or set
`ULTRAHDR_APP`. The explicit option wins over the environment. Without either, the wrapper looks for
the pinned build created by the script above.

## Capture the full website HDR catalog

After building `ultrahdr_app`, regenerate every public HDR example image with one command:

```sh
node scripts/hdr-capture/capture-all-hdr-examples.mjs
```

The catalog is intentionally explicit and contains these 11 routes:

- `showcase/gltf`
- `showcase/instancing`
- `showcase/lightstorm-megacity`
- `showcase/tempest-ocean`
- `showcase/globe`
- `showcase/packet-spraying`
- `experimental/deferred-rendering`
- `experimental/fluid-foundry`
- `experimental/spectral-caustics`
- `experimental/volumetric-fire-forge`
- `experimental/bloom`

The batch selects `webgpu-core` (and `webgpu-max` for Deferred Rendering's filterable float
history target), captures each route sequentially into its own artifact directory,
and rejects any capture that is not exactly `1280x720`. Capture mode selects CSS/DPR-compatible
drawing-buffer sizing and a `1580x780` website viewport to account for the canvas layout, navbar,
and 300-pixel Docusaurus examples sidebar. The full-width Instancing route uses `1310x780` instead.
It waits three seconds after backend selection for asynchronous scene assets and simulation state;
glTF receives ten seconds because its default model is loaded remotely.
The batch skips Playwright's separate page PNG because the same-frame SDR plane and final gain-map
JPEG are the visual review artifacts, and a page screenshot can stall active GPU simulations.
Every version-2
manifest supplies the captured frame's `targetPeakNits`; the catalog deliberately does not duplicate
those values. Tempest supplies its authored 1117-nit peak through its specialized paired capture,
while the generic canvas path derives the peak from the finite FP16 pixels it reads.

The batch launches a visible browser by default so the platform can expose its real HDR canvas
configuration. It stops if any route falls back to an SDR canvas. `--headless` is available for
environments that continue to expose an extended-range `rgba16float` canvas without a visible
window; it does not weaken that validation.

Browser console errors, page errors, and failed requests abort the batch so an invalid render cannot
be published as a valid image. Encoded JPEGs stay under a unique
`.playwright-artifacts/hdr-gainmap-batches/run-*` staging
directory until all 11 encodes pass dimension, ISO metadata, XMP metadata, and Ultra HDR probe
validation. Only then does the batch replace the website catalog images. Existing images are backed
up in the retained run directory and restored if publication fails partway through.

The website runner starts a development server when needed. For a faster batch, start the website
once in another terminal and point the batch at it:

```sh
(cd website && yarn start --host 127.0.0.1 --port 3000)
node scripts/hdr-capture/capture-all-hdr-examples.mjs \
  --base-url http://127.0.0.1:3000
```

Use `--artifact-base <directory>` to choose where retained run directories are created, and
`--ultrahdr-app <path>` to select a compatible encoder build. Run the orchestration tests without a
browser or encoder using:

```sh
node --test scripts/hdr-capture/capture-all-hdr-examples.test.mjs
```

## Encode paired raw readbacks

The Playwright helper writes a version 2 manifest beside the raw planes. This is the preferred
interface because the wrapper validates the example ID, target peak, capture schema, formats, color
metadata, tight row layout, and byte lengths:

```sh
node scripts/hdr-capture/encode-gainmap-jpeg.mjs \
  --manifest .playwright-artifacts/website-playwright-hdr.json \
  --output website/static/images/examples/showcase/tempest-ocean.jpg
```

The version 2 manifest records the example's authored target peak; Tempest declares
`5.5 * 203 = 1116.5` nits, rounded to 1117. Legacy version 1 manifests remain supported with the
1000-nit default. An explicit `--target-peak-nits` overrides either manifest version.

The lower-level raw interface is also available when there is no manifest:

```sh
node scripts/hdr-capture/encode-gainmap-jpeg.mjs \
  --hdr .playwright-artifacts/website-playwright-hdr.rgba16float \
  --sdr-raw .playwright-artifacts/website-playwright-sdr.rgba8 \
  --width 1280 \
  --height 720 \
  --target-peak-nits 1117 \
  --output website/static/images/examples/showcase/tempest-ocean.jpg
```

This invokes libultrahdr's raw HDR + raw SDR scenario. The wrapper defaults are:

- HDR: linear RGBA16F, Display P3;
- SDR: sRGB-transfer RGBA8888, Display P3;
- explicit target peak when supplied, otherwise the version 2 manifest value, otherwise 1000 nits;
- four-times gain-map dimension downsampling (one-sixteenth the base pixel count);
- RGB gain map, quality 95;
- base JPEG quality 95;
- best-quality encoder preset.

Use `--hdr-gamut bt709` or `--sdr-gamut bt709` only when the corresponding pixels really use those
primaries. Supported values are `bt709`, `display-p3`, and `bt2100`.

## Encode with an authored SDR JPEG

```sh
node scripts/hdr-capture/encode-gainmap-jpeg.mjs \
  --hdr frame.rgba16float \
  --sdr-jpeg frame-sdr.jpg \
  --width 1280 \
  --height 720 \
  --output frame-ultrahdr.jpg
```

The JPEG path preserves the supplied SDR file as the fallback. `--base-quality` only affects the raw
SDR path.

Run with `--help` for all quality, gamut, preset, overwrite, and dry-run options. Existing outputs are
not replaced unless `--overwrite` is present.

## Validation

Before encoding, the wrapper validates:

- required and mutually exclusive options;
- numeric ranges accepted by libultrahdr;
- input files and executable permissions;
- exact raw byte lengths and JPEG dimensions;
- a `.jpg` or `.jpeg` output that does not alias an input.

After encoding, it validates the primary JPEG dimensions, checks for both the ISO 21496-1 and Ultra
HDR XMP namespaces, and runs `ultrahdr_app` in probe mode. A binary built without both metadata flags
fails with a setup command instead of publishing a partial result.

For a command preview that still validates all inputs:

```sh
node scripts/hdr-capture/encode-gainmap-jpeg.mjs [options] --dry-run
```

To inspect an output manually:

```sh
"${ULTRAHDR_APP}" -m 1 -j frame-ultrahdr.jpg -P
```

## Tests

The tests use only Node built-ins and a fake encoder, so libultrahdr is not required:

```sh
node --test scripts/hdr-capture/encode-gainmap-jpeg.test.mjs
```

In CI, cache `.cache/hdr-capture/libultrahdr-v1.5.1` by operating system and architecture. The pinned
source build is supported upstream on Linux, macOS, and Windows.
