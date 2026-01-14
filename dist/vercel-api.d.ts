import type { DeploymentsResponse, ListDeploymentsParams, FileTree, FileContent } from './types.js';
export declare class VercelAPIClient {
    private bearerToken;
    constructor(bearerToken: string);
    listDeployments(params?: ListDeploymentsParams): Promise<DeploymentsResponse>;
    listFiles(deploymentId: string, params?: {
        teamId?: string;
        slug?: string;
    }): Promise<FileTree[]>;
    getFileContents(deploymentId: string, fileId: string, params?: {
        teamId?: string;
        slug?: string;
        path?: string;
    }): Promise<FileContent>;
}
//# sourceMappingURL=vercel-api.d.ts.map