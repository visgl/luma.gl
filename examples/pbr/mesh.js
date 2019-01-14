/* global luma */
const {Model, pbr} = luma;

const VERTEX_SHADER = `\
attribute vec4 a_Position;
#ifdef HAS_NORMALS
attribute vec4 a_Normal;
#endif
#ifdef HAS_TANGENTS
attribute vec4 a_Tangent;
#endif
#ifdef HAS_UV
attribute vec2 a_UV;
#endif

void main()
{
#ifdef HAS_TANGENTS
  pbr_setPositionNormalTangentUV(a_Position, a_Normal, a_Tangent, a_UV);
#else
  pbr_setPositionNormalTangentUV(a_Position, a_Normal, vec4(0.), a_UV);
#endif
  gl_Position = u_MVPMatrix * a_Position;
}
`;

const FRAGMENT_SHADER = `\
void main()
{
  gl_FragColor = pbr_filterColor(gl_FragColor);
}
`;

class Mesh {
  constructor(gl, scene, globalState, modelPath, gltf, meshIdx) {
    this.modelPath = modelPath;
    this.scene = scene;

    this.defines = {
      'USE_IBL': 1
    };

    this.localState = {
      uniforms: {},
      uniformLocations: {},
      attributes: {}
    };

    this.hasSRGBExt = globalState.hasSRGBExt;

    if(!this.hasSRGBExt) {
      this.defines.MANUAL_SRGB = 1;
    }

    ++scene.pendingBuffers;

    var primitives = gltf.meshes[meshIdx].primitives;
    // todo:  multiple primitives doesn't work.
    for (let i = 0; i < primitives.length; i++) {
      var primitive = primitives[Object.keys(primitives)[i]];

      for (let attribute in primitive.attributes) {
        switch (attribute) {
          case 'NORMAL':
            this.defines.HAS_NORMALS = 1;
            break;
          case 'TANGENT':
            this.defines.HAS_TANGENTS = 1;
            break;
          case 'TEXCOORD_0':
            this.defines.HAS_UV = 1;
            break;
        }
      }

      // Material
      var materialName = primitive.material;
      if (materialName !== undefined) {
        this.material = gltf.materials[materialName];
      }
      var imageInfos = this.initTextures(gl, gltf);

      this.initProgram(gl, globalState);

      this.accessorsLoading = 0;
      // Attributes
      for (let attribute in primitive.attributes) {
        this.getAccessorData(gl, gltf, modelPath, primitive.attributes[attribute], attribute);
      }

      // Indices
      this.getAccessorData(gl, gltf, modelPath, primitive.indices, 'INDEX');

      scene.loadImages(imageInfos, gl, this);
    }
  }


  initProgram(gl, globalState) {
    if (globalState.hasLODExtension) {
      this.defines.USE_TEX_LOD = 1;
    }

    console.log(this.defines);

    const model = new Model(gl, {
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER,
      modules: [pbr],
      defines: this.defines,
      drawMode: gl.TRIANGLES,
      vertexCount: 3
    });

    this.program = model.program.handle;
  }

