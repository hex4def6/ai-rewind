import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { AITracker } from '../AITracker.js';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { $ } from 'bun';

describe('AITracker', () => {
  let testDir: string;
  let tracker: AITracker;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `ai-tracker-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    tracker = new AITracker(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('isInitialized', () => {
    test('should return false when not initialized', async () => {
      const result = await tracker.isInitialized();
      expect(result).toBe(false);
    });

    test('should return true when initialized', async () => {
      // Create the tracking directory
      mkdirSync(join(testDir, '.git-ai-tracking'), { recursive: true });
      const result = await tracker.isInitialized();
      expect(result).toBe(true);
    });
  });

  describe('initialize', () => {
    test('should create tracking repository', async () => {
      await tracker.initialize();
      
      expect(existsSync(join(testDir, '.git-ai-tracking'))).toBe(true);
      expect(existsSync(join(testDir, '.gitignore'))).toBe(true);
      
      const gitignore = readFileSync(join(testDir, '.gitignore'), 'utf-8');
      expect(gitignore).toContain('.git-ai-tracking/');
    });

    test('should throw error if already initialized', async () => {
      await tracker.initialize();
      
      expect(async () => await tracker.initialize()).toThrow(
        'Repository already initialized'
      );
    });

    test('should set correct autocrlf based on platform', async () => {
      await tracker.initialize();
      
      const result = await $`git --git-dir=${join(testDir, '.git-ai-tracking')} config core.autocrlf`.text();
      
      const expected = process.platform === 'win32' ? 'true' : 'input';
      expect(result.trim()).toBe(expected);
    });
  });

  describe('commit', () => {
    beforeEach(async () => {
      await tracker.initialize();
    });

    test('should create commit with custom message', async () => {
      // Create a test file
      writeFileSync(join(testDir, 'test.txt'), 'test content');
      
      await tracker.commit('Test commit');
      
      const result = await $`git --git-dir=${join(testDir, '.git-ai-tracking')} --work-tree=${testDir} log --oneline -1`.text();
      
      expect(result).toContain('Test commit');
    });

    test('should create commit with auto-generated message', async () => {
      // Create a test file
      writeFileSync(join(testDir, 'test.txt'), 'test content');
      
      await tracker.commit();
      
      const result = await $`git --git-dir=${join(testDir, '.git-ai-tracking')} --work-tree=${testDir} log --oneline -1`.text();
      
      expect(result).toContain('AI change at');
    });

    test('should handle no changes gracefully', async () => {
      // First commit any existing changes from previous test
      const status = await $`git --git-dir=${join(testDir, '.git-ai-tracking')} --work-tree=${testDir} status --porcelain`.text();
      if (status.trim()) {
        await tracker.commit('Cleanup previous test');
      }
      
      // Mock console.log to check output
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: any) => {
        logOutput += msg;
      };
      
      await tracker.commit('No changes');
      
      expect(logOutput).toContain('No changes detected');
      
      console.log = originalLog;
    });
  });

  describe('rollback', () => {
    beforeEach(async () => {
      await tracker.initialize();
      
      // Create multiple commits
      writeFileSync(join(testDir, 'file1.txt'), 'content 1');
      await tracker.commit('Commit 1');
      
      writeFileSync(join(testDir, 'file2.txt'), 'content 2');
      await tracker.commit('Commit 2');
    });

    test('should rollback single commit', async () => {
      await tracker.rollback(1, { noConfirm: true });
      
      expect(existsSync(join(testDir, 'file2.txt'))).toBe(false);
      expect(existsSync(join(testDir, 'file1.txt'))).toBe(true);
    });

    test('should rollback multiple commits', async () => {
      writeFileSync(join(testDir, 'file3.txt'), 'content 3');
      await tracker.commit('Commit 3');
      
      await tracker.rollback(2, { noConfirm: true });
      
      expect(existsSync(join(testDir, 'file3.txt'))).toBe(false);
      expect(existsSync(join(testDir, 'file2.txt'))).toBe(false);
      expect(existsSync(join(testDir, 'file1.txt'))).toBe(true);
    });

    test('should support dry-run mode', async () => {
      writeFileSync(join(testDir, 'file3.txt'), 'content 3');
      await tracker.commit('Commit 3');
      
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: any) => {
        logOutput += String(msg);
      };
      
      await tracker.rollback(1, { dryRun: true, noConfirm: true });
      
      // Files should still exist (dry run doesn't change anything)
      expect(existsSync(join(testDir, 'file3.txt'))).toBe(true);
      expect(logOutput).toContain('Would rollback');
      
      console.log = originalLog;
    });

    test('should support force flag with uncommitted changes', async () => {
      // Create uncommitted change
      writeFileSync(join(testDir, 'uncommitted.txt'), 'not committed');
      
      // Should work with force flag
      await tracker.rollback(1, { force: true, noConfirm: true });
      
      expect(existsSync(join(testDir, 'file2.txt'))).toBe(false);
      expect(existsSync(join(testDir, 'file1.txt'))).toBe(true);
    });

    test('should validate rollback count', async () => {
      await expect(tracker.rollback(0)).rejects.toThrow('positive integer');
      await expect(tracker.rollback(-1)).rejects.toThrow('positive integer');
      await expect(tracker.rollback(1.5)).rejects.toThrow('positive integer');
    });
  });

  describe('status', () => {
    test('should show error when not initialized', async () => {
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: any) => {
        logOutput += msg;
      };
      
      await tracker.status();
      
      expect(logOutput).toContain('not initialized');
      
      console.log = originalLog;
    });

    test('should show status when initialized', async () => {
      await tracker.initialize();
      
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: any) => {
        logOutput += msg;
      };
      
      await tracker.status();
      
      expect(logOutput).toContain('Current Working Directory');
      expect(logOutput).toContain(testDir);
      
      console.log = originalLog;
    });
  });

  describe('log', () => {
    beforeEach(async () => {
      await tracker.initialize();
    });

    test('should show commit history', async () => {
      writeFileSync(join(testDir, 'test.txt'), 'content');
      await tracker.commit('Test commit');
      
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: any) => {
        logOutput += msg;
      };
      
      await tracker.log(5);
      
      expect(logOutput).toContain('Test commit');
      
      console.log = originalLog;
    });
  });

  describe('stats', () => {
    beforeEach(async () => {
      await tracker.initialize();
    });

    test('should show statistics', async () => {
      writeFileSync(join(testDir, 'test.txt'), 'content');
      await tracker.commit('Test commit');
      
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: any) => {
        logOutput += msg;
      };
      
      await tracker.stats();
      
      expect(logOutput).toContain('AI Tracker Statistics');
      expect(logOutput).toContain('Total Commits');
      expect(logOutput).toContain('Files Tracked');
      
      console.log = originalLog;
    });
  });

  describe('config and exclude patterns', () => {
    test('should respect exclude patterns from config', async () => {
      await tracker.initialize();
      
      // Create files that should be excluded
      mkdirSync(join(testDir, 'node_modules'), { recursive: true });
      writeFileSync(join(testDir, 'node_modules', 'test.js'), 'should be excluded');
      writeFileSync(join(testDir, 'included.txt'), 'should be included');
      
      await tracker.commit('Test excludes');
      
      // Check that node_modules is not tracked
      const result = await $`git --git-dir=${join(testDir, '.git-ai-tracking')} --work-tree=${testDir} ls-files`.text();
      
      expect(result).toContain('included.txt');
      expect(result).not.toContain('node_modules');
    });

    test('should load custom config from .ai-tracker.json', async () => {
      // Create custom config
      const customConfig = {
        excludePatterns: ['*.tmp', 'temp/**'],
        commitMessageFormat: 'Custom: {timestamp}'
      };
      writeFileSync(join(testDir, '.ai-tracker.json'), JSON.stringify(customConfig, null, 2));
      
      // Re-create tracker to load config
      tracker = new AITracker(testDir);
      await tracker.initialize();
      
      writeFileSync(join(testDir, 'test.txt'), 'content');
      writeFileSync(join(testDir, 'test.tmp'), 'temp file');
      
      await tracker.commit();
      
      // Check that .tmp file is excluded
      const result = await $`git --git-dir=${join(testDir, '.git-ai-tracking')} --work-tree=${testDir} ls-files`.text();
      
      expect(result).toContain('test.txt');
      expect(result).not.toContain('test.tmp');
    });
  });

  describe('error handling', () => {
    test('should provide helpful error messages', async () => {
      // Try to commit without initialization
      await expect(tracker.commit('test')).rejects.toThrow('ai-tracker init');
      
      // Try invalid rollback with no history
      await tracker.initialize();
      
      // This should not throw but exit gracefully (only initial commit exists)
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: any) => {
        logOutput += String(msg);
      };
      
      await tracker.rollback(1, { noConfirm: true });
      expect(logOutput).toContain('Cannot rollback');
      
      console.log = originalLog;
    });
  });
});