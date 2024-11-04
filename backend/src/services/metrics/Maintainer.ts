import axios from "axios";
import * as dotenv from 'dotenv';

dotenv.config();
const GITHUB_API = 'https://api.github.com'

export class Maintainer {
    private owner: string;
    private repoName: string;
    private latency: number = 0;

    /**
     * constructs a metrics manager for a GitHub repository
     * 
     * @param owner the owner of the repository
     * @param repoName the name of the repository
     */
    constructor(owner: string, repoName: string) {
        this.owner = owner;
        this.repoName = repoName;
    }

    /**
     * Calculates the maintainer score of the repository
     * 
     * @returns the maintainer score
     */
    public async getMaintainerScore(): Promise<number> {
        let startTime = performance.now();

        // get the date of last commit
        const lastCommitDateStr = await this.getLastCommit();
        const lastCommitDate = new Date(lastCommitDateStr);
        const todayDate = new Date();

        // calculate difference in days between the last commit and today
        const dateDiff = Math.abs(todayDate.getTime() - lastCommitDate.getTime());
        const daysDiff = Math.ceil(dateDiff / (1000 * 3600 * 24));
        //console.log('Days Diff: ', daysDiff);

        // find open to total issue ratio
        const openIssueRatio = await this.getOpenIssueRatioCount();
        //console.log("Open Issue Ratio: ", openIssueRatio);

        // calculate score (0-1) based on how long ago last commit was & open to total issue ratio
        let score = 0;
        if (daysDiff < 73 && openIssueRatio < 0.02) {
            score = 1.000;
        }
        else if (daysDiff < 146 && openIssueRatio < 0.04) {
            score = 0.800;
        }
        else if (daysDiff < 219 && openIssueRatio < 0.06) {
            score = 0.600;
        }
        else if (daysDiff < 292 && openIssueRatio < 0.08) {
            score = 0.400;
        }
        else if (daysDiff < 365 && openIssueRatio < 0.1) {
            score = 0.200;
        }
        else {
            score = 0.000;
        }

        this.latency = (performance.now() - startTime) / 1000;
        return parseFloat(score.toFixed(3));
    }

    /**
     * Fetches the open issue count of the repository
     * 
     * @returns the open issue count
     */
    private async getOpenIssueRatioCount(): Promise<number> {
        const url = `${GITHUB_API}/repos/${this.owner}/${this.repoName}`;
        const closedUrl = `${GITHUB_API}/repos/${this.owner}/${this.repoName}/issues`;
        try {
            const response = await axios.get(url,
                {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                }
            );
            const openIssues = response.data.open_issues_count; // this number includes open pull requests
            //console.log('Open Issue Count: ', openIssues);
            
            const closedResponse = await axios.get(closedUrl,
                {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                }
            );
            var closedIssues = 0;
            if(closedResponse.data[0] != undefined) {
                closedIssues = closedResponse.data[0].number; // this number also includes pull requests
                //console.log('Closed Issue Count: ', closedIssues);
            }

            // console.log('Open Issue Count: ', openIssues);
            // console.log('Closed Issue Count: ', closedIssues);
            if (closedIssues + openIssues === 0) {
                return 0;
            }
            else if (closedIssues === undefined) {
                return openIssues;
            }
            const ratio = openIssues / (openIssues + closedIssues);
            return ratio;
        } catch (error) {
            console.error('Error when fetching open issue ratio count: ', (error as any).message);
            throw new Error('Error when fetching open issue ratio count');
        }
    }

    /**
     * Fetches the last commit date of the repository
     * 
     * @returns the date of the last commit
     */
    private async getLastCommit(): Promise<string> {
        const url = `${GITHUB_API}/repos/${this.owner}/${this.repoName}/commits`;
        try {
            const response = await axios.get(url,
                {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                }
            );
            const lastCommit = response.data[0];
            // console.log('Last Commit Data: ', lastCommit.commit.author.date);
            return lastCommit.commit.author.date;
        } catch (error) {
            console.error('Error when fetching last commit data: ', (error as any).message);
            throw new Error('Error when fetching last commit data');
        }
    }

    async correctnessChecker() {
        console.log('Correctness Checker:');
        console.log('Maintainer Score: ', await this.getMaintainerScore());
    }

    /**
     * Returns the latency of the metric
     * 
     * @returns the latency of the metric
     */
    public getLatency(): number {
        return this.latency;
    }

}

// Testing

// test repo 1 (N/A)
// const maintainerChecker = new Maintainer('hasansultan92', 'watch.js'); // score is 0.4 (0 open issues)

// test repo 2 (should have high score)
// const maintainerChecker = new Maintainer('mrdoob', 'three.js'); //score is 1 (ratio is 0.0175)

// test repo 3 (should have medium score)
// const maintainerChecker = new Maintainer('socketio', 'socket.io'); // score is 0.8 (ratio is 0.0333)

// test repo 4 (N/A)
// const maintainerChecker = new Maintainer('prathameshnetake', 'libvlc'); // score is 0 (0 open issues)

// test repo 5 (should have high score)
// const maintainerChecker = new Maintainer('facebook', 'react'); // score is 0.8 (ratio is 0.0255)

// test repo 6 (N/A)
// const maintainerChecker = new Maintainer('ryanve', 'unlicensed'); // score is 0 (0 open issues)

// uncomment this to run test
// maintainerChecker.correctnessChecker();