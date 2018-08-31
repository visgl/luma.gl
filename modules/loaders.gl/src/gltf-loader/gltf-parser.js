export default class GLTFParser {
  constructor(gltf) {
    this.gltf = gltf;
    this.log = console; // eslint-disable-line
    this.out = {};
  }

  parse(options = {}) {
    // Load all images
    this.out.images = (this.gltf.images || [])
      .map(image => this.parseImage(image))
      .filter(Boolean);

    // Parse all scenes
    this.out.scenes = (this.gltf.scenes || [])
      .map(scene => this.parseImage(scene))
      .filter(Boolean);

    if (this.gltf.scene) {
      this.out.scene = this.gltf.scenes[this.gltf.scene];
    }
  }

  parseScene() {

  }

  parseImage(image) {
    return this.config.createImage(image);
  }

  parseMesh(mesh) {
    // Each primitive is intended to correspond to a draw call
    const primitives = (mesh.primitives || []).map(primitive => this.parseMeshPrimitive(primitive));

    return primitives.length === 1 ? primitives[0] : this.config.createGroup(primitives);
  }

  parseMeshPrimitive(primitive) {
    // if (!primitive.attributes)
    //   this.log.warn(primitive without attributes`)
    let attributes = primitive.attributes || {};
    attributes = this.config.mapAttributes(attributes);
    return attributes;
  }

  parseAccessor(accessor) {
    return this.config.createBuffer(accessor);
  }

  // ACCESSORS

  getScene(index) {
    return this._get('scenes', index);
  }

  getNode(index) {
    return this._get('nodes', index);
  }

  getSkin(index) {
    return this._get('skins', index);
  }

  getMesh(index) {
    return this._get('meshes', index);
  }

  getMaterial(index) {
    return this._get('materials', index);
  }

  getAccessor(index) {
    return this._get('accessors', index);
  }

  getTexture(index) {
    return this._get('textures', index);
  }

  getSampler(index) {
    return this._get('samplers', index);
  }

  getImage(index) {
    return this._get('images', index);
  }

  getBufferView(index) {
    return this._get('bufferViews', index);
  }

  getBuffer(index) {
    return this._get('buffers', index);
  }

  _get(array, index) {
    const object = this.gltf[array] && this.gltf[array][index];
    if (!object) {
      console.warn(`glTF file error: Could not resolve ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  // PREPARATION STEP: CROSS-LINK INDEX RESOLUTION, ENUM LOOKUP, CONVENIENCE CALCULATIONS

  /* eslint-disable complexity */
  resolve(options = {}) {
    const {gltf} = this;

    (gltf.bufferViews || []).forEach((bufView, i) => this.resolveBufferView(bufView, i));

    (gltf.images || []).forEach((image, i) => this.resolveImage(image, i));
    (gltf.samplers || []).forEach((sampler, i) => this.resolveSampler(sampler, i));
    (gltf.textures || []).forEach((texture, i) => this.resolveTexture(texture, i));

    (gltf.accessors || []).forEach((accessor, i) => this.resolveAccessor(accessor, i));
    (gltf.materials || []).forEach((material, i) => this.resolveMaterial(material, i));
    (gltf.meshes || []).forEach((mesh, i) => this.resolveMesh(mesh, i));

    (gltf.nodes || []).forEach((node, i) => this.resolveNode(node, i));

    (gltf.skins || []).forEach((skin, i) => this.resolveSkin(skin, i));

    (gltf.scenes || []).forEach((scene, i) => this.resolveScene(scene, i));

    if (gltf.scene) {
      gltf.scene = gltf.scenes[this.gltf.scene];
    }

    return gltf;
  }
  /* eslint-enable complexity */

  resolveScene(scene, index) {
    scene.id = `scene-${index}`;
    scene.nodes = (scene.nodes || []).map(node => this.getNode(node));
  }

  resolveNode(node, index) {
    node.id = `node-${index}`;
    node.children = (node.children || []).map(child => this.getNode(child));
    if (node.mesh) {
      node.mesh = this.getMesh(node.mesh);
    }
    if (node.camera) {
      node.camera = this.getCamera(node.camera);
    }
    if (node.skin) {
      node.skin = this.getSkin(node.skin);
    }
  }

  resolveSkin(skin, index) {
    skin.id = `skin-${index}`;
    skin.inverseBindMatrices = this.getAccessor(skin.inverseBindMatrices);
  }

  resolveMesh(mesh, index) {
    mesh.id = `mesh-${index}`;
    for (const primitive of mesh.primitives) {
      for (const attribute in primitive.attributes) {
        primitive.attributes[attribute] = this.getAccessor(primitive.attributes[attribute]);
      }
      if (primitive.indices) {
        primitive.indices = this.getAccessor(primitive.indices);
      }
      if (primitive.material) {
        primitive.material = this.getMaterial(primitive.material);
      }
    }
  }

  resolveMaterial(material, index) {
    material.id = `material-${index}`;
    if (material.normalTexture) {
      this.normalTexture = this.getTexture(material.normalTexture);
    }
    if (material.occlusionTexture) {
      this.occlusionTexture = this.getTexture(material.occlusionTexture);
    }
    if (material.emissiveTexture) {
      this.emissiveTexture = this.getTexture(material.emissiveTexture);
    }

    if (material.pbrMetallicRoughness) {
      const mr = material.pbrMetallicRoughness;
      if (mr.baseColorTexture) {
        mr.baseColorTexture = this.getTexture(mr.baseColorTexture);
      }
      if (mr.metallicRoughnessTexture) {
        mr.metallicRoughnessTexture = this.getTexture(mr.metallicRoughnessTexture);
      }
    }
  }

  resolveAccessor(accessor, index) {
    accessor.id = `accessor-${index}`;
    accessor.bufferView = this.getBufferView(accessor.bufferView);

    // Look up enums
    accessor.bytesPerComponent = this.enumAccessorBytes(accessor);
    accessor.components = this.enumAccessorType(accessor);
    accessor.bytesPerElement = accessor.bytesPerComponent * accessor.components;
  }

  resolveTexture(texture, index) {
    texture.id = `texture-${index}`;
    texture.sampler = this.getSampler(texture.sampler);
    texture.source = this.getImage(texture.source);
  }

  resolveSampler(sampler, index) {
    sampler.id = `sampler-${index}`;
    // Map textual parameters to GL parameter values
    this.parameters = {};
    for (const key in sampler) {
      const glEnum = this.enumSamplerParameter(sampler[key]);
      this.parameters[glEnum] = sampler[key];
    }
  }

  resolveImage(image, index) {
    image.id = `image-${index}`;
    if (image.bufferView) {
      image.bufferView = this.getBufferView(image.bufferView);
    }
    // TODO - Handle URIs etc
  }

  resolveBufferView(bufferView, index) {
    bufferView.id = `bufferView-${index}`;
    bufferView.buffer = this.getBuffer(bufferView.buffer);
  }

  // PREPROC

  resolveCamera(camera) {
    // TODO - resolve step should not create
    if (camera.perspective) {
      camera.matrix = this.config.createPerspectiveMatrix(camera.perspective);
    }
    if (camera.orthographic) {
      camera.matrix = this.config.createOrthographicMatrix(camera.orthographic);
    }
  }

  // ENUM LOOKUP

  enumAccessorBytes(componentType) {
    const BYTES = {
      5120: 1, // BYTE
      5121: 1, // UNSIGNED_BYTE
      5122: 2, // SHORT
      5123: 2, // UNSIGNED_SHORT
      5125: 4, // UNSIGNED_INT
      5126: 4  // FLOAT
    };
    return BYTES[componentType];
  }

  enumAccessorType(type) {
    const COMPONENTS = {
      SCALAR: 1,
      VEC2: 2,
      VEC3: 3,
      VEC4: 4,
      MAT2: 4,
      MAT3: 9,
      MAT4: 16
    };
    return COMPONENTS[type];
  }

  enumSamplerParameter(parameter) {
    const GL_TEXTURE_MAG_FILTER = 0x2800;
    const GL_TEXTURE_MIN_FILTER = 0x2801;
    const GL_TEXTURE_WRAP_S = 0x2802;
    const GL_TEXTURE_WRAP_T = 0x2803;

    const PARAMETER_MAP = {
      magFilter: GL_TEXTURE_MAG_FILTER,
      minFilter: GL_TEXTURE_MIN_FILTER,
      wrapS: GL_TEXTURE_WRAP_S,
      wrapT: GL_TEXTURE_WRAP_T
    };

    return PARAMETER_MAP[parameter];
  }
}
