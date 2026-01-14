import type { DownloadStats } from './types.js';
import type { VercelAPIClient } from './vercel-api.js';
export declare class FileDownloader {
    private client;
    private deploymentId;
    private outputDir;
    private teamId?;
    private slug?;
    private progress;
    private startTime;
    constructor(client: VercelAPIClient, deploymentId: string, outputDir: string, teamId?: string, slug?: string);
    private countFiles;
    downloadAll(): Promise<DownloadStats>;
    private downloadTree;
    private downloadFile;
}
//# sourceMappingURL=file-downloader.d.ts.map