import {defineConfig} from 'vite';
import {readdirSync} from 'fs';

const MODULES_DIR = `${__dirname}/../../../modules`;
const modules = readdirSync(MODULES_DIR);
const alias = Object.fromEntries(
  modules.map(module => [`@luma.gl/${module}`, `${MODULES_DIR}/${module}/src`])
);

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
