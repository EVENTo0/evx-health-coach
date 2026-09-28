import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

for (const path of ['.env', '.agents/.env', 'admin/.env', 'evx/.env', 'evx/admin/.env']) {
  assert.ok(!existsSync(path), `CI must not load a tracked runtime environment: ${path}`);
}

const clientSecretName = /\b(?:EXPO_PUBLIC|VITE|NEXT_PUBLIC)_[A-Z0-9_]*(?:OPENAI_API_KEY|SERVICE_ROLE|SERVICE_KEY|SECRET_KEY)\b/;
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) inspect(path);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      assert.ok(!clientSecretName.test(readFileSync(path, 'utf8')), `Client source exposes a server-secret configuration path: ${path}`);
    }
  }
}
inspect('src');
inspect('admin/src');
console.log('CI boundary PASS: no runtime environment files or public server-secret configuration paths');
