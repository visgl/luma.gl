/* global document */

import addEvents from '../../../add-events';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) mouse click (fixed position)',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.setAttribute('style', 'height: 200vh; width: 200vw');
    canvasElement.height = document.documentElement.clientHeight;
    canvasElement.width = document.documentElement.clientWidth;
    canvasElement.setAttribute('style', 'position: fixed; top: 300px; left: 400px;');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onClick(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({key: 'click', position: eventInfo.pointerPosition});
      }
    });
  }
};
