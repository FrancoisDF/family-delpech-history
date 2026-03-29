# Plan: Set Supabase Secret Key for Ingestion

## What needs to happen

1. User provides their `sb_secret_...` key from the Supabase dashboard
2. Set it as `SUPABASE_SERVICE_ROLE_KEY` environment variable (secret)
3. The ingestion script (`scripts/ingest-to-supabase.mjs`) already reads this variable and uses it to write data to the `documents` table

## No code changes needed

The ingestion script already has this logic:
```js
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
```

So once the secret key is set, the script will pick it up automatically.

## After setting the key

The user can run `npm run ingest:supabase` to populate the database with embeddings from `static/family-data.json`.
