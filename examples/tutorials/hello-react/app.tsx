// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useEffect, useRef, useState} from 'react';
import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {Device, UniformStore, luma} from '@luma.gl/core';
import {
  AnimationLoop,
  makeAnimationLoop,
  AnimationLoopTemplate,
  Model,
  CubeGeometry
} from '@luma.gl/engine';
import type {AnimationProps} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';

const WGSL_SHADER = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> app : Uniforms;

struct VertexInputs {
  @location(0) positions : vec4<f32>
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) vPosition : vec3<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * inputs.positions;
  outputs.vPosition = inputs.positions.xyz;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return vec4(0.5 * inputs.vPosition + vec3(0.5), 1.0);
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

layout(location=0) in vec3 positions;

out vec3 vPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  vPosition = positions;
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

in vec3 vPosition;

layout (location=0) out vec4 fragColor;

void main() {
  fragColor = vec4(0.5 * vPosition + vec3(0.5), 1.0);
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

    this.model = new Model(device, {
      id: 'rotating-cube',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      geometry: new CubeGeometry({indices: false}),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer(device, 'app')
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
        device = await luma.createDevice({
          adapters: [webgl2Adapter],
          // Enable _reuseDevices to handle React StrictMode double-mounting
          // This is what deck.gl also does (core/src/lib/deck.ts)
          _reuseDevices: true,
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
 * Main app component
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
      <div style={{marginBottom: '20px'}}>
        <h1 style={{margin: '0 0 20px 0'}}>Hello React</h1>
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
        </div>
      </div>

      {showCube && <RotatingCube />}
    </div>
  );
}
