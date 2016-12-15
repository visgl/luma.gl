/* global document */

import addEvents from '../../../add-events';
import CrosshairCanvas from '../crosshair-canvas';

export default {
  name: '(new) touch gesture (more features)',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    let lastFingerReleased = true;
    addEvents(canvasElement, {
      onTouchGestureStart(eventInfo) {
        eventInfo.browserEvent.preventDefault();
        console.log(eventInfo);
        if (lastFingerReleased) {
          crosshairCanvas.reset();
        }
        lastFingerReleased = false;
        if (eventInfo.gesture === 'pinch') {
          crosshairCanvas.clearCrosshair('movePinch');
          crosshairCanvas.clearCrosshair('endPinch');
          crosshairCanvas.setCrosshair({
            key: 'startPinch',
            position: eventInfo.focalPoint,
            sizePx: 50 * eventInfo.scale,
            color: 'blue',
            style: 'circleBounded'
          });
        } else {
          crosshairCanvas.clearCrosshair('moveDrag');
          crosshairCanvas.clearCrosshair('endDrag');
          crosshairCanvas.setCrosshair({
            key: 'startDrag',
            position: eventInfo.pointerPosition,
            color: 'blue'
          });
        }
      },
      onTouchGestureChange(eventInfo) {
        eventInfo.browserEvent.preventDefault();
        console.log(eventInfo);
        if (eventInfo.gesture === 'pinch') {
          crosshairCanvas.setCrosshair({
            key: 'movePinch',
            position: eventInfo.focalPoint,
            sizePx: 50 * eventInfo.scale,
            color: 'black',
            style: 'circleBounded'
          });
        } else {
          crosshairCanvas.setCrosshair({
            key: 'moveDrag',
            position: eventInfo.pointerPosition,
            color: 'black'
          });
        }
      },
      onTouchGestureEnd(eventInfo) {
        eventInfo.browserEvent.preventDefault();
        if (eventInfo.browserEvent.touches.length === 0) {
          lastFingerReleased = true;
        }
        console.log(eventInfo);
        if (eventInfo.gesture === 'pinch') {
          crosshairCanvas.setCrosshair({
            key: 'endPinch',
            position: eventInfo.focalPoint,
            sizePx: 50 * eventInfo.scale,
            color: 'red',
            style: 'circleBounded'
          });
        } else {
          crosshairCanvas.setCrosshair({
            key: 'endDrag',
            position: eventInfo.pointerPosition,
            color: 'red'
          });
        }
      }
    });
  }
};
