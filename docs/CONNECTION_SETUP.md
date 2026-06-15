# OpenAI, Supabase, Vercel connection checklist

This app needs three services:

1. OpenAI for post generation.
2. Supabase for saving logs and draft history.
3. Vercel for hosting the React app and serverless API routes.

## OpenAI

Create an API key at:

https://platform.openai.com/api-keys

Add this value to Vercel:

```text
OPENAI_API_KEY=sk-...
```

Optional model setting:

```text
OPENAI_MODEL=gpt-4o-mini
```

## Supabase

Create a Supabase project at:

https://supabase.com/dashboard/projects

Open the SQL Editor and run the contents of `supabase_schema.sql`.

Then copy these values from Project Settings > API:

```text
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Use the `service_role` key only in Vercel environment variables. Never expose it in browser code.

## Vercel

Import this GitHub repository into Vercel:

https://vercel.com/new

Use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Add the environment variables above in:

Project Settings > Environment Variables

After changing environment variables, redeploy the latest deployment.

## Required Vercel environment variables

```text
OPENAI_API_KEY
OPENAI_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Only `OPENAI_API_KEY` is required for generation. Supabase values are required for save and history features.
