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

## Encode paired raw readbacks

The Playwright helper writes a manifest beside the raw planes. This is the preferred interface because
the wrapper validates the capture schema, formats, color metadata, tight row layout, and byte lengths:

```sh
node scripts/hdr-capture/encode-gainmap-jpeg.mjs \
  --manifest .playwright-artifacts/website-playwright-hdr.json \
  --target-peak-nits 1117 \
  --output website/static/images/examples/showcase/tempest-ocean.jpg
```

Tempest's authored peak is `5.5 * 203 = 1116.5` nits, rounded to 1117 for the integer command-line
setting. Set `--target-peak-nits` from each example's authored linear peak rather than copying this
value to unrelated captures.

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

This invokes libultrahdr's raw HDR + raw SDR scenario. Except for Tempest's explicit peak, the
wrapper defaults are:

- HDR: linear RGBA16F, Display P3;
- SDR: sRGB-transfer RGBA8888, Display P3;
- 1117-nit target peak for Tempest (1000 nits when the option is omitted);
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
