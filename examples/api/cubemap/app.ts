// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  AnimationLoopTemplate,
  AnimationProps,
  loadImageBitmap,
  DynamicTexture,
  ShaderInputs
} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';

import {app, Prism, RoomCube} from './cubemap-models';
import {CUBEMAP_INFO_HTML} from './app-ui';

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = CUBEMAP_INFO_HTML;

  cube: RoomCube;
  prism: Prism;

  roomShaderInputs = new ShaderInputs<{
    app: typeof app.props;
  }>({app});

  prismShaderInputs = new ShaderInputs<{
    app: typeof app.props;
  }>({app});

  constructor({device}: AnimationProps) {
    super();

    const cubeTexture = new DynamicTexture(device, {
      dimension: 'cube',
      mipmaps: true,
      // @ts-ignore
      data: (async () => ({
        '+X': await loadImageBitmap('sky-posx.png'),
        '-X': await loadImageBitmap('sky-negx.png'),
        '+Y': await loadImageBitmap('sky-posy.png'),
        '-Y': await loadImageBitmap('sky-negy.png'),
        '+Z': await loadImageBitmap('sky-posz.png'),
        '-Z': await loadImageBitmap('sky-negz.png')
      }))(),
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    const prismTexture = new DynamicTexture(device, {
      data: loadImageBitmap('vis-logo.png'),
      mipmaps: true,
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    this.cube = new RoomCube(device, {
      shaderInputs: this.roomShaderInputs,
      instanceCount: 1,
      bindings: {
        cubeTexture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });

    this.prism = new Prism(device, {
      shaderInputs: this.prismShaderInputs,
      instanceCount: 1,
      bindings: {
        prismTexture,
        cubeTexture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize(): void {
    this.prism.destroy();
    this.cube.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps): void {
    // const eyePosition = [5, -3, 5];

    const radius = 7.0;
    const speed = 0.01; // radians per tick (adjust for desired speed)
    const angle = tick * speed;

    // Simple horizontal rotation around origin
    const eyeX = -Math.abs(Math.cos(angle)) * radius;
    const eyeZ = -Math.abs(Math.sin(angle)) * radius;
    const eyeY = -Math.abs(Math.sin(angle)) * radius * 2; // keep constant height

    const eyePosition: [number, number, number] = [eyeX, eyeY, eyeZ];

    const view = new Matrix4().lookAt({eye: eyePosition});
    const projection = new Matrix4().perspective({
      fovy: radians(45),
      aspect,
      near: 0.001,
      far: 1000
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    this.roomShaderInputs.setProps({
      app: {
        viewMatrix: view,
        projectionMatrix: projection,
        modelMatrix: new Matrix4().scale([20, 20, 20])
      }
    });
    this.cube.draw(renderPass);

    this.prismShaderInputs.setProps({
      app: {
        eyePosition,
        viewMatrix: view,
        projectionMatrix: projection,
        modelMatrix: new Matrix4() // s.rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });
    this.prism.draw(renderPass);

    renderPass.end();
  }
}
