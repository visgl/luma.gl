// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const BLOOM_BACKGROUND_HTML = `
<p><b>Multiscale HDR bloom:</b> exposure-aware highlight extraction feeds an adaptive two-to-five-level pyramid. Supported WebGPU devices fuse every downsampling level into one compute dispatch, and expired extraction textures are reused during reconstruction.</p>
<p><b>FFT convolution:</b> packed RGB transforms share one dispatch sequence and apply independent wavelength-aware aperture kernels. Zero-padded guard bands prevent opposite-edge wraparound, while area-weighted extraction retains tiny HDR emitters.</p>
<p><b>Lens optics:</b> adjustable chromatic ghosts, a radial halo, sampled dirt, and optional temporal history are available in both multiscale and FFT modes. FFT optics reuse the existing composite dispatch.</p>
<p><b>Stability and cost:</b> dual-Kawase reconstruction removes separable blur passes, while Gaussian remains available for wider artistic shaping. Physical mode scatters all light without additively duplicating scene energy.</p>
<p><b>Compact bloom:</b> the legacy single-pass glow samples one small neighborhood directly from the source image. It is cheaper, but it cannot spread highlights as naturally as the multiscale pyramid.</p>
<p><b>Scene setup:</b> this page renders animated HDR emitters into an offscreen texture before bloom. The previous static image hid the useful part of the effect by baking most of the lighting into SDR pixels.</p>
`;
