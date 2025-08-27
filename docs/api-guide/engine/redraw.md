# Redraw detection

luma.gl components track when they need to be redrawn. A number of classes expose a common pair of methods:

- `setNeedsRedraw(reason: string)` &mdash; mark the object as needing a redraw. The optional `reason` string is stored for debugging.
- `needsRedraw(): false | string` &mdash; returns `false` if no redraw is pending, or the `reason` string. Calling this method clears the flag.

## Redraw flag semantics

A number of luma.gl engine classes store a redraw flag. This flag is either `false` meaning that the component is not aware of any reason it needs to be redrawn, or a string, which is a short human readable reason why the component needs to be redrawn.

When the framework (or the application) modifies a component in some way that means that redrawing it would change the rendering, it calls `.setNeedsRedraw('<reason>')`

The intended usage is that when the application's `onRedraw()` callback is called, the application can call `.needsRedraw()` on all its components to determine if anything needs to be updated. If all components return `false`, rendering can be skipped for that frame.

Notes

- Reading a components redraw flag with `.needsRedraw()` automatically clears the redraw flag (sets it to `false`).
- If `.setNeedsRedraw(reason)` is called multiple times before a clear, only the first reason is stored.
- Typically, if any component does need to be redrawn, all components need to be redrawn.

## Usage

```ts
import {AnimationLoop, Model} from '@luma.gl/engine';

const model = new Model({device /* ... */});

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

| Class                                                      | `setNeedsRedraw()` | `needsRedraw()` |
| ---------------------------------------------------------- | ------------------ | --------------- |
| [AnimationLoop](/docs/api-reference/engine/animation-loop) | ✅                 | ✅              |
| [Model](/docs/api-reference/engine/model)                  | ✅                 | ✅              |

Additional classes may also use this pattern for internal state tracking.
