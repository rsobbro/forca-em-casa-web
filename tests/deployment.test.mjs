import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('deploy inclui todos os módulos importados pelo aplicativo', () => {
  const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const gate = readFileSync(new URL('../gate.js', import.meta.url), 'utf8');
  const copy = workflow.match(/^\s+cp (.+) _site\/$/m);
  assert.ok(copy, 'workflow deve copiar os arquivos para _site');
  const copied = new Set(copy[1].split(/\s+/));
  for (const match of (app+'\n'+gate).matchAll(/import\s+.*?\s+from\s+['"]\.\/([^'"]+)['"]/g)) {
    assert.ok(copied.has(match[1]), `Dependência ausente na publicação: ${match[1]}`);
  }
  assert.ok(copied.has('index.html'));
});
