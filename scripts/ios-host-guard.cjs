const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');

// One canonical host path, independent of project and EAS cache versions.
// Stale locks require inspection: a dead wrapper may have surviving children.
function acquireLock(directory) {
  fs.mkdirSync(path.dirname(directory), { recursive: true, mode: 0o700 });
  try { fs.mkdirSync(directory, { mode: 0o700 }); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`iOS signing is locked; inspect ${directory}. Do not remove it while a build may still be running.`);
    throw error;
  }
  const token = crypto.randomUUID();
  try {
    fs.writeFileSync(path.join(directory, 'owner.json'), JSON.stringify({ pid: process.pid, token, cwd: process.cwd(), startedAt: new Date().toISOString() }), { flag: 'wx', mode: 0o600 });
  } catch (error) {
    fs.rmdirSync(directory);
    throw error;
  }
  return () => {
    const owner = JSON.parse(fs.readFileSync(path.join(directory, 'owner.json'), 'utf8'));
    if (owner.pid !== process.pid || owner.token !== token) throw new Error('iOS signing lock ownership changed; retaining evidence.');
    // Remove only files this invocation owns; unexpected contents retain the lock.
    for (const name of fs.readdirSync(directory)) {
      if (!['owner.json', 'keychains.json'].includes(name)) throw new Error('Unexpected signing lock contents; retaining evidence.');
    }
    if (fs.existsSync(path.join(directory, 'keychains.json'))) fs.unlinkSync(path.join(directory, 'keychains.json'));
    fs.unlinkSync(path.join(directory, 'owner.json'));
    fs.rmdirSync(directory);
  };
}

function parseKeychains(output) {
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const value = JSON.parse(line);
    if (typeof value !== 'string' || !path.isAbsolute(value)) throw new Error('Unexpected keychain search-list output.');
    return value;
  });
}

// Read executable names only: process arguments may contain credentials.
function activeXcodebuildPids(output) {
  return output.split(/\r?\n/).filter((line) => line.trim()).flatMap((line) => {
    const match = line.match(/^\s*(\d+)\s+(.+?)\s*$/);
    if (!match) throw new Error('Could not parse host process snapshot; refusing signing.');
    return path.basename(match[2]) === 'xcodebuild' ? [Number(match[1])] : [];
  });
}

function processGroupAlive(pid) {
  try { process.kill(-pid, 0); return true; }
  catch (error) {
    if (error.code === 'ESRCH') return false;
    throw new Error('Could not verify the iOS child process group has exited.');
  }
}

async function runGuard(command, args, options = {}) {
  const directory = options.directory || path.join(os.homedir(), '.cache/uulab/ios-signing.lock');
  const security = options.security || ((args) => execFileSync('/usr/bin/security', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  const release = acquireLock(directory);
  const processSnapshot = options.processSnapshot || (() => execFileSync('/bin/ps',
    ['-U', String(process.getuid()), '-o', 'pid=,comm='],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  let original;
  let restored = false;
  let safeToRestore = true;
  try {
    let active;
    try { active = activeXcodebuildPids(processSnapshot()); }
    catch { throw new Error('Host build inspection failed; refusing to change keychains.'); }
    if (active.length) {
      throw new Error(`Another xcodebuild is running (PID ${active.join(', ')}); wait for it to finish before signing.`);
    }
    original = parseKeychains(security(['list-keychains', '-d', 'user']));
    fs.writeFileSync(path.join(directory, 'keychains.json'), JSON.stringify(original), { mode: 0o600 });
    const result = await new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: options.cwd, env: options.env, stdio: 'inherit', detached: true });
      let interrupted = false;
      const forward = (signal) => {
        interrupted = true;
        if (child.pid) {
          try { process.kill(-child.pid, signal); }
          catch (error) { if (error.code !== 'ESRCH') process.stderr.write('Could not forward signal to iOS process group.\n'); }
        }
      };
      const onInt = () => forward('SIGINT');
      const onTerm = () => forward('SIGTERM');
      process.on('SIGINT', onInt);
      process.on('SIGTERM', onTerm);
      const remove = () => {
        process.off('SIGINT', onInt);
        process.off('SIGTERM', onTerm);
      };
      child.once('error', (error) => { remove(); reject(error); });
      child.once('close', (code, signal) => {
        remove();
        // The EAS parent may exit before its compiler/signing descendants.
        // Never restore global state or admit a second build while they live.
        try {
          if (child.pid && processGroupAlive(child.pid)) {
            safeToRestore = false;
            reject(new Error('iOS child process group is still active; retaining signing lock and snapshot.'));
            return;
          }
        } catch (error) {
          safeToRestore = false;
          reject(error);
          return;
        }
        resolve(interrupted || signal ? 1 : code ?? 1);
      });
    });
    return result;
  } finally {
    // Preserve the snapshot and lock if restoration fails; no next build may
    // start against an unknown search list. Even an originally empty list is restored.
    if (original && safeToRestore) {
      try {
        security(['list-keychains', '-d', 'user', '-s', ...original]);
        restored = true;
      } catch {
        throw new Error(`Keychain restoration failed; inspect retained snapshot and lock: ${directory}`);
      }
    }
    if (safeToRestore && (!original || restored)) release();
  }
}

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  if (process.platform !== 'darwin' || !command) {
    process.stderr.write('iOS host guard requires macOS and an explicit command.\n');
    process.exitCode = 1;
  } else {
    runGuard(command, args).then((code) => { process.exitCode = code; }).catch((error) => {
      process.stderr.write(`[iOS host guard] ${error.message}\n`);
      process.exitCode = 1;
    });
  }
}
module.exports = { acquireLock, parseKeychains, activeXcodebuildPids, runGuard };
