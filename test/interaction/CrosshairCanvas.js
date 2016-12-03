export default class CrosshairCanvas {
  constructor(canvasElement, options) {
    this._element = canvasElement;
    this._context = canvasElement.getContext('2d');
    this._options = options;
    this._clear();
  }

  setCrosshairPosition(position) {
    this._clear();
    if (position) {
      this._drawCrosshair(position);
    }
  }

  _clear() {
    this._context.fillStyle = this._options.backgroundColor;
    this._context.fillRect(0, 0, this._element.width, this._element.height);
  }

  _drawCrosshair({x, y}) {
    this._context.beginPath();
    this._context.moveTo(x - this._options.crosshairSizePx, y);
    this._context.lineTo(x + this._options.crosshairSizePx, y);
    this._context.moveTo(x, y - this._options.crosshairSizePx);
    this._context.lineTo(x, y + this._options.crosshairSizePx);
    this._context.stroke();
  }
}
