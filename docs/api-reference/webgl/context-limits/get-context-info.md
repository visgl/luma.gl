# getContextInfo

Returns an object containing following details.

* vendor: info[GL.UNMASKED_VENDOR_WEBGL] || info[GL.VENDOR],
* renderer: info[GL.UNMASKED_RENDERER_WEBGL] || info[GL.RENDERER],
* version: info[GL.VERSION],
* shadingLanguageVersion: info[GL.SHADING_LANGUAGE_VERSION],
* info,
* limits,
* webgl1MinLimits: gl.luma.webgl1MinLimits,
* webgl2MinLimits: gl.luma.webgl2MinLimits
