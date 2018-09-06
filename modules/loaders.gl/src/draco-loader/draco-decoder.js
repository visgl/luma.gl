// DRACO decompressor

const draco3d = require('draco3d');
// const assert = require('assert');

const GEOMETRY_TYPE = {
  TRIANGULAR_MESH: 0,
  POINT_CLOUD: 1
};

// Native Draco attribute names to GLTF attribute names.
const ATTRIBUTE_MAP = {
  position: 'POSITION',
  normal: 'NORMAL',
  color: 'COLOR_0',
  uv: 'TEXCOORD_0'
};

export default class DRACODecoder {
  constructor() {
    this.decoderModule = draco3d.createDecoderModule({});
  }

  // isVersionSupported(version, callback) {
  //   DRACOLoader.getDecoderModule()
  //     .then(function (module) {
  //       callback(module.decoder.isVersionSupported(version));
  //     });
  // }

  // getAttributeOptions(attributeName) {
  //     if (typeof this.attributeOptions[attributeName] === 'undefined')
  //       this.attributeOptions[attributeName] = {};
  //     return this.attributeOptions[attributeName];
  // }

  destroy() {
    // this.decoderModule.destroy();
  }

  destroyGeometry(dracoGeometry) {
    if (dracoGeometry) {
      this.decoderModule.destroy(dracoGeometry.dracoGeometry);
    }
  }

  // NOTE: caller must call `destroyGeometry` on the return value after using it
  decode(arrayBuffer) {
    const buffer = new this.decoderModule.DecoderBuffer();
    buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);

    const decoder = new this.decoderModule.Decoder();

    const data = {};
    let dracoStatus;
    let dracoGeometry;

    try {
      const geometryType = decoder.GetEncodedGeometryType(buffer);
      switch (geometryType) {

      case this.decoderModule.TRIANGULAR_MESH:
        dracoGeometry = new this.decoderModule.Mesh();
        dracoStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
        data.header = {
          type: GEOMETRY_TYPE.TRIANGULAR_MESH,
          faceCount: dracoGeometry.num_faces(),
          attributeCount: dracoGeometry.num_attributes(),
          vertexCount: dracoGeometry.num_points()
        };
        break;

      case this.decoderModule.POINT_CLOUD:
        dracoGeometry = new this.decoderModule.PointCloud();
        dracoStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
        data.header = {
          type: GEOMETRY_TYPE.POINT_CLOUD,
          attributeCount: dracoGeometry.num_attributes(),
          vertexCount: dracoGeometry.num_points()
        };
        break;

      default:
        throw new Error('Unknown DRACO geometry type.');
      }

      if (!dracoStatus.ok() || !dracoGeometry.ptr) {
        const message = `DRACO decompression failed: ${dracoStatus.error_msg()}`;
        // console.error(message);
        if (dracoGeometry) {
          this.decoderModule.destroy(dracoGeometry);
        }
        throw new Error(message);
      }

      this.extractDRACOGeometry(decoder, dracoGeometry, data);

    } finally {
      this.decoderModule.destroy(decoder);
      this.decoderModule.destroy(buffer);
    }

