/* global Mesh, document, luma, Matrix4 */

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
    this.viewMatrix = new Matrix4()
      .rotateX(pitch)
      .rotateY(roll);
    this.viewMatrix[14] = -translate;

    const firstNode = this.nodes[0];

    drawNodeRecursive(gl, this, firstNode, new Matrix4());

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


function drawNodeRecursive(gl, scene, node, parentTransform) {

  const localTransform = getNodeTransform(node).multiplyRight(parentTransform);

  if (node.mesh !== undefined && node.mesh < scene.meshes.length) {
    scene.meshes[node.mesh].drawMesh(
      gl, localTransform, scene.viewMatrix, scene.projectionMatrix, scene.globalState
    );
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      drawNodeRecursive(gl, scene, scene.nodes[child], localTransform);
    }
  }
}

function getNodeTransform(node) {
  // Transform
  let localTransform;

  if (node.matrix) {
    localTransform = new Matrix4(node.matrix);
  } else {
    localTransform = new Matrix4();
    if (node.scale) {
      localTransform.scale(node.scale)
    }
    if (node.rotation) {
      const rotationMatrix = new Matrix4().fromQuaternion(node.rotation);
      localTransform.multiplyLeft(rotationMatrix);
    }
    if (node.translation) {
      localTransform.translate(node.translation);
    }
    // const scale = node.scale ? node.scale : [1.0, 1.0, 1.0];
    // const rotation = node.rotation ? node.rotation : [0.0, 0.0, 0.0, 1.0];
    // const translate = node.translation ? node.translation : [0.0, 0.0, 0.0];
    // mat4.fromRotationTranslationScale(localTransform, rotation, translate, scale);
  }

  return localTransform;
}
