import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import archiver from 'archiver';

const output = 'dist-lambda.zip';

await rm(output, { force: true });

const archive = archiver('zip', { zlib: { level: 9 } });
const stream = createWriteStream(output);

archive.pipe(stream);
archive.file('package.json', { name: 'package.json' });
archive.directory('dist/', false);
archive.directory('node_modules/', 'node_modules');
archive.finalize();

await new Promise((resolve, reject) => {
  stream.on('close', resolve);
  archive.on('error', reject);
});

console.log(`Created ${output}`);
