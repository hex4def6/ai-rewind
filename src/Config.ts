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
    this.configPath = join(workTree, '.ai-rewind.json');
    this.config = this.load();
  }

  private load(): TrackerConfigOptions {
    if (existsSync(this.configPath)) {
      try {
        const content = readFileSync(this.configPath, 'utf-8');
        
        // Check file size to prevent DoS
        if (content.length > 100000) { // 100KB max
          console.warn('Warning: Config file too large, using defaults');
          return this.defaults;
        }
        
        const userConfig = JSON.parse(content);
        
        // Validate config schema to prevent prototype pollution
        const validatedConfig: TrackerConfigOptions = {};
        
        // Only copy allowed properties
        if (Array.isArray(userConfig.excludePatterns)) {
          validatedConfig.excludePatterns = userConfig.excludePatterns
            .filter((p: any) => typeof p === 'string' && p.length < 1000)
            .slice(0, 100); // Max 100 patterns
        }
        
        if (typeof userConfig.autoCommitThreshold === 'number') {
          validatedConfig.autoCommitThreshold = Math.min(Math.max(1, userConfig.autoCommitThreshold), 1000);
        }
        
        if (typeof userConfig.commitMessageFormat === 'string' && userConfig.commitMessageFormat.length < 500) {
          validatedConfig.commitMessageFormat = userConfig.commitMessageFormat;
        }
        
        if (typeof userConfig.maxCommits === 'number') {
          validatedConfig.maxCommits = Math.min(Math.max(10, userConfig.maxCommits), 10000);
        }
        
        if (typeof userConfig.verboseOutput === 'boolean') {
          validatedConfig.verboseOutput = userConfig.verboseOutput;
        }
        
        if (typeof userConfig.defaultBranch === 'string' && userConfig.defaultBranch.length < 100) {
          validatedConfig.defaultBranch = userConfig.defaultBranch;
        }
        
        return { ...this.defaults, ...validatedConfig };
      } catch (error) {
        console.warn('Warning: Invalid .ai-rewind.json, using defaults');
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
      console.log('Created .ai-rewind.json with default configuration');
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