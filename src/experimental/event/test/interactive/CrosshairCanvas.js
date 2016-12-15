const defaultOptions = {
  backgroundColor: 'green',
  crosshairSizePx: 15
};

export default class CrosshairCanvas {
  constructor(canvasElement, options = defaultOptions) {
    this._element = canvasElement;
    this._context = canvasElement.getContext('2d');
    this._options = options;
    this.reset();
  }

  reset() {
    this._crosshairs = [];
    this._redraw();
  }

  setCrosshair(newCrosshair) {
    this._crosshairs = this._crosshairs.filter(crosshair => crosshair.key !== newCrosshair.key);
    this._crosshairs.push(newCrosshair);
    this._redraw();
  }

  clearCrosshair(key) {
    this._crosshairs = this._crosshairs.filter(crosshair => crosshair.key !== key);
  }

  _redraw() {
    this._clear();
    for (const crosshair of this._crosshairs) {
      this._drawCrosshair(crosshair);
    }
  }

  _clear() {
    this._context.fillStyle = this._options.backgroundColor;
    this._context.fillRect(0, 0, this._element.width, this._element.height);
  }

  _drawCrosshair({position: {x, y}, color, style, sizePx}) {
    const radius = sizePx || this._options.crosshairSizePx;
    this._context.strokeStyle = color || 'black';
    this._context.beginPath();
    this._context.moveTo(x - radius, y);
    this._context.lineTo(x + radius, y);
    this._context.moveTo(x, y - radius);
    this._context.lineTo(x, y + radius);
    if (style === 'circleBounded') {
      this._context.moveTo(x, y);
      this._context.arc(x, y, radius, 0, 2 * Math.PI);
    }
    this._context.stroke();
  }
}
