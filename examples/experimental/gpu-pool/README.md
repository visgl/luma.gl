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
restores a central strike. The dashed miscue guide marks the selectable limit at 80% of the radius;
contact points clamp to this ring. Miscue slips are not simulated. Cloth spinning resistance
dissipates residual side spin so shots can settle.
**Cut Induced Throw** and **Spin Induced Throw** independently include linear and
angular contact-slip contributions to sphere friction. Both start enabled; a
highlighted button means enabled. This is an experimental teaching control, not
a calibrated billiards model.

## Prototype limits

- WebGPU required; no textures, models or other network assets.
- Fixed 1/240-second steps, 12 solver iterations, maximum initial shot speed 12 table units/s.
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

## Spin practice

Choose **Follow shot**, **Draw shot**, or **Cushion spin** from **Practice**. Each
sets up a repeatable shot, power and contact point; **Reset shot** restores it.
Adjust the cue contact or power to compare the result. A gold cue-ball trail records
the shot, with a brighter recent section showing its direction. The trail remains
after the shot and clears on the next shot or reset; scratch recovery never draws
a teleport line. Up to 1,200 sampled positions are retained. The footer reports cue-ball
sliding/rolling state, pace in table units per second, and sidespin in radians per
second. **Full rack** restores normal play.

Cloth sliding friction converts retained topspin into follow and backspin into
draw after the object-ball collision. Rolling resistance starts at no-slip and
sidespin decays independently. Cushions apply impulses at a raised contact,
exchanging spin with rebound motion; their restitution falls with impact speed.
These are qualitative practice effects, not measured tournament-table calibration.
The approach distinguishes the cloth motion regimes described in
[pooltool's physics notes](https://ekiefl.github.io/2020/04/24/pooltool-theory/).

GPU regressions compare draw, stun and follow; verify no-slip rolling preserves
independent sidespin; compare left/right cushion spin and soft/hard rebound
fractions; and bound post-impact energy.
