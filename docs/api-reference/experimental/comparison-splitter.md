# ComparisonSplitter

`ComparisonSplitter` provides a reusable, accessible divider for comparing two views of the same
canvas. Pointer, touch, and keyboard interactions update a normalized horizontal split without
coupling the control to a renderer, shader, settings panel, or graphics backend.

The divider owns its DOM elements and inline visual styling, so it works in standalone examples,
embedded documentation, and applications without loading a global stylesheet.

## Usage

```ts
import {ComparisonSplitter} from '@luma.gl/experimental';

let comparisonSplit = 0.5;

const splitter = new ComparisonSplitter({
  canvas,
  value: comparisonSplit,
  onChange: value => {
    comparisonSplit = value;
  }
});

function render(): void {
  splitter.updateLayout();
  model.shaderInputs.setProps({comparison: {split: comparisonSplit}});
}

// Hide the divider when displaying a diagnostic view instead of a comparison.
splitter.setVisible(debugView === 'final');

// Release the overlay and all interaction handlers when the view is removed.
splitter.destroy();
```

The application decides how to render the comparison. For example, a fullscreen shader can select
the original texture when `uv.x < comparisonSplit` and the processed texture otherwise. Two
scissored render passes can use the same value as their viewport boundary.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `canvas` | `HTMLCanvasElement` | Canvas whose visible bounds position and size the divider. |
| `value` | `number` | Initial normalized horizontal split. Values are clamped to `[0, 1]`. |
| `onChange` | `(value: number) => void` | Runs immediately for every pointer or keyboard position change. |
| `onCommit` | `(value: number) => void` | Optional callback when a pointer interaction ends or a keyboard movement is applied. |
| `id` | `string` | Optional DOM identifier for application-level styling, automation, or accessibility. |
| `label` | `string` | Accessible separator label. Defaults to `Before and after comparison`. |
| `accentColor` | `string` | CSS color for this instance's divider line, handle border, and glow. Defaults to cyan. |
| `handleColor` | `string` | CSS background color for this instance's drag handle. |
| `container` | `HTMLElement` | Optional positioned host element. Without one, the divider is fixed within the canvas document's body. |

Each instance owns its appearance. Multiple splitters can coexist without shared style elements,
global CSS selectors, or generated identifier collisions:

```ts
const warmSplitter = new ComparisonSplitter({
  canvas,
  value: 0.5,
  accentColor: '#ffdb33',
  handleColor: 'rgb(59 47 8 / 92%)',
  onChange: setComparisonSplit
});
```

An optional `container` must establish an absolute-positioning context, usually with
`position: relative`. The divider compensates for the host's current client position and scroll
offset.

## Methods

### `setValue(value: number): void`

Sets the normalized divider position without calling `onChange` or `onCommit`. Use this when an
external preset changes the comparison boundary.

### `setVisible(visible: boolean): void`

Shows or hides the divider without resetting its position. The divider also hides automatically
while its canvas has zero visible width or height.

### `updateLayout(): void`

Recomputes placement from the canvas and optional host. Call it before rendering, or after canvas
resize, scrolling, or other layout changes.

### `destroy(): void`

Releases active pointer capture, removes all registered event handlers, and removes the owned DOM
subtree. Calling `destroy()` more than once is safe.

## Accessibility and interaction

The divider is a focusable vertical `separator` with an accessible label, normalized minimum and
maximum values, and a percentage-based value description.

- Dragging with a mouse, stylus, or touch contact updates the split continuously.
- Pointer capture keeps the interaction active when the pointer leaves the divider.
- Left/down and right/up arrow keys move by one percent.
- Holding `Shift` with an arrow key moves by five percent.
- `Home` moves to zero and `End` moves to one.
- Pointer cancellation preserves the last valid position and finishes the interaction cleanly.
