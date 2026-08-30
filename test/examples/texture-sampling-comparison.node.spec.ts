// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const REPOSITORY_ROOT = process.cwd();
const EXAMPLE_DIRECTORY = path.join(REPOSITORY_ROOT, 'examples/api/texture-sampling');
const EXAMPLE_SOURCE = readFileSync(path.join(EXAMPLE_DIRECTORY, 'app.ts'), 'utf8');
const LEFT_COLOR_SAMPLER = 'activeLeftColorSampler';
const RIGHT_COLOR_SAMPLER = 'activeRightColorSampler';
const LEFT_COMPARISON_SAMPLER = 'activeLeftComparisonSampler';
const RIGHT_COMPARISON_SAMPLER = 'activeRightComparisonSampler';

describe('interactive texture sampler comparisons', () => {
  test('uses the accessible shared comparison splitter instead of a settings slider', () => {
    expect(EXAMPLE_SOURCE).toMatch(
      /import\s*\{[^}]*\bComparisonSplitter\b[^}]*\}\s*from\s*['"]@luma\.gl\/experimental['"]/
    );
    expect(EXAMPLE_SOURCE).toMatch(/new\s+ComparisonSplitter\s*\(/);
    expect(EXAMPLE_SOURCE).toContain("id: 'texture-sampling-comparison-splitter'");
    expect(EXAMPLE_SOURCE).toMatch(/value:\s*this\.comparisonSplit/);
    expect(EXAMPLE_SOURCE).toMatch(/onChange:\s*\w+\s*=>/);
    expect(EXAMPLE_SOURCE).toMatch(/this\.comparisonSplit\s*=/);
    expect(EXAMPLE_SOURCE).not.toMatch(/name:\s*['"](?:split|comparisonSplit)['"]/);
    expect(EXAMPLE_SOURCE).not.toMatch(/makeRangeSetting\s*\(\s*['"](?:split|comparisonSplit)['"]/);
  });

  test('defaults to visibly different, independently selectable sampler settings', () => {
    expect(EXAMPLE_SOURCE).toMatch(/leftSamplerPreset:\s*['"]nearest-pixels['"]/);
    expect(EXAMPLE_SOURCE).toMatch(/preset:\s*['"]trilinear['"]/);
    expect(EXAMPLE_SOURCE).toMatch(/name:\s*['"]leftSamplerPreset['"]/);
    expect(EXAMPLE_SOURCE).toMatch(/label:\s*['"]Left sampler['"]/);
    expect(EXAMPLE_SOURCE).toMatch(/label:\s*['"]Right sampler['"]/);

    for (const sampler of [
      LEFT_COLOR_SAMPLER,
      RIGHT_COLOR_SAMPLER,
      LEFT_COMPARISON_SAMPLER,
      RIGHT_COMPARISON_SAMPLER
    ]) {
      expect(EXAMPLE_SOURCE).toContain(sampler);
    }

    expect(EXAMPLE_SOURCE).toContain('applyColorSamplers');
    expect(EXAMPLE_SOURCE).toContain('applyComparisonSamplers');
    expect(EXAMPLE_SOURCE).toMatch(/makeLeftSamplerSettings\s*\(/);
    expect(EXAMPLE_SOURCE).toMatch(/\.\.\.PRESETS\[settings\.leftSamplerPreset\]/);
  });

  test('clips two full diagnostic scenes to the live divider', () => {
    const renderMethod = readClassMethod('onRender');
    const comparisonViewMethod = readClassMethod('renderComparisonView');

    expect(renderMethod).toMatch(/this\.renderComparisonView\s*\(\s*renderPass\s*,\s*['"]left['"]/);
    expect(renderMethod).toMatch(
      /this\.renderComparisonView\s*\(\s*renderPass\s*,\s*['"]right['"]/
    );
    expect(comparisonViewMethod).toMatch(/\.setParameters\s*\(\s*\{[^}]*scissorRect:/s);
    expect(comparisonViewMethod).toContain('this.comparisonSplit');

    expect(comparisonViewMethod).toContain('this.colorMagnifiedModel.draw(renderPass)');
    expect(comparisonViewMethod).toContain('this.colorRecedingModel.draw(renderPass)');
    expect(comparisonViewMethod).toContain('this.comparisonMagnifiedModel.draw(renderPass)');
    expect(comparisonViewMethod).toContain('this.comparisonRecedingModel.draw(renderPass)');
  });

  test('binds each side’s actual color sampler immediately before drawing its scene', () => {
    const comparisonViewMethod = readClassMethod('renderComparisonView');
    const colorModelMethod = readClassMethod('makeColorSampleModel');
    const samplerBindingIndex = comparisonViewMethod.indexOf('this.colorTexture.setSampler(');

    expect(samplerBindingIndex).toBeGreaterThanOrEqual(0);
    expect(comparisonViewMethod).toContain(LEFT_COLOR_SAMPLER);
    expect(comparisonViewMethod).toContain(RIGHT_COLOR_SAMPLER);
    expect(colorModelMethod).toMatch(/uTexture:\s*this\.colorTexture/);
    expect(
      comparisonViewMethod.indexOf('this.colorMagnifiedModel.draw(renderPass)')
    ).toBeGreaterThan(samplerBindingIndex);
    expect(
      comparisonViewMethod.indexOf('this.colorRecedingModel.draw(renderPass)')
    ).toBeGreaterThan(samplerBindingIndex);
  });

  test('preserves independently sampled depth-comparison views', () => {
    const comparisonViewMethod = readClassMethod('renderComparisonView');
    const comparisonModelMethod = readClassMethod('makeComparisonSampleModel');
    const samplerBindingIndex = comparisonViewMethod.indexOf('this.depthTexture.setSampler(');

    expect(EXAMPLE_SOURCE).toContain("sampleMode: 'color-texture'");
    expect(comparisonViewMethod).toContain("this.settings.sampleMode === 'depth-comparison'");
    expect(comparisonViewMethod).toContain(LEFT_COMPARISON_SAMPLER);
    expect(comparisonViewMethod).toContain(RIGHT_COMPARISON_SAMPLER);
    expect(samplerBindingIndex).toBeGreaterThanOrEqual(0);
    expect(comparisonModelMethod).toMatch(/uDepthTexture:\s*this\.depthTexture/);
    expect(
      comparisonViewMethod.indexOf('this.comparisonMagnifiedModel.draw(renderPass)')
    ).toBeGreaterThan(samplerBindingIndex);
    expect(
      comparisonViewMethod.indexOf('this.comparisonRecedingModel.draw(renderPass)')
    ).toBeGreaterThan(samplerBindingIndex);
  });

  test('updates divider positioning and releases all comparison-owned resources', () => {
    const renderMethod = readClassMethod('onRender');
    const finalizeMethod = readClassMethod('onFinalize');

    expect(renderMethod).toContain('this.comparisonSplitter?.updateLayout()');
    expect(finalizeMethod).toContain('this.comparisonSplitter?.destroy()');

    for (const sampler of [
      LEFT_COLOR_SAMPLER,
      RIGHT_COLOR_SAMPLER,
      LEFT_COMPARISON_SAMPLER,
      RIGHT_COMPARISON_SAMPLER
    ]) {
      expect(finalizeMethod).toContain(`this.${sampler}?.destroy()`);
    }
  });

  test('declares and resolves the reusable experimental package', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(EXAMPLE_DIRECTORY, 'package.json'), 'utf8')
    ) as {dependencies: Record<string, string>};
    const viteConfig = readFileSync(path.join(EXAMPLE_DIRECTORY, 'vite.config.ts'), 'utf8');

    expect(packageJson.dependencies['@luma.gl/experimental']).toBe(
      packageJson.dependencies['@luma.gl/engine']
    );
    expect(viteConfig).toMatch(/['"]@luma\.gl\/experimental['"]:\s*`/);
  });

  test('documents direct comparison while preserving both advertised backends', () => {
    const documentation = readFileSync(
      path.join(REPOSITORY_ROOT, 'website/content/examples/api/texture-sampling.mdx'),
      'utf8'
    );

    expect(documentation).toMatch(/backends:\s*\[webgpu,\s*webgl2\]/);
    expect(documentation).toMatch(
      /drag(?:gable|ging)?\s+(?:the\s+)?(?:comparison\s+)?(?:divider|splitter)/i
    );
    expect(documentation).toMatch(/independent(?:ly)?(?:\s+\w+){0,3}\s+samplers/i);
    expect(documentation).toMatch(/arrow\s+keys/i);
  });
});

function readClassMethod(methodName: string): string {
  const method = EXAMPLE_SOURCE.match(
    new RegExp(`^  (?:private\\s+(?:async\\s+)?)?${methodName}\\s*\\([\\s\\S]*?\\n  \\}`, 'm')
  );

  expect(method, `Expected texture sampling example to implement ${methodName}`).not.toBeNull();
  return method?.[0] || '';
}
