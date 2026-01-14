// API base URL - defaults to current origin
const API_BASE = window.location.origin;

// State management
let deployments = [];
let selectedDeployment = null;

// DOM elements
const tokenInput = document.getElementById('token');
const toggleTokenBtn = document.getElementById('toggleToken');
const projectUrlInput = document.getElementById('projectUrl');
const teamIdInput = document.getElementById('teamId');
const slugInput = document.getElementById('slug');
const targetSelect = document.getElementById('target');
const stateSelect = document.getElementById('state');
const limitInput = document.getElementById('limit');
const fetchBtn = document.getElementById('fetchDeployments');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const deploymentsSection = document.getElementById('deploymentsSection');
const deploymentsList = document.getElementById('deploymentsList');
const downloadSection = document.getElementById('downloadSection');
const selectedDeploymentDiv = document.getElementById('selectedDeployment');
const downloadBtn = document.getElementById('downloadBtn');
const downloadProgress = document.getElementById('downloadProgress');
const downloadStatus = document.getElementById('downloadStatus');

// Toggle token visibility
toggleTokenBtn.addEventListener('click', () => {
    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        toggleTokenBtn.textContent = 'Hide';
    } else {
        tokenInput.type = 'password';
        toggleTokenBtn.textContent = 'Show';
    }
});

// Fetch deployments
fetchBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    
    if (!token) {
        showError('Please enter your Vercel API token');
        return;
    }

    hideError();
    showLoading();
    hideDeployments();
    hideDownload();

    try {
        // Extract project ID from URL if provided
        let projectId = projectUrlInput.value.trim();
        if (projectId && (projectId.startsWith('http://') || projectId.startsWith('https://'))) {
            // Try to extract project name from URL
            const match = projectId.match(/https?:\/\/([^.]+)\./);
            if (match) {
                projectId = match[1];
            }
        }

        const requestBody = {
            token,
            limit: parseInt(limitInput.value) || 20,
        };

        if (teamIdInput.value.trim()) requestBody.teamId = teamIdInput.value.trim();
        if (slugInput.value.trim()) requestBody.slug = slugInput.value.trim();
        if (projectId) requestBody.projectId = projectId;
        if (targetSelect.value) requestBody.target = targetSelect.value;
        if (stateSelect.value) requestBody.state = stateSelect.value;

        const response = await fetch(`${API_BASE}/api/deployments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch deployments');
        }

        const data = await response.json();
        deployments = data.deployments || [];

        if (deployments.length === 0) {
            showError('No deployments found. Try adjusting your filters.');
            return;
        }

        displayDeployments();
    } catch (error) {
        showError(error.message || 'Failed to fetch deployments. Please check your token and try again.');
    } finally {
        hideLoading();
    }
});

// Display deployments
function displayDeployments() {
    deploymentsList.innerHTML = '';
    
    deployments.forEach((deployment, index) => {
        const item = document.createElement('div');
        item.className = 'deployment-item';
        
        const statusClass = getStatusClass(deployment.state || deployment.readyState);
        const date = new Date(deployment.created || deployment.createdAt).toLocaleString();
        
        item.innerHTML = `
            <div class="deployment-header">
                <div class="deployment-name">${deployment.name || 'Unnamed'}</div>
                <div class="deployment-status ${statusClass}">
                    ${deployment.state || deployment.readyState || 'UNKNOWN'}
                </div>
            </div>
            <div class="deployment-info">
                ${deployment.url ? `<a href="https://${deployment.url}" target="_blank" class="deployment-url" onclick="event.stopPropagation()">${deployment.url}</a>` : 'No URL'}
            </div>
            <div class="deployment-meta">
                <strong>ID:</strong> ${deployment.uid} | 
                <strong>Created:</strong> ${date} |
                <strong>Target:</strong> ${deployment.target || 'preview'}
            </div>
        `;
        
        item.addEventListener('click', () => selectDeployment(deployment, item));
        deploymentsList.appendChild(item);
    });
    
    deploymentsSection.classList.remove('hidden');
}

// Select a deployment
function selectDeployment(deployment, element) {
    selectedDeployment = deployment;
    
    // Update UI
    document.querySelectorAll('.deployment-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Show download section
    const date = new Date(deployment.created || deployment.createdAt).toLocaleString();
    selectedDeploymentDiv.innerHTML = `
        <div class="selected-info">
            <h3>${deployment.name || 'Unnamed Deployment'}</h3>
            <p><strong>URL:</strong> ${deployment.url ? `<a href="https://${deployment.url}" target="_blank">${deployment.url}</a>` : 'N/A'}</p>
            <p><strong>ID:</strong> ${deployment.uid}</p>
            <p><strong>State:</strong> ${deployment.state || deployment.readyState || 'UNKNOWN'}</p>
            <p><strong>Created:</strong> ${date}</p>
            <p><strong>Target:</strong> ${deployment.target || 'preview'}</p>
        </div>
    `;
    
    downloadSection.classList.remove('hidden');
    downloadProgress.classList.add('hidden');
    
    // Scroll to download section
    downloadSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Download deployment
downloadBtn.addEventListener('click', async () => {
    if (!selectedDeployment) {
        showError('Please select a deployment first');
        return;
    }

    const token = tokenInput.value.trim();
    
    downloadBtn.disabled = true;
    downloadProgress.classList.remove('hidden');
    downloadStatus.textContent = 'Fetching files and preparing download...';
    
    try {
        const requestBody = {
            token,
            deploymentId: selectedDeployment.uid,
        };

        if (teamIdInput.value.trim()) requestBody.teamId = teamIdInput.value.trim();
        if (slugInput.value.trim()) requestBody.slug = slugInput.value.trim();

        downloadStatus.textContent = 'Downloading files... This may take a while.';
        
        const response = await fetch(`${API_BASE}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to download deployment');
        }

        // Get the blob and download it
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedDeployment.uid}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        downloadStatus.textContent = '✅ Download complete!';
        
        setTimeout(() => {
            downloadProgress.classList.add('hidden');
            downloadBtn.disabled = false;
        }, 3000);
    } catch (error) {
        showError(error.message || 'Failed to download deployment. Please try again.');
        downloadProgress.classList.add('hidden');
        downloadBtn.disabled = false;
    }
});

// Helper functions
function getStatusClass(status) {
    if (!status) return '';
    status = status.toUpperCase();
    if (status === 'READY') return 'status-ready';
    if (status === 'BUILDING' || status === 'QUEUED') return 'status-building';
    if (status === 'ERROR' || status === 'CANCELED') return 'status-error';
    return '';
}

function showLoading() {
    loadingState.classList.remove('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
}

function showError(message) {
    errorState.textContent = `❌ ${message}`;
    errorState.classList.remove('hidden');
}

function hideError() {
    errorState.classList.add('hidden');
}

function hideDeployments() {
    deploymentsSection.classList.add('hidden');
}

function hideDownload() {
    downloadSection.classList.add('hidden');
}
