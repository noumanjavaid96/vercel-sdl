//! Formats deployment data for terminal display with ANSI colors.
//! This module handles all the visual presentation logic. We use ANSI escape codes
//! directly rather than a library like chalk to keep dependencies minimal - it's just
//! color codes, not worth adding a dependency for.
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};
function getStateColor(state) {
    switch (state) {
        case 'READY':
            return colors.green;
        case 'BUILDING':
        case 'INITIALIZING':
        case 'QUEUED':
            return colors.yellow;
        case 'ERROR':
        case 'CANCELED':
            return colors.red;
        default:
            return colors.gray;
    }
}
function formatTimestamp(timestamp) {
    if (!timestamp)
        return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
}
/// Extracts git metadata from various VCS providers.
/// Vercel supports GitHub, GitLab, and Bitbucket - each has slightly different
/// field names in their metadata, so we check all possible variations to build
/// a unified git info string. This makes the output consistent regardless of provider.
function formatGitInfo(meta) {
    if (!meta)
        return 'N/A';
    const parts = [];
    if (meta.githubCommitRepo || meta.gitlabProjectPath || meta.bitbucketRepoName) {
        const repo = meta.githubCommitRepo ||
            meta.gitlabProjectPath ||
            meta.bitbucketRepoName;
        parts.push(`Repo: ${repo}`);
    }
    if (meta.githubCommitRef || meta.gitlabCommitRef || meta.bitbucketCommitRef) {
        const branch = meta.githubCommitRef || meta.gitlabCommitRef || meta.bitbucketCommitRef;
        parts.push(`Branch: ${branch}`);
    }
    if (meta.githubCommitSha || meta.gitlabCommitSha || meta.bitbucketCommitSha) {
        const sha = meta.githubCommitSha || meta.gitlabCommitSha || meta.bitbucketCommitSha;
        // Short SHA is convention - 7 chars is enough to avoid collisions in most repos
        parts.push(`SHA: ${sha.substring(0, 7)}`);
    }
    if (meta.githubCommitMessage || meta.gitlabCommitMessage) {
        const message = meta.githubCommitMessage || meta.gitlabCommitMessage;
        parts.push(`Message: ${message}`);
    }
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
}
export function formatDeployment(deployment, index) {
    const stateColor = getStateColor(deployment.state || deployment.readyState);
    const state = deployment.state || deployment.readyState || 'UNKNOWN';
    const lines = [
        `\n${colors.bright}${colors.cyan}[${index + 1}] ${deployment.name}${colors.reset}`,
        `${colors.gray}${'─'.repeat(60)}${colors.reset}`,
        `  ${colors.bright}ID:${colors.reset} ${deployment.uid}`,
        `  ${colors.bright}URL:${colors.reset} ${deployment.url ? `https://${deployment.url}` : colors.dim + 'null (incomplete)' + colors.reset}`,
        `  ${colors.bright}Status:${colors.reset} ${stateColor}${state}${colors.reset}`,
        `  ${colors.bright}Created:${colors.reset} ${formatTimestamp(deployment.created || deployment.createdAt)}`,
    ];
    // Skip showing ready time when it matches created - happens for instant deploys
    if (deployment.ready && deployment.ready !== deployment.created) {
        lines.push(`  ${colors.bright}Ready:${colors.reset} ${formatTimestamp(deployment.ready)}`);
    }
    if (deployment.target) {
        const targetColor = deployment.target === 'production' ? colors.green : colors.blue;
        lines.push(`  ${colors.bright}Environment:${colors.reset} ${targetColor}${deployment.target}${colors.reset}`);
    }
    lines.push(`  ${colors.bright}Project ID:${colors.reset} ${deployment.projectId}`);
    if (deployment.source) {
        lines.push(`  ${colors.bright}Source:${colors.reset} ${deployment.source}`);
    }
    const gitInfo = formatGitInfo(deployment.meta);
    lines.push(`  ${colors.bright}Git:${colors.reset} ${gitInfo}`);
    if (deployment.creator) {
        const creatorInfo = deployment.creator.username || deployment.creator.email || deployment.creator.uid;
        lines.push(`  ${colors.bright}Creator:${colors.reset} ${creatorInfo}`);
    }
    if (deployment.errorCode || deployment.errorMessage) {
        lines.push(`  ${colors.bright}${colors.red}Error:${colors.reset} ${deployment.errorCode || ''} ${deployment.errorMessage || ''}`);
    }
    if (deployment.inspectorUrl) {
        lines.push(`  ${colors.bright}Inspector:${colors.reset} ${deployment.inspectorUrl}`);
    }
    return lines.join('\n');
}
export function formatDeploymentsList(deployments) {
    if (deployments.length === 0) {
        return `\n${colors.yellow}No deployments found.${colors.reset}\n`;
    }
    const header = `\n${colors.bright}${colors.cyan}Found ${deployments.length} deployment(s)${colors.reset}\n`;
    const formattedDeployments = deployments.map((deployment, index) => formatDeployment(deployment, index));
    return header + formattedDeployments.join('\n') + '\n';
}
export function formatError(error) {
    return `\n${colors.red}${colors.bright}Error:${colors.reset} ${error.message}\n`;
}
//# sourceMappingURL=formatter.js.map