import {defineConfig} from 'vite';
import fs from 'fs/promises';
import {resolve} from 'path';
/** @see https://vitejs.dev/config/ */

// @ts-expect-error Seems appType is not typed in the root but that is where it takes effect
export default defineConfig(async () => ({
  appType: 'mpa', // disable history fallback, generate 404s
  root: resolve(__dirname),
  resolve: {alias: await getAliases('@luma.gl', `${__dirname}/../../..`)},
  server: {
    appType: 'mpa', // disable history fallback, generate 404s
    open: true
  },
  publicDir: resolve(__dirname, '../../../modules/core/test/data/compressed-textures')
}));

/** Run against local source */
const getAliases = async (frameworkName: string, frameworkRootDir: string) => {
  const modules = await fs.readdir(`${frameworkRootDir}/modules`);
  const aliases = {} as Record<string, string>;
  for (const module of modules) {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`;
  }
  return aliases;
};
