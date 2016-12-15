import {getElementRelativePosition} from './util';
import TouchGestureEventManager from './touch-gesture-event-manager';
import MouseEventManager from './mouse-event-manager';
import TouchEventManager from './touch-event-manager';

export default function addEvents(element, userHandlers, options) {
  const transformPosition = getElementRelativePosition.bind(null, element);

  let mergedHandlers = userHandlers;

  // Middlewares
  const touchGestureEventManager = new TouchGestureEventManager(mergedHandlers);
  mergedHandlers = touchGestureEventManager.getMiddlewareHandlers();

  // True event sources
  const mouseEventManager = new MouseEventManager(mergedHandlers, transformPosition);
  mouseEventManager.attach(element);
  const touchEventManager = new TouchEventManager(mergedHandlers, transformPosition);
  touchEventManager.attach(element);
}
