# Space Salvage

A small top-down zero-gravity game built on public `GPURigidBodyWorld` APIs.

```sh
yarn workspace luma.gl-examples-experimental-space-salvage start
```

Recover five amber cargo pods into the green docking field. WASD/arrows apply thrust;
Space brakes. Aim with the mouse and hold the primary button to pull the nearest
object within 12 world units. Release the beam to let cargo drift. Rocks and walls
occlude the ray. Touch controls provide thrust/braking; touch the scene to aim/tow.
`R` or New mission resets the game. High-impulse ship contacts damage the hull.

The tractor applies bounded impulses and a small recoil; it is not a joint or rigid
tether. Docking uses a sphere-overlap query every 100 ms of wall time, so it is a
sampled collection field, not a swept trigger. Collected bodies are parked outside
the arena and contact caches invalidated. Ray/overlap queries are exact for the
sphere and oriented-box colliders used here. Gameplay has no private manifold access
or CPU collision implementation.

Physics advances on the GPU at 120 Hz with at most four catch-up steps and one pending
frame. Body poses feed rendering directly; asynchronous snapshots drive gameplay and
UI. Contact events drive hull damage. Diagnostic failures/event loss stop the game
rather than accepting incomplete simulation. There is no general CCD; use moderate
speeds. The collapsed standard InfoBox includes GPU Graph and GPU Graph Timeline tabs.

## Browser smoke check

With the server running, `SPACE_SALVAGE_URL=http://127.0.0.1:5200/ node scripts/playwright/space-salvage-smoke.mjs`
flies the ship through keyboard controls, tows a real cargo pod into the dock, and
checks reset/pause and startup errors. Set `SPACE_SALVAGE_SCREENSHOT` to retain an
image of the recovered cargo state.
