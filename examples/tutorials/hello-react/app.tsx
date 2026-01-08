// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useEffect, useRef, useState} from 'react';
import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {Device, Texture, UniformStore, luma} from '@luma.gl/core';
import {
  AnimationLoop,
  makeAnimationLoop,
  AnimationLoopTemplate,
  Model,
  CubeGeometry,
  loadImageBitmap,
  AsyncTexture
} from '@luma.gl/engine';
import type {AnimationProps} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';

const WGSL_SHADER = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> app : Uniforms;
@group(0) @binding(1) var uTexture : texture_2d<f32>;
@group(0) @binding(2) var uTextureSampler : sampler;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) texCoords : vec2<f32>
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * inputs.positions;
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = 0.5 * (inputs.positions + vec4(1.0, 1.0, 1.0, 1.0));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return textureSample(uTexture, uTextureSampler, inputs.fragUV);
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  fragUV = texCoords;
  fragPosition = 0.5 * (vec4(positions, 1.) + vec4(1., 1., 1., 1.));
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform sampler2D uTexture;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

in vec2 fragUV;
in vec4 fragPosition;

layout (location=0) out vec4 fragColor;

void main() {
  fragColor = texture(uTexture, vec2(fragUV.x, 1.0 - fragUV.y));
}
`;

type AppUniforms = {
  mvpMatrix: NumberArray;
};

const app: {uniformTypes: Record<keyof AppUniforms, VariableShaderType>} = {
  uniformTypes: {
    mvpMatrix: 'mat4x4<f32>'
  }
};

const eyePosition = [0, 0, -4];

class CubeAnimationLoopTemplate extends AnimationLoopTemplate {
  mvpMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});
  model: Model;

  uniformStore = new UniformStore<{app: AppUniforms}>({app});

  constructor({device}: AnimationProps) {
    super();

    const texture = new AsyncTexture(device, {
      usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT | Texture.COPY_DST,
      data: loadImageBitmap('vis-logo.png'),
      mipmaps: true,
      sampler: device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear'
      })
    });

    this.model = new Model(device, {
      id: 'rotating-cube',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      geometry: new CubeGeometry({indices: false}),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer(device, 'app'),
        uTexture: texture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize() {
    this.model.destroy();
    this.uniformStore.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps) {
    this.mvpMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    this.uniformStore.setUniforms({
      app: {mvpMatrix: this.mvpMatrix}
    });

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    this.model.draw(renderPass);
    renderPass.end();
  }
}

/**
 * React component that renders a spinning cube using luma.gl
 * Includes mount/unmount toggle to test race condition fixes
 */
function RotatingCube() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationLoopRef = useRef<AnimationLoop | null>(null);
  const deviceRef = useRef<Device | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let animationLoop: AnimationLoop | null = null;
    let device: Device | null = null;

    const init = async () => {
      try {
        // Create device with canvas context
        device = await luma.createDevice({
          adapters: [webgl2Adapter],
          createCanvasContext: {
            canvas: canvasRef.current!
          }
        });

        deviceRef.current = device;

        // Create animation loop
        animationLoop = makeAnimationLoop(CubeAnimationLoopTemplate, {
          device
        });

        animationLoopRef.current = animationLoop;

        // Start rendering
        animationLoop.start();
      } catch (error) {
        console.error('Failed to initialize cube:', error);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      if (animationLoop) {
        animationLoop.destroy();
        animationLoopRef.current = null;
      }
      if (device) {
        device.destroy();
        deviceRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '600px',
        display: 'block'
      }}
    />
  );
}

/**
 * Main app component with mount/unmount controls to test bug fixes
 */
export default function App() {
  const [showCube, setShowCube] = useState(true);
  const [mountCount, setMountCount] = useState(0);

  const toggleCube = () => {
    setShowCube(prev => !prev);
    if (!showCube) {
      setMountCount(prev => prev + 1);
    }
  };

  return (
    <div style={{fontFamily: 'sans-serif', padding: '20px'}}>
      <div style={{marginBottom: '20px', backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px'}}>
        <h1 style={{margin: '0 0 10px 0'}}>React Spinning Cube - Race Condition Test</h1>
        <p style={{margin: '0 0 15px 0', color: '#666'}}>
          This example tests the canvas context race condition fixes. Toggle the cube on/off
          and resize the window to verify the bug is fixed.
        </p>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <button
            onClick={toggleCube}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: showCube ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {showCube ? 'Hide Cube' : 'Show Cube'}
          </button>
          <span style={{color: '#666'}}>
            Mount count: <strong>{mountCount}</strong>
          </span>
          <span style={{color: '#666', marginLeft: 'auto'}}>
            {showCube ? '✅ Cube is mounted' : '❌ Cube is unmounted'}
          </span>
        </div>
      </div>

      {showCube && <RotatingCube />}

      <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '8px'}}>
        <h3 style={{margin: '0 0 10px 0'}}>Testing Instructions:</h3>
        <ol style={{margin: 0, paddingLeft: '20px'}}>
          <li>Click "Hide Cube" to unmount the component</li>
          <li>Resize the browser window while the cube is hidden</li>
          <li>Click "Show Cube" to remount the component</li>
          <li>Check the console for errors - there should be none!</li>
          <li>Repeat multiple times to verify stability</li>
        </ol>
        <p style={{marginTop: '10px', marginBottom: 0, color: '#666', fontSize: '14px'}}>
          <strong>What this tests:</strong> The bug fix prevents orphaned canvas contexts from
          triggering resize callbacks after the device is destroyed. Without the fix, you would
          see "Cannot read properties of undefined (reading 'maxTextureDimension2D')" errors
          in the console when resizing after unmounting.
        </p>
      </div>
    </div>
  );
}
