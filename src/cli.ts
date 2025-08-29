#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AITracker } from './AITracker.js';
import { readFileSync } from 'fs';
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

const program = new Command();
const tracker = new AITracker();

program
  .name('ai-tracker')
  .description('Cross-platform AI change tracking system using shadow git repository')
  .version(version);

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
  .action(async (count?: string) => {
    try {
      const rollbackCount = count ? parseInt(count) : 1;
      if (isNaN(rollbackCount) || rollbackCount < 1) {
        console.error(chalk.red('Error: Count must be a positive number'));
        process.exit(1);
      }
      await tracker.rollback(rollbackCount);
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
  .description('Create default configuration file (.ai-tracker.json)')
  .action(async () => {
    try {
      const { Config } = await import('./Config.js');
      const config = new Config(process.cwd());
      config.createDefault();
      console.log(chalk.green('✓ Configuration file created/updated'));
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