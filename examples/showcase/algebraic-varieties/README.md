# Algebraic varieties

This WebGPU-only showcase renders real implicit polynomial surfaces directly in a fullscreen
fragment shader. It does not build a CPU mesh and does not assume that the polynomial value is a
signed distance.

The frame is declared as a reusable `GPUCommandGraph` render node. The application updates only its
small camera, variety, coefficient, and lighting uniform block before encoding the compiled graph
into the caller-owned command encoder. The per-pixel work remains a fragment render operation; a
compute-to-storage-texture stage would add bandwidth without helping this single-pass MVP.

Each camera ray is clipped to a conservative bounding sphere and sampled at fixed intervals. Sign
changes are refined with guarded secant steps and bisection. Because even-multiplicity and tangent
roots do not change sign, local minima of `abs(f) / max(length(grad f), epsilon)` also seed clamped
Newton refinement using `grad f · d`. The nearest accepted root is shaded with an analytic
gradient. Pixels whose gradient magnitude is small can be highlighted as candidate singular
regions.

The catalog includes an affine chart of the Clebsch diagonal cubic, Cayley's nodal cubic,
Steiner's Roman quartic, a Kummer quartic, a Chmutov quintic, the Barth sextic, an algebraic heart
sextic, a torus quartic, a tanglecube quartic, and the Whitney umbrella. The bounding sphere clips
unbounded affine charts. The coefficient slider adds a low-order radial term; zero restores the
named surface. Lighting is evaluated in a high dynamic range linear space and compressed for
display with an ACES-like filmic curve.

The showcase advances to the next surface after 15 seconds without input. Orbit, zoom, keyboard,
preset, deformation, exposure, tab, and singularity-control interactions restart the idle
countdown; a variety is never changed while a pointer interaction remains active. Each surface has
an authored starting deformation, and slider changes are remembered independently while browsing
the catalog. The reset button (or `R`) restores the active surface's authored coefficient, default
exposure, camera, and default-on singularity overlay without changing the other saved coefficients.

## Limitations

- Fixed sampling is predictable but can miss roots closer together than a sampling interval.
- Near-tangent roots and singular points are numerically ill-conditioned; the local-minimum path is
  a practical heuristic rather than certified root isolation.
- `f / length(grad f)` is used only as a local residual, never as a sphere-tracing distance.
- The singular overlay shows small gradients near the rendered real locus, not a symbolic solution
  of `f = grad f = 0`.

Run with `yarn workspace luma.gl-example-algebraic-varieties start` in a WebGPU browser.
