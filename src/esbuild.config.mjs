import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve('./package.json');
const { dependencies = {} } = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

build({
    entryPoints: ['./index.ts'],
    outdir: 'dist',
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    sourcemap: true,
    external: [
        ...Object.keys(dependencies),
    ],
}).catch(() => process.exit(1));
