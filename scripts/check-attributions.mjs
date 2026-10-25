// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const readText = filename => readFileSync(path.join(repositoryRoot, filename), 'utf8');
const inventory = JSON.parse(readText('dev-docs/attribution-inventory.json'));
const packages = readdirSync(path.join(repositoryRoot, 'modules')).filter(directory => {
  const filename = path.join('modules', directory, 'package.json');
  return existsSync(path.join(repositoryRoot, filename));
});
const publicPackages = packages.filter(directory =>
  !JSON.parse(readText(path.join('modules', directory, 'package.json'))).private
);

assert.deepEqual(
  publicPackages.sort(),
  [...inventory.publicPackages].sort(),
  'Update the attribution inventory when public packages change'
);

for (const directory of packages) {
  const packageRoot = path.join('modules', directory);
  const manifest = JSON.parse(readText(path.join(packageRoot, 'package.json')));
  const noticePath = path.join(packageRoot, 'THIRD-PARTY-NOTICES.md');
  const notices = readText(noticePath);
  const requiredFiles = new Set(['LICENSE', 'THIRD-PARTY-NOTICES.md']);
  assert.equal(readText(path.join(packageRoot, 'LICENSE')), readText('LICENSE'));

  const addRequiredNotice = filename => {
    assert(filename.startsWith(packageRoot + path.sep), 'Package notices must stay inside the package');
    assert(existsSync(path.join(repositoryRoot, filename)), 'Broken notice link: ' + filename);
    assert(readText(filename).trim().length > 100, 'Empty notice: ' + filename);
    const relativeFilename = path.relative(packageRoot, filename);
    requiredFiles.add(relativeFilename);
    assert(
      !manifest.files || manifest.files.some(entry => relativeFilename === entry || relativeFilename.startsWith(entry + '/')),
      'Notice missing from files manifest: ' + filename
    );
  };
  for (const match of notices.matchAll(/\]\((\.\/[^)#]+)(?:#[^)]*)?\)/gu)) {
    addRequiredNotice(path.normalize(path.join(packageRoot, match[1])));
  }
  // The recorded inventory is independent of editable Markdown links.
  for (const filename of new Set(inventory.sources.flatMap(source => source.notices))) {
    if (filename.startsWith(packageRoot + '/')) {
      addRequiredNotice(filename);
    }
  }

  for (const filename of ['LICENSE', 'THIRD-PARTY-NOTICES.md']) {
    assert(!manifest.files || manifest.files.includes(filename), 'Missing package files entry: ' + packageRoot + '/' + filename);
  }

  // An absent files allowlist preserves npm's default packaging, including code.
  for (const filename of ['src/index.ts', manifest.main, manifest.module, manifest.types].filter(Boolean)) {
    if (existsSync(path.join(repositoryRoot, packageRoot, filename))) {
      requiredFiles.add(filename);
      assert(!manifest.files || manifest.files.some(entry => filename === entry || filename.startsWith(entry + '/')),
        'Code missing from files manifest: ' + packageRoot + '/' + filename);
    }
  }

  if (process.argv.includes('--pack')) {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: path.join(repositoryRoot, packageRoot),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const packedFiles = new Set(JSON.parse(output)[0].files.map(file => file.path));
    for (const filename of requiredFiles) {
      assert(packedFiles.has(filename), 'Notice absent from npm pack: ' + packageRoot + '/' + filename);
    }
  }
}

// These retained sources must keep their upstream ownership and provenance.
for (const entry of inventory.sources) {
  for (const filename of entry.files) {
    const source = readText(filename);
    for (const marker of entry.markers) {
      assert(source.includes(marker), 'Missing upstream attribution in ' + filename + ': ' + marker);
    }
  }
  for (const filename of entry.notices) {
    assert(readText(filename).trim().length > 100, 'Missing full upstream notice: ' + filename);
  }
}

// Verify local documentation links without depending on upstream network availability.
const guide = readText('docs/references-and-credits.md');
for (const match of guide.matchAll(/\]\((\.\/[^)#]+)(?:#[^)]*)?\)/gu)) {
  assert(existsSync(path.join(repositoryRoot, 'docs', match[1])), 'Broken credits link: ' + match[1]);
}
assert(readText('README.md').includes('docs/references-and-credits.md'));
for (const match of guide.matchAll(/https:\/\/github\.com\/visgl\/luma\.gl\/blob\/master\/([^\s)#]+)/gu)) {
  assert(existsSync(path.join(repositoryRoot, match[1])), 'Broken repository credits link: ' + match[1]);
}
assert(readText('docs/table-of-contents.json').includes('"references-and-credits"'));
assert(readText('website/docusaurus.config.js').includes('docs/references-and-credits'));

// Standalone website distributions need full terms even when bundlers remove comments.
const distributionSources = ['LICENSE', 'examples/THIRD-PARTY-NOTICES.md',
  'modules/shadertools/src/modules/lighting/area-lighting/LTC-LICENSE.txt',
  'website/static/images/examples/gltf/ATTRIBUTION.md',
  'examples/licenses/picogl.txt',
  'examples/anari/scenes/public/gltf/ASSET-LICENSE.md',
  'examples/anari/scenes/public/usd/ASSET-LICENSE.md',
  'examples/experimental/text-space-crawl/public/fonts/OFL.txt'];
for (const directory of packages.sort()) {
  distributionSources.push('modules/' + directory + '/THIRD-PARTY-NOTICES.md');
  const licenseDirectory = 'modules/' + directory + '/licenses';
  if (existsSync(path.join(repositoryRoot, licenseDirectory))) {
    for (const filename of readdirSync(path.join(repositoryRoot, licenseDirectory)).sort()) {
      distributionSources.push(licenseDirectory + '/' + filename);
    }
  }
}
const distributionNotices = 'luma.gl example distribution notices\n' +
  'Generated by yarn check:attributions --write-distribution.\n' +
  'Source paths below are relative to https://github.com/visgl/luma.gl\n\n' +
  distributionSources.map(filename => '===== ' + filename + ' =====\n\n' +
    readText(filename).trim().split('\n').map(line => line.trimEnd()).join('\n') + '\n').join('\n');
const distributionPath = 'website/static/standalone-examples/THIRD-PARTY-NOTICES.txt';
if (process.argv.includes('--write-distribution')) {
  writeFileSync(path.join(repositoryRoot, distributionPath), distributionNotices);
}
assert.equal(readText(distributionPath), distributionNotices,
  'Refresh standalone notices with yarn check:attributions --write-distribution');
console.log('Attribution checks passed for ' + packages.length + ' workspaces (' + publicPackages.length + ' public)' +
  (process.argv.includes('--pack') ? ', including npm pack contents.' : '.'));
