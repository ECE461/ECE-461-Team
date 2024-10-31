import { Command } from 'commander';
import { URL } from 'url';
import { MetricManager } from './MetricManager';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export class CLIParser {
    private program: Command;

    constructor() {
        this.program = new Command();
        this.configureProgram();
    }

    private configureProgram() {
        this.program
            .name('CLIParser')
            .description('CLI program to parse URL and output measured metrics')
            .version('0.0.1');

        this.program
            .arguments('<url>')
            .description('CLI program takes in URL of a package and outputs measured metrics')
            .action(async (urlString: string) => {
                await this.handleAction(urlString);
            });
    }

    public async run(argv: string[]) {
        await this.program.parseAsync(argv);
    }

    private async handleAction(urlString: string) {
        try {
            const isTokenValid = await this.checkGitHubToken(process.env.GITHUB_TOKEN);
            if (!isTokenValid) {
                console.error('Invalid GitHub token');
                process.exit(1);
            }

            // Sanitize the URL to prevent command injection
            const sanitized_urlString = this.sanitizeGitUrl(urlString);
            const repoLink = await this.getRepoLink(sanitized_urlString);
            if (!repoLink) {
                console.error('Invalid URL:', urlString);
                process.exit(1);
            }

            // Parse the URL
            const parsedUrl = new URL(repoLink);

            // Extract owner and repository name and get metrics
            let Metrics = new MetricManager(parsedUrl.pathname);
            const metrics = await Metrics.getMetrics();

            const result = {
                URL: repoLink,
                NetScore: metrics.netScore,
                NetScore_Latency: metrics.netLatency,
                RampUp: metrics.rampUpValue,
                RampUp_Latency: metrics.rampUpLatency,
                Correctness: metrics.correctnessValue,
                Correctness_Latency: metrics.correctnessLatency,
                BusFactor: metrics.busFactorValue,
                BusFactor_Latency: metrics.busFactorLatency,
                ResponsiveMaintainer: metrics.maintainerValue,
                ResponsiveMaintainer_Latency: metrics.maintainerLatency,
                License: metrics.licenseValue,
                License_Latency: metrics.licenseLatency,
                PullRequest: metrics.pullRequestValue, 
                PullRequest_Latency: metrics.pullRequestLatency
            };
            console.log(JSON.stringify(result));
        } catch (error) {
            console.error('Invalid URL:', (error as Error).message);
            process.exit(1);
        }
    }

    public async checkGitHubToken(token: string | undefined): Promise<boolean> {
        if (!token) {
            return false;
        }

        try {
            const response = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${token}`
                }
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    public sanitizeGitUrl(url: string): string {
        return url.replace(/[;`<>]/g, '');
    }

    public async getRepoLink(url: string): Promise<string | null> {
        const npmRegex = /^https?:\/\/(www\.)?npmjs\.com\/package\/([^\/]+)$/;
        const githubRegex = /^https?:\/\/(www\.)?github\.com\/([^\/]+\/[^\/]+)$/;

        if (githubRegex.test(url)) {
            return url;
        } else if (npmRegex.test(url)) {
            const match = url.match(npmRegex);
            if (match) {
                const packageName = match[2];
                const npmApiUrl = `https://registry.npmjs.org/${packageName}`;
                try {
                    const response = await axios.get(npmApiUrl, {
                        headers: {
                            Authorization: `token ${process.env.GITHUB_TOKEN}`
                        }
                    });
                    const repoUrl = response.data.repository?.url;
                    if (repoUrl) {
                        // Convert git+https URLs to https URLs
                        const sanitizedRepoUrl = repoUrl.replace(/^git\+/, '');
                        if (sanitizedRepoUrl.endsWith('.git')) {
                            return sanitizedRepoUrl.slice(0, -4);
                        }
                        return sanitizedRepoUrl;
                    } else {
                        console.error('No repository found for npm package:', packageName);
                    }
                } catch (error) {
                    console.error('Error fetching npm package information:', error);
                }
            }
        } else {
            console.error('Invalid URL:', url);
        }
        return null;
    }
}

// If this file is run directly, execute the CLI
if (require.main === module) {
    const cliParser = new CLIParser();
    cliParser.run(process.argv);
}