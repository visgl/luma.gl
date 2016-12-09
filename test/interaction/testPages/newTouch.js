/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) touch',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onTouchStart(eventInfo) {
        console.log(eventInfo);
        if (eventInfo.rawEvent.targetTouches.length === 1) {
          crosshairCanvas.reset();
        }
        crosshairCanvas.setCrosshair({
          key: Symbol('start'),
          position: eventInfo.pointerPosition,
          color: 'blue'
        });
      },
      onTouchMove(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'move',
          position: eventInfo.pointerPosition,
          color: 'black'
        });
      },
      onTouchEnd(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: Symbol('end'),
          position: eventInfo.pointerPosition,
          color: 'red'
        });
      }
    });
  }
};
