export interface TrackerConfigOptions {
    excludePatterns?: string[];
    autoCommitThreshold?: number;
    commitMessageFormat?: string;
    maxCommits?: number;
    verboseOutput?: boolean;
    defaultBranch?: string;
}
export declare class Config {
    private configPath;
    private config;
    private defaults;
    constructor(workTree: string);
    private load;
    save(): void;
    createDefault(): void;
    get excludePatterns(): string[];
    get autoCommitThreshold(): number;
    get commitMessageFormat(): string;
    get maxCommits(): number;
    get verboseOutput(): boolean;
    get defaultBranch(): string;
    getExcludeArgs(): string[];
    formatCommitMessage(template?: string): string;
}
//# sourceMappingURL=Config.d.ts.map