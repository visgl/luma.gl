import {resolve} from 'node:path';
import {defineConfig} from 'vite';

const workspaceRoot = resolve(__dirname, '../../..');
const localLoadersRoot = process.env.VITE_LOADERS_GL_ROOT;

const alias = {
  '@luma.gl/arrow': `${workspaceRoot}/modules/arrow/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/splats': `${__dirname}/../../../modules/splats/src`,
  '@luma.gl/tables': `${__dirname}/../../../modules/tables/src`,
  '@luma.gl/webgl/constants': `${__dirname}/../../../modules/webgl/src/constants`,
  '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`,
  '@math.gl/geoarrow': `${workspaceRoot}/modules/geoarrow/src`
};

export default defineConfig({
  resolve: {alias},
  plugins: [
    {
      name: 'gaussian-splats-watch-workspace-source',
      configureServer(server) {
        server.watcher.add([
          resolve(workspaceRoot, 'modules/splats/src'),
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
