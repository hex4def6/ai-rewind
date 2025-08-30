import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface TrackerConfigOptions {
  excludePatterns?: string[];
  autoCommitThreshold?: number;
  commitMessageFormat?: string;
  maxCommits?: number;
  verboseOutput?: boolean;
  defaultBranch?: string;
}

export class Config {
  private configPath: string;
  private config: TrackerConfigOptions;
  private defaults: TrackerConfigOptions = {
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      '.git-ai-tracking/**',
      '**/*.log',
      '**/dist/**',
      '**/build/**',
      '**/.env*',
      '**/coverage/**',
      '**/*.tmp'
    ],
    autoCommitThreshold: 5,
    commitMessageFormat: 'AI change at {timestamp}',
    maxCommits: 100,
    verboseOutput: false,
    defaultBranch: 'master'
  };

  constructor(workTree: string) {
    this.configPath = join(workTree, '.ai-tracker.json');
    this.config = this.load();
  }

  private load(): TrackerConfigOptions {
    if (existsSync(this.configPath)) {
      try {
        const content = readFileSync(this.configPath, 'utf-8');
        const userConfig = JSON.parse(content);
        return { ...this.defaults, ...userConfig };
      } catch (error) {
        console.warn('Warning: Invalid .ai-tracker.json, using defaults');
        return this.defaults;
      }
    }
    return this.defaults;
  }

  save(): void {
    const content = JSON.stringify(this.config, null, 2);
    writeFileSync(this.configPath, content);
  }

  createDefault(): void {
    if (!existsSync(this.configPath)) {
      const content = JSON.stringify(this.defaults, null, 2);
      writeFileSync(this.configPath, content);
      console.log('Created .ai-tracker.json with default configuration');
    }
  }

  get excludePatterns(): string[] {
    return this.config.excludePatterns || this.defaults.excludePatterns!;
  }

  get autoCommitThreshold(): number {
    return this.config.autoCommitThreshold || this.defaults.autoCommitThreshold!;
  }

  get commitMessageFormat(): string {
    return this.config.commitMessageFormat || this.defaults.commitMessageFormat!;
  }

  get maxCommits(): number {
    return this.config.maxCommits || this.defaults.maxCommits!;
  }

  get verboseOutput(): boolean {
    return this.config.verboseOutput || this.defaults.verboseOutput!;
  }

  get defaultBranch(): string {
    return this.config.defaultBranch || this.defaults.defaultBranch!;
  }

  getExcludeArgs(): string[] {
    const args: string[] = [];
    for (const pattern of this.excludePatterns) {
      args.push('--exclude', pattern);
    }
    return args;
  }

  formatCommitMessage(template?: string): string {
    const format = template || this.commitMessageFormat;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return format.replace('{timestamp}', timestamp);
  }

  getAll(): TrackerConfigOptions {
    return this.config;
  }
}