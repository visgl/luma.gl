import {resolve} from 'node:path';
import {defineConfig} from 'vite';

const workspaceRoot = resolve(__dirname, '../../..');
const localLoadersRoot = process.env.VITE_LOADERS_GL_ROOT;

const alias = {
  '@luma.gl/arrow': `${workspaceRoot}/modules/arrow/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine/models': `${__dirname}/../../../modules/engine/src/graph/models`,
  '@luma.gl/engine/physics': `${__dirname}/../../../modules/engine/src/graph/physics`,
  '@luma.gl/engine/tables': `${__dirname}/../../../modules/engine/src/graph/tables`,
  '@luma.gl/engine/text-fonts': `${__dirname}/../../../modules/engine/src/text/fonts`,
  '@luma.gl/engine/text-3d': `${__dirname}/../../../modules/engine/src/text/text-3d`,
  '@luma.gl/engine/text-experimental': `${__dirname}/../../../modules/engine/src/text/experimental.ts`,
  '@luma.gl/engine/text': `${__dirname}/../../../modules/engine/src/text`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/engine/splats': `${__dirname}/../../../modules/engine/src/splats`,
  '@luma.gl/gpgpu/_internal': `${__dirname}/../../../modules/gpgpu/src/execution`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/graph': `${__dirname}/../../../modules/graph/src`,
  '@luma.gl/core/webgl-constants': `${__dirname}/../../../modules/core/src/webgl-constants`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
  '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
};

export default defineConfig({
  resolve: {alias},
  plugins: [
    {
      name: 'gaussian-splats-watch-workspace-source',
      configureServer(server) {
        server.watcher.add([
          resolve(workspaceRoot, 'modules/engine/src/splats'),
          resolve(workspaceRoot, 'modules/arrow/src')
        ]);
        if (localLoadersRoot) {
          server.watcher.add([
            resolve(localLoadersRoot, 'modules/core/src'),
            resolve(localLoadersRoot, 'modules/ply/src'),
            resolve(localLoadersRoot, 'modules/splats/src')
          ]);
        }
      }
    }
  ],
  server: {
    open: true,
    ...(localLoadersRoot ? {fs: {allow: [workspaceRoot, resolve(localLoadersRoot)]}} : {})
  }
});
