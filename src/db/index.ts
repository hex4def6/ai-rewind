import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as schema from './schema.js';

export class TrackerDatabase {
  private db: ReturnType<typeof drizzle>;
  private sqlite: Database.Database;

  constructor(workTree: string) {
    const dbDir = join(workTree, '.git-ai-tracking');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = join(dbDir, 'tracker.db');
    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite, { schema });

    // Initialize tables
    this.initializeTables();
  }

  private initializeTables() {
    // Create tables if they don't exist
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS commits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL UNIQUE,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        files_changed INTEGER DEFAULT 0,
        insertions INTEGER DEFAULT 0,
        deletions INTEGER DEFAULT 0,
        author TEXT DEFAULT 'AI Assistant'
      );

      CREATE TABLE IF NOT EXISTS file_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commit_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        change_type TEXT NOT NULL CHECK(change_type IN ('added', 'modified', 'deleted')),
        lines_added INTEGER DEFAULT 0,
        lines_removed INTEGER DEFAULT 0,
        FOREIGN KEY (commit_id) REFERENCES commits(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tracker_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        files_modified INTEGER DEFAULT 0,
        commits_created INTEGER DEFAULT 0,
        rollbacks_performed INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_commits_hash ON commits(hash);
      CREATE INDEX IF NOT EXISTS idx_file_changes_commit ON file_changes(commit_id);
      CREATE INDEX IF NOT EXISTS idx_tracker_stats_key ON tracker_stats(key);
    `);
  }

  async recordCommit(commitData: schema.NewCommit) {
    return this.db.insert(schema.commits).values(commitData).returning();
  }

  async recordFileChange(changeData: schema.NewFileChange) {
    return this.db.insert(schema.fileChanges).values(changeData).returning();
  }

  async getCommitByHash(hash: string) {
    return this.db.select().from(schema.commits).where(schema.commits.hash.eq(hash)).get();
  }

  async getRecentCommits(limit = 10) {
    return this.db
      .select()
      .from(schema.commits)
      .orderBy(schema.commits.timestamp.desc())
      .limit(limit);
  }

  async getFileChangesForCommit(commitId: number) {
    return this.db
      .select()
      .from(schema.fileChanges)
      .where(schema.fileChanges.commitId.eq(commitId));
  }

  async updateStat(key: string, value: string) {
    return this.db
      .insert(schema.trackerStats)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.trackerStats.key,
        set: { value, updatedAt: new Date() },
      });
  }

  async getStat(key: string) {
    return this.db
      .select()
      .from(schema.trackerStats)
      .where(schema.trackerStats.key.eq(key))
      .get();
  }

  async startSession() {
    return this.db.insert(schema.sessions).values({}).returning();
  }

  async endSession(sessionId: number, stats: Partial<schema.Session>) {
    return this.db
      .update(schema.sessions)
      .set({ ...stats, endTime: new Date() })
      .where(schema.sessions.id.eq(sessionId));
  }

  close() {
    this.sqlite.close();
  }
}