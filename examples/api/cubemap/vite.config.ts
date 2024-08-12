import {defineConfig} from 'vite';
import fs from 'fs';

export default defineConfig(async () => ({
  resolve: {alias: await getAliases('@luma.gl', `${__dirname}/../../..`)},
  server: {open: true}
}));

/** Run against local source */
const getAliases = async (frameworkName, frameworkRootDir) => {
  const modules = await fs.promises.readdir(`${frameworkRootDir}/modules`);
  const aliases = {};
  modules.forEach(module => {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`;
  });
  return aliases;
};
