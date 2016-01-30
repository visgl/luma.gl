function SwapTexture(app, config, count) {
  count = count || 1;
  config = config || {};
  var me = this;
  config = Utils.merge({
    width: config.width,
    height: config.height,
    bindToTexture: {
      pixelStore: [],
      parameters: [
        {
          name: gl.TEXTURE_MAG_FILTER,
          value: gl.NEAREST
        },
        {
          name: gl.TEXTURE_MIN_FILTER,
          value: gl.NEAREST,
          generateMipmap: false
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
        type: gl.FLOAT
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
    var textures = config.textures || [], i = 0, ln = this.from.length;
    for (i = 0; i < ln; i++) {
      textures.push(this.from[i] + '-texture');
    }
    PhiloGL.Media.Image.postProcess(
        Utils.merge({
          width: me.width,
          height: me.height,
          fromTexture: textures,
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
  },
  getResult: function(i) {
    return this.from[i || 0] + '-texture';
  }
};
