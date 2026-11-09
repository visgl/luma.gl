// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {getWebGPUTestDevice, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {Matrix4, radians} from '@math.gl/core';
import {ShadowMapRenderer, type ShadowRenderOptions} from '@luma.gl/engine/lighting';

const CAMERA = {
  viewMatrix: new Matrix4().lookAt({eye: [6, 5, 8], center: [0, 0, 0], up: [0, 1, 0]}),
  projectionMatrix: new Matrix4().perspective({
    fovy: radians(55),
    aspect: 1.5,
    near: 0.1,
    far: 100
  }),
  near: 0.1,
  far: 100
};

for (const getDevice of [getWebGPUTestDevice, getWebGLTestDevice]) {
  it(`ShadowMapRenderer reuses, reconstructs and destroys resources (${getDevice.name})`, async () => {
    const device = await getDevice();
    if (!device) {
      void 0;
      void 0;
      return;
    }
    const renderer = new ShadowMapRenderer(device, {
      quality: 'low',
      directionalMapSize: 16,
      spotMapSize: 16,
      pointMapSize: 16
    });
    const callbackOrder: string[] = [];
    const submit = vi.spyOn(device, 'submit');
    const preparedViews = new Map<object, Readonly<Matrix4>>();
    const options = {
      camera: CAMERA,
      directionalLights: [{direction: [0.45, 0.82, 0.35] as [number, number, number]}],
      spotLights: [
        {
          position: [0, 8, 0] as [number, number, number],
          direction: [0, -1, 0] as [number, number, number],
          range: 20,
          outerConeAngle: 0.4
        }
      ],
      pointLights: [{position: [0, 3, 0] as [number, number, number], range: 12}],
      prepareShadowCasters: view => {
        preparedViews.set(view.framebuffer, view.viewProjectionMatrix);
        expect(view.rasterParameters.frontFace).toBe(
          view.type === 'point' && device.type === 'webgpu' ? 'cw' : 'ccw'
        );
      },
      drawShadowCasters: view => {
        expect(preparedViews.get(view.framebuffer)).toBe(view.viewProjectionMatrix);
        callbackOrder.push(
          view.type === 'directional'
            ? `directional-${view.cascadeIndex}`
            : view.type === 'point'
              ? `point-${view.pointFace}`
              : 'spot-0'
        );
      }
    } satisfies ShadowRenderOptions;
    const firstProps = renderer.render(options);
    const secondProps = renderer.render(options);
    expect(firstProps.directionalShadowTexture, 'reuses maps').toBe(
      secondProps.directionalShadowTexture
    );
    expect(new Set(preparedViews.values()).size).toBe(10);
    expect(
      callbackOrder.slice(0, 10),
      'invokes views in deterministic cascade, spot and cube-face order'
    ).toEqual([
      'directional-0',
      'directional-1',
      'directional-2',
      'spot-0',
      'point-+X',
      'point--X',
      'point-+Y',
      'point--Y',
      'point-+Z',
      'point--Z'
    ]);

    expect(submit).not.toHaveBeenCalled();
    submit.mockRestore();
    device.submit();
    renderer.setProps({quality: 'cinematic'});
    const rebuiltProps = renderer.render(options);
    expect(rebuiltProps.directionalShadowTexture, 'quality cascade change rebuilds maps').not.toBe(
      firstProps.directionalShadowTexture
    );
    expect(firstProps.directionalShadowTexture.destroyed, 'destroys replaced maps').toBe(true);
    expect(
      () =>
        renderer.render({
          ...options,
          pointLights: [...options.pointLights, ...options.pointLights]
        }),
      'rejects active lights above capacity'
    ).toThrow(/exceeds configured capacity/);
    device.submit();
    renderer.setProps({spotMapSize: 32});
    const resizedProps = renderer.render(options);
    expect(resizedProps.spotShadowTexture.width).toBe(32);
    expect(rebuiltProps.spotShadowTexture.destroyed).toBe(true);
    expect(() =>
      renderer.render({
        ...options,
        drawShadowCasters: () => {
          throw new Error('caster failed');
        }
      })
    ).toThrow('caster failed');
    expect(renderer.render(options).spotShadowTexture).toBe(resizedProps.spotShadowTexture);
    device.submit();
    renderer.setProps({spotLightCapacity: 2});
    const expandedProps = renderer.render({
      ...options,
      spotLights: [...options.spotLights, ...options.spotLights]
    });
    expect(expandedProps.spotShadowTexture.depth).toBe(2);
    expect(resizedProps.spotShadowTexture.destroyed).toBe(true);
    device.submit();
    renderer.destroy();
    renderer.destroy();
    expect(expandedProps.pointShadowTexture.destroyed, 'destroy is idempotent').toBe(true);
    device.submit();
    void 0;
  });
}
