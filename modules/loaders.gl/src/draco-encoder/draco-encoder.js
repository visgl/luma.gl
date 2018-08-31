// Copyright 2017 The Draco Authors.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

/* eslint-disable no-console */
/* global console */
const draco3d = require('draco3d');
const assert = require('assert');

const DEFAULT_ENCODING_OPTIONS = {
  speed: [5, 5],
  method: 'MESH_EDGEBREAKER_ENCODING',
  quantization: {
    POSITION: 10
  }
};

export default class DRACOEncoder {
  constructor() {
    this.encoderModule = draco3d.createEncoderModule({});
    this.encoder = new this.encoderModule.Encoder();
  }

  destroy() {
    this.this.encoderModule.destroy(this.encoder);
    this.encoder = null;
    this.encoderModule = null;
  }

  destroyEncodedObject(object) {
    if (object) {
      this.encoderModule.destroy(object);
    }
  }

  // Set encoding options.
  setOptions(opts) {
    if ('speed' in opts) {
      this.encoder.SetSpeedOptions(...opts.speed);
    }
    if ('method' in opts) {
      this.encoder.SetEncodingMethod(this.encoderModule[opts.method]);
    }
    if ('quantization' in opts) {
      for (const attribute in opts.quantization) {
        const bits = opts.quantization[attribute];
        this.encoder.SetAttributeQuantization(this.encoderModule[attribute], bits);
      }
    }
  }

  encodeCloud(mesh, decoder) {

    const newMesh = this.prepareMesh(mesh, decoder);

    this.setOptions(DEFAULT_ENCODING_OPTIONS);

    // Encoding.
    // console.log('Encoding...');
    const encodedData = new this.encoderModule.DracoInt8Array();
    const encodedLen = this.encoder.EncodeMeshToDracoBuffer(newMesh, encodedData);
    this.encoderModule.destroy(newMesh);
    if (!(encodedLen > 0)) {
      throw new Error('Draco encoding failed.');
    }

    console.log(`Encoded size is ${encodedLen}`);

    // Copy encoded data to buffer.
    const outputBuffer = new ArrayBuffer(encodedLen);
    const outputData = new Int8Array(outputBuffer);
    for (let i = 0; i < encodedLen; ++i) {
      outputData[i] = encodedData.GetValue(i);
    }

    this.encoderModule.destroy(encodedData);

    return outputData;
  }

  encodeMesh(mesh, decoder) {

    const newMesh = this.prepareMesh(mesh, decoder);

    this.setOptions(DEFAULT_ENCODING_OPTIONS);

    // Encoding.
    // console.log('Encoding...');
    const encodedData = new this.encoderModule.DracoInt8Array();
    const encodedLen = this.encoder.EncodeMeshToDracoBuffer(newMesh, encodedData);
    this.encoderModule.destroy(newMesh);
    if (!(encodedLen > 0)) {
      throw new Error('Draco encoding failed.');
    }

    console.log(`Encoded size is ${encodedLen}`);

    // Copy encoded data to buffer.
    const outputBuffer = new ArrayBuffer(encodedLen);
    const outputData = new Int8Array(outputBuffer);
    for (let i = 0; i < encodedLen; ++i) {
      outputData[i] = encodedData.GetValue(i);
    }

    this.encoderModule.destroy(encodedData);
    // this.encoderModule.destroy(meshBuilder);

    return outputData;
  }

  prepareMesh(mesh, decoder) {
    const numFaces = mesh.num_faces();
    const numIndices = numFaces * 3;
    const numPoints = mesh.num_points();
    const indices = new Uint32Array(numIndices);

    console.log(`Number of faces ${numFaces}`);
    console.log(`Number of vertices ${numPoints}`);

    const meshBuilder = new this.encoderModule.MeshBuilder();

    // Add Faces to mesh
    const integerArray = new this.decoderModule.DracoInt32Array();
    for (let i = 0; i < numFaces; ++i) {
      decoder.GetFaceFromMesh(mesh, i, integerArray);
      const index = i * 3;
      indices[index] = integerArray.GetValue(0);
      indices[index + 1] = integerArray.GetValue(1);
      indices[index + 2] = integerArray.GetValue(2);
    }
    this.decoderModule.destroy(integerArray);

    // Create a mesh object for storing mesh data.
    const newMesh = new this.encoderModule.Mesh();
    meshBuilder.AddFacesToMesh(newMesh, numFaces, indices);

    this._prepareMeshAttributes(mesh, newMesh, numPoints, meshBuilder, decoder);

    this.encoderModule.destroy(meshBuilder);

    return newMesh;
  }

