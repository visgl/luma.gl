---
title: Redraw on demand
description: Treat Engine redraw flags as invalidation signals so static views stop rendering while updates and animation remain responsive.
---

import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# Redraw on demand

<EngineDocsTabs group="guides" active="redraw-guide" />

## Outcome

An Engine object can tell you that its next image would differ from its previous image. It
cannot decide when the application should render. The application combines those invalidation
signals with interaction, animation, streaming, and asynchronous work to schedule a frame.

The practical rule is: **render while something is changing; otherwise stop submitting GPU
work**.

## Mental model

Classes such as `Model` and `AnimationLoop` expose the same small protocol:

- `setNeedsRedraw(reason)` records the first reason that invalidated the current image.
- `needsRedraw()` returns `false` or the stored reason **and clears the flag**.

This is a consumable signal, not a persistent state query and not a frame scheduler. Read each
signal once at the point where the application decides whether to draw.

```text
state change ─→ setNeedsRedraw(reason) ─→ schedule/check frame
                                                ↓
                                      needsRedraw() clears flag
                                                ↓
                                     render once or remain idle
```

If several changes happen before the flag is consumed, the first reason is retained for
debugging. The flag answers “does this object know why the image may be stale?”; it is not an
exhaustive log of every change.

## Complete workflow

1. Construct durable models and other Engine objects.
2. When application state changes, update the relevant object. Engine setters mark their
   object for redraw; application-owned state should request a frame explicitly.
3. At the frame boundary, consume each redraw signal once.
4. Render if any signal is truthy, animation is active, or asynchronous output arrived.
5. Stop requesting frames when none of those conditions remains true.

```ts
import {AnimationLoop, Model} from '@luma.gl/engine';

const model = new Model(device, modelProps);
let applicationReason: string | false = 'initial frame';

const loop = new AnimationLoop({
  device,
  onRender() {
    const reason = applicationReason || model.needsRedraw();
    applicationReason = false;

    if (!reason) {
      return;
    }

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    model.draw(renderPass);
    renderPass.end();
  }
});

loop.start();
```

In a request-driven application, use the same decision to call `requestAnimationFrame()` only
when work becomes pending. An `AnimationLoop` is useful when continuous callbacks are already
required; it does not obligate every callback to submit a draw.

## What should invalidate the image?

| Change | Typical action |
| --- | --- |
| Geometry, bindings, shader inputs, or draw parameters changed | Let the affected `Model` mark itself. |
| Camera or controller state changed | Mark application view state and request one frame. |
| Animation is playing | Keep frames scheduled until playback stops. |
| A texture, worker result, or GPU readback arrived | Publish the result, mark the dependent view, and request one frame. |
| Telemetry alone needs sampling | Schedule only the sampling cadence, not an unrestricted render loop. |
| Nothing visible changed | Submit no render work. |

## Decisions and tradeoffs

- A single application-level dirty flag is often enough for a small renderer. Per-object reasons
  become useful when diagnosing why a larger application keeps drawing.
- Continuous animation should not repeatedly set and clear many object flags. Treat “animation
  active” as a separate frame condition.
- Coalesce synchronous updates into one requested frame. Rendering after every setter wastes
  CPU and GPU work and can expose intermediate state.

## Common mistakes

- Calling `needsRedraw()` in logging code and then expecting the renderer to read it again.
- Treating `false` as proof that no external state changed; it only reports what that object
  knows.
- Running an unconditional render loop for a static view.
- Updating state during a draw without scheduling the following frame.
- Assuming every object must be drawn separately when one invalidation occurs; most scenes still
  redraw as one coherent image.

## Related pages

- [Engine programming](/docs/api-guide/engine)
- [`AnimationLoop`](/docs/api-reference/engine/animation-loop)
- [`Model`](/docs/api-reference/engine/model)
- [Animation workflow](/docs/api-guide/engine/animation)
- [Interactivity](/docs/api-guide/engine/interactivity)
