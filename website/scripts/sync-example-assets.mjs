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
  '.json',
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
const SKIPPED_EXAMPLE_DIRECTORIES = new Set([
  // ANARI runs as a standalone Vite app and is not embedded in the website.
  path.join('showcase', 'anari')
]);
const EXAMPLE_SOURCE_FILE_NAMES = new Set(['app.ts', 'app.tsx', 'index.html', 'package.json']);

function syncExampleAssets() {
  mkdirSync(outputDirectory, {recursive: true});

  let copiedAssetCount = 0;
  let unchangedAssetCount = 0;
  let removedAssetCount = 0;
  const assetPaths = new Set();

  const walkDirectory = currentDirectory => {
    for (const entry of readdirSync(currentDirectory, {withFileTypes: true})) {
      if (SKIPPED_DIRECTORY_NAMES.has(entry.name)) {
        continue;
      }

      const entryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (!SKIPPED_EXAMPLE_DIRECTORIES.has(path.relative(examplesDirectory, entryPath))) {
          walkDirectory(entryPath);
        }
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!ASSET_EXTENSIONS.has(extension) && !EXAMPLE_SOURCE_FILE_NAMES.has(entry.name)) {
        continue;
      }

      const relativePath = getWebsiteAssetPath(path.relative(examplesDirectory, entryPath));
      const destinationPath = path.join(outputDirectory, relativePath);
      assetPaths.add(relativePath);

      const sourceStats = statSync(entryPath);
      const destinationStats = statSync(destinationPath, {throwIfNoEntry: false});
      if (
        destinationStats?.isFile() &&
        sourceStats.size === destinationStats.size &&
        sourceStats.mtimeMs <= destinationStats.mtimeMs
      ) {
        unchangedAssetCount++;
        continue;
      }

      mkdirSync(path.dirname(destinationPath), {recursive: true});
      cpSync(entryPath, destinationPath);
      copiedAssetCount++;
    }
  };

  walkDirectory(examplesDirectory);

  const removeStaleAssets = currentDirectory => {
    for (const entry of readdirSync(currentDirectory, {withFileTypes: true})) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        removeStaleAssets(entryPath);
        if (readdirSync(entryPath).length === 0) {
          rmSync(entryPath, {recursive: true});
        }
      } else if (!assetPaths.has(path.relative(outputDirectory, entryPath))) {
        rmSync(entryPath);
        removedAssetCount++;
      }
    }
  };

  removeStaleAssets(outputDirectory);
  console.log(
    `Synced example assets: ${copiedAssetCount} copied, ${unchangedAssetCount} unchanged, ${removedAssetCount} removed.`
  );
}

function getWebsiteAssetPath(relativePath) {
  const pathSegments = relativePath.split(path.sep);
  return pathSegments[2] === 'public'
    ? path.join(...pathSegments.slice(0, 2), ...pathSegments.slice(3))
    : relativePath;
}

syncExampleAssets();
