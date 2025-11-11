# Vercel SDL (Source Downloader)

Deployed something to Vercel and later needed to grab the source files? Vercel's dashboard doesn't let you do that. `vercel-sdl` fixes that!

## What it does

Browse your Vercel deployments interactively and download the source files. Simple as that.

## Before you start: Get your Vercel token

You'll need a Vercel API token to use this tool. Here's what you need to know about token scoping before creating one:

### Understanding token scope

Vercel lets you create tokens at different levels. Go to https://vercel.com/account/settings/tokens and you'll see options for:

- **Full Account Access** works across all your personal projects AND all teams you're part of. Most flexible option if you work with multiple teams.
- **Personal Account Only** only accesses your personal Vercel projects. Won't work for any team deployments.
- **Specific Team** (eg. team-xyz) only accesses that one team's deployments. Won't work for your personal account or other teams.

> [!IMPORTANT]
> If you create a token scoped to a specific team, you won't be able to access deployments from your personal Vercel account or other teams with that token. Choose based on what you need to download.

### Creating the token

1. Go to [Vercel Token Creation](https://vercel.com/account/settings/tokens) page.
2. Click "Create Token"
3. Choose your scope (see above)
4. Give it a name you'll remember
5. Copy the token - you won't see it again

Keep that token safe. You'll need it for every command.

## Installation

Now that you have your token, you can proceed to install:

Install globally:
```bash
npm install -g vercel-sdl
```

Or run directly with npx (no installation needed):
```bash
npx vercel-sdl --token YOUR_TOKEN
```

## Development Setup

If you want to contribute or modify the code:
```bash
git clone <repository-url>
cd vercel-source-downloader
npm install
npm run build
```

## Usage

```bash
vercel-sdl --token YOUR_TOKEN
# or with npx
npx vercel-sdl --token YOUR_TOKEN
```

This shows your recent deployments. Use arrow keys to browse through them - you'll see all the details (git info, status, timestamps) as you navigate. Hit Enter when you find the one you want.

### Filtering deployments

```bash
# Only production deployments
vercel-sdl --token xxx --target production

# Only ready deployments
vercel-sdl --token xxx --state READY

# Specific project
vercel-sdl --token xxx --project prj_abc123

# Get more results
vercel-sdl --token xxx --limit 20
```

### Team deployments

```bash
# By team ID
vercel-sdl --token xxx --team team_abc123

# By team slug
vercel-sdl --token xxx --slug my-team
```

## How downloads work

When you select a deployment and choose to download:

- Files go to `./downloads/{deployment-id}/`
- Downloads happen 5 at a time (API rate limit safety)
- If some files fail, the rest keep going
- You get a summary at the end

Progress bar shows what's happening in real-time.

## Why this exists

Vercel's UI doesn't give you a way to download deployment source. Sometimes you need that - maybe for debugging production issues, recovering files, or just keeping local backups.

I kept the dependencies minimal (just minimist for args and prompts for the interactive UI). Everything else uses standard Node APIs.

## Project structure

```
lib/
  types.ts              - TypeScript types from Vercel API spec
  vercel-api.ts         - API client wrapper
  formatter.ts          - Terminal output with colors
  interactive-selector.ts - Arrow-key navigation
  progress-display.ts   - Download progress bar
  file-downloader.ts    - Handles the actual downloads
  main.ts              - CLI entry point
```

## Notes

- File contents come back as base64 (so binary files work)
- Progress percentage is accurate because we fetch the full file tree first
- Concurrency is set to 5 based on testing - keeps things fast without hitting rate limits
