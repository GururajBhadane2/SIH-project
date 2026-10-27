import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[34m%s\x1b[0m', '=====================================================');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Starting AICTE FlowX - Full-Stack Local Server');
console.log('\x1b[33m%s\x1b[0m', '  STUDENT PROTOTYPE — NOT AN OFFICIAL AICTE SYSTEM');
console.log('\x1b[34m%s\x1b[0m', '=====================================================\n');

function runProcess(cmd, args, cwd, label, color) {
  const proc = spawn(cmd, args, {
    cwd: path.resolve(rootDir, cwd),
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`${color}[${label}]\x1b[0m ${line}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`${color}[${label} ERR]\x1b[0m ${line}`);
    }
  });

  proc.on('close', (code) => {
    console.log(`${color}[${label}]\x1b[0m Process exited with code ${code}`);
  });

  return proc;
}

const serverProc = runProcess('npm', ['run', 'dev'], 'server', 'BACKEND', '\x1b[32m');
const clientProc = runProcess('npm', ['run', 'dev'], 'client', 'FRONTEND', '\x1b[35m');

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down services...');
  serverProc.kill();
  clientProc.kill();
  process.exit();
});
