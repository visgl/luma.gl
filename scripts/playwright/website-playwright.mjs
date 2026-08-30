import {runWebsitePlaywrightCli} from './website-playwright-cli.mjs';

runWebsitePlaywrightCli(process.argv.slice(2)).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
