// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Framebuffer, type ShaderLayout} from '@luma.gl/core';
import {makeArrowFixedSizeListVector, makeGPUTableFromArrowTable} from '@luma.gl/arrow';
import {getGPUVectorBuffer, getRequiredGPUVector} from '@luma.gl/gpgpu/gpu-data';
import {TableTransform} from '@luma.gl/experimental/gpu-tables';
import {
  AnimationLoopTemplate,
  AnimationProps,
  DynamicBuffer,
  Model,
  ShaderInputs,
  Swap,
  makeRandomGenerator
} from '@luma.gl/engine';
import {picking, type ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';
import {TRANSFORM_INFO_HTML} from './app-ui';

// Ensure repeatable rendertests
const random = makeRandomGenerator();

import {COMPUTE_VS, DRAW_FS, DRAW_VS} from './shaders';

const NUM_INSTANCES = 1000;

type AppUniforms = {
  time: number;
};

const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    time: 'f32'
  }
};

const TRANSFORM_SHADER_LAYOUT = {
  attributes: [
    {name: 'oldPositions', location: 0, type: 'vec2<f32>'},
    {name: 'oldRotations', location: 1, type: 'f32'}
  ],
  bindings: []
} satisfies ShaderLayout;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = TRANSFORM_INFO_HTML;

  // Geometry of each object (a triangle)
  positionBuffer: Buffer;

  // Positions, rotations, colors and picking colors for each object
  instancePositionBuffers: Swap<Buffer>;
  instanceRotationBuffers: Swap<Buffer>;

  instanceColorBuffer: Buffer;
  instancePickingColorBuffer: Buffer;

  renderModel: Model;
  transform: TableTransform;
  pickingFramebuffer?: Framebuffer;
  readonly transformShaderInputs = new ShaderInputs<{app: typeof app.props}>({app});

  // eslint-disable-next-line max-statements
  constructor({device, width, height, animationLoop}: AnimationProps) {
    super();

    if (device.type !== 'webgl') {
      throw new Error('This demo is only implemented for WebGL2');
    }

    // -- Initialize data
    const trianglePositions = new Float32Array([0.015, 0.0, -0.01, 0.01, -0.01, -0.01]);

    const instancePositions = new Float32Array(NUM_INSTANCES * 2);
    const instanceRotations = new Float32Array(NUM_INSTANCES);
    const instanceColors = new Float32Array(NUM_INSTANCES * 3);
    const pickingColors = new Float32Array(NUM_INSTANCES * 2);

    for (let i = 0; i < NUM_INSTANCES; ++i) {
      instancePositions[i * 2] = random() * 2.0 - 1.0;
      instancePositions[i * 2 + 1] = random() * 2.0 - 1.0;
      instanceRotations[i] = random() * 2 * Math.PI;

      const randValue = random();
      if (randValue > 0.5) {
        instanceColors[i * 3 + 1] = 1.0;
        instanceColors[i * 3 + 2] = 1.0;
      } else {
        instanceColors[i * 3] = 1.0;
        instanceColors[i * 3 + 2] = 1.0;
      }

      pickingColors[i * 2] = Math.floor(i / 255);
      pickingColors[i * 2 + 1] = i - 255 * pickingColors[i * 2];
    }

    this.positionBuffer = device.createBuffer({data: trianglePositions});
    this.instanceColorBuffer = device.createBuffer({data: instanceColors});
    this.instancePickingColorBuffer = device.createBuffer({data: pickingColors});

    this.renderModel = new Model(device, {
      id: 'RenderModel',
      vs: DRAW_VS,
      fs: DRAW_FS,
      modules: [picking],
      topology: 'triangle-list',
      vertexCount: 3,
      isInstanced: true,
      instanceCount: NUM_INSTANCES,
      attributes: {
        positions: this.positionBuffer,
        instanceColors: this.instanceColorBuffer,
        instancePickingColors: this.instancePickingColorBuffer
      },
      bufferLayout: [
        {name: 'positions', format: 'float32x2'},
        {name: 'instancePositions', format: 'float32x2'},
        {name: 'instanceRotations', format: 'float32'},
        {name: 'instanceColors', format: 'float32x3'},
        {name: 'instancePickingColors', format: 'float32x2'}
      ]
    });

    this.transform = new TableTransform(device, {
      vs: COMPUTE_VS,
      shaderLayout: TRANSFORM_SHADER_LAYOUT,
      shaderInputs: this.transformShaderInputs,
      table: makeGPUTableFromArrowTable(
        device,
        makeAgentTransformTable(instancePositions, instanceRotations),
        {shaderLayout: TRANSFORM_SHADER_LAYOUT}
      ),
      outputs: ['newOffsets', 'newRotations']
    });

    this.instancePositionBuffers = new Swap({
      current: getCoreBuffer(
        getGPUVectorBuffer(
          getRequiredGPUVector(this.transform.table, 'oldPositions', 'Transform example table')
        )
      ),
      next: device.createBuffer({data: instancePositions})
    });
    this.instanceRotationBuffers = new Swap({
      current: getCoreBuffer(
        getGPUVectorBuffer(
          getRequiredGPUVector(this.transform.table, 'oldRotations', 'Transform example table')
        )
      ),
      next: device.createBuffer({data: instanceRotations})
    });

    // picking
    // device.getDefaultCanvasContext().canvas.addEventListener('mousemove', mousemove);
    // device.getDefaultCanvasContext().canvas.addEventListener('mouseleave', mouseleave);
    // this.pickingFramebuffer = device.createFramebuffer({width, height});
  }

  override onFinalize(): void {
    this.renderModel.destroy();
    this.transform.destroy();
  }

  override onRender({device, width, height, time}: AnimationProps): void {
    this.transformShaderInputs.setProps({app: {time}});
    this.transform.run({
      inputBuffers: {
        oldPositions: this.instancePositionBuffers.current,
        oldRotations: this.instanceRotationBuffers.current
      },
      outputBuffers: {
        newOffsets: this.instancePositionBuffers.next,
        newRotations: this.instanceRotationBuffers.next
      }
    });

    this.instancePositionBuffers.swap();
    this.instanceRotationBuffers.swap();

    this.renderModel.setAttributes({
      instancePositions: this.instancePositionBuffers.current,
      instanceRotations: this.instanceRotationBuffers.current
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    this.renderModel.draw(renderPass);
    renderPass.end();

    // if (pickPosition) {
    //   // use the center pixel location in device pixel range
    //   const devicePixels = cssToDevicePixels(gl, pickPosition);
    //   const deviceX = devicePixels.x + Math.floor(devicePixels.width / 2);
    //   const deviceY = devicePixels.y + Math.floor(devicePixels.height / 2);
    //   this.pickingFramebuffer.resize({width, height});
    //   pickInstance(gl, deviceX, deviceY, this.renderModel, this.pickingFramebuffer);
    // }
  }
}

function makeAgentTransformTable(
  instancePositions: Float32Array,
  instanceRotations: Float32Array
): arrow.Table {
  return new arrow.Table({
    oldPositions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, instancePositions),
    oldRotations: arrow.makeVector(instanceRotations)
  });
}

function getCoreBuffer(buffer: Buffer | DynamicBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

/*
function pickInstance(gl, pickX, pickY, model, framebuffer) {
  if (framebuffer) {
    framebuffer.clear({color: true, depth: true});
  }
  // Render picking colors
  model.setUniforms({picking_uActive: 1});
  model.draw({framebuffer});
  model.setUniforms({picking_uActive: 0});

  const color = readPixelsToArray(framebuffer, {
    sourceX: pickX,
    sourceY: pickY,
    sourceWidth: 1,
    sourceHeight: 1,
    sourceFormat: GL.RGBA,
    sourceType: GL.UNSIGNED_BYTE
  });

  if (color[0] + color[1] + color[2] > 0) {
    model.updateModuleSettings({
      pickingSelectedColor: color,
      pickingHighlightColor: RED
    });
  } else {
    model.updateModuleSettings({
      pickingSelectedColor: null
    });
  }
}
*/
