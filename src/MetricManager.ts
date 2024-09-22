// takes info from API and outputs metrics
import { busFactor } from "./busFactor";
import { maintainer } from "./maintainer";
import { rampUp } from "./rampUp";
import { license } from "./findLicense";
import { correctness } from "./correctness";
import * as dotenv from 'dotenv';
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
    async getMetrics() : Promise<string> {
        
        
        // get the bus factor
        let busFactorMetric = new busFactor(this.owner, this.repoName);
        let busFactorValue = await busFactorMetric.calculateBusFactor();

        let rampUpMetric = new rampUp(this.owner, this.repoName);
        let rampUpValue = await rampUpMetric.getRepoStats();

        let licenseMetric = new license(this.owner, this.repoName)
        let exists = await licenseMetric.getRepoLicense();
        
        let maintainerMetric = new maintainer(this.owner, this.repoName);
        let maintainerValue = await maintainerMetric.getMaintainerScore();

        let correctnessMetric = new correctness(this.owner, this.repoName);
        let correctnessValue = await correctnessMetric.getCorrectnessScore();
        console.log(`The Correctness Score is: ${correctnessValue}`);

        //console.log(busFactorValue);
        return '\nContributors: ' + busFactorValue + 
        '\n ' + 'Repo Stats: ' + rampUpValue
        + '\n ' + 'License: ' + exists
        + '\n ' + 'Maintainer: ' + maintainerValue;
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