    return data;
  }

  extractDRACOGeometry(decoder, dracoGeometry, geometry, geometryType) {
    // const numPoints = dracoGeometry.num_points();
    // const numAttributes = dracoGeometry.num_attributes();

    // Structure for converting to WebGL framework specific attributes later
    const attributes = this.getAttributes(decoder, dracoGeometry);

    const positionAttribute = this.getPositionAttribute(decoder, dracoGeometry);

    this.getPositionAttributeMetadata(positionAttribute);

    attributes.POSITION = positionAttribute;

    // For meshes, we need indices to define the faces.
    if (geometryType === this.decoderModule.TRIANGULAR_MESH) {
      attributes.indices = this.drawMode === 'TRIANGLE_STRIP' ?
        this.getMeshStripIndices() :
        this.getMeshFaceIndices();
    }

    attributes.drawMode = this.drawMode;

    geometry.attributes = attributes;

    return geometry;
  }

  getPositionAttribute(decoder, dracoGeometry) {
    // Ensure we at least have position attribute.
    const positionAttributeId = decoder.GetAttributeId(dracoGeometry, this.decoderModule.POSITION);
    if (positionAttributeId === -1) {
      throw new Error('DRACO decompressor: No position attribute found.');
    }

    const dracoAttribute = decoder.GetAttribute(dracoGeometry, positionAttributeId);
    const {typedArray} = this.getAttributeTypedArray(
      decoder, dracoGeometry, dracoAttribute, Float32Array, 'position');
    return typedArray;
  }

  getPositionAttributeMetadata(positionAttribute) {
    this.metadata = this.metadata || {};
    this.metadata.attributes = this.metadata.attributes || {};

    const posTransform = new this.decoderModule.AttributeQuantizationTransform();
    if (posTransform.InitFromAttribute(positionAttribute)) {
      // Quantized attribute. Store the quantization parameters into the
      // THREE.js attribute.
      this.metadata.attributes.position.isQuantized = true;
      this.metadata.attributes.position.maxRange = posTransform.range();
      this.metadata.attributes.position.numQuantizationBits = posTransform.quantization_bits();
      this.metadata.attributes.position.minValues = new Float32Array(3);
      for (let i = 0; i < 3; ++i) {
        this.metadata.attributes.position.minValues[i] = posTransform.min_value(i);
      }
    }
    this.decoderModule.destroy(posTransform);
  }

  getAttributes(decoder, dracoGeometry) {
    const attributes = {};
    // const attributeUniqueIdMap = {};

    // Add native Draco attribute type to geometry.
    for (const attributeName in ATTRIBUTE_MAP) {
      // The native attribute type is only used when no unique Id is provided.
      // For example, loading .drc files.

      // if (attributeUniqueIdMap[attributeName] === undefined) {
      const attributeType = this.decoderModule[attributeName];
      const attributeId = decoder.GetAttributeId(dracoGeometry, attributeType);
      if (attributeId !== -1) {
        const dracoAttribute = decoder.GetAttribute(dracoGeometry, attributeId);
        this.getAttributeTypedArray(
          decoder, dracoGeometry, dracoAttribute, Float32Array, attributeName
        );
      }
      // }
    }

    // // Add attributes of user specified unique id. E.g. GLTF models.
    // for (const attributeName in attributeUniqueIdMap) {
    //   const attributeType = attributeTypeMap[attributeName] || Float32Array;
    //   const attributeId = attributeUniqueIdMap[attributeName];
    //   const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeId);
    //   this.getAttributeTypedArray(decoder, dracoGeometry, attribute,attributeName,attributeType);
    // }

    return attributes;
  }

  // For meshes, we need indices to define the faces.
  getMeshFaceIndices(decoder, dracoGeometry) {
    // Example on how to retrieve mesh and attributes.
    const numFaces = dracoGeometry.num_faces();

    const numIndices = numFaces * 3;
    const indices = new Uint32Array(numIndices);
    const dracoArray = new this.decoderModule.DracoInt32Array();
    for (let i = 0; i < numFaces; ++i) {
      decoder.GetFaceFromMesh(dracoGeometry, i, dracoArray);
      const index = i * 3;
      indices[index] = dracoArray.GetValue(0);
      indices[index + 1] = dracoArray.GetValue(1);
      indices[index + 2] = dracoArray.GetValue(2);
    }

    this.decoderModule.destroy(dracoArray);
    return indices;
  }

  // For meshes, we need indices to define the faces.
  getMeshStripIndices(decoder, dracoGeometry) {
    const dracoArray = new this.decoderModule.DracoInt32Array();
    /* const numStrips = */ decoder.GetTriangleStripsFromMesh(dracoGeometry, dracoArray);
    const indices = new Uint32Array(dracoArray.size());
    for (let i = 0; i < dracoArray.size(); ++i) {
      indices[i] = dracoArray.GetValue(i);
    }
    this.decoderModule.destroy(dracoArray);
    return indices;
  }

  getAttributeTypedArray(decoder, dracoGeometry, dracoAttribute, attributeType, attributeName) {
    if (dracoAttribute.ptr === 0) {
      const message = `DRACO decode bad attribute ${attributeName}`;
      // console.error(message);
      throw new Error(message);
    }

    const numComponents = dracoAttribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;

    let dracoArray;
    let typedArray;

    switch (attributeType) {

    case Float32Array:
      dracoArray = new this.decoderModule.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
      typedArray = new Float32Array(numValues);
      break;

    case Int8Array:
      dracoArray = new this.decoderModule.DracoInt8Array();
      decoder.GetAttributeInt8ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
      typedArray = new Int8Array(numValues);
      break;

    case Int16Array:
      dracoArray = new this.decoderModule.DracoInt16Array();
      decoder.GetAttributeInt16ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
      typedArray = new Int16Array(numValues);
      break;

    case Int32Array:
      dracoArray = new this.decoderModule.DracoInt32Array();
      decoder.GetAttributeInt32ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
      typedArray = new Int32Array(numValues);
      break;

    case Uint8Array:
      dracoArray = new this.decoderModule.DracoUInt8Array();
      decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
      typedArray = new Uint8Array(numValues);
      break;

    case Uint16Array:
      dracoArray = new this.decoderModule.DracoUInt16Array();
      decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
      typedArray = new Uint16Array(numValues);
      break;

    case Uint32Array:
      dracoArray = new this.decoderModule.DracoUInt32Array();
      decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
      typedArray = new Uint32Array(numValues);
      break;

    default:
      const errorMsg = 'DRACO decoder: unexpected attribute type.';
      // console.error(errorMsg);
      throw new Error(errorMsg);

    }

    // Copy data from decoder.
    for (let i = 0; i < numValues; i++) {
      typedArray[i] = dracoArray.GetValue(i);
    }

    this.decoderModule.destroy(dracoArray);

    return {typedArray, components: numComponents};
  }
}
