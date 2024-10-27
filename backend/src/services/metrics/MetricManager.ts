// takes info from API and outputs metrics
import { BusFactor } from "./BusFactor";
import { Maintainer } from "./Maintainer";
import { RampUp } from "./RampUp";
import { License } from "./License";
import { Correctness } from "./Correctness";
import { PullRequest } from "./PullRequest"; 
import * as dotenv from 'dotenv';
import { performance } from 'perf_hooks';
dotenv.config();



export class MetricManager {
    private owner: string;
    private repoName: string;
    /**
     * constructs a metrics manager for a GitHub repository
     * 
     * @param path the path from the URL of the GitHub repository
     */
    constructor(path: string) {

        // extracts owner and repository name from the URL
        let pathParts = path.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
            this.owner = pathParts[0];
            this.repoName = pathParts[1];
        } else {
            throw new Error('Invalid GitHub repository URL');
        }
    }

    /**
     * get metrics calls all the metric classes and returns the net score of the package
     * 
     * @returns the net score of the package
     */
    async getMetrics() : Promise<{
        netScore: number,
        netLatency: number,
        rampUpValue: number,
        rampUpLatency: number,
        correctnessValue: number,
        correctnessLatency: number,
        busFactorValue: number,
        busFactorLatency: number,
        maintainerValue: number,
        maintainerLatency: number,
        licenseValue: number,
        licenseLatency: number
        pullRequestValue: number, 
        pullRequestLatency: number
    }> {
        // TODO: Need to calculate in parrallel
        let NetStartTime = performance.now();
        let startTime = performance.now();
        let busFactorMetric = new BusFactor(this.owner, this.repoName);
        let busFactorValue = await busFactorMetric.calculateBusFactor();
        let busFactorLatency = (performance.now() - startTime) / 1000;

        startTime = performance.now();
        let rampUpMetric = new RampUp(this.owner, this.repoName);
        let rampUpValue = await rampUpMetric.getRampUpScore();
        let rampUpLatency = (performance.now() - startTime) / 1000;

        startTime = performance.now();
        let licenseMetric = new License(this.owner, this.repoName)
        let licenseValue = await licenseMetric.getRepoLicense();
        let licenseLatency = (performance.now() - startTime) / 1000;

        startTime = performance.now();
        let maintainerMetric = new Maintainer(this.owner, this.repoName);
        let maintainerValue = await maintainerMetric.getMaintainerScore();
        let maintainerLatency = (performance.now() - startTime) / 1000;

        startTime = performance.now();
        let correctnessMetric = new Correctness(this.owner, this.repoName);
        let correctnessValue = await correctnessMetric.getCorrectnessScore();
        let correctnessLatency = (performance.now() - startTime) / 1000;

        startTime = performance.now(); 
        let pullRequestMetric = new PullRequest(this.owner, this.repoName); 
        let pullRequestValue = await pullRequestMetric.getPullRequest(); 
        let pullRequestLatency = (performance.now() - startTime);
        //console.log(`The Correctness Score is: ${correctnessValue}`);

        // Calculate the net score
        // (0.3 * busFactor + 0.2 * correctness + 0.2 * rampup + 0.3 * maintainer) * license

        let netScore = (0.3 * busFactorValue + 0.2 * correctnessValue + 0.2 * rampUpValue + 0.3 * maintainerValue) * licenseValue;
        let netLatency = (performance.now() - NetStartTime) / 1000;
        //console.log(busFactorValue);
        // parseFloat(score.toFixed(3));

        return {
            netScore: parseFloat(netScore.toFixed(3)),
            netLatency: parseFloat(netLatency.toFixed(3)),
            rampUpValue: parseFloat(rampUpValue.toFixed(3)),
            rampUpLatency: parseFloat(rampUpLatency.toFixed(3)),
            correctnessValue: parseFloat(correctnessValue.toFixed(3)),
            correctnessLatency: parseFloat(correctnessLatency.toFixed(3)),
            busFactorValue: parseFloat(busFactorValue.toFixed(3)),
            busFactorLatency: parseFloat(busFactorLatency.toFixed(3)),
            maintainerValue: parseFloat(maintainerValue.toFixed(3)),
            maintainerLatency: parseFloat(maintainerLatency.toFixed(3)),
            licenseValue: parseFloat(licenseValue.toFixed(3)),
            licenseLatency: parseFloat(licenseLatency.toFixed(3)),
            pullRequestValue: parseFloat(pullRequestValue.toFixed(3)), 
            pullRequestLatency: parseFloat(pullRequestLatency.toFixed(3))
        };


        // return 
        // URL: ${this.owner}/${this.repoName}
        // busFactorValue: ${parseFloat(busFactorValue.toFixed(3))} (Latency: ${busFactorLatency.toFixed(3)} s)
        // rampUpValue: ${parseFloat(rampUpValue.toFixed(3))} (Latency: ${rampUpLatency.toFixed(3)} s)
        // licenseValue: ${parseFloat(licenseValue.toFixed(3))} (Latency: ${licenseLatency.toFixed(3)} s)
        // maintainerValue: ${parseFloat(maintainerValue.toFixed(3))} (Latency: ${maintainerLatency.toFixed(3)} s)
        // correctnessValue: ${parseFloat(correctnessValue.toFixed(3))} (Latency: ${correctnessLatency.toFixed(3)} s)
        // Net Score: ${parseFloat(netScore.toFixed(3))} (Latency: ${netLatency.toFixed(3)} s)
        // `;

        // return '\nbusFactorValue: ' + parseFloat(busFactorValue.toFixed(3)) + 
        // '\n ' + 'rampUpValue: ' + parseFloat(rampUpValue.toFixed(3))
        // + '\n ' + 'liscenseValue: ' + parseFloat(licenseValue.toFixed(3))
        // + '\n ' + 'maintainerValue: ' + parseFloat(maintainerValue.toFixed(3))
        // + '\n ' + 'correctnessValue: ' + parseFloat(correctnessValue.toFixed(3))
        // + '\n ' + 'Net Score: ' + parseFloat(netScore.toFixed(3));
    }

    /**
     * getOwnwer returns the bus factor of the package
     * 
     * @returns the Owner of the package
     */
    getOwner() : string {
        return this.owner;
    }

    /**
     * getRepoName returns the repository name
     * 
     * @returns the repository name
     */
    getRepoName() : string {
        return this.repoName;
    }
}

