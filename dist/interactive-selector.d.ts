import type { Deployment } from './types.js';
interface SelectionResult {
    deployment: Deployment;
    index: number;
}
export declare function selectDeployment(deployments: Deployment[]): Promise<SelectionResult | null>;
export {};
//# sourceMappingURL=interactive-selector.d.ts.map