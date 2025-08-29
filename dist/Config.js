import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
export class Config {
    configPath;
    config;
    defaults = {
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
    constructor(workTree) {
        this.configPath = join(workTree, '.ai-tracker.json');
        this.config = this.load();
    }
    load() {
        if (existsSync(this.configPath)) {
            try {
                const content = readFileSync(this.configPath, 'utf-8');
                const userConfig = JSON.parse(content);
                return { ...this.defaults, ...userConfig };
            }
            catch (error) {
                console.warn('Warning: Invalid .ai-tracker.json, using defaults');
                return this.defaults;
            }
        }
        return this.defaults;
    }
    save() {
        const content = JSON.stringify(this.config, null, 2);
        writeFileSync(this.configPath, content);
    }
    createDefault() {
        if (!existsSync(this.configPath)) {
            const content = JSON.stringify(this.defaults, null, 2);
            writeFileSync(this.configPath, content);
            console.log('Created .ai-tracker.json with default configuration');
        }
    }
    get excludePatterns() {
        return this.config.excludePatterns || this.defaults.excludePatterns;
    }
    get autoCommitThreshold() {
        return this.config.autoCommitThreshold || this.defaults.autoCommitThreshold;
    }
    get commitMessageFormat() {
        return this.config.commitMessageFormat || this.defaults.commitMessageFormat;
    }
    get maxCommits() {
        return this.config.maxCommits || this.defaults.maxCommits;
    }
    get verboseOutput() {
        return this.config.verboseOutput || this.defaults.verboseOutput;
    }
    get defaultBranch() {
        return this.config.defaultBranch || this.defaults.defaultBranch;
    }
    getExcludeArgs() {
        const args = [];
        for (const pattern of this.excludePatterns) {
            args.push('--exclude', pattern);
        }
        return args;
    }
    formatCommitMessage(template) {
        const format = template || this.commitMessageFormat;
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
        return format.replace('{timestamp}', timestamp);
    }
}
//# sourceMappingURL=Config.js.map