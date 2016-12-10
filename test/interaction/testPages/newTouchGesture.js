/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) touch gesture (drag only, no prevent default)',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onTouchGestureStart(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.reset();
        if (eventInfo.gesture === 'drag') {
          crosshairCanvas.setCrosshair({
            key: 'start',
            position: eventInfo.pointerPosition,
            color: 'blue'
          });
        }
      },
      onTouchGestureChange(eventInfo) {
        console.log(eventInfo);
        if (eventInfo.gesture === 'drag') {
          crosshairCanvas.setCrosshair({
            key: 'move',
            position: eventInfo.pointerPosition,
            color: 'black'
          });
        }
      },
      onTouchGestureEnd(eventInfo) {
        console.log(eventInfo);
        if (eventInfo.gesture === 'drag') {
          crosshairCanvas.setCrosshair({
            key: 'end',
            position: eventInfo.pointerPosition,
            color: 'red'
          });
        }
      }
    });
  }
};
