# Redraw detection

luma.gl components track when they need to be redrawn. A number of classes expose a common pair of methods:

- `setNeedsRedraw(reason: string)` &mdash; mark the object as needing a redraw. The optional `reason` string is stored for debugging.
- `needsRedraw(): false | string` &mdash; returns `false` if no redraw is pending, or the `reason` string. Calling this method clears the flag.

```ts
import {AnimationLoop, Model} from '@luma.gl/engine';

const model = new Model({device, /* ... */});

const loop = new AnimationLoop({
  device,
  onRender({animationLoop}) {
    const reason = animationLoop.needsRedraw() || model.needsRedraw();
    if (reason) {
      model.draw();
    }
  }
});

model.setNeedsRedraw('initial draw');
loop.start();
```

## Classes supporting `needsRedraw`

| Class | `setNeedsRedraw()` | `needsRedraw()` |
| ---- | ------------------- | ---------------- |
| [AnimationLoop](../api-reference/engine/animation-loop.md) | ✅ | ✅ |
| [Model](../api-reference/engine/model.md) | ✅ | ✅ |

Additional classes may also use this pattern for internal state tracking.