  drawMesh(gl, transform, view, projection, globalState) {
    // Update model matrix
    var modelMatrix = mat4.create();
    mat4.multiply(modelMatrix, modelMatrix, transform);

    if (this.material && this.material.doubleSided) {
      gl.disable(gl.CULL_FACE);
    } else {
      gl.enable(gl.CULL_FACE);
    }

    // Update mvp matrix
    var mvMatrix = mat4.create();
    var mvpMatrix = mat4.create();
    mat4.multiply(mvMatrix, view, modelMatrix);
    mat4.multiply(mvpMatrix, projection, mvMatrix);

    var modelInverse = mat4.create();
    var normalMatrix = mat4.create();

    /*  NOTE:

      Normal vectors must be transformed by the transpose of the inverse of the model-matrix when that matrix is not orthonormal.

      See e.g. https://www.gdcvault.com/play/1015322/Fundamentals-of-Grassmann or other sources for an explanation.

      In short, lets illustrate the problem, and show the solution.

      Suppose we have normal vector n and any tangent vector v at some point p of the model's surface.

      By the definition of a 'normal' vector, n is orthonormal to v.

      Mathematically, this means that [1]:

      n^T * v = 0

      where * means matrix multiplication and ^T means transpose.

      (another way of writing this in non-matrix form is n . v = 0, where . is the dot product between n and v)

      Say our model's surface is a sphere and that our model-to-world matrix is a non-uniform scaling matrix.

      The sphere will be transformed to an ellipsoid, but when transforming the normal vectors using the same matrix,
      these transformed normal vectors are not orthogonal to the ellipsoid anymore!
      See https://alfonse.bitbucket.io/oldtut/Illumination/CircleNormalScaling.svg

      So these transformed normal vectors are not 'normal' at all...

      So what matrix should we use to transform the original normal vectors into new correct normals?

      Say that U is such a matrix, then U*n (the transformed normal) must be orthogonal to M*v (the transformed tangent), meaning

      (U*n)^T * (M*v) = 0

      <=> (transpose of product is reversed product of transposes)

      (n^T * U^T) * (M * v) = 0

      <=> (matrix multiplication is associative)

      n^T * (U^T * M) * v = 0

      From [1] above, we already know that

      n^T      *        v = 0

      so if we could just find U so that U^T * M = I (the identity matrix), we're done.

      That's easy

      U^T * M = I

      <=> (multiply both sides to the right with M^-1, the inverse of M)

      U^T = I * M^-1

      <=> (transpose both sides, and transposing twice cancels out)

      U = (M^-1)^T

      So here you have it, U must be the transpose of the inverse of M.

      Normal vectors to describe planes and the cross product that only works in 3D
      are an indication that something is very rotten in vector math land...

      Indeed, when we go back in time, and look at the 19th century math that existed before vector math became popular,
      we find beautiful but forgotten object-oriented frameworks like Grassmann and Clifford algebra.

      These work the same in all dimensions, and do not exhibit the above problems, offering much more bang for the buck.

      It is only recently that some game engine developers discovered this math, e.g. the Terathon C4 engine.

      For a nice little Javascript library that demonstrates the crazy power of this ancient algebras,
      see https://github.com/enkimute/ganja.js
    */

    // TODO: We don't need a 4x4 matrix here, just 3x3
    mat4.invert(modelInverse, modelMatrix);
    mat4.transpose(normalMatrix, modelInverse);

    // these should actually be local to the mesh (not in global)
    globalState.uniforms['u_MVPMatrix'].vals = [false, mvpMatrix];

    // Update model transformation matrix
    globalState.uniforms['u_ModelMatrix'].vals = [false, modelMatrix];

    // Update normal transformation matrix
    globalState.uniforms['u_NormalMatrix'].vals = [false, normalMatrix];

    this.applyState(gl, globalState);

    // Draw
    if (this.indicesAccessor) {
      gl.drawElements(gl.TRIANGLES, this.indicesAccessor.count, gl.UNSIGNED_SHORT, this.indicesAccessor.byteOffset);
    }

    this.disableState(gl);
  }

  initArrayBuffer(gl, data, num, type, attribute, stride, offset) {
    var buffer = gl.createBuffer();
    if (!buffer) {
      var error = document.GetElementById('error');
      error.innerHTML += 'Failed to create the buffer object<br>';
      return -1;
    }

    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var a_attribute = gl.getAttribLocation(this.program, attribute);

    this.localState.attributes[attribute] = {
      'cmds': [
        { 'funcName': 'bindBuffer', 'vals': [gl.ARRAY_BUFFER, buffer] },
        { 'funcName': 'vertexAttribPointer', 'vals': [a_attribute, num, type, false, stride, offset] },
        { 'funcName': 'enableVertexAttribArray', 'vals': [a_attribute] }
      ],
      'a_attribute': a_attribute
    };
    return true;
  }

  initBuffers(gl, gltf) {
    var error = document.getElementById('error');
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      error.innerHTML += 'Failed to create the buffer object<br>';
      return -1;
    }

    if (!this.initArrayBuffer(gl, this.vertices, 3, gl.FLOAT, 'a_Position', this.verticesAccessor.byteStride, this.verticesAccessor.byteOffset)) {
      error.innerHTML += 'Failed to initialize position buffer<br>';
    }

    if (this.normalsAccessor) {
      if (!this.initArrayBuffer(gl, this.normals, 3, gl.FLOAT, 'a_Normal', this.normalsAccessor.byteStride, this.normalsAccessor.byteOffset)) {
        error.innerHTML += 'Failed to initialize normal buffer<br>';
      }
    }

    if (this.tangentsAccessor) {
      if (!this.initArrayBuffer(gl, this.tangents, 4, gl.FLOAT, 'a_Tangent', this.tangentsAccessor.byteStride, this.tangentsAccessor.byteOffset)) {
        error.innerHTML += 'Failed to initialize tangent buffer<br>';
      }
    }

