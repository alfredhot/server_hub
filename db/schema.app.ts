import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { user } from './schema.auth'

/**
 * Per-user feature authorization. Features themselves are defined in code
 * (lib/features/registry.ts) — this table only stores grants/overrides.
 * Effective access = role default (code) ⊕ this row (db).
 */
export const featureGrant = sqliteTable(
  'feature_grant',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    permissions: text('permissions', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    grantedBy: text('granted_by'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
  },
  t => [uniqueIndex('feature_grant_user_feature_idx').on(t.userId, t.featureKey)]
)

/** Audit trail for user-management and permission changes. */
export const auditLog = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    targetId: text('target_id'),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
  },
  t => [index('audit_log_created_idx').on(t.createdAt)]
)

/** Example feature: quick notes. */
export const note = sqliteTable(
  'note',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
  },
  t => [index('note_user_idx').on(t.userId)]
)
