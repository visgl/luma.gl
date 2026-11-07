// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {Geometry, PlaneGeometry, type Model} from '@luma.gl/engine';
import {
  createPBRMaterial,
  createPBRModel,
  createPBRShadowModel,
  ShadowMapRenderer,
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms
} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';

for (const getDevice of [getWebGLTestDevice, getWebGPUTestDevice]) {
  test(`standalone PBR shadows preserve indirect light and alpha cutouts (${getDevice.name})`, async context => {
    const device = await getDevice();
    if (!device) return context.skip('No rendering device');
    const geometry = new Geometry({
      indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
      attributes: {
        POSITION: {
          size: 3,
          value: new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0])
        },
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])},
        TEXCOORD_0: {size: 2, value: new Float32Array(8)},
        TEXCOORD_1: {size: 2, value: new Float32Array(8).fill(0.25)},
        COLOR_0: {size: 4, value: new Float32Array(16).fill(1)},
        JOINTS_0: {size: 4, value: new Uint16Array(16)},
        WEIGHTS_0: {
          size: 4,
          value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
        }
      }
    });
    const alphaTexture = device.createTexture({
      width: 2,
      height: 1,
      data: new Uint8Array([255, 255, 255, 255, 255, 255, 255, 0]),
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
    const casterMaterial = createPBRMaterial(device, {
      uniforms: {baseColorFactor: [1, 1, 1, 1], alphaCutoff: 0.5, baseColorUVSet: 1},
      bindings: {pbr_baseColorSampler: alphaTexture}
    });
    const receiverMaterial = createPBRMaterial(device, {
      uniforms: {
        baseColorFactor: [0.8, 0.8, 0.8, 1],
        metallicRoughnessValues: [0, 1],
        emissiveFactor: [0.02, 0.01, 0.005],
        IBLenabled: true
      }
    });
    const source = device.createTexture({width: 4, height: 2, data: new Uint8Array(32).fill(64)});
    const environment = createPrefilteredEnvironment(device, {
      source,
      size: 4,
      sampleCount: 8,
      format: 'rgba8unorm'
    });
    const receiver = createPBRModel(device, {
      geometry: new PlaneGeometry({type: 'x,z', flipCull: true}),
      material: receiverMaterial,
      receiveShadows: true,
      defines: {
        HAS_SKIN: false,
        USE_LIGHTS: true,
        USE_IBL: true,
        USE_SCENE_ENVIRONMENT: true,
        USE_TEX_LOD: true
      },
      bindings: getPBREnvironmentBindings(environment.textures),
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {depthWriteEnabled: false, cullMode: 'none'}
    });
    const shadows = new ShadowMapRenderer(device, {
      quality: 'low',
      directionalMapSize: 64,
      spotMapSize: 64,
      pointMapSize: 64
    });
    const casters = new Map<object, Model>();
    const color = device.createTexture({
      width: 32,
      height: 32,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [color]});
    const readback = device.createBuffer({
      byteLength: 256,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const view = new Matrix4().lookAt({eye: [0, 0, 6], center: [0, 0, 0]});
    const projection = new Matrix4().ortho({
      left: -2,
      right: 2,
      bottom: -2,
      top: 2,
      near: 0.1,
      far: 10
    });
    const receiverProjection = new Matrix4(projection);
    if (device.type === 'webgpu')
      receiverProjection.multiplyLeft(
        new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1])
      );
    const receiverMatrix = new Matrix4().rotateX(Math.PI / 2).scale([4, 1, 4]);
    receiver.shaderInputs.setProps({
      pbrProjection: {
        modelMatrix: receiverMatrix,
        normalMatrix: new Matrix4(receiverMatrix).invert().transpose(),
        modelViewProjectionMatrix: new Matrix4(receiverProjection)
          .multiplyRight(view)
          .multiplyRight(receiverMatrix),
        camera: [0, 0, 6]
      },
      pbrShadow: {viewMatrix: view},
      pbrScene: getPBREnvironmentUniforms(environment.textures)
    });
    async function readCenter(enabled: boolean, model: Model = receiver) {
      model.shaderInputs.setProps({pbrShadow: {enabled}});
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
      pass.setParameters({viewport: [0, 0, 32, 32]});
      model.draw(pass);
      pass.end();
      device.submit();
      color.readBuffer({x: 16, y: 16, width: 1, height: 1}, readback);
      device.submit();
      return Array.from((await readback.readAsync()).slice(0, 4));
    }
    const instanceMatrix = new Matrix4().translate([0.1, 0, 0]).scale([1.1, 0.8, 1]);
    const instanceNames = [0, 1, 2, 3].map(column => `instanceModelMatrixCol${column}`);
    const instanceBuffers = instanceNames.map((name, column) =>
      device.createBuffer({
        data: new Float32Array(instanceMatrix.slice(column * 4, column * 4 + 4)),
        usage: Buffer.VERTEX
      })
    );
    try {
      for (const variant of ['ordinary', 'instanced', 'skinned']) {
        for (const caster of casters.values()) caster.destroy();
        casters.clear();
        for (const lightType of ['directional', 'spot', 'point'] as const) {
          const shadowProps = shadows.render({
            camera: {viewMatrix: view, projectionMatrix: projection, near: 0.1, far: 10},
            directionalLights:
              lightType === 'directional'
                ? [{direction: [0, 0, 1], shadowDistance: 9, normalBias: 0, sourceAngularRadius: 0}]
                : [],
            spotLights:
              lightType === 'spot'
                ? [
                    {
                      position: [0, 0, 4],
                      direction: [0, 0, -1],
                      range: 8,
                      outerConeAngle: 0.6,
                      normalBias: 0,
                      sourceRadius: 0
                    }
                  ]
                : [],
            pointLights:
              lightType === 'point'
                ? [{position: [0, 0, 4], range: 8, normalBias: 0, sourceRadius: 0}]
                : [],
            prepareShadowCasters: lightView => {
              let caster = casters.get(lightView.framebuffer);
              if (!caster) {
                caster = createPBRShadowModel(device, {
                  geometry,
                  material: casterMaterial,
                  defines: {
                    ALPHA_CUTOFF: true,
                    HAS_SKIN: variant === 'skinned',
                    HAS_INSTANCING: variant === 'instanced'
                  },
                  instanceCount: 1,
                  attributes:
                    variant === 'instanced'
                      ? Object.fromEntries(
                          instanceNames.map((name, index) => [name, instanceBuffers[index]])
                        )
                      : {},
                  bufferLayout:
                    variant === 'instanced'
                      ? instanceNames.map(name => ({
                          name,
                          format: 'float32x4',
                          stepMode: 'instance'
                        }))
                      : [],
                  parameters: {cullMode: 'none'}
                });
                casters.set(lightView.framebuffer, caster);
              }
              if (variant === 'skinned')
                caster.shaderInputs.setProps({
                  skin: {
                    jointMatrices: new Matrix4().translate([-0.1, 0.1, 0]).scale([-1.2, 0.9, 1])
                  }
                });
              const modelMatrix = new Matrix4().translate([0, 0, 1]);
              caster.shaderInputs.setProps({
                pbrProjection: {
                  modelMatrix,
                  modelViewProjectionMatrix: new Matrix4(
                    lightView.viewProjectionMatrix
                  ).multiplyRight(modelMatrix),
                  normalMatrix: new Matrix4(),
                  camera: [0, 0, 4]
                }
              });
              caster.setParameters({...lightView.rasterParameters, cullMode: 'none'});
            },
            drawShadowCasters: lightView =>
              casters.get(lightView.framebuffer)!.draw(lightView.renderPass)
          });
          device.submit();
          receiver.shaderInputs.setProps({
            shadow: shadowProps,
            lighting: {
              useByteColors: false,
              lights:
                lightType === 'directional'
                  ? [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1]}]
                  : lightType === 'spot'
                    ? [
                        {
                          type: 'spot',
                          position: [0, 0, 4],
                          direction: [0, 0, -1],
                          color: [1, 1, 1],
                          innerConeAngle: 0.3,
                          outerConeAngle: 0.6,
                          attenuation: [1, 0, 0]
                        }
                      ]
                    : [
                        {
                          type: 'point',
                          position: [0, 0, 4],
                          color: [1, 1, 1],
                          attenuation: [1, 0, 0]
                        }
                      ]
            }
          });
          const shadowed = await readCenter(true);
          const lit = await readCenter(false);
          expect(shadowed[0], `${device.type} ${lightType} ${variant} direct shadow`).toBeLessThan(
            lit[0] - 20
          );
          expect(shadowed[0], 'IBL and emission survive').toBeGreaterThan(2);
          receiver.shaderInputs.setProps({
            lighting: {lights: [{type: 'ambient', color: [0.1, 0.1, 0.1]}], useByteColors: false}
          });
          const indirectShadowed = await readCenter(true);
          const indirectLit = await readCenter(false);
          expect(indirectShadowed).toEqual(indirectLit);
        }
      }
      // UV1 starts in the opaque texel; translate it into the transparent texel.
      casterMaterial.setProps({pbrMaterial: {baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0.5, 0, 1]}});
      const props = shadows.render({
        camera: {viewMatrix: view, projectionMatrix: projection, near: 0.1, far: 10},
        spotLights: [
          {
            position: [0, 0, 4],
            direction: [0, 0, -1],
            range: 8,
            outerConeAngle: 0.6,
            normalBias: 0,
            sourceRadius: 0
          }
        ],
        drawShadowCasters: lightView =>
          casters.get(lightView.framebuffer)!.draw(lightView.renderPass)
      });
      device.submit();
      receiver.shaderInputs.setProps({
        shadow: props,
        lighting: {
          useByteColors: false,
          lights: [
            {
              type: 'spot',
              position: [0, 0, 4],
              direction: [0, 0, -1],
              color: [1, 1, 1],
              attenuation: [1, 0, 0],
              outerConeAngle: 0.6,
              innerConeAngle: 0.3
            }
          ]
        }
      });
      expect(await readCenter(true), 'transformed alpha-cutout casts no shadow').toEqual(
        await readCenter(false)
      );
      const selfCaster = createPBRShadowModel(device, {
        geometry: receiver.sourceGeometry,
        material: receiverMaterial,
        parameters: {cullMode: 'none'}
      });
      const noNormalReceiver = createPBRModel(device, {
        geometry: receiver.sourceGeometry,
        material: receiverMaterial,
        receiveShadows: true,
        defines: {HAS_NORMALS: false, USE_LIGHTS: true},
        colorAttachmentFormats: ['rgba8unorm'],
        parameters: {depthWriteEnabled: false, cullMode: 'none'}
      });
      try {
        const selfShadowProps = shadows.render({
          camera: {viewMatrix: view, projectionMatrix: projection, near: 0.1, far: 10},
          spotLights: [
            {
              position: [0, 0, 4],
              direction: [0, 0, -1],
              range: 8,
              outerConeAngle: 0.6,
              normalBias: 0.05,
              depthBias: 0,
              depthBiasSlopeScale: 0,
              sourceRadius: 0
            }
          ],
          prepareShadowCasters: lightView => {
            selfCaster.shaderInputs.setProps({
              pbrProjection: {
                modelMatrix: receiverMatrix,
                normalMatrix: new Matrix4(receiverMatrix).invert().transpose(),
                modelViewProjectionMatrix: new Matrix4(
                  lightView.viewProjectionMatrix
                ).multiplyRight(receiverMatrix),
                camera: [0, 0, 4]
              }
            });
            selfCaster.setParameters({...lightView.rasterParameters, cullMode: 'none'});
          },
          drawShadowCasters: lightView => selfCaster.draw(lightView.renderPass)
        });
        noNormalReceiver.shaderInputs.setProps({
          pbrProjection: {
            modelMatrix: receiverMatrix,
            normalMatrix: new Matrix4(receiverMatrix).invert().transpose(),
            modelViewProjectionMatrix: new Matrix4(receiverProjection)
              .multiplyRight(view)
              .multiplyRight(receiverMatrix),
            camera: [0, 0, 6]
          },
          shadow: selfShadowProps,
          pbrShadow: {viewMatrix: view},
          lighting: {
            useByteColors: false,
            lights: [
              {
                type: 'spot',
                position: [0, 0, 4],
                direction: [0, 0, -1],
                color: [1, 1, 1],
                attenuation: [1, 0, 0],
                outerConeAngle: 0.6,
                innerConeAngle: 0.3
              }
            ]
          }
        });
        const selfShadowed = await readCenter(true, noNormalReceiver);
        const selfLit = await readCenter(false, noNormalReceiver);
        expect(selfLit[0], 'a receiver without normals is illuminated').toBeGreaterThan(20);
        expect(
          selfShadowed,
          'derivative normal bias keeps the receiver from shadowing itself'
        ).toEqual(selfLit);
      } finally {
        selfCaster.destroy();
        noNormalReceiver.destroy();
      }
    } finally {
      for (const caster of casters.values()) caster.destroy();
      receiver.destroy();
      casterMaterial.destroy();
      receiverMaterial.destroy();
      shadows.destroy();
      for (const buffer of instanceBuffers) buffer.destroy();
      readback.destroy();
      framebuffer.destroy();
      color.destroy();
      environment.destroy();
      source.destroy();
      alphaTexture.destroy();
    }
  });
}
