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
