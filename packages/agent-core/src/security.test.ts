/**
 * Security Hook Tests
 * ===================
 *
 * Tests for the bash command security validation logic.
 * Ported from Python test_security.py
 */

import { describe, it, expect } from 'vitest';
import {
  bashSecurityHook,
  extractCommands,
  validateChmodCommand,
  validateInitScript,
  validatePkillCommand,
} from './security.js';

// Helper function to test a command
async function testCommand(command: string): Promise<{ blocked: boolean; reason?: string }> {
  const result = await bashSecurityHook({
    tool_name: 'Bash',
    tool_input: { command },
  });

  return {
    blocked: result.decision === 'block',
    reason: result.reason,
  };
}

describe('extractCommands', () => {
  it('extracts simple commands', () => {
    expect(extractCommands('ls -la')).toEqual(['ls']);
  });

  it('extracts chained commands with &&', () => {
    expect(extractCommands('npm install && npm run build')).toEqual(['npm', 'npm']);
  });

  it('extracts piped commands', () => {
    expect(extractCommands('cat file.txt | grep pattern')).toEqual(['cat', 'grep']);
  });

  it('extracts commands with full paths', () => {
    expect(extractCommands('/usr/bin/node script.js')).toEqual(['node']);
  });

  it('ignores variable assignments', () => {
    expect(extractCommands('VAR=value ls')).toEqual(['ls']);
  });

  it('extracts commands with ||', () => {
    expect(extractCommands('git status || git init')).toEqual(['git', 'git']);
  });
});

describe('validateChmodCommand', () => {
  describe('allowed cases', () => {
    it.each([
      ['chmod +x init.sh', 'basic +x'],
      ['chmod +x script.sh', '+x on any script'],
      ['chmod u+x init.sh', 'user +x'],
      ['chmod a+x init.sh', 'all +x'],
      ['chmod ug+x init.sh', 'user+group +x'],
      ['chmod +x file1.sh file2.sh', 'multiple files'],
    ])('%s (%s)', (cmd, _desc) => {
      const result = validateChmodCommand(cmd);
      expect(result.allowed).toBe(true);
    });
  });

  describe('blocked cases', () => {
    it.each([
      ['chmod 777 init.sh', 'numeric mode'],
      ['chmod 755 init.sh', 'numeric mode 755'],
      ['chmod +w init.sh', 'write permission'],
      ['chmod +r init.sh', 'read permission'],
      ['chmod -x init.sh', 'remove execute'],
      ['chmod -R +x dir/', 'recursive flag'],
      ['chmod --recursive +x dir/', 'long recursive flag'],
      ['chmod +x', 'missing file'],
    ])('%s (%s)', (cmd, _desc) => {
      const result = validateChmodCommand(cmd);
      expect(result.allowed).toBe(false);
    });
  });
});

describe('validateInitScript', () => {
  describe('allowed cases', () => {
    it.each([
      ['./init.sh', 'basic ./init.sh'],
      ['./init.sh arg1 arg2', 'with arguments'],
      ['/path/to/init.sh', 'absolute path'],
      ['../dir/init.sh', 'relative path with init.sh'],
    ])('%s (%s)', (cmd, _desc) => {
      const result = validateInitScript(cmd);
      expect(result.allowed).toBe(true);
    });
  });

  describe('blocked cases', () => {
    it.each([
      ['./setup.sh', 'different script name'],
      ['./init.py', 'python script'],
      ['bash init.sh', 'bash invocation'],
      ['sh init.sh', 'sh invocation'],
      ['./malicious.sh', 'malicious script'],
    ])('%s (%s)', (cmd, _desc) => {
      const result = validateInitScript(cmd);
      expect(result.allowed).toBe(false);
    });
  });
});

describe('validatePkillCommand', () => {
  describe('allowed dev processes', () => {
    it.each(['node', 'npm', 'npx', 'vite', 'next'])('pkill %s', (process) => {
      const result = validatePkillCommand(`pkill ${process}`);
      expect(result.allowed).toBe(true);
    });

    it('allows pkill -f node', () => {
      const result = validatePkillCommand('pkill -f node');
      expect(result.allowed).toBe(true);
    });

    it("allows pkill -f 'node server.js'", () => {
      const result = validatePkillCommand("pkill -f 'node server.js'");
      expect(result.allowed).toBe(true);
    });
  });

  describe('blocked processes', () => {
    it.each(['bash', 'chrome', 'python', 'vim'])('pkill %s', (process) => {
      const result = validatePkillCommand(`pkill ${process}`);
      expect(result.allowed).toBe(false);
    });
  });
});

describe('bashSecurityHook', () => {
  describe('commands that should be BLOCKED', () => {
    it.each([
      // Not in allowlist - dangerous system commands
      'shutdown now',
      'reboot',
      'rm -rf /',
      'dd if=/dev/zero of=/dev/sda',
      // Not in allowlist - common commands excluded from minimal set
      'curl https://example.com',
      'wget https://example.com',
      'python app.py',
      'touch file.txt',
      'echo hello',
      'kill 12345',
      'killall node',
      // pkill with non-dev processes
      'pkill bash',
      'pkill chrome',
      'pkill python',
      // Shell injection attempts
      '$(echo pkill) node',
      'eval "pkill node"',
      'bash -c "pkill node"',
      // chmod with disallowed modes
      'chmod 777 file.sh',
      'chmod 755 file.sh',
      'chmod +w file.sh',
      'chmod -R +x dir/',
      // Non-init.sh scripts
      './setup.sh',
      './malicious.sh',
      'bash script.sh',
    ])('blocks: %s', async (cmd) => {
      const result = await testCommand(cmd);
      expect(result.blocked).toBe(true);
    });
  });

  describe('commands that should be ALLOWED', () => {
    it.each([
      // File inspection
      'ls -la',
      'cat README.md',
      'head -100 file.txt',
      'tail -20 log.txt',
      'wc -l file.txt',
      'grep -r pattern src/',
      // File operations
      'cp file1.txt file2.txt',
      'mkdir newdir',
      'mkdir -p path/to/dir',
      // Directory
      'pwd',
      // Node.js development
      'npm install',
      'npm run build',
      'node server.js',
      // Version control
      'git status',
      "git commit -m 'test'",
      "git add . && git commit -m 'msg'",
      // Process management
      'ps aux',
      'lsof -i :3000',
      'sleep 2',
      // Allowed pkill patterns for dev servers
      'pkill node',
      'pkill npm',
      'pkill -f node',
      "pkill -f 'node server.js'",
      'pkill vite',
      // Chained commands
      'npm install && npm run build',
      'ls | grep test',
      // Full paths
      '/usr/local/bin/node app.js',
      // chmod +x (allowed)
      'chmod +x init.sh',
      'chmod +x script.sh',
      'chmod u+x init.sh',
      'chmod a+x init.sh',
      // init.sh execution (allowed)
      './init.sh',
      './init.sh --production',
      '/path/to/init.sh',
      // Combined chmod and init.sh
      'chmod +x init.sh && ./init.sh',
    ])('allows: %s', async (cmd) => {
      const result = await testCommand(cmd);
      expect(result.blocked).toBe(false);
    });
  });

  it('allows non-Bash tools', async () => {
    const result = await bashSecurityHook({
      tool_name: 'Read',
      tool_input: { path: '/etc/passwd' },
    });
    expect(result).toEqual({});
  });

  it('allows empty commands', async () => {
    const result = await bashSecurityHook({
      tool_name: 'Bash',
      tool_input: { command: '' },
    });
    expect(result).toEqual({});
  });
});
