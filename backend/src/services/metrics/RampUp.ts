import axios from 'axios';

export class RampUp {
    private repoOwner: string;
    private repoName: string;
    private latency: number = 0;
    private static readonly MAX_FILE_COUNT = 1000;
    //private static readonly MAX_LINE_COUNT = 100000;
    private static readonly MAX_DEPENDENCIES_COUNT = 100;
    private static readonly MAX_SIZE = 10000000; // in KB
    //private static readonly MAX_STARGAZERS_COUNT = 10000;
    //private static readonly MAX_FORKS_COUNT = 10000;

    constructor(repoOwner: string, repoName: string) {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
    }

    public async getRampUpScore(): Promise<number> {
        try {
            let startTime = performance.now();
            const response = await axios.get(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}`, {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`
                }
            });
            const { size, stargazers_count, forks_count } = response.data;

            const fileCount = await this.getFileCount();
            //const lineCount = await this.getLineCount();
            const dependenciesCount = await this.getDependenciesCount();

           /*  console.log('Repository Stats:', {
                fileCount,
                //lineCount,
                dependenciesCount,
                size,
                //stargazers_count,
                //forks_count
            }); */

            const score = this.calculateScore({
                fileCount,
                //lineCount,
                dependenciesCount,
                size
                //stargazers_count,
                //forks_count
            });

            this.latency = (performance.now() - startTime) / 1000;

            return parseFloat(score.toFixed(3));

        } catch (error) {
            console.error('RAMPUP -> Error fetching repository stats:', error);
            return 0; // Return 0 in case of an error
        }
    }

    private async getFileCount(): Promise<number> {
        // Implement logic to count files in the repository
        const response = await axios.get(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`
            }
        });
        return response.data.length;
    }
/*
    private async getLineCount(): Promise<number> { // SCRAPED
        // Implement logic to count lines of code in the repository
        const response = await axios.get(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/trees/master?recursive=1`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`
            }
        });
        const tree = response.data.tree;
        let lineCount = 0;

        for (const file of tree) {
            if (file.type === 'blob') {
            const fileResponse = await axios.get(file.url, {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`
                }
            });
            lineCount += fileResponse.data.content.split('\n').length;
            }
        }

        return lineCount;
    }
*/
    private async getDependenciesCount(): Promise<number> {
        // Implement logic to count dependencies in the repository
        try {
            const response = await axios.get(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/package.json`, {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`
                }
            });
            const packageJson = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
            const dependencies = packageJson.dependencies || {};

            return Object.keys(dependencies).length;
        } catch (error) {
            console.error('getDependenciesCount -> Error fetching dependencies count:', error);
            return 0; // Return undefined in case of an error
        }
    }

    private calculateScore(stats: {
        fileCount: number;
        //lineCount: number;
        dependenciesCount: number;
        size: number;
        //stargazers_count: number;
        //forks_count: number;
    }): number {
        const {
            fileCount,
            //lineCount,
            dependenciesCount,
            size
            //stargazers_count,
            //forks_count
        } = stats;

        const fileCountScore = 1 - Math.min(fileCount / RampUp.MAX_FILE_COUNT, 1);
        //const lineCountScore = 1 - Math.min(lineCount / RampUp.MAX_LINE_COUNT, 1);
        //const dependenciesCountScore = dependenciesCount !== undefined ? 1 - Math.min(dependenciesCount / RampUp.MAX_DEPENDENCIES_COUNT, 1) : 0;
        const dependenciesCountScore = 1 - Math.min(dependenciesCount / RampUp.MAX_DEPENDENCIES_COUNT, 1);
        const sizeScore = 1 - Math.min(size / RampUp.MAX_SIZE, 1);
        //const stargazersCountScore = Math.min(stargazers_count / RampUp.MAX_STARGAZERS_COUNT, 1);
        //const forksCountScore = Math.min(forks_count / RampUp.MAX_FORKS_COUNT, 1);

        //const totalScore = (fileCountScore + lineCountScore + dependenciesCountScore + sizeScore + stargazersCountScore + forksCountScore) / 6;
        //const totalScore = (fileCountScore + lineCountScore + dependenciesCountScore + sizeScore) / 4;
        const totalScore = (fileCountScore + dependenciesCountScore + sizeScore) / 3;

        return totalScore;
    }

    public getLatency(): number {
        return this.latency;
    }

}