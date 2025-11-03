//! Client for communicating with Vercel's REST API v6.
//! This wraps the deployment and file endpoints we need. We use fetch instead of
//! a library like axios to keep dependencies minimal - the API is simple enough
//! that we don't need the extra abstraction layer.

import type {
  DeploymentsResponse,
  ListDeploymentsParams,
  VercelAPIError,
  FileTree,
  FileContent,
} from './types.js';

const VERCEL_API_BASE_URL = 'https://api.vercel.com';

export class VercelAPIClient {
  private bearerToken: string;

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  /// Lists deployments with optional filtering.
  /// Vercel's API uses query params for everything - teamId/slug for scope,
  /// and various filters for narrowing results. The pagination response tells
  /// us if there are more results, but we don't implement pagination yet since
  /// most users just want recent deployments.
  async listDeployments(
    params: ListDeploymentsParams = {}
  ): Promise<DeploymentsResponse> {
    const queryParams = new URLSearchParams();

    if (params.teamId) queryParams.set('teamId', params.teamId);
    if (params.slug) queryParams.set('slug', params.slug);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.projectId) queryParams.set('projectId', params.projectId);
    if (params.target) queryParams.set('target', params.target);
    if (params.state) queryParams.set('state', params.state);
    if (params.since) queryParams.set('since', params.since.toString());
    if (params.until) queryParams.set('until', params.until.toString());

    const url = `${VERCEL_API_BASE_URL}/v6/deployments${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as VercelAPIError;
        throw new Error(
          `Vercel API Error (${response.status}): ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      return (await response.json()) as DeploymentsResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred while fetching deployments');
    }
  }

  /// Fetches the file tree for a deployment.
  /// This returns a nested structure with directories containing children arrays.
  /// We need the full tree upfront to show accurate progress during downloads.
  async listFiles(
    deploymentId: string,
    params?: { teamId?: string; slug?: string }
  ): Promise<FileTree[]> {
    const queryParams = new URLSearchParams();
    if (params?.teamId) queryParams.set('teamId', params.teamId);
    if (params?.slug) queryParams.set('slug', params.slug);

    const url = `${VERCEL_API_BASE_URL}/v6/deployments/${deploymentId}/files${
      queryParams.toString() ? `?${queryParams}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as VercelAPIError;
      throw new Error(
        `Vercel API Error (${response.status}): ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    return (await response.json()) as FileTree[];
  }

  /// Downloads file contents as base64.
  /// Vercel uses v8 for this endpoint (not v6 like the others) and returns base64
  /// to safely handle binary files over JSON. We decode this to a Buffer before
  /// writing to disk.
  async getFileContents(
    deploymentId: string,
    fileId: string,
    params?: { teamId?: string; slug?: string; path?: string }
  ): Promise<FileContent> {
    const queryParams = new URLSearchParams();
    if (params?.teamId) queryParams.set('teamId', params.teamId);
    if (params?.slug) queryParams.set('slug', params.slug);
    if (params?.path) queryParams.set('path', params.path);

    const url = `${VERCEL_API_BASE_URL}/v8/deployments/${deploymentId}/files/${fileId}${
      queryParams.toString() ? `?${queryParams}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return (await response.json()) as FileContent;
  }
}
