// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  expandArrowVector,
  makeArrowGPUTable,
  makeArrowGPUVector,
  makeArrowFixedSizeListVector,
  makeArrowMatrix4x4Vector,
  makeGPUGeometryFromArrow,
  type ArrowTableGeometry,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import type {CommandEncoder, Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {CubeGeometry, PickingManager} from '@luma.gl/engine';
import {GPURenderable, type GPUTable, type GPUTableModel, type GPUVector} from '@luma.gl/tables';
import {Matrix4, radians} from '@math.gl/core';
import * as arrow from 'apache-arrow';
import {
  MESH_GEOMETRY_MATRIX_ARROW_PATHS,
  createMeshGeometryModel,
  createMeshGeometryPickingModel,
  createMeshGeometryShaderInputs,
  getMeshGeometryShaderLayout,
  type MeshGeometryShaderInputs
} from './mesh-geometry-model';

const FACE_NAMES = ['Front', 'Back', 'Top', 'Bottom', 'Right', 'Left'] as const;
const CUBE_COLUMNS = 3;
const CUBE_ROWS = 2;
const CUBE_COUNT = CUBE_COLUMNS * CUBE_ROWS;
export const ARROW_MESH_GEOMETRY_CUBE_COUNT = CUBE_COUNT;
const MATRIX_COMPONENT_COUNT = 16;

type CubeTransform = {
  translation: [number, number, number];
  rotation: [number, number, number];
  rotationRate: [number, number, number];
  scale: [number, number, number];
  matrix: Matrix4;
};

/** Public configuration for the Arrow mesh/matrix example layer. */
export type ArrowMeshRendererProps = {
  /** Debug label used for generated model and picking resources. */
  id?: string;
  /** Optional per-face RGBA colors. Defaults to the example face metadata colors. */
  faceColors?: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  /** Camera eye position used to build the view matrix. */
  cameraEye?: [number, number, number];
  /** Camera target used to build the view matrix. */
  cameraCenter?: [number, number, number];
  /** Perspective field of view in degrees. */
  fieldOfViewDegrees?: number;
  /** Perspective near plane. */
  near?: number;
  /** Perspective far plane. */
  far?: number;
  /** Render pass clear color. */
  clearColor?: [number, number, number, number];
  /** Render pass clear depth. */
  clearDepth?: number;
  /** Render parameters forwarded to generated models. */
  parameters?: Record<string, unknown>;
};

const DEFAULT_MESH_RENDERER_ID = 'arrow-mesh-geometry';
const DEFAULT_CAMERA_EYE: [number, number, number] = [6.4, 4.8, 7.4];
const DEFAULT_CAMERA_CENTER: [number, number, number] = [0, 0, 0];
const DEFAULT_FIELD_OF_VIEW_DEGREES = 60;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 30;
const DEFAULT_CLEAR_COLOR: [number, number, number, number] = [0.03, 0.04, 0.08, 1];
const DEFAULT_CLEAR_DEPTH = 1;

/** Example layer that renders Arrow mesh attributes with an instanced Arrow matrix column. */
export class ArrowMeshRenderer extends GPURenderable<[AnimationProps]> {
  readonly device: Device;
  readonly geometry: ArrowTableGeometry;
  readonly model: GPUTableModel;
  readonly pickingModel: GPUTableModel | null;
  readonly matrixTable: GPUTable;
  readonly picker: PickingManager;
  readonly faceColors?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  readonly faceNames: arrow.Vector<arrow.Utf8>;
  readonly matrixValues = new Float32Array(CUBE_COUNT * MATRIX_COMPONENT_COUNT);
  readonly cubeTransforms = makeCubeTransforms();
  readonly shaderInputs: MeshGeometryShaderInputs = createMeshGeometryShaderInputs();
  props: ArrowMeshRendererProps;

  constructor(device: Device, props: ArrowMeshRendererProps = {}) {
    super();
    this.device = device;
    this.props = props;

    const faceMetadata = makeFaceMetadataTable();
    const defaultFaceColors = faceMetadata.getChild('COLOR_0') as arrow.Vector<
      arrow.FixedSizeList<arrow.Float32>
    >;
    const faceColors = props.faceColors ?? defaultFaceColors;
    const arrowMesh = makeArrowMeshTable(device.type, faceColors);
    this.faceNames = faceMetadata.getChild('name') as arrow.Vector<arrow.Utf8>;
    this.faceColors =
      device.type === 'webgpu'
        ? makeArrowGPUVector(device, faceColors, {name: 'faceColors'})
        : undefined;

    this.updateInstanceMatrices(0);
    this.geometry = makeGPUGeometryFromArrow(device, {arrowMesh});
    this.matrixTable = makeArrowGPUTable(device, makeInstanceArrowTable(this.matrixValues), {
      shaderLayout: getMeshGeometryShaderLayout(device),
      arrowPaths: MESH_GEOMETRY_MATRIX_ARROW_PATHS
    });
    this.model = createMeshGeometryModel(device, {
      id: props.id ?? DEFAULT_MESH_RENDERER_ID,
      geometry: this.geometry,
      table: this.matrixTable,
      shaderInputs: this.shaderInputs,
      faceColors: this.faceColors,
      parameters: props.parameters
    });
    this.pickingModel = createMeshGeometryPickingModel(device, {
      id: `${this.model.id || DEFAULT_MESH_RENDERER_ID}-picking`,
      geometry: this.geometry,
      table: this.matrixTable,
      shaderInputs: this.shaderInputs,
      faceColors: this.faceColors,
      parameters: props.parameters
    });
    this.picker = new PickingManager(device, {
      shaderInputs: this.shaderInputs,
      mode: 'auto',
      getTooltip: ({batchIndex, objectIndex}) => {
        if (batchIndex === null || objectIndex === null) {
          return null;
        }
        const cubeIndex = Math.floor(objectIndex / FACE_NAMES.length);
        const faceIndex = objectIndex % FACE_NAMES.length;
        const faceName = this.faceNames.get(faceIndex);
        return typeof faceName === 'string' ? `Cube ${cubeIndex + 1}, ${faceName} face` : null;
      }
    });
  }

  setProps(props: Partial<ArrowMeshRendererProps>): void {
    this.props = {...this.props, ...props};
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.model.predraw(commandEncoder);
    this.pickingModel?.predraw(commandEncoder);
  }

  override draw({aspect, device, tick, _mousePosition}: AnimationProps): void {
    this.updateInstanceMatrices(tick);
    this.shaderInputs.setProps({
      app: {
        viewMatrix: new Matrix4().lookAt({
          eye: this.props.cameraEye ?? DEFAULT_CAMERA_EYE,
          center: this.props.cameraCenter ?? DEFAULT_CAMERA_CENTER
        }),
        projectionMatrix: new Matrix4().perspective({
          fovy: radians(this.props.fieldOfViewDegrees ?? DEFAULT_FIELD_OF_VIEW_DEGREES),
          aspect,
          near: this.props.near ?? DEFAULT_NEAR,
          far: this.props.far ?? DEFAULT_FAR
        })
      }
    });
    this.shaderInputs.setProps({picking: {isActive: false, batchIndex: 0}});

    const renderPass = device.beginRenderPass({
      clearColor: this.props.clearColor ?? DEFAULT_CLEAR_COLOR,
      clearDepth: this.props.clearDepth ?? DEFAULT_CLEAR_DEPTH
    });
    this.model.draw(renderPass);
    renderPass.end();
    this.pickFace(_mousePosition);
  }

  destroy(): void {
    this.picker.destroy();
    this.pickingModel?.destroy();
    this.model.destroy();
    this.matrixTable.destroy();
    this.faceColors?.destroy();
  }

  updateInstanceMatrices(tick: number): void {
    for (const [cubeIndex, cubeTransform] of this.cubeTransforms.entries()) {
      cubeTransform.rotation[0] += cubeTransform.rotationRate[0];
      cubeTransform.rotation[1] += cubeTransform.rotationRate[1];
      cubeTransform.rotation[2] += cubeTransform.rotationRate[2];
      cubeTransform.matrix
        .identity()
        .translate([
          cubeTransform.translation[0],
          cubeTransform.translation[1],
          cubeTransform.translation[2] + Math.sin(tick * 0.01 + cubeIndex) * 0.3
        ])
        .rotateXYZ(cubeTransform.rotation)
        .scale(cubeTransform.scale);

      const matrixOffset = cubeIndex * MATRIX_COMPONENT_COUNT;
      for (let matrixComponent = 0; matrixComponent < MATRIX_COMPONENT_COUNT; matrixComponent++) {
        this.matrixValues[matrixOffset + matrixComponent] = cubeTransform.matrix[matrixComponent];
      }
    }

    this.matrixTable?.gpuVectors.matrix?.buffer.write(this.matrixValues);
  }

  pickFace(mousePosition: number[] | null | undefined): void {
    if (!this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    const pickingPass = this.picker.beginRenderPass();
    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    (this.pickingModel ?? this.model).draw(pickingPass);
    pickingPass.end();
    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }
}

function makeArrowMeshTable(
  deviceType: AnimationProps['device']['type'],
  faceColors: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>
): ArrowMeshTable {
  const cubeGeometry = new CubeGeometry({indices: true});
  const cubePositions = cubeGeometry.attributes.positions?.value;
  const cubeFaceIndices = cubeGeometry.attributes.faceIndex?.value;
  const cubeIndices = cubeGeometry.indices?.value;

  if (!(cubePositions instanceof Float32Array)) {
    throw new Error('Matrices requires CubeGeometry positions');
  }
  if (!(cubeFaceIndices instanceof Uint32Array)) {
    throw new Error('Matrices requires CubeGeometry faceIndex values');
  }
  if (!(cubeIndices instanceof Uint16Array) && !(cubeIndices instanceof Uint32Array)) {
    throw new Error('Matrices requires CubeGeometry indices');
  }

  const positions = makeArrowFixedSizeListVector(new arrow.Float32(), 3, cubePositions);
  const table =
    deviceType === 'webgpu'
      ? makeWebGPUMeshTable(positions, cubeFaceIndices)
      : makeWebGLMeshTable(
          positions,
          expandArrowVector(faceColors, cubeFaceIndices),
          cubeFaceIndices
        );

  return {
    shape: 'arrow-table',
    topology: 'triangle-list',
    indices: {
      value: cubeIndices,
      size: 1
    },
    data: table
  };
}

function makeWebGPUMeshTable(
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
  faceIndices: Uint32Array
): arrow.Table {
  const schema = new arrow.Schema([
    new arrow.Field(
      'POSITION',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field('faceIndex', new arrow.Uint32(), false)
  ]);

  return new arrow.Table(schema, {
    POSITION: positions,
    faceIndex: arrow.makeVector(faceIndices)
  });
}

function makeWebGLMeshTable(
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
  colors: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
  faceIndices: Uint32Array
): arrow.Table {
  const schema = new arrow.Schema([
    new arrow.Field(
      'POSITION',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field(
      'COLOR_0',
      new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field('faceIndices', new arrow.Uint32(), false)
  ]);

  return new arrow.Table(schema, {
    POSITION: positions,
    COLOR_0: colors,
    faceIndices: arrow.makeVector(faceIndices)
  });
}

function makeInstanceArrowTable(matrixValues: Float32Array): arrow.Table {
  return new arrow.Table({
    matrix: makeArrowMatrix4x4Vector(matrixValues, {
      order: 'column-major',
      layout: 'wgsl-storage'
    })
  });
}

function makeCubeTransforms(): CubeTransform[] {
  const cubeTransforms: CubeTransform[] = [];

  for (let rowIndex = 0; rowIndex < CUBE_ROWS; rowIndex++) {
    for (let columnIndex = 0; columnIndex < CUBE_COLUMNS; columnIndex++) {
      const cubeIndex = rowIndex * CUBE_COLUMNS + columnIndex;
      const scale = 0.72 + (cubeIndex % 3) * 0.08;
      cubeTransforms.push({
        translation: [
          (columnIndex - (CUBE_COLUMNS - 1) / 2) * 2.1,
          (rowIndex - (CUBE_ROWS - 1) / 2) * 2.1,
          (cubeIndex % 2 === 0 ? -1 : 1) * 0.45
        ],
        rotation: [cubeIndex * 0.17, cubeIndex * 0.31, cubeIndex * 0.11],
        rotationRate: [0.004 + cubeIndex * 0.0003, 0.006 + cubeIndex * 0.0004, 0.002],
        scale: [scale, scale, scale],
        matrix: new Matrix4()
      });
    }
  }

  return cubeTransforms;
}

function makeFaceMetadataTable(): arrow.Table {
  const schema = new arrow.Schema([
    new arrow.Field('name', new arrow.Utf8(), false),
    new arrow.Field(
      'COLOR_0',
      new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Float32(), false)),
      false
    )
  ]);

  return new arrow.Table(schema, {
    name: arrow.vectorFromArray(FACE_NAMES, new arrow.Utf8()),
    COLOR_0: makeArrowFixedSizeListVector(
      new arrow.Float32(),
      4,
      new Float32Array([
        1.0, 0.32, 0.32, 1.0, 1.0, 0.67, 0.3, 1.0, 0.98, 0.9, 0.36, 1.0, 0.46, 0.84, 0.42, 1.0,
        0.28, 0.77, 1.0, 1.0, 0.58, 0.47, 1.0, 1.0
      ])
    )
  });
}
