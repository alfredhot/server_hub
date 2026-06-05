/**
 * Manual admin seed. Normally the server seeds itself on startup
 * (server/plugins/0.bootstrap.ts); this is for running it by hand.
 *
 *   node --env-file=.env --import tsx scripts/seed-admin.ts
 */
import { ensureAdmin } from '../lib/bootstrap'

await ensureAdmin()
process.exit(0)
