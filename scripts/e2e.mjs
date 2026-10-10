import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const install = process.argv[2] === 'install';
const result = spawnSync(
  process.execPath,
  [
    resolve('node_modules/@playwright/test/cli.js'),
    ...(install
      ? ['install', 'chromium', 'firefox', 'webkit']
      : ['test', ...process.argv.slice(2)]),
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? resolve('.cache/browsers'),
    },
  },
);
process.exit(result.status ?? 1);
