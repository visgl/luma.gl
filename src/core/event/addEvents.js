import ElementRelativePositionTransformer from './ElementRelativePositionTransformer';
import MouseEventManager from './MouseEventManager';

export default function addEvents(element, userHandlers, options) {
  const tranformPosition = (new ElementRelativePositionTransformer(element)).fromViewportRelative;
  const mouseEventManager = new MouseEventManager(userHandlers, tranformPosition);
  mouseEventManager.attach(element);
}
