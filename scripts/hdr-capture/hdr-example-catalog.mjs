/** Width of every published HDR example image. */
export const HDR_EXAMPLE_CAPTURE_WIDTH = 1280;

/** Height of every published HDR example image. */
export const HDR_EXAMPLE_CAPTURE_HEIGHT = 720;

/**
 * Most routes render beside the 300-pixel Docusaurus sidebar, with 30 pixels of content padding.
 * Capture mode uses CSS/DPR-compatible drawing-buffer sizing, so this produces 1280 pixels.
 */
export const HDR_EXAMPLE_VIEWPORT_WIDTH = 1580;
/** Viewport width for the full-width route that has no Docusaurus examples sidebar. */
export const HDR_EXAMPLE_FULL_WIDTH_VIEWPORT_WIDTH = 1310;
export const HDR_EXAMPLE_VIEWPORT_HEIGHT = 780;
/** Default time for asynchronous textures and simulation state to reach a representative frame. */
export const HDR_EXAMPLE_CAPTURE_DELAY_MILLISECONDS = 3000;

/**
 * Public website examples whose catalog images are authored as HDR gain-map JPEGs.
 *
 * Peak luminance intentionally does not live here. Each example writes its authored
 * `targetPeakNits` into the version-2 capture manifest, which is the encoder's source of truth.
 */
export const HDR_EXAMPLE_CATALOG = Object.freeze(
  [
    {
      id: 'showcase-gltf',
      route: 'showcase/gltf',
      outputPath: 'website/static/images/examples/showcase/gltf.jpg',
      captureDelayMilliseconds: 10_000
    },
    {
      id: 'showcase-instancing',
      route: 'showcase/instancing',
      outputPath: 'website/static/images/examples/showcase/instancing.jpg',
      viewportWidth: HDR_EXAMPLE_FULL_WIDTH_VIEWPORT_WIDTH
    },
    {
      id: 'showcase-lightstorm-megacity',
      route: 'showcase/lightstorm-megacity',
      outputPath: 'website/static/images/examples/showcase/lightstorm-megacity.jpg'
    },
    {
      id: 'showcase-tempest-ocean',
      route: 'showcase/tempest-ocean',
      outputPath: 'website/static/images/examples/showcase/tempest-ocean.jpg'
    },
    {
      id: 'showcase-globe',
      route: 'showcase/globe',
      outputPath: 'website/static/images/examples/showcase/globe.jpg'
    },
    {
      id: 'showcase-packet-spraying',
      route: 'showcase/packet-spraying',
      outputPath: 'website/static/images/examples/showcase/packet-spraying.jpg'
    },
    {
      id: 'experimental-deferred-rendering',
      route: 'experimental/deferred-rendering',
      outputPath: 'website/static/images/examples/experimental/deferred-rendering.jpg',
      backend: 'webgpu-max'
    },
    {
      id: 'experimental-fluid-foundry',
      route: 'experimental/fluid-foundry',
      outputPath: 'website/static/images/examples/experimental/fluid-foundry.jpg'
    },
    {
      id: 'experimental-spectral-caustics',
      route: 'experimental/spectral-caustics',
      outputPath: 'website/static/images/examples/experimental/spectral-caustics.jpg'
    },
    {
      id: 'experimental-volumetric-fire-forge',
      route: 'experimental/volumetric-fire-forge',
      outputPath: 'website/static/images/examples/experimental/volumetric-fire-forge.jpg'
    },
    {
      id: 'experimental-bloom',
      route: 'experimental/bloom',
      outputPath: 'website/static/images/examples/experimental/bloom.jpg'
    }
  ].map(example => Object.freeze(example))
);
