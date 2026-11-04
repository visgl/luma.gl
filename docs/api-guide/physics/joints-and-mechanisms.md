# Joints and mechanisms

A physical joint restricts the relative motion of two body attachments. It is distinct from a skeletal joint used by a skin. The engine can represent attachments shared by programmatic scenes and glTF imports; the physics adapter converts them to solver rows.

| Constraint | Intended motion                                                          |
| ---------- | ------------------------------------------------------------------------ |
| Distance   | Keep attachment points a fixed distance apart, optionally with a spring  |
| Fixed      | Lock relative position and orientation                                   |
| Hinge      | Rotate about one attachment-frame axis, with optional limits and motor   |
| Slider     | Translate along one attachment-frame axis, with optional stops and drive |
| General    | Compose supported linear/angular attachment limits and drives            |

## A suspended ball[​](#a-suspended-ball "Direct link to A suspended ball")

```
const joints = [{type: 'distance' as const, first: 0, second: 1, distance: 10}];
```

Here `first` and `second` index the world's body array. Body zero could be a static anchor and body one a dynamic sphere. Place their initial attachment points ten world units apart. Optional attachment frames are body-local, not center-of-mass-local.

The [Wrecking Ball example](https://luma.gl/examples/experimental/wrecking-ball) uses a real distance constraint. Gravity drives the swing and contact impulses change the ball's motion; its path is not a prescribed animation.

## Solver choice[​](#solver-choice "Direct link to Solver choice")

The ordered reference solver supports the broader bounded joint envelope. Parallel contacts support static-anchored distance joints: a small GPU joint sweep alternates with contact iterations. Dynamic-to-dynamic joints, moving anchors and the other joint families still require ordered solving.

The parallel distance path is useful when one pendulum interacts with a large block pile. It avoids sending every block contact through the serial reference solve. The current joint count is bounded to 64; this is not a general articulation solver.

## Limits, motors and compliance[​](#limits-motors-and-compliance "Direct link to Limits, motors and compliance")

Attachment frames determine axes. Hinge angular limits use wrapped radians; sliders use linear distance. Velocity motors and position drives have force/torque caps. Springs and dampers provide compliance and energy loss instead of assuming perfectly rigid, lossless motion. Check the [joint reference](https://luma.gl/docs/api-reference/graph/gpu-rigid-body-world.md#ordered-joints-and-mechanisms) for exact frame conventions and supported controls.

More iterations can reduce coupled constraint error, while smaller fixed steps resolve motion more frequently. They change different aspects of the approximation. Measure joint length/angle drift, contact penetration and energy behavior at the chosen settings.

For scene-authored attachments, see [Scenegraph joints](https://luma.gl/docs/api-guide/engine/scenegraph-joints.md) and [Scenes and glTF](https://luma.gl/docs/api-guide/physics/scenes-and-gltf.md).
