# GPU Pool

A free-practice pool table built on `@luma.gl/gpgpu/gpu-physics`. Sixteen balls,
cloth and six finite cushions are simulated on WebGPU. Rendering consumes the
position and orientation buffers directly; stripes rotate with the balls.

```sh
yarn install
yarn workspace luma.gl-examples-experimental-gpu-pool start
```

Move the mouse to aim, drag the vertical power control at the right of the table,
then click the table (or **Shoot**). On touch, drag to aim and release to shoot. With the
table focused, use Left/Right for fine aim and Space to shoot. The aim slider is
also keyboard accessible. **New rack** works during a shot. Pot balls in any
order. A scratch restores the cue ball to a clear position after the shot rests.

The example owns the rack, cue animation, pocket triggers, score and shot state.
The module owns impulses, finite static surfaces, collision response and sleeping.
`readState()` samples all 16 bodies at most 30 times per second for interaction;
physics does not wait for that readback. Body commands submit independently and
are applied once, including when several simulation steps share an encoder.

The cue has a tapered wooden shaft, patterned wrap, inlays, ferrule and chalked tip.
Synthesized cue, ball, cushion and pocket sounds start after a user gesture and can
be muted with **Sound off**. No audio assets are downloaded. Contact sounds are
inferred from sampled changes in ball velocities and are cosmetic.

Select a point on the cue-ball diagram for top, back or side spin; **Center**
restores a central strike. Contact points are limited to 80% of the radius.
**Cut Induced Throw** and **Spin Induced Throw** independently include linear and
angular contact-slip contributions to sphere friction. Both start enabled; a
highlighted button means enabled. This is an experimental teaching control, not
a calibrated billiards model.

## Prototype limits

- WebGPU required; no textures, models or other network assets.
- Fixed 1/240-second steps, 12 solver iterations, maximum shot speed 12 table units/s.
- A frame processes at most 12 steps. Under load, simulation slows rather than
  increasing the timestep. Hidden-tab time is not replayed on return.
- Discrete collisions; continuous collision detection is a later tranche; spin/throw behavior uses an experimental Coulomb approximation. No claim of tournament-grade billiards accuracy.
- Pocket checks use sampled center-in-sphere triggers. These are suitable for the
  bounded speeds here, not a general continuous trigger system.
- Free practice, not eight-ball rules: no players, turns or fouls beyond scratches.

## Verification

GPU tests cover impulses, mass/inertia, sleeping/waking, disabling/restoring,
finite cushions, corner rebounds, and contact-skin regression. Node tests cover
the rack, pocket filtering, scratch placement and shot completion.
