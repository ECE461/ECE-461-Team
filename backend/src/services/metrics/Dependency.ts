import axios from 'axios';
import { Logger } from '../../utils/Logger';

// GitHub API Base URL
const GITHUB_API_URL = 'https://api.github.com';

// Define the structure of the Dependency Metric
export class DependencyMetric {
    private packages: Record<string, any>;

    constructor() {
        this.packages = {};
    }

    addPackage(packageName: string, version: string, dependencies: Array<[string, string]>, pullRequestFraction: number): void {
        this.packages[`${packageName}@${version}`] = {
            dependencies,
            pinnedCount: 0,
            totalDependencies: dependencies.length,
            pullRequestFraction,
            score: 0.0
        };
        this.updatePinnedCount(packageName, version);
        this.calculateScore(packageName, version);
    }

    private updatePinnedCount(packageName: string, version: string): void {
        const packageInfo = this.packages[`${packageName}@${version}`];
        const pinnedCount = packageInfo.dependencies.reduce((count: number, [_, version]: [string, string]) => {
            return count + (this.isPinned(version) ? 1 : 0);
        }, 0);
        packageInfo.pinnedCount = pinnedCount;
    }

    private isPinned(version: string): boolean {
        // Consider a version pinned if it's not using '~' or '^'
        return !version.startsWith('~') && !version.startsWith('^');
    }

    getPinnedFraction(packageName: string, version: string): number {
        const packageInfo = this.packages[`${packageName}@${version}`];
        if (!packageInfo || packageInfo.totalDependencies === 0) {
            return 1.0; // No dependencies, give perfect score
        }
        return packageInfo.pinnedCount / packageInfo.totalDependencies;
    }

    private calculateScore(packageName: string, version: string): void {
        const packageInfo = this.packages[`${packageName}@${version}`];
        const pinnedFraction = this.getPinnedFraction(packageName, version);
        const prFraction = packageInfo.pullRequestFraction;

        // Example weighting: 60% for pinned dependencies, 40% for pull request fraction
        const finalScore = 0.6 * pinnedFraction + 0.4 * prFraction;
        packageInfo.score = finalScore;
    }

    getPackageScore(packageName: string, version: string): number {
        const packageInfo = this.packages[`${packageName}@${version}`];
        return packageInfo?.score || 0.0;
    }
}

// Fetch package.json from GitHub repository using API
export async function getPackageJson(repoOwner: string, repoName: string): Promise<any> {
    try {
        const url = `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/contents/package.json`;
        const response = await axios.get(url, {
            headers: { 'Accept': 'application/vnd.github.v3.raw', Authorization: `token ${process.env.GITHUB_TOKEN}` },
        });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            Logger.logError("Failed to retreive package.json", error.message);
        } else {
            Logger.logError("An unknown error occurred", error);
        }
    }
}

// Fetch pull request data and calculate the fraction of code introduced via pull requests
export async function getPullRequestFraction(repoOwner: string, repoName: string): Promise<number> {
    try {
        const url = `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/pulls?state=all`;
        const response = await axios.get(url, { headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
        }});
        const pulls = response.data;
        let totalCommits = 0;
        let prCommits = 0;

        for (const pr of pulls) {
            const commitsResponse = await axios.get(pr.commits_url, { headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`
            }});
            const commits = commitsResponse.data;
            prCommits += commits.length;
            totalCommits += commits.length;
        }

        return totalCommits > 0 ? prCommits / totalCommits : 0.0;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            Logger.logDebug(`Failed to fetch pull request data: ${error.response?.status}`);
        } else if (error instanceof Error) {
            Logger.logDebug(`Failed to fetch pull request data: ${error.message}`);
        } else {
            Logger.logDebug("An unknown error occurred");
        }
        return 0.0; // Explicitly return a default value in case of an error
    }
}

// Process a GitHub repository, extract dependencies, and calculate scores
export async function processPackages(repoOwner: string, repoName: string, matrix: DependencyMetric): Promise<void> {
    try {
        // Fetch package.json metadata
        const packageMetadata = await getPackageJson(repoOwner, repoName);
        const packageName = packageMetadata.name;
        const version = packageMetadata.version;
        const dependencies = Object.entries(packageMetadata.dependencies || {});

        // Fetch the pull request fraction
        const pullRequestFraction = await getPullRequestFraction(repoOwner, repoName);

        // Add package and calculate scores
        matrix.addPackage(packageName, version, dependencies as Array<[string, string]>, pullRequestFraction);
        const score = matrix.getPackageScore(packageName, version);
    } catch (error) {
        if (error instanceof Error) {
            Logger.logDebug(`Failed to process package ${repoOwner}/${repoName}: ${error.message}`);
        } else {
            Logger.logDebug("An unknown error occurred");
        }
    }
}
