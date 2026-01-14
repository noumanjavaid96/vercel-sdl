//! Provides arrow-key navigation through deployment lists.
//! We use the prompts library to create an interactive terminal UI where users
//! can browse deployments before choosing one. This is better than showing a numbered
//! list and asking for input - users can see full details while navigating.
import prompts from 'prompts';
import { formatDeployment } from './formatter.js';
/// Shows an interactive selector for choosing a deployment.
/// The description field contains the full formatted deployment info, so users see
/// complete details while navigating with arrow keys. This avoids the back-and-forth
/// of "show list -> pick number -> show details" that most CLIs do.
export async function selectDeployment(deployments) {
    if (deployments.length === 0) {
        console.log('\nNo deployments found.\n');
        return null;
    }
    const choices = deployments.map((deployment, index) => {
        const state = deployment.state || deployment.readyState || 'UNKNOWN';
        const target = deployment.target ? ` - ${deployment.target}` : '';
        const createdDate = deployment.created
            ? new Date(deployment.created).toLocaleString()
            : 'N/A';
        return {
            title: `[${state}] ${deployment.name}${target} (${createdDate})`,
            description: formatDeployment(deployment, index),
            value: index,
        };
    });
    const response = await prompts({
        type: 'select',
        name: 'deploymentIndex',
        message: `Select a deployment (${deployments.length} found):`,
        choices,
        hint: 'Use arrow keys to navigate, Enter to select, Ctrl+C to cancel',
    }, {
        onCancel: () => {
            console.log('\n\nSelection cancelled.\n');
            process.exit(0);
        },
    });
    if (response.deploymentIndex === undefined) {
        return null;
    }
    return {
        deployment: deployments[response.deploymentIndex],
        index: response.deploymentIndex,
    };
}
//# sourceMappingURL=interactive-selector.js.map