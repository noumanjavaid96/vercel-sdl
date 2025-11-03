/**
 * Vercel API Type Definitions
 * Based on Vercel REST API v6 documentation
 */

export type DeploymentState =
  | 'BUILDING'
  | 'ERROR'
  | 'INITIALIZING'
  | 'QUEUED'
  | 'READY'
  | 'CANCELED'
  | 'DELETED';

export type DeploymentTarget = 'production' | 'staging' | null;

export type DeploymentSource =
  | 'api-trigger-git-deploy'
  | 'cli'
  | 'clone/repo'
  | 'git'
  | 'import'
  | 'import/repo'
  | 'redeploy'
  | 'v0-web';

export interface DeploymentCreator {
  uid: string;
  email?: string;
  username?: string;
  githubLogin?: string;
  gitlabLogin?: string;
}

export interface Deployment {
  uid: string;
  name: string;
  projectId: string;
  url: string | null;
  created: number;
  createdAt?: number;
  buildingAt?: number;
  ready?: number;
  state?: DeploymentState;
  readyState?: DeploymentState;
  readySubstate?: 'STAGED' | 'ROLLING' | 'PROMOTED';
  type?: string;
  creator: DeploymentCreator;
  meta?: Record<string, string>;
  target?: DeploymentTarget;
  source?: DeploymentSource;
  inspectorUrl?: string | null;
  errorCode?: string;
  errorMessage?: string | null;
  checksState?: 'registered' | 'running' | 'completed';
  checksConclusion?: 'succeeded' | 'failed' | 'skipped' | 'canceled';
  isRollbackCandidate?: boolean | null;
}

export interface Pagination {
  count: number;
  next: number | null;
  prev: number | null;
}

export interface DeploymentsResponse {
  deployments: Deployment[];
  pagination: Pagination;
}

export interface ListDeploymentsParams {
  teamId?: string;
  slug?: string;
  limit?: number;
  projectId?: string;
  target?: string;
  state?: string;
  since?: number;
  until?: number;
}

export interface VercelAPIError {
  error: {
    code: string;
    message: string;
  };
}

// File tree types from Vercel API
export type FileType = 'directory' | 'file' | 'symlink' | 'lambda' | 'middleware' | 'invalid';

export interface FileTree {
  name: string;
  type: FileType;
  uid?: string;              // Only for files
  children?: FileTree[];     // Only for directories
  contentType?: string;      // Only for files
  mode?: number;             // Unix permissions
}

export interface FileContent {
  data: string;  // base64-encoded content
}

// Download progress tracking
export interface DownloadProgress {
  totalFiles: number;
  downloadedFiles: number;
  currentFile: string;
  failed: string[];
}

export interface DownloadStats {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  totalSizeBytes: number;
  durationMs: number;
}
