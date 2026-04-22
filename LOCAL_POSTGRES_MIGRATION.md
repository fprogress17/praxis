# Local Postgres Migration

This repo currently uses Supabase APIs, but the relational schema can be migrated to plain Postgres first.

## Safety-first sequence

1. Create a separate local Postgres database.
2. Apply the plain Postgres schema from [`db/local/001_init.sql`](db/local/001_init.sql).
3. Export relational data from Supabase and import it into local Postgres.
4. Verify row counts and basic CRUD against local Postgres.
5. Cut the app over from Supabase table APIs to direct Postgres access.
6. Migrate file storage separately.

## Important constraint

[`db/local/001_init.sql`](db/local/001_init.sql) migrates the relational schema only. It intentionally does not create any Supabase Storage objects or RLS policies.

The `files` table is preserved, but the binary file payloads still need a separate destination:

- local disk
- S3-compatible object storage
- keep Supabase Storage temporarily during the database cutover

## Apply the local schema

Create the database once:

```bash
psql "$POSTGRES_ADMIN_URL" -c 'create database praxis'
```

Apply the schema:

```bash
psql "$DATABASE_URL" -f db/local/001_init.sql
```

Generate a relational data import from the current Supabase project:

```bash
npm run db:local:export-from-supabase
psql "$DATABASE_URL" -f /tmp/praxis-supabase-export.sql
```

Download Supabase Storage objects to local disk:

```bash
npm run files:local:pull-from-supabase
```

By default, files are copied into `local-storage/praxis-files/`.

## Data migration notes

For a safe full migration, import data in dependency order:

1. `channels`
2. `videos`
3. `notes`
4. `ideas`
5. `workspace_ideas`
6. `workspace_notes`
7. `files`
8. `links`
9. `script_versions`

After import, validate at minimum:

- row counts per table match Supabase
- every `videos.channel_id` exists in `channels`
- every `notes.video_id` exists when non-null
- every `files.object_path` remains unique
- the app can read and write channels, videos, notes, ideas, links, and workspace notes

## Current status

- Local Postgres target is reachable.
- The database named `praxis` was not present yet.
- Supabase relational schema has been translated into plain Postgres.
- Export and file-download utilities are available for staged data migration.
- App runtime has not been switched yet.
