export interface TrackerConfig {
    gitDir: string;
    workTree: string;
    ignoreFile: string;
}
export declare class AITracker {
    private config;
    private configManager;
    constructor(workTree?: string);
    private execGit;
    isInitialized(): Promise<boolean>;
    initialize(): Promise<void>;
    private updateGitignore;
    commit(message?: string): Promise<void>;
    rollback(count?: number): Promise<void>;
    status(): Promise<void>;
    log(count?: number): Promise<void>;
    diff(commitHash?: string): Promise<void>;
    stats(): Promise<void>;
    init(): Promise<void>;
}
//# sourceMappingURL=AITracker.d.ts.map