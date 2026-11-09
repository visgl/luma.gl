# Ocean Currents Globe — NASA-style advection showcase

## Motivation

Build a scientifically grounded, high-density ocean-current animation inspired by NASA SVS's *Perpetual Ocean* visualization. This is a follow-up to the GPU advection and Vector Observatory work in #3540, not a replacement for it.

## Scope

- Render ocean currents on a rotatable globe, initially centered on the Gulf Stream and North Atlantic.
- Reuse the GPU-resident advection infrastructure from #3540, after it is merged or rebased.
- Load real, time-varying eastward/northward ocean velocity fields from a redistributable source (evaluate ECCO, HYCOM, Copernicus Marine).
- Convert metres/second to geographic motion with latitude-aware integration; handle polar singularities and longitude wrap.
- Provide missing-data and land masks, time interpolation, deterministic seeding, and numerical tests.
- Support dense pathline history and velocity-aware luminous trails; compare against temporal accumulation.
- Expose date, simulation speed, trail length, density, and globe camera controls.
- Document dataset provenance, licensing, preprocessing, hosting, and reproducibility.

## Acceptance criteria

1. Working browser example under `examples/showcase/ocean-currents/`, registered on the website.
2. Real ocean velocity dataset with documented provenance and permissive redistribution.
3. No per-frame CPU readback of particle state.
4. Automated numerical tests for advection, time interpolation, longitude wrap, and land masking.
5. GPU profiling and graceful capability fallback.
6. Clear distinction between pathlines (time-varying flow) and streamlines (instantaneous flow).

## Implementation notes

- Prefer WebGPU storage buffers and compute passes; consider WebGL2 as a later fallback.
- Use RK2 by default, with RK4 as an accuracy comparison.
- Keep velocity sampling, simulation, trajectory history, globe projection, and rendering separable.
- Avoid copying NASA imagery or implying NASA endorsement; the screenshot is a visual reference only.
- The source data and visual style should be independently reproducible.

## Dependency

#3540 — GPU scientific advection and Vector Observatory.
