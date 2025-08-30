import { execa, ExecaError } from 'execa';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { Config } from './Config.js';

export interface TrackerConfig {
  gitDir: string;
  workTree: string;
  ignoreFile: string;
}

export class AITracker {
  private config: TrackerConfig;
  private configManager: Config;

  constructor(workTree: string = process.cwd()) {
    this.config = {
      gitDir: join(workTree, '.git-ai-tracking'),
      workTree: resolve(workTree),
      ignoreFile: join(workTree, '.gitignore')
    };
    this.configManager = new Config(this.config.workTree);
  }

  private async execGit(args: string[]): Promise<string> {
    try {
      const { stdout } = await execa('git', [
        `--git-dir=${this.config.gitDir}`,
        `--work-tree=${this.config.workTree}`,
        ...args
      ]);
      return stdout;
    } catch (error) {
      const execaError = error as ExecaError;
      const command = args[0];
      
      // Provide better error messages for common issues
      if (execaError.stderr?.includes('not a git repository')) {
        throw new Error('AI tracking repository not initialized. Run "ai-rewind init" first.');
      }
      if (execaError.stderr?.includes('Permission denied')) {
        throw new Error('Permission denied. Check file permissions in your project directory.');
      }
      if (execaError.stderr?.includes('index.lock')) {
        throw new Error('Another git process is running. Please wait and try again.');
      }
      if (command === 'commit' && execaError.stderr?.includes('nothing to commit')) {
        throw new Error('No changes to commit. All files are up to date.');
      }
      
      // Default error message
      throw new Error(`Git operation failed: ${execaError.stderr || execaError.message}`);
    }
  }

  async isInitialized(): Promise<boolean> {
    return existsSync(this.config.gitDir);
  }

  async initialize(): Promise<void> {
    const spinner = ora('Initializing AI tracking repository...').start();

    try {
      if (await this.isInitialized()) {
        spinner.fail('AI tracking repository already exists!');
        throw new Error('Repository already initialized. To reinitialize, first delete .git-ai-tracking directory');
      }

      // Check for existing Git repository
      const mainGitDir = join(this.config.workTree, '.git');
      if (existsSync(mainGitDir)) {
        spinner.info(chalk.yellow('Detected existing Git repository'));
        console.log(chalk.cyan('AI Tracker will operate independently from your main Git repository'));
        console.log(chalk.gray('The .git-ai-tracking directory will be added to .gitignore'));
      }

      // Initialize repository
      await this.execGit(['init']);
      spinner.text = 'Configuring tracking repository...';

      // Configure git
      await this.execGit(['config', 'user.name', 'AI Assistant']);
      await this.execGit(['config', 'user.email', 'ai@local']);
      
      // Set core.autocrlf based on platform
      const autocrlf = process.platform === 'win32' ? 'true' : 'input';
      await this.execGit(['config', 'core.autocrlf', autocrlf]);

      // Add to .gitignore BEFORE staging files
      spinner.text = 'Updating .gitignore...';
      this.updateGitignore();
      
      spinner.text = 'Creating initial commit...';
      
      // Stage all files (except .git-ai-tracking which is now in .gitignore)
      await this.execGit(['add', '-A']);
      
      // Create initial commit
      await this.execGit(['commit', '-m', 'Initial state before AI changes', '--allow-empty']);

      // Run git gc to clean up
      await this.execGit(['gc', '--auto']);

      spinner.succeed(chalk.green('✓ AI tracking repository initialized successfully!'));
      
      console.log('\n' + chalk.cyan('Available commands:'));
      console.log('  ai-rewind commit [message]  - Save current changes');
      console.log('  ai-rewind rollback [count]  - Revert last AI change(s)');
      console.log('  ai-rewind log [count]       - View change history');
      console.log('  ai-rewind status            - Check current status');
    } catch (error) {
      spinner.fail('Failed to initialize tracking repository');
      throw error;
    }
  }

