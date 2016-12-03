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

  _drawCrosshair({position: {x, y}, color}) {
    this._context.strokeStyle = color || 'black';
    this._context.beginPath();
    this._context.moveTo(x - this._options.crosshairSizePx, y);
    this._context.lineTo(x + this._options.crosshairSizePx, y);
    this._context.moveTo(x, y - this._options.crosshairSizePx);
    this._context.lineTo(x, y + this._options.crosshairSizePx);
    this._context.stroke();
  }
}
