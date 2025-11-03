#!/usr/bin/env node

//! CLI entry point for downloading Vercel deployment source files.
//! This tool provides an interactive interface for browsing and downloading deployments.
//! We built this because Vercel's web UI doesn't let you download source code, which is
//! problematic when you need to recover files or debug production issues.

import minimist from 'minimist';
import * as path from 'path';
import { VercelAPIClient } from './vercel-api.js';
import { formatDeployment, formatError } from './formatter.js';
import { selectDeployment } from './interactive-selector.js';
import { FileDownloader } from './file-downloader.js';
import { printSummary } from './progress-display.js';
import type { ListDeploymentsParams } from './types.js';

function printUsage(): void {
  console.log(`
Vercel Source Downloader - Interactive CLI

Usage:
  node dist/main.js --token <token> [options]

Authentication:
  --token <token>        Your Vercel API token (works for both personal and team)
  --team-token <token>   Alternative: explicitly specify a team token

Options:
  --team <teamId>        Team ID to fetch deployments for
  --slug <slug>          Team slug to fetch deployments for
  --limit <number>       Maximum number of deployments to fetch (default: 10)
  --project <projectId>  Filter by project ID
  --target <env>         Filter by environment (production, staging)
  --state <state>        Filter by state (BUILDING, ERROR, READY, etc.)
  --help                 Show this help message

Interactive Navigation:
  The tool will display an interactive list of deployments.
  - Use ↑/↓ arrow keys to navigate between deployments
  - Full deployment details are shown for the current selection
  - Press Enter to select a deployment for file download
  - Press Ctrl+C to cancel and exit

Examples:
  # Browse personal deployments interactively
  node dist/main.js --token xxx

  # Browse team deployments by team ID
  node dist/main.js --token xxx --team team_abc123

  # Browse team deployments by slug
  node dist/main.js --token xxx --slug my-team

  # Browse with filters (20 production deployments)
  node dist/main.js --token xxx --team team_abc123 --limit 20 --target production

  # Browse only ready deployments
  node dist/main.js --token xxx --state READY

Note: If you get a 403 error accessing team resources, ensure your token was
      created from the team settings (not personal settings) in Vercel dashboard.
`);
}

async function main(): Promise<void> {
  const args = minimist(process.argv.slice(2), {
    string: [
      'token',
      'team-token',
      'team',
      'slug',
      'project',
      'target',
      'state',
      'limit',
    ],
    boolean: ['help'],
    alias: {
      h: 'help',
      t: 'token',
    },
  });

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  // Prefer team-token if provided, fall back to token
  const token = args['team-token'] || args.token;

  if (!token) {
    console.error(
      formatError(
        new Error(
          'Missing required --token parameter. Provide your Vercel API token.'
        )
      )
    );
    printUsage();
    process.exit(1);
  }

  try {
    const client = new VercelAPIClient(token);

    const params: ListDeploymentsParams = {
      limit: args.limit ? parseInt(args.limit, 10) : 10,
    };

    if (args.team) params.teamId = args.team;
    if (args.slug) params.slug = args.slug;
    if (args.project) params.projectId = args.project;
    if (args.target) params.target = args.target;
    if (args.state) params.state = args.state;

    console.log('\nFetching deployments...');
    const response = await client.listDeployments(params);

    console.log(`Found ${response.deployments.length} deployment(s)\n`);

    const result = await selectDeployment(response.deployments);

    if (result) {
      const { deployment, index } = result;

      console.log('\n' + '='.repeat(60));
      console.log('SELECTED DEPLOYMENT');
      console.log('='.repeat(60) + '\n');

      console.log(formatDeployment(deployment, index));

      // Use readline to ask for download confirmation
      console.log('\n' + '='.repeat(60));
      const readline = await import('readline/promises');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await rl.question('📥 Download source files? (y/n): ');
      rl.close();

      if (answer.toLowerCase() === 'y') {
        const outputDir = path.join(
          process.cwd(),
          'downloads',
          deployment.uid
        );

        console.log(`\n📂 Will download to: ${outputDir}\n`);

        const downloader = new FileDownloader(
          client,
          deployment.uid,
          outputDir,
          args.team,
          args.slug
        );

        const stats = await downloader.downloadAll();

        printSummary(
          stats.totalFiles,
          stats.successCount,
          stats.failedCount,
          stats.durationMs,
          outputDir
        );
      } else {
        console.log('\n✅ Deployment selected. Exiting...\n');
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(formatError(error));
    } else {
      console.error(formatError(new Error('An unknown error occurred')));
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
