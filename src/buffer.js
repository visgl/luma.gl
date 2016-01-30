
export default class Buffer {

  constructor(gl, opts = {}) {
    this.gl = gl;
    this._setOpts(opts);
    this.buffer = gl.createBuffer();
    this._bufferData();
  }

  update(opts = {}) {
    this._setOpts(opts);
    this._bufferData();
  }

  _setOpts(opts) {
    opts = {
      data: this.data,
      attribute: this.attribute,
      bufferType: this.bufferType === undefined ? this.gl.ARRAY_BUFFER : this.bufferType,
      size: this.size === undefined ? 1 : this.size,
      dataType: this.dataType === undefined ? this.gl.FLOAT : this.dataType,
      stride: this.stride === undefined ? 0 : this.stride,
      offset: this.offset === undefined ? 0 : this.offset,
      drawType: this.drawType === undefined ? this.gl.STATIC_DRAW : this.drawType,
      instanced: this.instanced === undefined ? 0 : this.instanced,
      ...opts
    };
    this.data = opts.data;
    this.attribute = opts.attribute;
    this.bufferType = opts.bufferType;
    this.size = opts.size,
    this.dataType = opts.dataType;
    this.stride = opts.stride;
    this.offset = opts.offset;
    this.drawType = opts.drawType;
    this.instanced = opts.instanced;
  }

  _bufferData() {
    if (this.data !== undefined) {
      this.gl.bindBuffer(this.bufferType, this.buffer);
      this.gl.bufferData(this.bufferType, this.data, this.drawType);
      this.gl.bindBuffer(this.bufferType, null);
    }
  }

}
