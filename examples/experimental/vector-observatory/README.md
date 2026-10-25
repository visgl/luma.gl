# Vector Observatory

An interactive WebGPU scientific-vector-field advection example. Start from the
repository root with `yarn workspace luma.gl-examples-vector-observatory start`.
Requires a WebGPU browser. All particle integration, streak rendering and HDR
trail persistence run on the GPU; the frame loop reads no particle positions.

Select ocean gyres, a counter-rotating vortex pair, or a meandering jet. These are
analytic benchmarks sampled onto a 256 × 256 collocated grid, not observed data.
The scientific adapter accepts the same structural normalized input used by
loaders.gl. Integration uses fixed bounded simulation steps with RK4 by default.
Time scale controls simulation seconds per frame; it is deliberately independent
of wall time so slow devices do not take unstable steps. FPS is frame-loop timing.

Controls support 65,536 through 1,048,576 particles, RK2/RK4, pause/resume, reseed,
speed and exposure. History is cleared when the field, integrator, density or
viewport changes. Pause preserves the accumulated image. Resource cleanup runs
when the page is left.
