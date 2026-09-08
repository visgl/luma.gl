// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const REPOSITORY_ROOT = process.cwd();
const EXAMPLE_DIRECTORY = path.join(REPOSITORY_ROOT, 'examples');
const CATALOG_DIRECTORY = path.join(REPOSITORY_ROOT, 'website/content/examples');
const SUPPORT_BLOCK_PATTERN = /\n?\s*<!-- luma-example-support -->[\s\S]*?<!-- \/luma-example-support -->\n?/;
const CATALOG_ALIASES = new Map([
  ['arrow/arrow-instancing', 'showcase/instancing'],
  ['showcase/scene', 'experimental/scene-playground'],
  ['showcase/scene/playground', 'experimental/scene-playground'],
  ['tutorials/hello-instanced-cubes', 'tutorials/instanced-cubes'],
  ['tutorials/hello-two-cubes', 'tutorials/two-cubes']
]);
const STANDALONE_ONLY_DEFINITIONS = new Map([
  [
    'api/texture-compressed',
    {backends: ['webgpu', 'webgl2'], mobile: 'full', mobileProfile: 'standard'}
  ],
  [
    'integrations/hello-react',
    {backends: ['webgpu', 'webgl2'], mobile: 'full', mobileProfile: 'standard'}
  ],
  [
    'showcase/algebraic-varieties',
    {backends: ['webgpu', 'webgl2'], mobile: 'reduced', mobileProfile: 'simulation'}
  ]
]);

const htmlFiles = findStandaloneHtmlFiles(EXAMPLE_DIRECTORY).sort();

for (const relativeHtmlFile of htmlFiles) {
  const standaloneId = relativeHtmlFile.replace(/\/(?:index|playground)\.html$/, match =>
    match === '/index.html' ? '' : '/playground'
  );
  const catalogId = CATALOG_ALIASES.get(standaloneId) || standaloneId;
  const definition = readSupportDefinition(catalogId, standaloneId);
  const supportBlock = makeSupportBlock(catalogId, definition);
  const absoluteHtmlFile = path.join(EXAMPLE_DIRECTORY, relativeHtmlFile);
  let html = readFileSync(absoluteHtmlFile, 'utf8').replace(SUPPORT_BLOCK_PATTERN, '\n');

  if (!/<meta\s+name=["']viewport["']/i.test(html)) {
    const viewport = '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
    html = /<head(?:\s[^>]*)?>/i.test(html)
      ? html.replace(/<head(?:\s[^>]*)?>/i, match => `${match}\n${viewport}`)
      : html.replace(/<!doctype html>\s*/i, `<!doctype html>\n<head>\n${viewport}</head>\n`);
  }

  html = /<head(?:\s[^>]*)?>/i.test(html)
    ? html.replace(/<head(?:\s[^>]*)?>/i, match => `${match}\n${supportBlock}`)
    : html.replace(/<!doctype html>\s*/i, `<!doctype html>\n${supportBlock}\n`);
  writeFileSync(absoluteHtmlFile, html);
}

console.log(`Synchronized mobile support metadata for ${htmlFiles.length} standalone pages.`);

function readSupportDefinition(catalogId, standaloneId) {
  const catalogFile = path.join(CATALOG_DIRECTORY, `${catalogId}.mdx`);
  try {
    const source = readFileSync(catalogFile, 'utf8');
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
    const readValue = name => frontmatter.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, 'm'))?.[1];
    const backends = (readValue('backends') || '')
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    return {
      backends,
      mobile: readValue('mobile'),
      mobileProfile: readValue('mobileProfile'),
      unsupportedReason: readValue('mobileUnsupportedReason')
    };
  } catch (error) {
    const standaloneDefinition = STANDALONE_ONLY_DEFINITIONS.get(standaloneId);
    if (standaloneDefinition) {
      return standaloneDefinition;
    }
    throw new Error(`No mobile support declaration exists for ${standaloneId}`, {cause: error});
  }
}

function makeSupportBlock(catalogId, definition) {
  const unsupportedReasonMeta = definition.unsupportedReason
    ? `\n  <meta name="luma-example-mobile-unsupported-reason" content="${escapeHtmlAttribute(definition.unsupportedReason)}" />`
    : '';
  return `  <!-- luma-example-support -->
  <meta name="luma-example-id" content="${escapeHtmlAttribute(catalogId)}" />
  <meta name="luma-example-backends" content="${definition.backends.join(',')}" />
  <meta name="luma-example-mobile" content="${definition.mobile}" />
  <meta name="luma-example-mobile-profile" content="${definition.mobileProfile}" />${unsupportedReasonMeta}
  <script type="module" data-luma-example-support-bootstrap>
    import {installStandaloneExampleSupport} from '../../example-support.ts';
    const exampleSupport = installStandaloneExampleSupport();
    if (!exampleSupport.supported) {
      document
        .querySelectorAll('script[type="module"]:not([data-luma-example-support-bootstrap])')
        .forEach(script => script.remove());
    }
  </script>
  <!-- /luma-example-support -->`;
}

function escapeHtmlAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function findStandaloneHtmlFiles(directory, relativeDirectory = '') {
  const files = [];
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue;
    const entryPath = path.join(directory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findStandaloneHtmlFiles(entryPath, relativePath));
    } else if (
      statSync(entryPath).isFile() &&
      (entry.name === 'index.html' || entry.name === 'playground.html')
    ) {
      files.push(relativePath);
    }
  }
  return files;
}
