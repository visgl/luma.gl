# GPU Sphere World

Run `yarn start` in this directory. Requires WebGPU.

Drag the canvas with OrbitControls to orbit the camera and tilt gravity relative to the platform. The initial view is calibrated to a level platform. Drag sensitivity defaults to 0.25. Releasing within 3 degrees snaps back to level; the checkbox disables snapping. Double-clicking the canvas or pressing Level restores the initial view, and Reset restores the spheres. Simulation speed defaults to 1.5×.

This bounded 64-body prototype uses GPU integration and three ping-pong contact passes per fixed 1/120 second step. Each contact pass reads a consistent snapshot and writes separate buffers. Equal-mass sphere contacts and a finite platform let spheres collide and fall off. Coulomb floor friction slows grounded spheres, stops low-speed rolling, and holds slopes below approximately 11 degrees at rest; airborne spheres retain their lateral velocity. It deliberately uses an all-pairs solver for this small demonstration, rather than a scalable broad phase or full rigid-body dynamics.

Startup checks read back deterministic GPU cases for sphere separation and rebound, platform contact, falling past the platform edge, and grounded friction versus airborne motion. Rendering and normal simulation otherwise keep body state on the GPU.
