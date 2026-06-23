import { readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../../src');

function findTestFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findTestFiles(full));
    else if (entry.name.endsWith('.test.js')) results.push(full);
  }
  return results;
}

const files = findTestFiles(root).sort();
let failed = 0;

for (const file of files) {
  try {
    await import(new URL(`file://${file}`));
  } catch (err) {
    console.error(`\x1b[31m✗ ${relative(root, file)}\x1b[0m`);
    console.error(`  ${err.message}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} test file(s) failed.`);
  process.exit(1);
}
