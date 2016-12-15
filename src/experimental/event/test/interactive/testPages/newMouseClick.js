/* global document */

import addEvents from '../../../add-events';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) mouse click (document scroll)',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    canvasElement.height = 2 * document.documentElement.clientHeight;
    canvasElement.width = 2 * document.documentElement.clientWidth;
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
