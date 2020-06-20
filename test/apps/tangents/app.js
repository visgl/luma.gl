import {AnimationLoop, Model, CylinderGeometry, calculateTangents} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {Matrix4} from '@math.gl/core';
import {Vector3, radians} from '@math.gl/core';
import Controller from './controller';

const vs = `\
  #define SHADER_NAME simpleVs;

  attribute vec3 positions;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main(void) {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(positions, 1.0);
  }
`;

const fs = `\
  #define SHADER_NAME simpleFs;

  precision highp float;

  uniform vec4 u_Color;

  void main(void) {
    gl_FragColor = u_Color;
  }
`;

const tangentVs = `\
  #define SHADER_NAME simpleVs;

  attribute vec3 positions;
  attribute vec3 colors;
  attribute vec3 instancePositions;
  attribute vec3 instanceNormals;
  attribute vec3 instanceTangents;
  attribute vec3 instanceBitangents;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  
  varying vec3 vColor;

  void main(void) {
    vColor = colors;
    mat3 instanceMatrix = mat3(instanceTangents, instanceBitangents, instanceNormals);
    
    vec4 pos = vec4(normalize(instanceMatrix * positions) * 0.2, 1.0);
    pos.xyz += instancePositions;
    pos = u_ModelMatrix * pos;

    gl_Position = u_ProjectionMatrix * u_ViewMatrix * pos;
  }
`;

const tangentFs = `\
  precision highp float;

  varying vec3 vColor;
  void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

const loop = new AnimationLoop({
  onInitialize({gl}) {
    this._controller = new Controller(gl.canvas);
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL,
      [gl.LINE_WIDTH]: 2
    });

    const modelMatrix = new Matrix4().rotateX(radians(30)).rotateY(30);
    const projectionMatrix = new Matrix4();

    const geometry = new CylinderGeometry({
      radius: 1,
      nradial: 10,
      nvertical: 10
    });

    const {
      attributes: {NORMAL, TEXCOORD_0, POSITION},
      indices
    } = geometry;

    const {tangents, bitangents} = calculateTangents(
      POSITION.value,
      TEXCOORD_0.value,
      indices.value
    );

    const normal = NORMAL.value;
    const position = POSITION.value;
    const scratchP = new Vector3();
    const scratchT = new Vector3();
    const scratchB = new Vector3();
    const scratchN = new Vector3();

    const count = position.length / 3;
    const instanceTangents = new Float32Array(count * 3);
    const instanceBitangents = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const index = i * 3;
      scratchP.set(position[index], position[index + 1], position[index + 2]);
      scratchT.set(tangents[index], tangents[index + 1], tangents[index + 2]);
      scratchB.set(bitangents[index], bitangents[index + 1], bitangents[index + 2]);
      scratchN.set(normal[index], normal[index + 1], normal[index + 2]);

      scratchT.normalize();
      scratchB.normalize();

      instanceTangents[i * 3 + 0] = scratchT.x;
      instanceTangents[i * 3 + 1] = scratchT.y;
      instanceTangents[i * 3 + 2] = scratchT.z;
      instanceBitangents[i * 3 + 0] = scratchB.x;
      instanceBitangents[i * 3 + 1] = scratchB.y;
      instanceBitangents[i * 3 + 2] = scratchB.z;
    }

    const cubeModel = new Model(gl, {
      vs,
      fs,
      geometry
    });

    const tangentModel = new Model(gl, {
      vs: tangentVs,
      fs: tangentFs,
      attributes: {
        positions: new Buffer(
          gl,
          new Float32Array([
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0
          ])
        ),
        colors: new Buffer(
          gl,
          new Float32Array([
            1.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            1.0
          ])
        ),
        instanceNormals: new Buffer(gl, NORMAL.value),
        instancePositions: new Buffer(gl, POSITION.value),
        instanceTangents: new Buffer(gl, instanceTangents),
        instanceBitangents: new Buffer(gl, instanceBitangents)
      },
      vertexCount: 6,
      instanceCount: count
    });

    return {
      cubeModel,
      tangentModel,
      modelMatrix,
      projectionMatrix
    };
  },

  onRender({gl, aspect, tangentModel, cubeModel, modelMatrix, projectionMatrix}) {
    const {viewMatrix} = this._controller.getMatrices();
    projectionMatrix.perspective({fov: Math.PI / 3, aspect});

    clear(gl, {color: [0, 0, 0, 1]});

    cubeModel
      .setUniforms({
        u_ModelMatrix: modelMatrix,
        u_ViewMatrix: viewMatrix,
        u_ProjectionMatrix: projectionMatrix,
        u_Color: [1.0, 1.0, 1.0, 0.7]
      })
      .setDrawMode(gl.LINES)
      .draw();

    tangentModel
      .setUniforms({
        u_ModelMatrix: modelMatrix,
        u_ViewMatrix: viewMatrix,
        u_ProjectionMatrix: projectionMatrix
      })
      .setDrawMode(gl.LINES)
      .draw();
  }
});

loop.start();
