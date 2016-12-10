import ElementRelativePositionTransformer from './ElementRelativePositionTransformer';
import TouchGestureEventManager from './TouchGestureEventManager';
import MouseEventManager from './MouseEventManager';
import TouchEventManager from './TouchEventManager';

export default function addEvents(element, userHandlers, options) {
  const tranformPosition = (new ElementRelativePositionTransformer(element)).fromViewportRelative;

  let mergedHandlers = userHandlers;

  // Middlewares
  const touchGestureEventManager = new TouchGestureEventManager(mergedHandlers);
  mergedHandlers = touchGestureEventManager.getMiddlewareHandlers();

  // True event sources
  const mouseEventManager = new MouseEventManager(mergedHandlers, tranformPosition);
  mouseEventManager.attach(element);
  const touchEventManager = new TouchEventManager(mergedHandlers, tranformPosition);
  touchEventManager.attach(element);
}
