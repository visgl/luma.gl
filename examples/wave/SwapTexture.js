function SwapTexture(config, count) {
  count = count || 1;
  config = config || {};
  var me = this;
  gl.supports_OES_texture_float = !!gl.getExtension('OES_texture_float');
  config = Utils.merge({
    width: 512,
    height: 512,
    bindToTexture: {
      pixelStore: [],
      parameters: [
        {
          name: gl.TEXTURE_MAG_FILTER,
          value: gl.supports_OES_texture_float ? gl.LINEAR : gl.NEAREST
        },
        {
          name: gl.TEXTURE_MIN_FILTER,
          value: gl.supports_OES_texture_float ? gl.LINEAR : gl.NEAREST,
          generateMipmap: true
        },
        {
          name: gl.TEXTURE_WRAP_S,
          value: gl.CLAMP_TO_EDGE
        },
        {
          name: gl.TEXTURE_WRAP_T,
          value: gl.CLAMP_TO_EDGE
        }
      ],
      data: {
        type: gl.supports_OES_texture_float ? gl.FLOAT : gl.UNSIGNED_BYTE
      }
    },
    bindToRenderBuffer: false
  }, config);
  if (config.bindToTexture.data) {
    var data = config.bindToTexture.data;
    data.height = data.height || config.height;
    data.width = data.width || config.width;
  }
  me.width = config.width;
  me.height = config.height;
  me.from = [];
  me.to = [];
  for (var i = 0; i < count; i++) {
    me.from[i] = 'fb-' + Utils.uid();
    me.to[i] = 'fb-' + Utils.uid();
    app.setFrameBuffer(me.from[i], config);
    app.setFrameBuffer(me.to[i], config);
  }
}

SwapTexture.prototype = {
  process: function(config, idx, noSwap) {
    var me = this;
    var fromTexture = [], i = 0, ln = this.from.length;
    for (i = 0; i < ln; i++) {
      fromTexture.push(this.from[i] + '-texture');
    }
    LumaGL.Media.Image.postProcess(
      Utils.merge({
        width: me.width,
        height: me.height,
        fromTexture: fromTexture,
        toFrameBuffer: this.to[idx || 0]
      }, config)
    );
    if (!noSwap) {
      me.swap();
    }
  },
  swap: function() {
    var me = this,
      temp = me.from;
    me.from = me.to;
    me.to = temp;
  }
};
