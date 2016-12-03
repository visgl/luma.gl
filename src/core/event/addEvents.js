/* global document */

import ElementRelativePositionTransformer from './ElementRelativePositionTransformer';
import MouseEventManager from './MouseEventManager';
import KeyboardEventManager from './KeyboardEventManager';

export default function addEvents(element, userHandlers, options) {
  const tranformPosition = (new ElementRelativePositionTransformer(element)).fromViewportRelative;
  const mouseEventManager = new MouseEventManager(userHandlers, tranformPosition);
  mouseEventManager.attach(element);
  const keyboardEventManager = new KeyboardEventManager(userHandlers);
  keyboardEventManager.attach(document);
}
