# New event handling system

## Added features

 - Clearer separation in design

 - Touch gestures (drag and pinch) with easy to consume API

 - Mouse middle click support

 - Improved access to modifiers on mouse/touch events

 - Fixed positioning bug on document scroll

 - Test pages for quickly verifying functionality across browsers

 - Removed "center origin" positioning 
 
 - Removed keyboard event handling

## Usage

The events module exports a single function `addEvents(element, userHandlers)`.
`element` is a DOM element that event listeners should be attached to.
`userHandlers` is a plain object, which can contain keys for any of the handlers
specified below. Each value in `userHandlers` should be a function with a single
`event` argument. The shape of this `event` can vary and is specified below.

## Events

### Mouse events

#### Handlers

 - onClick

 - onMouseUp

 - onMouseDown

 - onMouseMove

 - onMouseEnter

 - onMouseLeave

 - onMouseOver

 - onMouseOut

#### Event format

 - **browserEvent** - The mouse event provided by the browser.

 - **pointerPosition.x** - X coordinate in device independent pixels relative to
 the left side of the element events are bound to.

 - **pointerPosition.y** - Y coordinate in device independent pixels relative to
 the top side of the element events are bound to.

 - **mouse.pressedButtons** - Only valid for `onMouseDown`. Object with keys
 `left`, `middle` and `right` and boolean values, `true` when the corresponding
 key is pressed, `false` otherwise.

 - **mouse.clickButton** - One of `"left"`, `"middle"` or `"right"` during a
 click, `null` otherwise. This has a value on all events from `onMouseDown`
 (inclusive) to `onClick` or `onMouseUp` (inclusive). If the mouse button used
 is unrecognized, the value will be `null`.

 - **getModifierState(keyArg)** - Function with one argument, either `"Alt"`,
 `"Control"`, `"Meta"` or `"Shift"`. True if this key is currently pressed,
 false otherwise.

### Touch events

#### Handlers

 - onTouchStart

 - onTouchEnd

 - onTouchMove

#### Event format

 - **browserEvent** - The touch event provided by the browser.

 - **touchPositions** - An array containing information about both changed and
 unchanged touches.  These are **not in any stable order**.  Changed touches
 include those which have just been removed from the screen on `onTouchEnd`. See
 `touchPositions[i].wasChanged` for more information.

 - **touchPositions[i].identifier** - A unique DOMString identifying the touch.
 See the [Touch Web API](https://developer.mozilla.org/en-US/docs/Web/API/Touch)
 for more information.

 - **touchPositions[i].wasChanged** - `true` if this touch was changed, `false`
 otherwise. For `onTouchStart` events, a touch is changed if it just started.
 For `onTouchEnd` events, a touch is changed if it just ended. For `onTouchMove`
 events, a touch is changed if its position changed.

 - **touchPositions[i].position.x** - X coordinate in device independent pixels
 relative to the left side of the element events are bound to.

 - **touchPositions[i].position.y** - Y coordinate in device independent pixels
 relative to the top side of the element events are bound to.

 - **getModifierState(keyArg)** - Function with one argument, either `"Alt"`,
 `"Control"`, `"Meta"` or `"Shift"`. True if this key is currently pressed,
 false otherwise.

### Touch gesture events

#### Handlers

 - onTouchGestureStart

 - onTouchGestureEnd

 - onTouchGestureChange

#### Event format

 - **browserEvent** - The touch event provided by the browser.

 - **touchEvent** - The touch event provided by the framework (see above).

 - **gesture** - One of `drag` (single finger) or `pinch` (two finger).

 - **pointerPosition** - Only for `drag` gesture.

 - **scale** - Only for `pinch` gesture. The value is `1.0` when the user starts
 a pinch gesture and grows or shrinks as they move their fingers. Scale is
 relative to the initial distance between the users fingers.

 - **focalPoint** - Only for `pinch` gesture. The position of the point between
 the users fingers.

 - **focalPoint.x** - Only for `pinch` gesture. X coordinate in device
 independent pixels relative to the left side of the element events are bound
 to.

 - **focalPoint.y** - Only for `pinch` gesture. Y coordinate in device
 independent pixels relative to the top side of the element events are bound to.
