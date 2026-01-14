#!/usr/bin/env node

//! Web server for Vercel Source Downloader
//! Provides a web UI for downloading Vercel deployment source files
//! without requiring CLI knowledge or command-line access.

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import archiver from 'archiver';
import { VercelAPIClient } from './vercel-api.js';
import { FileDownloader } from './file-downloader.js';
import type { ListDeploymentsParams } from './types.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// API endpoint to list deployments
app.post('/api/deployments', async (req, res) => {
  try {
    const { token, teamId, slug, limit, projectId, target, state } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Vercel token is required' });
    }

    const client = new VercelAPIClient(token);
    const params: ListDeploymentsParams = {
      limit: limit || 20,
    };

    if (teamId) params.teamId = teamId;
    if (slug) params.slug = slug;
    if (projectId) params.projectId = projectId;
    if (target) params.target = target;
    if (state) params.state = state;

    const response = await client.listDeployments(params);
    res.json(response);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch deployments',
    });
  }
});

// API endpoint to download deployment source
app.post('/api/download', async (req, res) => {
  try {
    const { token, deploymentId, teamId, slug } = req.body;

    if (!token || !deploymentId) {
      return res.status(400).json({
        error: 'Vercel token and deployment ID are required',
      });
    }

    // Sanitize deploymentId to prevent path traversal attacks
    const sanitizedDeploymentId = deploymentId.replace(/[^a-zA-Z0-9_-]/g, '_');

    const client = new VercelAPIClient(token);
    const outputDir = path.join(process.cwd(), 'temp-downloads', sanitizedDeploymentId);

    // Clean up any existing directory
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    const downloader = new FileDownloader(
      client,
      deploymentId,
      outputDir,
      teamId,
      slug
    );

    // Download all files
    const stats = await downloader.downloadAll();

    // Create a zip file
    const zipPath = path.join(process.cwd(), 'temp-downloads', `${sanitizedDeploymentId}.zip`);
    
    await new Promise<void>((resolve, reject) => {
      const output = fsSync.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));

      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });

    // Send the zip file
    res.download(zipPath, `${sanitizedDeploymentId}.zip`, async (err) => {
      // Clean up after download
      try {
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.unlink(zipPath);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }

      if (err) {
        console.error('Error sending file:', err);
      }
    });
  } catch (error) {
    console.error('Error downloading deployment:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to download deployment',
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Vercel Source Downloader Web UI`);
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`\nOpen your browser and navigate to the URL above to use the web interface.\n`);
});
