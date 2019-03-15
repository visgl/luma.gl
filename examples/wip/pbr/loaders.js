
function loadCubeMap(gl, envMap, type, state) {
  var texture = gl.createTexture();
  var textureNumber = -1;
  var activeTextureEnum = gl.TEXTURE0;
  var mipLevels = 0;
  var uniformName = 'u_EnvSampler';
  if (type === "diffuse") {
    uniformName = 'u_DiffuseEnvSampler';
    activeTextureEnum = gl.TEXTURE1;
    textureNumber = 1;
    mipLevels = 1;
  }
  else if (type === "specular") {
    uniformName = 'u_SpecularEnvSampler';
    activeTextureEnum = gl.TEXTURE2;
    textureNumber = 2;
    mipLevels = 10;
  }
  else if (type === "environment") {
    uniformName = 'u_EnvSampler';
    activeTextureEnum = gl.TEXTURE0;
    textureNumber = 0;
    mipLevels = 1;
  }
  else {
    var error = document.getElementById('error');
    error.innerHTML += 'Invalid type of cubemap loaded<br>';
    return -1;
  }
  gl.activeTexture(activeTextureEnum);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (mipLevels < 2) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
  else {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  // https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master/models
  var path = "https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master/textures/" + envMap + "/" + type + "/" + type;

  function onLoadEnvironmentImage(texture, face, image, j) {
    return function() {
      gl.activeTexture(activeTextureEnum);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      // todo:  should this be srgb?  or rgba?  what's the HDR scale on this?
      gl.texImage2D(face, j, state.hasSRGBExt ? state.hasSRGBExt.SRGB_EXT : gl.RGBA, state.hasSRGBExt ? state.hasSRGBExt.SRGB_EXT : gl.RGBA, gl.UNSIGNED_BYTE, image);
    };
  }

  for (var j = 0; j < mipLevels; j++) {
    var faces = [[path + "_right_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
    [path + "_left_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
    [path + "_top_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
    [path + "_bottom_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
    [path + "_front_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
    [path + "_back_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
    for (var i = 0; i < faces.length; i++) {
      var face = faces[i][1];
      var image = new Image();
      image.onload = onLoadEnvironmentImage(texture, face, image, j);
      image.src = faces[i][0];
      image.crossOrigin = 'anonymous';
    }
  }

  state.uniforms[uniformName] = { 'funcName': 'uniform1i', 'vals': [textureNumber] };
  return 1;
}
