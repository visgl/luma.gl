// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {transformStaticImports} from './standalone-module-imports.mjs';

const REPOSITORY_ROOT = process.cwd();
const EXAMPLE_DIRECTORY = path.join(REPOSITORY_ROOT, 'examples');
const SUPPORT_BLOCK_PATTERN = /\n?\s*<!-- luma-example-support -->[\s\S]*?<!-- \/luma-example-support -->\n?/;
const DEFERRED_MODULE_TYPE = 'application/luma-example-module';
const APPLICATION_SCRIPT_ATTRIBUTE = 'data-luma-example-application';
const CATALOG_ALIASES = new Map([
  ['arrow/arrow-instancing', 'showcase/instancing'],
  ['showcase/scene', 'experimental/scene-playground'],
  ['showcase/scene/playground', 'experimental/scene-playground'],
  ['tutorials/hello-instanced-cubes', 'tutorials/instanced-cubes'],
  ['tutorials/hello-two-cubes', 'tutorials/two-cubes']
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
  html = gateApplicationModuleScripts(html);

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
  const sidecarFile = path.join(EXAMPLE_DIRECTORY, catalogId, 'mobile-support.ts');
  try {
    const source = readFileSync(sidecarFile, 'utf8');
    const backends = source
      .match(/backends:\s*\[([^\]]*)\]/)?.[1]
      ?.split(',')
      .map(value => value.trim().replaceAll(/["']/g, ''))
      .filter(Boolean);
    return {
      backends: backends || [],
      mobile: source.match(/mobileMode:\s*['"]([^'"]+)['"]/)?.[1],
      mobileProfile: source.match(/mobileProfile:\s*['"]([^'"]+)['"]/)?.[1],
      unsupportedReason: source.match(/unsupportedReason:\s*['"]([^'"]+)['"]/)?.[1]
    };
  } catch (error) {
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
  <script data-luma-example-support-promise>
    window.lumaExampleSupportPromise = new Promise(resolve => {
      window.addEventListener('luma-example-support-ready', event => resolve(event.detail), {
        once: true
      });
    });
  </script>
  <script type="module" data-luma-example-support-bootstrap>
    import {installStandaloneExampleSupport} from '../../example-support.ts';
    const exampleSupport = installStandaloneExampleSupport();
    window.dispatchEvent(
      new CustomEvent('luma-example-support-ready', {detail: exampleSupport})
    );
  </script>
  <!-- /luma-example-support -->`;
}

function gateApplicationModuleScripts(html) {
  return html.replace(
    /^([ \t]*)<script\b([^>]*)>([\s\S]*?)<\/script>/gim,
    (script, tagIndentation, attributes, source) => {
      const type = attributes.match(/\btype=(["'])(.*?)\1/i)?.[2];
      if (
        (type !== 'module' && type !== DEFERRED_MODULE_TYPE) ||
        attributes.includes(APPLICATION_SCRIPT_ATTRIBUTE)
      ) {
        return script;
      }

      const sourceAttribute = attributes.match(/\bsrc=(["'])(.*?)\1/i);
      const applicationSource = sourceAttribute
        ? `await import(${JSON.stringify(sourceAttribute[2])});`
        : transformStaticImports(source);
      if (/^\s*import\s/m.test(applicationSource)) {
        throw new Error('Standalone application scripts must use one-line static imports.');
      }

      const applicationAttributes = attributes
        .replace(/\s*\bsrc=(["'])(.*?)\1/i, '')
        .replace(
          /\btype=(["'])(?:module|application\/luma-example-module)\1/i,
          'type="module"'
        );
      const gatedSource = indentApplicationSource(applicationSource, `${tagIndentation}    `);
      return `${tagIndentation}<script${applicationAttributes} ${APPLICATION_SCRIPT_ATTRIBUTE}>
${tagIndentation}  const exampleSupport = await window.lumaExampleSupportPromise;
${tagIndentation}  if (exampleSupport.supported) {
${gatedSource}
${tagIndentation}  }
${tagIndentation}</script>`;
    }
  );
}

function indentApplicationSource(source, indentation) {
  const lines = source.replace(/^\s*\n/, '').replace(/\n\s*$/, '').split('\n');
  const indentationLengths = lines
    .filter(line => line.trim())
    .map(line => line.match(/^\s*/)[0].length);
  const minimumIndentation = Math.min(...indentationLengths);
  return lines
    .map(line => `${indentation}${line.slice(minimumIndentation)}`.trimEnd())
    .join('\n');
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
