/* global document */

import {addEvents} from '../../src/core/event';
import {addEvents as addEventsLegacy} from '../../src/core/eventLegacy';
import prepareTestArea from './prepareTestArea';
import CrosshairCanvas from './CrosshairCanvas';

const crosshairCanvasConfig = {
  backgroundColor: 'green',
  crosshairSizePx: 15
};

function getActiveModifierString(eventInfo) {
  const activeModifiers = [];
  for (const modifierName of ['Alt', 'Control', 'Meta', 'Shift']) {
    if (eventInfo.getModifierState(modifierName)) {
      activeModifiers.push(modifierName);
    }
  }
  return activeModifiers.join('+');
}

const testScenarios = [
  {
    name: '(legacy) basic mouse drag',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEventsLegacy(canvasElement, {
        onDragStart: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onDragMove: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onDragCancel: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        onDragEnd: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        centerOrigin: false,
      });
    }
  },
  {
    name: '(legacy) basic touch drag',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEventsLegacy(canvasElement, {
        onTouchStart: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onTouchMove: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onTouchCancel: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        onTouchEnd: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        centerOrigin: false,
      });
    }
  },
  {
    name: '(new) mouse move',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEvents(canvasElement, {
        onMouseMove(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.pointerPosition);
        },
      });
    }
  },
  {
    name: '(new) mouse over/out',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEvents(canvasElement, {
        onMouseOver(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.pointerPosition);
        },
        onMouseOut(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.pointerPosition);
        }
      });
    }
  }
];

testScenarios[0].prepare(prepareTestArea());