  private updateGitignore(): void {
    const gitignorePath = this.config.ignoreFile;
    const trackingDirEntry = '.git-ai-tracking/';
    
    let content = '';
    if (existsSync(gitignorePath)) {
      content = readFileSync(gitignorePath, 'utf-8');
    }

    if (!content.includes(trackingDirEntry)) {
      const newContent = content.length > 0 && !content.endsWith('\n') 
        ? `${content}\n\n# AI Change Tracking\n${trackingDirEntry}\n`
        : `${content}\n# AI Change Tracking\n${trackingDirEntry}\n`;
      
      writeFileSync(gitignorePath, newContent);
    }
  }

  async commit(message?: string): Promise<void> {
    const spinner = ora('Checking for changes...').start();

    try {
      if (!(await this.isInitialized())) {
        spinner.fail('AI tracking repository not initialized!');
        throw new Error('Please run "ai-rewind init" first');
      }

      // Check for changes
      const status = await this.execGit(['status', '--porcelain']);
      
      if (!status.trim()) {
        spinner.info('No changes detected to commit.');
        console.log('No changes detected');
        return;
      }

      spinner.text = 'Staging all changes...';
      
      // Get exclude patterns from config and create .gitignore entries
      const excludePatterns = this.configManager.excludePatterns;
      const excludePath = join(this.config.gitDir, 'info', 'exclude');
      
      // Ensure the info directory exists
      const infoDir = join(this.config.gitDir, 'info');
      if (!existsSync(infoDir)) {
        mkdirSync(infoDir, { recursive: true });
      }
      
      // Write exclude patterns to git's exclude file
      if (excludePatterns.length > 0) {
        const excludeContent = excludePatterns.join('\n');
        writeFileSync(excludePath, excludeContent, 'utf-8');
      }
      
      await this.execGit(['add', '-A']);

      // Generate commit message if not provided
      if (!message) {
        message = this.configManager.formatCommitMessage();
      }

      spinner.text = `Creating commit: ${message}`;
      await this.execGit(['commit', '-m', message]);

      // Run git gc periodically to clean up
      const commitCount = await this.execGit(['rev-list', '--count', 'HEAD']);
      if (parseInt(commitCount) % 10 === 0) {
        await this.execGit(['gc', '--auto']);
      }

      spinner.succeed(chalk.green('✓ Changes committed successfully!'));
      
      // Show recent commits
      console.log('\n' + chalk.cyan('Latest commits:'));
      const log = await this.execGit(['log', '--format=%C(yellow)%h%C(reset) - %C(cyan)%ad%C(reset) - %s', '--date=short', '-5']);
      console.log(log);
    } catch (error) {
      spinner.fail('Failed to commit changes');
      throw error;
    }
  }

