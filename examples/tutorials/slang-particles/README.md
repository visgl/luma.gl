# Slang particle vortex

One `particles.slang` source contains compute, vertex and fragment entry points. Each frame simulates
32,768 particles in 64-thread workgroups, shares tile positions, counts moving particles with an
integer atomic, and renders the next buffer directly. Phones use 8,192 particles.
There is no CPU readback in the animation. Move the pointer to attract the cloud;
adjust swirl/cohesion, pause or reset.

The application owns compiler registration, uses reflection for pipeline layouts and bindings,
and packs its scene buffer with the reflected layout. WebGPU is required. Run from the repository
root with `yarn website-debug --example slang-particles`, or run Vite in this directory.
The GPU test compares several simulation steps against `simulation.ts` and checks rendered pixels.
