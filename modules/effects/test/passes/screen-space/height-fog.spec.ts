// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  createVolumetricFogCompositeShaderPass,
  heightFogPass,
  type HeightFogPassUniforms
} from '@luma.gl/effects';
import {heightFog, getShaderModuleUniformLayoutValidationResult} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {getTestDevice} from '@luma.gl/test-utils';
import {makeShaderModuleRenderer} from '../../../../shadertools/test/modules/render-shader-module';

it('height fog preserves the existing fog graph and matches both uniform layouts', () => {
  expect(createVolumetricFogCompositeShaderPass().renderTargets?.fogHistory.lifetime).toBe(
    'history'
  );
  const analytic = createVolumetricFogCompositeShaderPass({mode: 'height'});
  expect(analytic.renderTargets).toBeUndefined();
  expect(analytic.steps).toHaveLength(1);
  expect(analytic.steps[0].shaderPass).toBe(heightFogPass);
  expect(getShaderModuleUniformLayoutValidationResult(heightFogPass, 'fragment')?.matches).toBe(
    true
  );
  expect(getShaderModuleUniformLayoutValidationResult(heightFogPass, 'wgsl')?.matches).toBe(true);
});

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`height fog reconstructs depth and matches material fog and numerical integration on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const original = [60, 100, 160, 128].map(value => value / 255);
    const source = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba8unorm',
      data: new Uint8Array([
        60, 100, 160, 128, 60, 100, 160, 128, 60, 100, 160, 128, 60, 100, 160, 128
      ])
    });
    const depth = device.createTexture({
      width: 2,
      height: 2,
      format: 'depth32float',
      usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT
    });
    const framebuffer = device.createFramebuffer({
      width: 2,
      height: 2,
      colorAttachments: [],
      depthStencilAttachment: depth
    });
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [createVolumetricFogCompositeShaderPass({mode: 'height'})],
      colorFormat: 'rgba32float'
    });
    renderer.resize([2, 2]);
    function clearDepth(value: number) {
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({framebuffer, clearColor: false, clearDepth: value});
      pass.end();
      device.submit(encoder.finish());
    }
    async function render(overrides: Partial<HeightFogPassUniforms>) {
      const encoder = device.createCommandEncoder();
      const output = renderer.encodeToTexture(encoder, {
        sourceTexture: source,
        bindings: {depthTexture: depth},
        uniforms: {heightFogPass: overrides}
      });
      device.submit(encoder.finish());
      expect(output).toBeTruthy();
      return readColors(output!);
    }
    try {
      clearDepth(0.5);
      const cases: Partial<HeightFogPassUniforms>[] = [
        {density: 0.3, heightFalloff: 0},
        {
          density: 0.3,
          heightFalloff: 0,
          variation: 0.9,
          evolutionSpeed: 0.1,
          wispScale: 2,
          velocity: [1, 0.5, 0],
          time: 3
        },
        {density: 0.3, heightFalloff: 0.5, baseHeight: -0.2, upDirection: [0, 1, 0]},
        {
          density: 0.02,
          heightFalloff: 0.1,
          cameraPosition: [0, 0, -5],
          inverseViewProjectionMatrix: [10, 0, 0, 0, 0, 10, 0, 0, 0, 0, 40, 0, 0, 0, 10, 1]
        },
        {density: 0.3, heightFalloff: 0.5, upDirection: [0, 1, 0], clipDepthRange: [-1, 1]}
      ];
      const viewProjection = new Matrix4()
        .perspective({fovy: Math.PI / 3, aspect: 1, near: 1, far: 100})
        .multiplyRight(new Matrix4().lookAt({eye: [3, 8, 15], center: [0, 0, 0], up: [0, 1, 0]}));
      // At this 2x2 resolution these offsets represent subpixel projection jitter.
      for (const jitter of [
        [0, 0],
        [0.2, -0.15],
        [-0.1, 0.25]
      ]) {
        cases.push({
          density: 0.2,
          heightFalloff: 0.1,
          cameraPosition: [3, 8, 15],
          upDirection: [0, 1, 0],
          inverseViewProjectionMatrix: new Matrix4()
            .translate([jitter[0], jitter[1], 0])
            .multiplyRight(viewProjection)
            .invert()
        });
      }
      for (const overrides of cases) {
        const uniforms: HeightFogPassUniforms = {
          ...heightFogPass.defaultUniforms,
          inverseViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -0.9, 0, 0, -1, 1],
          ...overrides
        };
        const colors = await render(uniforms);
        const inverse = new Matrix4(uniforms.inverseViewProjectionMatrix);
        const positions: number[][] = [];
        for (let row = 0; row < 2; row++)
          for (let column = 0; column < 2; column++) {
            const vertical = backend === 'webgpu' ? 0.5 - row : row - 0.5;
            const clipDepth = (uniforms.clipDepthRange[0] + uniforms.clipDepthRange[1]) / 2;
            const position = inverse.transformAsPoint([column - 0.5, vertical, clipDepth]);
            positions.push(Array.from(position));
            const transmittance = integrateFog(position, uniforms);
            for (let channel = 0; channel < 3; channel++) {
              const expected =
                uniforms.color[channel] * (1 - transmittance) + original[channel] * transmittance;
              if (uniforms.variation === 0)
                expect(colors[(row * 2 + column) * 4 + channel]).toBeCloseTo(expected, 5);
            }
            expect(colors[(row * 2 + column) * 4 + 3]).toBeCloseTo(original[3], 6);
          }
        // Rotate Y-up scenes to the material module's local Z-up coordinates.
        const rotate = (position: readonly number[]) =>
          uniforms.upDirection[1] === 1 ? [position[0], position[2], position[1]] : position;
        const positionSource = positions.map(position => rotate(position).join(', '));
        const cameraSource = rotate(uniforms.cameraPosition).join(', ');
        const material = makeShaderModuleRenderer(
          device,
          [heightFog],
          `@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
            let positions = array<vec3f,4>(${positionSource.map(value => `vec3f(${value})`).join(',')});
            return heightFog_getColor(vec4f(${original.join(',')}), positions[min(u32(fragment.x), 3u)], vec3f(${cameraSource}));
          }`,
          `void main() {
            vec3 positions[4] = vec3[4](${positionSource.map(value => `vec3(${value})`).join(',')});
            fragmentColor = heightFog_getColor(vec4(${original.join(',')}), positions[min(int(gl_FragCoord.x), 3)], vec3(${cameraSource}));
          }`
        );
        try {
          material.model.shaderInputs.setProps({
            heightFog: {
              color: uniforms.color,
              density: uniforms.density,
              baseHeight: uniforms.baseHeight,
              heightFalloff: uniforms.heightFalloff,
              variation: uniforms.variation,
              wispScale: uniforms.wispScale,
              velocity: uniforms.velocity,
              time: uniforms.time,
              evolutionSpeed: uniforms.evolutionSpeed
            }
          });
          const materialColors = await material.read();
          colors.forEach((value, index) => expect(value).toBeCloseTo(materialColors[index], 5));
        } finally {
          material.destroy();
        }
      }
      const backgroundUniforms: HeightFogPassUniforms = {
        ...heightFogPass.defaultUniforms,
        density: 0.3,
        heightFalloff: 0,
        inverseViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, -1, 1]
      };
      clearDepth(1);
      const clear = await render(backgroundUniforms);
      clear.forEach((value, index) => expect(value).toBeCloseTo(original[index % 4], 6));
      const fogged = await render({...backgroundUniforms, backgroundDistance: 4});
      for (let index = 0; index < 16; index++) {
        const channel = index % 4;
        const expected =
          channel === 3
            ? original[3]
            : backgroundUniforms.color[channel] * (1 - Math.exp(-1.2)) +
              original[channel] * Math.exp(-1.2);
        expect(fogged[index]).toBeCloseTo(expected, 5);
      }
      clearDepth(0);
      const reversed = await render({
        ...backgroundUniforms,
        backgroundDepth: 0,
        backgroundDistance: 0
      });
      reversed.forEach((value, index) => expect(value).toBeCloseTo(original[index % 4], 6));
      const disabled = await render({...backgroundUniforms, density: 0, backgroundDistance: 4});
      disabled.forEach((value, index) => expect(value).toBeCloseTo(original[index % 4], 6));
      renderer.destroy();
      expect(source.destroyed).toBe(false);
      expect(depth.destroyed).toBe(false);
    } finally {
      renderer.destroy();
      framebuffer.destroy();
      depth.destroy();
      source.destroy();
    }
  });
}

function integrateFog(position: readonly number[], uniforms: HeightFogPassUniforms): number {
  const difference = position.map((value, index) => value - uniforms.cameraPosition[index]);
  const rayLength = Math.hypot(...difference);
  let opticalDepth = 0;
  // Independent numerical quadrature of the density profile along the ray.
  for (let sample = 0; sample < 10000; sample++) {
    const fraction = (sample + 0.5) / 10000;
    const height = uniforms.upDirection.reduce(
      (sum, axis, index) =>
        sum + axis * (uniforms.cameraPosition[index] + difference[index] * fraction),
      0
    );
    opticalDepth +=
      (uniforms.density *
        Math.exp(-Math.max(height - uniforms.baseHeight, 0) * uniforms.heightFalloff) *
        rayLength) /
      10000;
  }
  return Math.exp(-opticalDepth);
}

async function readColors(texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout();
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({}, buffer);
    const bytes = await buffer.readAsync();
    const colors: number[] = [];
    for (let row = 0; row < texture.height; row++)
      colors.push(
        ...new Float32Array(
          bytes.buffer,
          bytes.byteOffset + row * layout.bytesPerRow,
          texture.width * 4
        )
      );
    return colors;
  } finally {
    buffer.destroy();
  }
}
