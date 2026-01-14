//! Handles recursive downloading of deployment files from Vercel's API.
//! This module manages the entire download lifecycle - from fetching the file tree,
//! to downloading files in parallel, to tracking progress. We chose a class-based
//! approach here to maintain state across the recursive download operations.
import * as fs from 'fs/promises';
import * as path from 'path';
import { updateProgress } from './progress-display.js';
export class FileDownloader {
    client;
    deploymentId;
    outputDir;
    teamId;
    slug;
    progress;
    startTime;
    constructor(client, deploymentId, outputDir, teamId, slug) {
        this.client = client;
        this.deploymentId = deploymentId;
        this.outputDir = outputDir;
        this.teamId = teamId;
        this.slug = slug;
        this.progress = {
            totalFiles: 0,
            downloadedFiles: 0,
            currentFile: '',
            failed: [],
        };
        this.startTime = Date.now();
    }
    countFiles(tree) {
        let count = 0;
        for (const node of tree) {
            if (node.type === 'file') {
                count++;
            }
            else if (node.type === 'directory' && node.children) {
                count += this.countFiles(node.children);
            }
        }
        return count;
    }
    /// Downloads all files from a deployment.
    /// We fetch the entire file tree first to show accurate progress - users need to know
    /// upfront how many files they're downloading rather than discovering it gradually.
    async downloadAll() {
        console.log('\n▸ Fetching file tree...');
        const fileTree = await this.client.listFiles(this.deploymentId, {
            teamId: this.teamId,
            slug: this.slug,
        });
        this.progress.totalFiles = this.countFiles(fileTree);
        console.log(`ℹ Found ${this.progress.totalFiles} files\n`);
        await fs.mkdir(this.outputDir, { recursive: true });
        await this.downloadTree(fileTree, '');
        const duration = Date.now() - this.startTime;
        return {
            totalFiles: this.progress.totalFiles,
            successCount: this.progress.downloadedFiles,
            failedCount: this.progress.failed.length,
            totalSizeBytes: 0, // TODO: calculate from downloaded files
            durationMs: duration,
        };
    }
    /// Downloads files recursively, respecting the directory structure.
    /// We process directories synchronously but batch file downloads in parallel.
    /// This prevents overwhelming the API with too many concurrent requests while
    /// still getting good performance - 5 was chosen through testing as a sweet spot
    /// between speed and API rate limit safety.
    async downloadTree(tree, currentPath) {
        const CONCURRENCY = 5;
        const queue = [];
        for (const node of tree) {
            const nodePath = path.join(currentPath, node.name);
            if (node.type === 'directory') {
                const dirPath = path.join(this.outputDir, nodePath);
                await fs.mkdir(dirPath, { recursive: true });
                if (node.children) {
                    await this.downloadTree(node.children, nodePath);
                }
            }
            else if (node.type === 'file' && node.uid) {
                queue.push(() => this.downloadFile(node.uid, nodePath));
            }
        }
        for (let i = 0; i < queue.length; i += CONCURRENCY) {
            const batch = queue.slice(i, i + CONCURRENCY);
            await Promise.all(batch.map(fn => fn()));
        }
    }
    /// Downloads a single file and updates progress tracking.
    /// We catch errors per-file rather than failing the entire download - partial downloads
    /// are more useful than no download. Failed files are logged so users can retry manually.
    async downloadFile(fileId, filePath) {
        try {
            this.progress.currentFile = filePath;
            updateProgress(this.progress);
            const content = await this.client.getFileContents(this.deploymentId, fileId, {
                teamId: this.teamId,
                slug: this.slug,
            });
            const buffer = Buffer.from(content.data, 'base64');
            const fullPath = path.join(this.outputDir, filePath);
            await fs.writeFile(fullPath, buffer);
            this.progress.downloadedFiles++;
            updateProgress(this.progress);
        }
        catch (error) {
            this.progress.failed.push(filePath);
            console.error(`\n✗ Failed to download: ${filePath}`);
        }
    }
}
//# sourceMappingURL=file-downloader.js.map