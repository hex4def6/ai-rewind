#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AITracker } from './AITracker.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
let version = '1.0.0';
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  version = packageJson.version;
} catch {
  // Use default version if package.json not found
}

// Check if git is available
import { execSync } from 'child_process';

function checkGitAvailable(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!checkGitAvailable()) {
  console.error(chalk.red('Error: Git is not installed or not in PATH'));
  console.error(chalk.yellow('Please install Git from https://git-scm.com/downloads'));
  process.exit(1);
}

const program = new Command();
const tracker = new AITracker();

program
  .name('ai-tracker')
  .description('Cross-platform AI change tracking system using shadow git repository')
  .version(version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
Examples:
  $ ai-tracker init                    Initialize tracking in current directory
  $ ai-tracker commit "Fixed bug"      Commit changes with message
  $ ai-tracker rollback                Rollback last change
  $ ai-tracker rollback 3 --dry-run    Preview rollback of 3 commits
  $ ai-tracker status                  Show current status
  $ ai-tracker config --create          Create configuration file

For more information, visit: https://github.com/hex4def6/ai-tracker`);

program
  .command('init')
  .description('Initialize AI tracking repository in current directory')
  .action(async () => {
    try {
      await tracker.initialize();
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('commit [message]')
  .description('Save current changes with optional message')
  .action(async (message?: string) => {
    try {
      await tracker.commit(message);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('rollback [count]')
  .description('Revert last N commits (default: 1)')
  .option('-f, --force', 'Force rollback even with uncommitted changes')
  .option('-d, --dry-run', 'Show what would be rolled back without making changes')
  .action(async (count?: string, options?: { force?: boolean; dryRun?: boolean }) => {
    try {
      const rollbackCount = count ? parseInt(count) : 1;
      if (isNaN(rollbackCount) || rollbackCount < 1) {
        console.error(chalk.red('Error: Count must be a positive number'));
        process.exit(1);
      }
      await tracker.rollback(rollbackCount, options || {});
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current tracking status')
  .action(async () => {
    try {
      await tracker.status();
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('log [count]')
  .description('View change history (default: 20 commits)')
  .action(async (count?: string) => {
    try {
      const logCount = count ? parseInt(count) : 20;
      if (isNaN(logCount) || logCount < 1) {
        console.error(chalk.red('Error: Count must be a positive number'));
        process.exit(1);
      }
      await tracker.log(logCount);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('diff [commit]')
  .description('Show changes in working directory or specific commit')
  .action(async (commit?: string) => {
    try {
      await tracker.diff(commit);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show repository statistics and metrics')
  .action(async () => {
    try {
      await tracker.stats();
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show or create configuration file (.ai-tracker.json)')
  .option('-c, --create', 'Create default configuration file')
  .option('-s, --show', 'Show current configuration')
  .action(async (options?: { create?: boolean; show?: boolean }) => {
    try {
      const { Config } = await import('./Config.js');
      const config = new Config(process.cwd());
      
      if (options?.create) {
        config.createDefault();
        console.log(chalk.green('✓ Configuration file created: .ai-tracker.json'));
        return;
      }
      
      // Show current config (default behavior)
      console.log(chalk.cyan.bold('AI Tracker Configuration'));
      console.log('=' .repeat(40));
      
      const configPath = join(process.cwd(), '.ai-tracker.json');
      if (existsSync(configPath)) {
        console.log(chalk.yellow('Config file:'), configPath);
        console.log('\n' + chalk.cyan('Current settings:'));
        console.log(JSON.stringify(config.getAll(), null, 2));
      } else {
        console.log(chalk.yellow('No config file found. Using defaults:'));
        console.log(JSON.stringify(config.getAll(), null, 2));
        console.log('\n' + chalk.gray('Run "ai-tracker config --create" to create config file'));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);