    if (this.texcoordsAccessor) {
      if (!this.initArrayBuffer(gl, this.texcoords, 2, gl.FLOAT, 'a_UV', this.texcoordsAccessor.byteStride, this.texcoordsAccessor.byteOffset)) {
        error.innerHTML += 'Failed to initialize texture buffer<br>';
      }
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    --this.scene.pendingBuffers;
    this.scene.drawScene(gl);
  }

  getImageInfo(gl, gltf, textureIndex, funcName, uniformName, colorSpace) {
    var textureInfo = gltf.textures[textureIndex];
    var uri = this.modelPath + gltf.images[textureInfo.source].uri;
    var samplerIndex = this.scene.getNextSamplerIndex();
    this.localState.uniforms[uniformName] = { 'funcName': funcName, 'vals': [samplerIndex] };

    return {
      'uri': uri,
      'samplerIndex': samplerIndex,
      'colorSpace': colorSpace
    };
  }

  initTextures(gl, gltf) {
    var imageInfos = {};
    var pbrMat = this.material ? this.material.pbrMetallicRoughness : null;
    var samplerIndex;

    // Base Color
    var baseColorFactor = pbrMat && pbrMat.baseColorFactor ? pbrMat.baseColorFactor : [1.0, 1.0, 1.0, 1.0];
    this.localState.uniforms['u_BaseColorFactor'] = {
      funcName: 'uniform4f',
      vals: baseColorFactor
    };
    if (pbrMat && pbrMat.baseColorTexture && gltf.textures.length > pbrMat.baseColorTexture.index) {
      imageInfos['baseColor'] = this.getImageInfo(gl, gltf, pbrMat.baseColorTexture.index, 'uniform1i', 'u_BaseColorSampler', this.hasSRGBExt ? this.hasSRGBExt.SRGB_EXT : gl.RGBA);
      this.defines.HAS_BASECOLORMAP = 1;
    }
    else if (this.localState.uniforms['u_BaseColorSampler']) {
      delete this.localState.uniforms['u_BaseColorSampler'];
    }

    // Metallic-Roughness
    var metallic = (pbrMat && pbrMat.metallicFactor) ? pbrMat.metallicFactor : 1.0;
    var roughness = (pbrMat && pbrMat.roughnessFactor) ? pbrMat.roughnessFactor : 1.0;
    this.localState.uniforms['u_MetallicRoughnessValues'] = {
      funcName: 'uniform2f',
      vals: [metallic, roughness]
    };
    if (pbrMat && pbrMat.metallicRoughnessTexture && gltf.textures.length > pbrMat.metallicRoughnessTexture.index) {
      imageInfos['metalRoughness'] = this.getImageInfo(gl, gltf, pbrMat.metallicRoughnessTexture.index, 'uniform1i', 'u_MetallicRoughnessSampler', gl.RGBA);
      this.defines.HAS_METALROUGHNESSMAP = 1;
    }
    else if (this.localState.uniforms['u_MetallicRoughnessSampler']) {
      delete this.localState.uniforms['u_MetallicRoughnessSampler'];
    }

    // Normals
    if (this.material && this.material.normalTexture && gltf.textures.length > this.material.normalTexture.index) {
      imageInfos['normal'] = this.getImageInfo(gl, gltf, this.material.normalTexture.index, 'uniform1i', 'u_NormalSampler', gl.RGBA);
      var normalScale = this.material.normalTexture.scale ? this.material.normalTexture.scale : 1.0;
      this.localState.uniforms['u_NormalScale'] = { 'funcName': 'uniform1f', 'vals': [normalScale] };
      this.defines.HAS_NORMALMAP = 1;
    }
    else if (this.localState.uniforms['u_NormalSampler']) {
      delete this.localState.uniforms['u_NormalSampler'];
    }

    // brdfLUT
    var brdfLUT = 'https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master/textures/brdfLUT.png';
    samplerIndex = this.scene.getNextSamplerIndex();
    imageInfos['brdfLUT'] = { 'uri': brdfLUT, 'samplerIndex': samplerIndex, 'colorSpace': this.hasSRGBExt ? this.hasSRGBExt.SRGB_EXT : gl.RGBA, 'clamp': true };
    this.localState.uniforms['u_brdfLUT'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };

    // Emissive
    if (this.material && this.material.emissiveTexture) {
      imageInfos['emissive'] = this.getImageInfo(gl, gltf, this.material.emissiveTexture.index, 'uniform1i', 'u_EmissiveSampler', this.hasSRGBExt ? this.hasSRGBExt.SRGB_EXT : gl.RGBA);
      this.defines.HAS_EMISSIVEMAP = 1;
      var emissiveFactor = this.material.emissiveFactor ? this.material.emissiveFactor : [0.0, 0.0, 0.0];
      this.localState.uniforms['u_EmissiveFactor'] = {
        funcName: 'uniform3f',
        vals: emissiveFactor
      };
    }
    else if (this.localState.uniforms['u_EmissiveSampler']) {
      delete this.localState.uniforms['u_EmissiveSampler'];
    }

    // AO
    if (this.material && this.material.occlusionTexture) {
      imageInfos['occlusion'] = this.getImageInfo(gl, gltf, this.material.occlusionTexture.index, 'uniform1i', 'u_OcclusionSampler', gl.RGBA);
      var occlusionStrength = this.material.occlusionTexture.strength ? this.material.occlusionTexture.strength : 1.0;
      this.localState.uniforms['u_OcclusionStrength'] = { 'funcName': 'uniform1f', 'vals': [occlusionStrength] };
      this.defines.HAS_OCCLUSIONMAP = 1;
    }
    else if (this.localState.uniforms['u_OcclusionSampler']) {
      delete this.localState.uniforms['u_OcclusionSampler'];
    }

    return imageInfos;
  }

