# Supabase Project Pinger

A GitHub Actions-based tool that automatically pings multiple Supabase projects every 15 minutes to prevent them from going to sleep.

## Features

- Pings multiple Supabase projects every 15 minutes
- Runs automatically using GitHub Actions
- Logs all ping results
- Can be triggered manually through GitHub Actions interface

## Setup

1. Clone this repository
2. Update `config.json` with your Supabase project details:
   ```json
   {
     "supabase_projects": [
       {
         "name": "Your Project Name",
         "url": "https://your-project-id.supabase.co",
         "anon_key": "your-anon-key"
       }
     ]
   }
   ```
3. The GitHub Action will automatically start pinging your projects every 15 minutes

## Manual Trigger

You can manually trigger the pinger from the GitHub Actions tab in your repository.
