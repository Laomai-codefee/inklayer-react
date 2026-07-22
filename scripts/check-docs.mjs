import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const build = spawnSync(npm, ['run', 'build:playground'], {
  cwd: root,
  stdio: 'inherit',
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const status = spawnSync(
  'git',
  ['status', '--porcelain=v1', '--untracked-files=all', '--', 'docs'],
  { cwd: root, encoding: 'utf8' },
);

if (status.status !== 0) {
  process.stderr.write(status.stderr || 'Unable to inspect generated docs.\n');
  process.exit(status.status ?? 1);
}

if (status.stdout.trim()) {
  console.error('\nGenerated docs are out of date:');
  console.error(status.stdout.trimEnd());
  console.error('\nReview and commit the regenerated docs before releasing.');
  process.exit(1);
}

console.log('Verified that generated docs match the committed playground sources.');