  getAccessorData(gl, gltf, modelPath, accessorName, attribute) {
    var mesh = this;
    this.accessorsLoading++;
    var accessor = gltf.accessors[accessorName];
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var buffer = gltf.buffers[bufferView.buffer];
    var bin = buffer.uri;

    var reader = new FileReader();

    reader.onload = function(e) {
      var arrayBuffer = reader.result;
      var start = bufferView.byteOffset ? bufferView.byteOffset : 0;
      var end = start + bufferView.byteLength;
      var slicedBuffer = arrayBuffer.slice(start, end);
      var data;
      if (accessor.componentType === 5126) {
        data = new Float32Array(slicedBuffer);
      } else if (accessor.componentType === 5123) {
        data = new Uint16Array(slicedBuffer);
      }
      switch (attribute) {
      case 'POSITION':
        mesh.vertices = data;
        mesh.verticesAccessor = accessor;
        break;
      case 'NORMAL':
        mesh.normals = data;
        mesh.normalsAccessor = accessor;
        break;
      case 'TANGENT':
        mesh.tangents = data;
        mesh.tangentsAccessor = accessor;
        break;
      case 'TEXCOORD_0':
        mesh.texcoords = data;
        mesh.texcoordsAccessor = accessor;
        break;
      case 'INDEX':
        mesh.indices = data;
        mesh.indicesAccessor = accessor;
        break;
      default:
        console.warn('Unknown attribute semantic: ' + attribute);
      }

      mesh.accessorsLoading--;
      if (mesh.accessorsLoading === 0) {
        mesh.initBuffers(gl, gltf);
      }
    };

    var assets = mesh.scene.assets;
    var assetUrl = modelPath + bin;
    var promise;
    if (assets.hasOwnProperty(assetUrl)) {
      // We already requested this, and a promise already exists.
      promise = assets[assetUrl];
    } else {
      // We didn't request this yet, create a promise for it.
      var deferred = $.Deferred();
      assets[assetUrl] = deferred;
      promise = deferred.promise();
      var oReq = new XMLHttpRequest();
      oReq.open('GET', assetUrl, true);
      oReq.responseType = 'blob';
      oReq.onload = function(e) {
        deferred.resolve(oReq.response);
      };
      oReq.crossOrigin = 'anonymous';
      oReq.send();
    }

    // This will fire when the promise is resolved, or immediately if the promise has previously resolved.
    promise.then(function(blob) {
      reader.readAsArrayBuffer(blob);
    });
  }

  applyState(gl, globalState) {
    var program = this.program;
    var localState = this.localState;
    gl.useProgram(program);

    var applyUniform = function(u, uniformName) {
      if (!localState.uniformLocations[uniformName]) {
        localState.uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
      }

      if (u.funcName && localState.uniformLocations[uniformName] && u.vals) {
        gl[u.funcName](localState.uniformLocations[uniformName], ...u.vals);
      }
    };

    for (let uniform in globalState.uniforms) {
      applyUniform(globalState.uniforms[uniform], uniform);
    }

    for (let uniform in localState.uniforms) {
      applyUniform(localState.uniforms[uniform], uniform);
    }

    for (var attrib in localState.attributes) {
      var a = localState.attributes[attrib];
      for (var cmd in a.cmds) {
        var c = a.cmds[cmd];
        gl[c.funcName](...c.vals);
      }
    }
  }

  disableState(gl) {
    var localState = this.localState;
    for (var attrib in localState.attributes) {
      // do something.
      gl.disableVertexAttribArray(localState.attributes[attrib].a_attribute);
    }
  }
}
