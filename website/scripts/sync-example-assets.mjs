import {cpSync, mkdirSync, readdirSync, rmSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const websiteDirectory = path.resolve(scriptDirectory, '..');
const examplesDirectory = path.resolve(websiteDirectory, '..', 'examples');
const outputDirectory = path.resolve(
  websiteDirectory,
  '.generated',
  'example-assets',
  'example-assets'
);

const ASSET_EXTENSIONS = new Set([
  '.avif',
  '.bin',
  '.bmp',
  '.dds',
  '.gif',
  '.glb',
  '.gltf',
  '.hdr',
  '.jpeg',
  '.jpg',
  '.ktx',
  '.ktx2',
  '.mtl',
  '.obj',
  '.pvr',
  '.png',
  '.svg',
  '.webp'
]);

const SKIPPED_DIRECTORY_NAMES = new Set(['dist', 'node_modules']);

function syncExampleAssets() {
  rmSync(path.resolve(websiteDirectory, '.generated', 'example-assets'), {
    force: true,
    recursive: true
  });
  mkdirSync(outputDirectory, {recursive: true});

  let copiedAssetCount = 0;

  const walkDirectory = currentDirectory => {
    for (const entryName of readdirSync(currentDirectory)) {
      if (SKIPPED_DIRECTORY_NAMES.has(entryName)) {
        continue;
      }

      const entryPath = path.join(currentDirectory, entryName);
      const entryStats = statSync(entryPath);

      if (entryStats.isDirectory()) {
        walkDirectory(entryPath);
        continue;
      }

      const extension = path.extname(entryName).toLowerCase();
      if (!ASSET_EXTENSIONS.has(extension)) {
        continue;
      }

      const relativePath = path.relative(examplesDirectory, entryPath);
      const destinationPath = path.join(outputDirectory, relativePath);
      mkdirSync(path.dirname(destinationPath), {recursive: true});
      cpSync(entryPath, destinationPath);
      copiedAssetCount++;
    }
  };

  walkDirectory(examplesDirectory);
  console.log(`Synced ${copiedAssetCount} example assets to ${outputDirectory}`);
}

syncExampleAssets();
