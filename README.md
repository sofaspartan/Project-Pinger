# Supabase Project Pinger

A GitHub Actions-based tool that automatically pings multiple Supabase projects every 15 minutes to prevent them from going to sleep.

## Features

- Pings multiple Supabase projects every 15 minutes
- Runs automatically using GitHub Actions
- Logs all ping results
- Can be triggered manually through GitHub Actions interface

## Setup

1. Clone this repository
2. Copy `config.example.json` to `config.json` (gitignored) and add your projects. Each project needs the **Supabase secret (service_role) API key** — the same credential PostgREST expects for your ping endpoint:
   ```json
   {
     "supabase_projects": [
       {
         "name": "Your Project Name",
         "url": "https://your-project-id.supabase.co",
         "secret_key": "your-secret-key"
       }
     ],
     "ping_interval_minutes": 15
   }
   ```
   You can use `service_role_key` instead of `secret_key` if you prefer that field name (same value).
3. For **GitHub Actions**, add a repository secret `PINGER_CONFIG_JSON` whose value is that entire JSON document. Do not commit real keys.
4. The GitHub Action runs on the schedule in `.github/workflows/ping.yml` and pings your projects automatically.

## Manual Trigger

You can manually trigger the pinger from the GitHub Actions tab in your repository.

## Vercel dashboard (status UI)

The **front-end status page** is `public/index.html`. After deploy, open your Vercel **production URL** (root `/`). Vercel serves files from `public/` at the site root and **`api/` as `/api/*`**; do not add a catch-all rewrite to `/public/` or `/api/ping` will not run.

It calls:

- **`GET /api/ping`** — runs the same Supabase pings as `ping.js` (uses `PINGER_CONFIG_JSON` on the server).
- **`GET /api/github`** — reads GitHub Actions history for this repo (uses `GITHUB_TOKEN`).
- **`GET /api/github?sparkline=1&limit=10`** — returns `{ points, usedRuns }` for the status hero (fraction healthy per recent `ping.yml` run, from artifacts).

### Deploy

1. Install the CLI: `npm i -g vercel`, or connect the GitHub repo in the [Vercel dashboard](https://vercel.com/new) (**Import** → pick `Project-Pinger`).
2. From the project root: `vercel` (preview) or `vercel --prod` (production). With GitHub import, every push to `main` can auto-deploy.

### Environment variables (Vercel)

In the Vercel project: **Settings → Environment Variables**. Add for **Production** (and **Preview** if you use previews):

| Name | Value |
|------|--------|
| `PINGER_CONFIG_JSON` | Same JSON string as the GitHub secret: full `config` object with `supabase_projects` and each project’s `url` + `secret_key` (or `service_role_key`). |
| `GITHUB_TOKEN` | A GitHub [personal access token](https://github.com/settings/tokens) with **`actions:read`** (and **`repo`** scope if you use a classic PAT on a private repo). Needed for the **GitHub** tab, workflow list, **ping-results artifacts** (ZIP), and job logs. |

Redeploy after saving env vars (**Deployments → … → Redeploy** or push an empty commit).

### Security note

`/api/ping` is a **public** URL on Vercel. The browser never receives your Supabase keys, but **anyone who can open the site can trigger** a ping run on your server (abuse / quota). The JSON still holds **service_role**-level secrets—treat `PINGER_CONFIG_JSON` as highly sensitive and rotate if it leaks.
