/* global Mesh, document, luma, mat4 */

const {loadImage, Texture2D} = luma;

// eslint-disable-next-line
class Scene {
  constructor(gl, glState, model, gltf) {
    this.globalState = glState;

    this.nodes = gltf.nodes;
    this.meshes = [];
    this.assets = {};
    this.pendingTextures = 0;
    this.pendingBuffers = 0;
    this.samplerIndex = 3; // skip the first three because of the cubemaps
    for (const meshIdx in gltf.meshes) {
      this.meshes.push(new Mesh(gl, this, this.globalState, model, gltf, meshIdx));
    }
  }

  getNextSamplerIndex() {
    const result = this.samplerIndex++;
    if (result > 31) {
      throw new Error('Too many texture samplers in use.');
    }
    return result;
  }

  drawScene(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (this.pendingTextures > 0 || this.pendingBuffers > 0) {
      return;
    }
    document.getElementById('loadSpinner').style.display = 'none';

    function drawNodeRecursive(scene, node, parentTransform) {
      // Transform
      let localTransform;
      if (node.matrix) {
        localTransform = mat4.clone(node.matrix);
      } else {
        localTransform = mat4.create();
        const scale = node.scale ? node.scale : [1.0, 1.0, 1.0];
        const rotation = node.rotation ? node.rotation : [0.0, 0.0, 0.0, 1.0];
        const translate = node.translation ? node.translation : [0.0, 0.0, 0.0];

        mat4.fromRotationTranslationScale(localTransform, rotation, translate, scale);
      }

      mat4.multiply(localTransform, localTransform, parentTransform);

      if (defined(node.mesh) && node.mesh < scene.meshes.length) {
        scene.meshes[node.mesh].drawMesh(
          gl, localTransform, scene.viewMatrix, scene.projectionMatrix, scene.globalState
        );
      }

      if (defined(node.children) && node.children.length > 0) {
        for (let i = 0; i < node.children.length; i++) {
          drawNodeRecursive(scene, scene.nodes[node.children[i]], localTransform);
        }
      }
    }

    // set up the camera position and view matrix
    const {translate, roll, pitch} = controls;

    const cameraPos = [
      -translate * Math.sin(roll) * Math.cos(-pitch),
      -translate * Math.sin(-pitch),
      translate * Math.cos(roll) * Math.cos(-pitch)
    ];
    this.globalState.uniforms['u_Camera'].vals = cameraPos;

    // Update view matrix
    // roll, pitch and translate are all globals.
    const xRotation = mat4.create();
    mat4.rotateY(xRotation, xRotation, roll);
    const yRotation = mat4.create();
    mat4.rotateX(yRotation, yRotation, pitch);
    this.viewMatrix = mat4.create();
    mat4.multiply(this.viewMatrix, yRotation, xRotation);
    this.viewMatrix[14] = -translate;

    var firstNode = this.nodes[0];

    drawNodeRecursive(this, firstNode, mat4.create());

    // draw to the front buffer
    this.frontBuffer.drawImage(this.backBuffer, 0, 0);
  }

  loadImage(imageInfo, gl) {

    this.pendingTextures++;

    loadImage(imageInfo.uri).then(image => {

      const lumatexture = new Texture2D(gl, {
        // gl.TEXTUREn enums are in numeric order.
        textureUnit: imageInfo.samplerIndex, // gl.TEXTURE0 +
        parameters: {
          [gl.TEXTURE_WRAP_S]: imageInfo.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT,
          [gl.TEXTURE_WRAP_T]: imageInfo.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT,
          [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
          [gl.TEXTURE_MAG_FILTER]: gl.LINEAR
        },
        pixelStore: {
          [gl.UNPACK_FLIP_Y_WEBGL]: false
        },
        format: imageInfo.colorSpace,
        dataFormat: imageInfo.colorSpace,
        // type: gl.UNSIGNED_BYTE,
        pixels: image,
        mipmaps: false
      });

      lumatexture.bind();

      this.pendingTextures--;

      this.drawScene(gl);
    });
  }

  loadImages(imageInfos, gl) {
    this.pendingTextures = 0;
    for (const key in imageInfos) {
      this.loadImage(imageInfos[key], gl);
    }
  }
}

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

