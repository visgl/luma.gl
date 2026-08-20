# Vector Field Lab

A WebGPU showcase for visually comparing a sampled field with its differential operators. Four
linked views consume the same GPU-resident buffers and share one world-space probe.

## Numerical method

- Regular `128 × 128` grid over `[-1, 1]²`, so `dx = dy = 2 / 127` by default.
- `f32` scalar buffers and interleaved `vec2<f32>` vector buffers.
- Second-order centered first and second derivatives in the interior.
- Second-order forward/backward stencils on the outer row and column. The reusable primitive also
  supports periodic wrapping, but this showcase keeps one immutable graph and uses one-sided edges.
- Gradient and Laplacian consume scalar samples. Divergence and scalar 2D curl consume vector
  samples. Units therefore follow the input units divided by distance (or distance squared).

The six presets have analytic derivatives used by the interactive probe and by focused reusable-
primitive tests. Animated fields are resampled at 30 Hz; derived buffers never leave the GPU.

## Performance envelope

Each field refresh dispatches four independent `O(N²)` compute nodes, then a fullscreen renderer
bilinearly samples their outputs. The default grid contains 16,384 samples and is intentionally
small enough for integrated GPUs while dense enough for smooth contours. The animated streamline
texture is evaluated in the fragment shader and trades fill rate for a readback-free flow cue.

## Follow-ups

Natural extensions are fourth-order stencils, 3D Jacobian/Hessian tensors, vorticity magnitude,
GPU particle integration, spectral derivatives through `GPUFFT2D`, Helmholtz decomposition,
Poisson solvers, and coupled fluid/PDE visualizations.
