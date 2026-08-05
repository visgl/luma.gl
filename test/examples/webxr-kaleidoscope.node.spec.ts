// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';

const APPLICATION_PATH = path.join(
  process.cwd(),
  'examples/experimental/webxr-kaleidoscope/app.ts'
);
const STANDALONE_PATH = path.join(
  process.cwd(),
  'examples/experimental/webxr-kaleidoscope/index.html'
);
const PACKAGE_PATH = path.join(
  process.cwd(),
  'examples/experimental/webxr-kaleidoscope/package.json'
);
const WEBSITE_EXAMPLES_PATH = path.join(process.cwd(), 'website/src/examples.tsx');
const WEBSITE_EXAMPLE_WRAPPER_PATH = path.join(
  process.cwd(),
  'website/src/react-luma/components/luma-example.tsx'
);
const WEBSITE_DEVICE_STORE_PATH = path.join(
  process.cwd(),
  'website/src/react-luma/store/device-store.tsx'
);
const EXAMPLE_METADATA_PATH = path.join(
  process.cwd(),
  'website/content/examples/experimental/webxr-kaleidoscope.mdx'
);

describe('immersive WebGPU and WebGL2 prism portal', () => {
  test('keeps valid native WGSL and portable GLSL rendering paths', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const shaderDeclaration = applicationSource.indexOf('const WGSL_SHADER = /* wgsl */');
    const shaderStart = applicationSource.indexOf('\n', shaderDeclaration) + 1;
    const shaderEnd = applicationSource.indexOf('\n`;', shaderStart);
    let bindingIndex = 0;

    expect(shaderDeclaration).toBeGreaterThan(0);
    expect(shaderEnd).toBeGreaterThan(shaderStart);

    const shaderSource = applicationSource
      .slice(shaderStart, shaderEnd)
      .replaceAll(/@binding\(auto\)/g, () => `@binding(${bindingIndex++})`);
    const reflectedShader = new WgslReflect(shaderSource);

    expect(reflectedShader.entry.vertex.map(entry => entry.name)).toEqual(['vertexMain']);
    expect(reflectedShader.entry.fragment.map(entry => entry.name)).toEqual(['fragmentMain']);
    expect(reflectedShader.uniforms.map(uniform => uniform.name)).toContain('app');
    expect(reflectedShader.textures.map(texture => texture.name)).toContain('cameraTexture');
    expect(reflectedShader.samplers.map(sampler => sampler.name)).toContain('cameraTextureSampler');
    expect(applicationSource).toContain('source: WGSL_SHADER');
    expect(applicationSource).toContain('vs: VS_GLSL');
    expect(applicationSource).toContain('fs: FS_GLSL');
    expect(applicationSource).not.toContain('WebXR Kaleidoscope requires WebGL2');
  });

  test('creates a genuinely three-dimensional GPU-animated prism tunnel', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');

    expect(applicationSource).toMatch(/const PORTAL_RING_COUNT\s*=\s*(?:1[0-9]|[2-9][0-9]+)/);
    expect(applicationSource).toMatch(
      /const PARTICLE_COUNT\s*=\s*(?:[2-9][0-9]{2,}|[1-9][0-9]{3,})/
    );
    expect(applicationSource).toContain('appendPortalRings(positions, texCoords, shardAttributes)');
    expect(applicationSource).toContain(
      'appendHelicalRibbons(positions, texCoords, shardAttributes)'
    );
    expect(applicationSource).toContain(
      'appendFloatingPrisms(positions, texCoords, shardAttributes)'
    );
    expect(applicationSource).toContain('depthFactor * PORTAL_DEPTH');
    expect(applicationSource).toContain('shardData: {size: 4');
    expect(applicationSource).toContain('time: elapsedTimeMilliseconds');
    expect(applicationSource).toContain('new OrbitControls(canvas');
  });

  test('negotiates native WebGPU sessions without misrepresenting raw-camera support', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');

    expect(applicationSource).toContain("requiredFeatures: ['webgpu']");
    expect(applicationSource).toContain("optionalFeatures: ['camera-access', 'local-floor']");
    expect(applicationSource).toMatch(
      /sessionMode\s*===\s*'immersive-ar'\s*&&\s*this\.device\.type\s*===\s*'webgl'/
    );
    expect(applicationSource).toContain('!this.device.props.xrCompatible');
    expect(applicationSource).toContain("!('XRGPUBinding' in globalThis)");
    expect(applicationSource).toContain('Switch to WebGL2 for immersive fallback');
    expect(applicationSource).not.toMatch(/requiredFeatures:\s*\[[^\]]*['"]layers['"]/);
  });

  test('orders per-eye uploads before render passes and clears shared targets only once', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const prepareMethodStart = applicationSource.indexOf('private preparePortal(');
    const prepareMethodEnd = applicationSource.indexOf(
      '\n  private drawPortal(',
      prepareMethodStart
    );
    const prepareMethod = applicationSource.slice(prepareMethodStart, prepareMethodEnd);

    expect(renderMethodStart).toBeGreaterThan(0);
    expect(renderMethodEnd).toBeGreaterThan(renderMethodStart);
    expect(renderMethod).toContain('view.framebuffer ?? frameState.framebuffer');
    expect(renderMethod).toContain('new Set<Framebuffer>()');
    expect(renderMethod).toContain('!renderedFramebuffers.has(framebuffer)');
    expect(renderMethod).toContain('renderedFramebuffers.add(framebuffer)');
    expect(renderMethod).toMatch(
      /this\.xrSessionMode\s*===\s*'immersive-ar'\s*\?\s*\[0,\s*0,\s*0,\s*0\]/
    );
    expect(renderMethod.indexOf('this.preparePortal({')).toBeLessThan(
      renderMethod.indexOf('this.device.beginRenderPass({')
    );
    expect(prepareMethod).toContain('this.uniformStore.setUniforms(');
    expect(prepareMethod).toContain('this.device.commandEncoder');
    expect(prepareMethod).toContain('this.model.predraw(this.device.commandEncoder)');
    expect(prepareMethod.indexOf('this.uniformStore.setUniforms(')).toBeLessThan(
      prepareMethod.indexOf('this.model.predraw(this.device.commandEncoder)')
    );
  });

  test('requests isolated XR-compatible website devices while preserving preview fallback', () => {
    const examplesSource = readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8');
    const wrapperSource = readFileSync(WEBSITE_EXAMPLE_WRAPPER_PATH, 'utf8');
    const deviceStoreSource = readFileSync(WEBSITE_DEVICE_STORE_PATH, 'utf8');
    const exampleStart = examplesSource.indexOf('export const WebXRKaleidoscopeExample');
    const exampleEnd = examplesSource.indexOf('\nfunction isCameraPermissionBlocked', exampleStart);
    const exampleSource = examplesSource.slice(exampleStart, exampleEnd);

    expect(exampleStart).toBeGreaterThan(0);
    expect(exampleEnd).toBeGreaterThan(exampleStart);
    expect(exampleSource).toContain("devices={['webgpu', 'webgl2']}");
    expect(exampleSource).toMatch(/\s+xrCompatible(?:\s|=)/);
    expect(exampleSource).toContain('native stereo projection layers when supported');
    expect(exampleSource).toContain('choose WebGL2 for immersive fallback');
    expect(wrapperSource).toContain('xrCompatible?: boolean');
    expect(wrapperSource).toContain('props.xrCompatible === true');
    expect(wrapperSource).toContain('continuing with desktop preview');
    expect(deviceStoreSource).toContain(':xr-compatible');
    expect(deviceStoreSource).toContain('{xrCompatible: true}');
  });

  test('keeps standalone launch, sidebar, and backend metadata accurate', () => {
    const standaloneSource = readFileSync(STANDALONE_PATH, 'utf8');
    const metadataSource = readFileSync(EXAMPLE_METADATA_PATH, 'utf8');
    const packageSource = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(standaloneSource).toContain("import {luma} from '@luma.gl/core'");
    expect(standaloneSource).toContain("import {webgpuAdapter} from '@luma.gl/webgpu'");
    expect(standaloneSource).toContain("import {webgl2Adapter} from '@luma.gl/webgl'");
    expect(standaloneSource).toContain("luma.createDevice(makeDeviceProps('webgpu', true))");
    expect(standaloneSource).toContain(
      'makeAnimationLoop(AnimationLoopTemplate, {device: currentDevice})'
    );
    expect(standaloneSource).toContain("toggleSession('immersive-vr')");
    expect(standaloneSource).toContain("toggleSession('immersive-ar')");
    expect(standaloneSource).toContain('switch-backend');
    expect(metadataSource).toContain('backends: [webgpu, webgl2]');
    expect(metadataSource).toContain('Immersive Prism Portal');
    expect(packageSource.dependencies).toHaveProperty('@luma.gl/webgpu');
    expect(packageSource.dependencies).toHaveProperty('@luma.gl/webgl');
  });
});