  async rollback(count: number = 1, options: { force?: boolean; dryRun?: boolean; noConfirm?: boolean } = {}): Promise<void> {
    // Validate input
    if (!Number.isInteger(count) || count < 1) {
      throw new Error('Rollback count must be a positive integer');
    }

    const spinner = ora('Checking commit history...').start();

    try {
      if (!(await this.isInitialized())) {
        spinner.fail('AI tracking repository not initialized!');
        throw new Error('Please run "ai-rewind init" first');
      }

      // Check commit count
      const commitCount = parseInt(await this.execGit(['rev-list', '--count', 'HEAD']));
      
      if (commitCount <= 1) {
        spinner.fail('No AI changes to roll back (only initial commit exists)');
        console.log('Cannot rollback: only initial commit exists');
        return;
      }

      if (count >= commitCount) {
        spinner.fail(`Cannot roll back ${count} commits (only ${commitCount - 1} AI changes exist)`);
        console.log(`Cannot roll back ${count} commits (only ${commitCount - 1} AI changes exist)`);
        return;
      }

      // Show current history
      spinner.text = 'Current change history:';
      const currentLog = await this.execGit(['log', '--format=%h - %ad - %s', '--date=short', '-5']);
      console.log('\n' + chalk.cyan('Current history:'));
      console.log(currentLog);

      // Check for uncommitted changes
      const status = await this.execGit(['status', '--porcelain']);
      if (status.trim() && !options.force) {
        spinner.warn(chalk.yellow('Warning: You have uncommitted changes that will be lost!'));
        console.log('Warning: You have uncommitted changes that will be lost!');
        console.log('Please commit or stash your changes before rolling back.');
        console.log('Or use --force to rollback anyway (changes will be lost).');
        return;
      }

      if (options.dryRun) {
        spinner.info('Dry run mode - no changes will be made');
        console.log(chalk.yellow(`\nWould rollback ${count} commit(s):`));
        const targetCommit = await this.execGit(['rev-parse', `HEAD~${count}`]);
        const targetLog = await this.execGit(['log', '--format=%h - %ad - %s', '--date=short', '-1', targetCommit]);
        console.log(`Target state after rollback: ${targetLog}`);
        
        // Show what files would be affected
        const diff = await this.execGit(['diff', '--name-status', `HEAD~${count}`, 'HEAD']);
        if (diff) {
          console.log('\nFiles that would be changed:');
          console.log(diff);
        }
        return;
      }

      // Create backup tag before rollback
      const backupTag = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      spinner.text = 'Creating backup...';
      try {
        await this.execGit(['tag', backupTag, 'HEAD']);
        console.log(chalk.gray(`Backup created: ${backupTag}`));
      } catch (error) {
        console.warn(chalk.yellow('Warning: Could not create backup tag'));
      }

      // Confirmation prompt (unless --no-confirm or --force)
      if (!options.noConfirm && !options.force) {
        spinner.stop();
        console.log(chalk.yellow(`\n⚠️  This will rollback ${count} commit(s) and cannot be undone easily.`));
        console.log(chalk.gray(`(Backup saved as: ${backupTag})`));
        
        // Simple confirmation using built-in readline
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise<string>((resolve) => {
          rl.question('Are you sure you want to continue? (y/N): ', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log(chalk.yellow('Rollback cancelled.'));
          return;
        }
        spinner.start();
      }

      spinner.text = `Rolling back ${count} commit(s)...`;
      await this.execGit(['reset', '--hard', `HEAD~${count}`]);

      spinner.succeed(chalk.green(`✓ Successfully rolled back ${count} commit(s)!`));
      console.log(chalk.gray(`To restore: ai-rewind forward ${backupTag}`));
      
      // Show new state
      console.log('\n' + chalk.cyan('Current state:'));
      const newLog = await this.execGit(['log', '--format=%h - %ad - %s', '--date=short', '-1']);
      console.log(newLog);
    } catch (error) {
      spinner.fail('Rollback failed');
      throw error;
    }
  }

  async status(): Promise<void> {
    console.log(chalk.cyan.bold('AI Change Tracker - Status'));
    console.log('=' .repeat(40));

    try {
      if (!(await this.isInitialized())) {
        console.log(chalk.red('Error: AI tracking repository not initialized!'));
        console.log('Please run "ai-rewind init" first');
        return;
      }

      console.log('\n' + chalk.yellow('Current Working Directory:'));
      console.log(this.config.workTree);

      console.log('\n' + chalk.yellow('Tracking Repository Status:'));
      const status = await this.execGit(['status']);
      console.log(status);

      console.log('\n' + chalk.yellow('Recent Commits:'));
      const log = await this.execGit(['log', '--format=%h - %ad - %s', '--date=short', '-10']);
      console.log(log);

      try {
        console.log('\n' + chalk.yellow('Files Changed in Last Commit:'));
        const diff = await this.execGit(['diff', '--name-status', 'HEAD~1', 'HEAD']);
        console.log(diff || '(No previous commits to compare)');
      } catch {
        console.log('(No previous commits to compare)');
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    }
  }

  async log(count: number = 20): Promise<void> {
    console.log(chalk.cyan.bold('AI Change Tracker - Change Log'));
    console.log('=' .repeat(40));

    try {
      if (!(await this.isInitialized())) {
        console.log(chalk.red('Error: AI tracking repository not initialized!'));
        console.log('Please run "ai-rewind init" first');
        return;
      }

      console.log(`\nShowing last ${count} changes:\n`);
      const log = await this.execGit(['log', '--format=%C(yellow)%h%C(reset) - %C(cyan)%ai%C(reset) - %s %C(green)%d%C(reset)', '--graph', `-n`, count.toString()]);
      console.log(log);

      console.log('\n' + '=' .repeat(40));
      console.log('\n' + chalk.gray('To see more details for a specific commit:'));
      console.log(chalk.gray(`  git --git-dir=${this.config.gitDir} --work-tree=${this.config.workTree} show [commit-hash]`));
      console.log('\n' + chalk.gray('To see all changes in detail:'));
      console.log(chalk.gray(`  git --git-dir=${this.config.gitDir} --work-tree=${this.config.workTree} log -p`));
    } catch (error) {
      console.log(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    }
  }

  async forward(tagOrCommit: string): Promise<void> {
    const spinner = ora('Restoring from backup...').start();

    try {
      if (!(await this.isInitialized())) {
        spinner.fail('AI tracking repository not initialized!');
        throw new Error('Please run "ai-rewind init" first');
      }

      // Check if tag or commit exists
      try {
        await this.execGit(['rev-parse', tagOrCommit]);
      } catch {
        spinner.fail(`Backup or commit '${tagOrCommit}' not found`);
        
        // Show available backups
        console.log('\n' + chalk.cyan('Available backups:'));
        const tags = await this.execGit(['tag', '-l', 'backup-*']);
        if (tags) {
          console.log(tags);
        } else {
          console.log(chalk.gray('No backups found'));
        }
        return;
      }

      // Reset to the specified tag/commit
      spinner.text = `Restoring to ${tagOrCommit}...`;
      await this.execGit(['reset', '--hard', tagOrCommit]);

      spinner.succeed(chalk.green(`✓ Successfully restored to ${tagOrCommit}`));
      
      // Show current state
      console.log('\n' + chalk.cyan('Current state:'));
      const log = await this.execGit(['log', '--format=%h - %ad - %s', '--date=short', '-1']);
      console.log(log);
    } catch (error) {
      spinner.fail('Failed to restore from backup');
      throw error;
    }
  }

  async listBackups(): Promise<void> {
    if (!(await this.isInitialized())) {
      console.log(chalk.red('Error: AI tracking repository not initialized!'));
      return;
    }

    console.log(chalk.cyan.bold('AI Tracker - Available Backups'));
    console.log('=' .repeat(40));

    const tags = await this.execGit(['tag', '-l', 'backup-*', '--sort=-creatordate']);
    
    if (!tags) {
      console.log(chalk.yellow('No backups found'));
      console.log(chalk.gray('\nBackups are created automatically when you rollback'));
      return;
    }

    console.log('\n' + chalk.yellow('Backup tags:'));
    const tagLines = tags.split('\n').filter(t => t);
    
    for (const tag of tagLines) {
      try {
        const commit = await this.execGit(['log', '--format=%h - %ad - %s', '--date=short', '-1', tag]);
        console.log(`  ${chalk.green(tag)}`);
        console.log(`    ${chalk.gray(commit)}`);
      } catch {
        console.log(`  ${tag}`);
      }
    }

    console.log('\n' + chalk.gray('To restore: ai-rewind forward <backup-tag>'));
  }

  async diff(commitHash?: string): Promise<void> {
    try {
      if (!(await this.isInitialized())) {
        console.log(chalk.red('Error: AI tracking repository not initialized!'));
        return;
      }

      let diff: string;
      if (commitHash) {
        diff = await this.execGit(['show', commitHash]);
      } else {
        diff = await this.execGit(['diff', 'HEAD']);
      }

      console.log(diff || 'No changes to show');
    } catch (error) {
      console.log(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    }
  }

  async stats(): Promise<void> {
    const spinner = ora('Calculating statistics...').start();

    try {
      if (!(await this.isInitialized())) {
        spinner.fail('AI tracking repository not initialized!');
        return;
      }

      // Get commit count
      const commitCount = await this.execGit(['rev-list', '--count', 'HEAD']);
      
      // Get file change statistics
      const filesChanged = await this.execGit(['diff', '--stat', '--name-only', 'HEAD~1', 'HEAD']).catch(() => '');
      const filesChangedCount = filesChanged ? filesChanged.split('\n').filter(Boolean).length : 0;
      
      // Get total files tracked
      const trackedFiles = await this.execGit(['ls-files']);
      const trackedCount = trackedFiles.split('\n').filter(Boolean).length;
      
      // Get repository size
      const repoSize = await this.execGit(['count-objects', '-v']);
      const sizeMatch = repoSize.match(/size: (\d+)/);
      const sizeKb = sizeMatch ? parseInt(sizeMatch[1]) : 0;
      
      // Get first and last commit dates
      const firstCommit = await this.execGit(['log', '--reverse', '--format=%ai', '-1']);
      const lastCommit = await this.execGit(['log', '--format=%ai', '-1']);
      
      // Get top changed files
      const topFiles = await this.execGit([
        'log', '--pretty=format:', '--name-only'
      ]).catch(() => '');
      
      const fileFrequency: Record<string, number> = {};
      topFiles.split('\n').filter(Boolean).forEach(file => {
        fileFrequency[file] = (fileFrequency[file] || 0) + 1;
      });
      
      const sortedFiles = Object.entries(fileFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      spinner.succeed('Statistics calculated');

      // Display statistics
      console.log('\n' + chalk.cyan.bold('📊 AI Tracker Statistics'));
      console.log('=' .repeat(40));
      
      console.log('\n' + chalk.yellow('Repository Info:'));
      console.log(`  Total Commits: ${chalk.green(commitCount)}`);
      console.log(`  Files Tracked: ${chalk.green(trackedCount)}`);
      console.log(`  Repository Size: ${chalk.green(sizeKb + ' KB')}`);
      
      console.log('\n' + chalk.yellow('Timeline:'));
      console.log(`  First Commit: ${chalk.green(firstCommit.trim())}`);
      console.log(`  Last Commit: ${chalk.green(lastCommit.trim())}`);
      
      console.log('\n' + chalk.yellow('Recent Activity:'));
      console.log(`  Files Changed in Last Commit: ${chalk.green(filesChangedCount)}`);
      
      if (sortedFiles.length > 0) {
        console.log('\n' + chalk.yellow('Most Frequently Modified Files:'));
        sortedFiles.forEach(([file, count]) => {
          console.log(`  ${chalk.blue(file)}: ${chalk.green(count + ' changes')}`);
        });
      }
      
      // Show config info
      console.log('\n' + chalk.yellow('Configuration:'));
      console.log(`  Config File: ${existsSync(join(this.config.workTree, '.ai-rewind.json')) ? chalk.green('Present') : chalk.gray('Not found')}`);
      console.log(`  Auto-commit Threshold: ${chalk.green(this.configManager.autoCommitThreshold + ' files')}`);
      console.log(`  Max Commits: ${chalk.green(this.configManager.maxCommits)}`);
      
    } catch (error) {
      spinner.fail('Failed to calculate statistics');
      console.log(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    }
  }

  async init(): Promise<void> {
    await this.initialize();
    this.configManager.createDefault();
  }
}