  _prepareMeshAttributes(mesh, newMesh, numPoints, meshBuilder, decoder) {
    const attrs = {POSITION: 3, NORMAL: 3, COLOR: 3, TEX_COORD: 2};

    Object.keys(attrs).forEach((attr) => {
      const stride = attrs[attr];
      const numValues = numPoints * stride;
      const decoderAttr = this.decoderModule[attr];
      const encoderAttr = this.encoderModule[attr];
      const attrId = decoder.GetAttributeId(mesh, decoderAttr);

      if (attrId < 0) {
        return;
      }

      console.log(`Adding ${attr} attribute`);

      const attribute = decoder.GetAttribute(mesh, attrId);
      const attributeData = new this.decoderModule.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(mesh, attribute, attributeData);

      assert(numValues === attributeData.size(), 'Wrong attribute size.');

      const attributeDataArray = new Float32Array(numValues);
      for (let i = 0; i < numValues; ++i) {
        attributeDataArray[i] = attributeData.GetValue(i);
      }

      this.decoderModule.destroy(attributeData);
      meshBuilder.AddFloatAttributeToMesh(newMesh, encoderAttr, numPoints,
          stride, attributeDataArray);
    });
  }
}

/*
  encodeMesh(mesh, decoder) {
    const encoder = new this.encoderModule.Encoder();
    const meshBuilder = new this.encoderModule.MeshBuilder();

    // Create a mesh object for storing mesh data.
    const newMesh = new this.encoderModule.Mesh();

    const numFaces = mesh.num_faces();
    const numIndices = numFaces * 3;
    const numPoints = mesh.num_points();
    const indices = new Uint32Array(numIndices);

    console.log("Number of faces " + numFaces);
    console.log("Number of vertices " + numPoints);

    // Add Faces to mesh
    const ia = new this.decoderModule.DracoInt32Array();
    for (let i = 0; i < numFaces; ++i) {
      decoder.GetFaceFromMesh(mesh, i, ia);
      const index = i * 3;
      indices[index] = ia.GetValue(0);
      indices[index + 1] = ia.GetValue(1);
      indices[index + 2] = ia.GetValue(2);
    }
    this.decoderModule.destroy(ia);
    meshBuilder.AddFacesToMesh(newMesh, numFaces, indices);

    const attrs = {POSITION: 3, NORMAL: 3, COLOR: 3, TEX_COORD: 2};

    Object.keys(attrs).forEach((attr) => {
      const stride = attrs[attr];
      const numValues = numPoints * stride;
      const decoderAttr = this.decoderModule[attr];
      const encoderAttr = this.encoderModule[attr];
      const attrId = decoder.GetAttributeId(mesh, decoderAttr);

      if (attrId < 0) {
        return;
      }

      console.log("Adding %s attribute", attr);

      const attribute = decoder.GetAttribute(mesh, attrId);
      const attributeData = new this.decoderModule.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(mesh, attribute, attributeData);

      assert(numValues === attributeData.size(), 'Wrong attribute size.');

      const attributeDataArray = new Float32Array(numValues);
      for (let i = 0; i < numValues; ++i) {
        attributeDataArray[i] = attributeData.GetValue(i);
      }

      this.decoderModule.destroy(attributeData);
      meshBuilder.AddFloatAttributeToMesh(newMesh, encoderAttr, numPoints,
          stride, attributeDataArray);
    });

    let encodedData = new this.encoderModule.DracoInt8Array();
    // Set encoding options.
    encoder.SetSpeedOptions(5, 5);
    encoder.SetAttributeQuantization(this.encoderModule.POSITION, 10);
    encoder.SetEncodingMethod(this.encoderModule.MESH_EDGEBREAKER_ENCODING);

    // Encoding.
    console.log("Encoding...");
    const encodedLen = encoder.EncodeMeshToDracoBuffer(newMesh,
                                                       encodedData);
    this.encoderModule.destroy(newMesh);

    if (encodedLen > 0) {
      console.log("Encoded size is " + encodedLen);
    } else {
      console.log("Error: Encoding failed.");
    }
    // Copy encoded data to buffer.
    const outputBuffer = new ArrayBuffer(encodedLen);
    const outputData = new Int8Array(outputBuffer);
    for (let i = 0; i < encodedLen; ++i) {
      outputData[i] = encodedData.GetValue(i);
    }

    this.encoderModule.destroy(encodedData);
    this.encoderModule.destroy(encoder);
    this.encoderModule.destroy(meshBuilder);

    return outputData;
  }
*/
