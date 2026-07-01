#!/usr/bin/env node
/**
 * Adapts the workspace Launchpad manifest for the development-1 submodule layout.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(repoRoot, '..');
const sourceManifest = path.join(workspaceRoot, '.launchpad', 'cloud-deploy', 'manifest.json');
const destManifest = path.join(repoRoot, '.launchpad', 'cloud-deploy', 'manifest.json');

if (!fs.existsSync(sourceManifest)) {
  process.stderr.write(`Missing workspace manifest: ${sourceManifest}\n`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(sourceManifest, 'utf8'));
manifest.files = (manifest.files ?? []).map((file) => ({
  ...file,
  path: String(file.path ?? '').replace(/^development-1\//, ''),
}));

fs.mkdirSync(path.dirname(destManifest), { recursive: true });
fs.writeFileSync(destManifest, `${JSON.stringify(manifest, null, 2)}\n`);
