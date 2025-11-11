//! Type definitions for Vercel API v6.
//! These match the actual API response shapes. I extracted only what we need
//! instead of importing an SDK - keeps things lean and we only use a few endpoints.

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

/// File tree structure from Vercel's deployment API.
/// The tree is recursive - directories have children arrays while files have uids
/// we use to fetch their contents. Vercel also returns lambda/middleware nodes but
/// we treat those like regular files for downloading purposes.
export type FileType = 'directory' | 'file' | 'symlink' | 'lambda' | 'middleware' | 'invalid';

export interface FileTree {
  name: string;
  type: FileType;
  uid?: string;
  children?: FileTree[];
  contentType?: string;
  mode?: number;
}

/// Vercel returns file contents as base64 to handle binary files safely over JSON.
/// We decode this to a Buffer before writing to disk.
export interface FileContent {
  data: string;
}

/// Progress tracking for the download UI.
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
