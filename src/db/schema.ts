import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const commits = sqliteTable('commits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hash: text('hash').notNull().unique(),
  message: text('message').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  filesChanged: integer('files_changed').notNull().default(0),
  insertions: integer('insertions').notNull().default(0),
  deletions: integer('deletions').notNull().default(0),
  author: text('author').notNull().default('AI Assistant'),
});

export const fileChanges = sqliteTable('file_changes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commitId: integer('commit_id')
    .notNull()
    .references(() => commits.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  changeType: text('change_type', { enum: ['added', 'modified', 'deleted'] }).notNull(),
  linesAdded: integer('lines_added').notNull().default(0),
  linesRemoved: integer('lines_removed').notNull().default(0),
});

export const trackerStats = sqliteTable('tracker_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startTime: integer('start_time', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  endTime: integer('end_time', { mode: 'timestamp' }),
  filesModified: integer('files_modified').notNull().default(0),
  commitsCreated: integer('commits_created').notNull().default(0),
  rollbacksPerformed: integer('rollbacks_performed').notNull().default(0),
});

export type Commit = typeof commits.$inferSelect;
export type NewCommit = typeof commits.$inferInsert;
export type FileChange = typeof fileChanges.$inferSelect;
export type NewFileChange = typeof fileChanges.$inferInsert;
export type TrackerStat = typeof trackerStats.$inferSelect;
export type Session = typeof sessions.$inferSelect;