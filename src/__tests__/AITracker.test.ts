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
      await tracker.rollback(1);
      
      expect(existsSync(join(testDir, 'file2.txt'))).toBe(false);
      expect(existsSync(join(testDir, 'file1.txt'))).toBe(true);
    });

    test('should rollback multiple commits', async () => {
      writeFileSync(join(testDir, 'file3.txt'), 'content 3');
      await tracker.commit('Commit 3');
      
      await tracker.rollback(2);
      
      expect(existsSync(join(testDir, 'file3.txt'))).toBe(false);
      expect(existsSync(join(testDir, 'file2.txt'))).toBe(false);
      expect(existsSync(join(testDir, 'file1.txt'))).toBe(true);
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
});