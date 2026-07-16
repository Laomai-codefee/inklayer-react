import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

function collectExportTargets(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(collectExportTargets);
}

const targets = new Set([
  packageJson.main,
  packageJson.module,
  packageJson.types,
  ...collectExportTargets(packageJson.exports),
]);

const missing = [];
for (const target of targets) {
  if (!target) continue;
  try {
    await access(resolve(target));
  } catch {
    missing.push(target);
  }
}

if (missing.length > 0) {
  throw new Error(`Missing package entry files: ${missing.join(', ')}`);
}

console.log(`Verified ${targets.size} package entry files.`);
