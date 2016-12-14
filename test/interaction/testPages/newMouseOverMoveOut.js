/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) mouse over/move/out',
  render(testArea) {
    const containerElement = document.createElement('div');
    const canvasElement = document.createElement('canvas');
    const coverElement = document.createElement('div');
    containerElement.appendChild(coverElement);
    containerElement.appendChild(canvasElement);
    testArea.appendChild(containerElement);
    containerElement.setAttribute('style', 'position: relative;');
    coverElement.innerHtml = '&nbsp;';
    coverElement.setAttribute('style', `
      position: absolute;
      bottom: -20px;
      left: 100px;
      width: 50px;
      height: 100px;
      background: blue;
      opacity: 0.5;
    `);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onMouseOver(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.reset();
        crosshairCanvas.setCrosshair({
          key: 'over', position: eventInfo.pointerPosition, color: 'blue'
        });
      },
      onMouseMove(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'move', position: eventInfo.pointerPosition, color: 'black'
        });
      },
      onMouseOut(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'out', position: eventInfo.pointerPosition, color: 'red'
        });
      }
    });
  }
};
