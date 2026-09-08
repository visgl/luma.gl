// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const ANTIALIASING_BACKGROUND_HTML = `
<p><b>Aliasing is under-sampling:</b> one pixel sample cannot represent thin geometry, diagonal edges, alpha cutouts, or minified texture detail that changes faster than the pixel grid.</p>
<p><b>FXAA:</b> a fullscreen shader detects high-contrast edges in the finished image and smooths along them. It is cheap and works after any render path, but it cannot recover hidden subpixel geometry or texture detail.</p>
<p><b>Supersampling:</b> render the scene into a 2× or 4× larger offscreen target, then filter down once. It improves geometry, shading, and texture aliasing together, but pixel cost grows with area: 2× per axis means roughly 4× fragments; 4× means roughly 16×.</p>
<p><b>Texture sampling:</b> mipmaps choose prefiltered resolution for minification and anisotropy spends extra samples along steep texture footprints. These solve texture-frequency aliasing, complementing edge antialiasing rather than replacing it.</p>
`;

export function makeAntialiasingDescriptionHtml(props: {
  effectiveSupersampleScale: 1 | 2 | 4;
  requestedSupersampleScale: 1 | 2 | 4;
  technique: string;
}): string {
  const supersampleLimitNote =
    props.requestedSupersampleScale > props.effectiveSupersampleScale
      ? `<p>Requested ${props.requestedSupersampleScale}x supersampling is capped to ${props.effectiveSupersampleScale}x by the device texture-size limit.</p>`
      : '';
  return (
    '<p><b>Before:</b> single-sample baseline. <b>After:</b> ' +
    props.technique +
    '. Use Zoom, then move or drag the divider to compare them.</p><p>The scene combines thin geometry, minified texture detail, alpha cutouts, and depth discontinuities. ' +
    'Canvas antialiasing and explicit MSAA are documented separately: WebGPU <code>Texture.samples</code> still needs the managed resolve workflow proposed in RFC #2741, while WebGL uses context or renderbuffer paths.</p>' +
    supersampleLimitNote
  );
}
