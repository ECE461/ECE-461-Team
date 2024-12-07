import axios from 'axios';
import { Logger } from '../../utils/Logger';

export class BusFactor {
    private repoOwner: string;
    private repoName: string;
    private latency: number = 0;

    constructor(repoOwner: string, repoName: string) {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
    }

    public async calculateBusFactor(): Promise<number> {
        let startTime = performance.now();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/commits?since=${twoYearsAgo.toISOString()}`;
        try {
            const response = await axios.get(url,
                {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                }
            );
            const contributors = new Set<string>();
            // Extract the author name from each commit
            response.data.forEach((commit: any) => {
                contributors.add(commit.commit.author.name);
            });
            //return Array.from(contributors);
            const numberOfContributors = contributors.size;
            const score = this.calculateBusFactorScore(numberOfContributors);
            this.latency = (performance.now() - startTime) / 1000;
            
            return parseFloat(score.toFixed(3));

        } catch (error) {
            Logger.logError('BusFactor -> Error fetching commits:', (error as any).message);
            process.exit(1);
        }
    }

    private calculateBusFactorScore(contributors: number): number {
        // Calculate the bus factor score based on the number of contributors
        let score = 0;
        if (contributors >= 10) {
            score = 1;
        }
        else if (contributors >= 5) {
            score = 0.500;
        }
        else if (contributors >= 2) {
            score = 0.300;
        }
        else if (contributors >= 1) {
            score = 0.100;
        }
        else {
            score = 0.000;
        }

        return parseFloat(score.toFixed(3));
    }

    public getLatency(): number {
        return this.latency;
    }

}