/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) touch',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    let lastFingerReleased = true;
    addEvents(canvasElement, {
      onTouchStart(eventInfo) {
        console.log(eventInfo);
        if (lastFingerReleased) {
          crosshairCanvas.reset();
        }
        lastFingerReleased = false;
        for (const touch of eventInfo.touchPositions) {
          if (touch.wasChanged) {
            crosshairCanvas.setCrosshair({
              key: `start-${touch.identifier}`,
              position: touch.position,
              color: 'blue'
            });
          }
        }
      },
      onTouchMove(eventInfo) {
        console.log(eventInfo);
        for (const touch of eventInfo.touchPositions) {
          crosshairCanvas.setCrosshair({
            key: `move-${touch.identifier}`,
            position: touch.position,
            color: 'black'
          });
        }
      },
      onTouchEnd(eventInfo) {
        console.log(eventInfo);
        if (eventInfo.rawEvent.touches.length === 0) {
          lastFingerReleased = true;
        }
        for (const touch of eventInfo.touchPositions) {
          if (touch.wasChanged) {
            crosshairCanvas.setCrosshair({
              key: `end-${touch.identifier}`,
              position: touch.position,
              color: 'red'
            });
          }
        }
      }
    });
  }
};
