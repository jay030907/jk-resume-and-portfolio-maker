import { spawn } from 'node:child_process';

const nextBin = process.platform === 'win32' ? 'npx.cmd' : './node_modules/.bin/next';
const baseArgs = process.platform === 'win32'
  ? ['next', 'dev', '-p', '3000', '-H', '0.0.0.0']
  : ['dev', '-p', '3000', '-H', '0.0.0.0'];

const child = spawn(nextBin, baseArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
child.on('exit', (code) => process.exit(code ?? 0));
