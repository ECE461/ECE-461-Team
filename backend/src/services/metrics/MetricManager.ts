// takes info from API and outputs metrics
import { BusFactor } from "./BusFactor";
import { Maintainer } from "./Maintainer";
import { RampUp } from "./RampUp";
import { License } from "./License";
import { Correctness } from "./Correctness";
import { PullRequest } from "./PullRequest"; 
import * as dotenv from 'dotenv';
import { performance } from 'perf_hooks';
import { URLHandler } from "../../utils/URLHandler";
import { DependencyMetric, processPackages, getPackageJson } from "./Dependency";
import { Logger } from "../../utils/Logger";
dotenv.config();



export class MetricManager {
    public urlHandler: URLHandler | null = null;
    private owner: string = "";
    private repoName: string = "";

    /**
     * constructs a metrics manager for a GitHub repository
     * 
     * @param path the path from the URL of the GitHub repository
     */
    private constructor() {
    }

    static async create(path: string) : Promise<MetricManager> {
        const metricManagerInstance = new MetricManager();
        const urlHandlerInstance = await URLHandler.create(path);
        
        metricManagerInstance.urlHandler = urlHandlerInstance;
        // sets the owner and repository name
        metricManagerInstance.owner = metricManagerInstance.urlHandler.getOwnerName();
        metricManagerInstance.repoName = metricManagerInstance.urlHandler.getRepoName();

        return metricManagerInstance; 
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
        pullRequestLatency: number,
        dependencyValue: number,
        dependencyLatency: number
    }> {
        // TODO: Add the pull request and dependency metrics

        // Create the metric classes
        let busFactorMetric = new BusFactor(this.owner, this.repoName);
        let rampUpMetric = new RampUp(this.owner, this.repoName);
        let licenseMetric = new License(this.owner, this.repoName);
        let maintainerMetric = new Maintainer(this.owner, this.repoName);
        let correctnessMetric = new Correctness(this.owner, this.repoName);
        let pullRequestMetric = new PullRequest(this.owner, this.repoName);
        let dependencyMetric = new DependencyMetric()
        
        let NetStartTime = performance.now();

        // Calculate the metrics
        const metricResults = await Promise.allSettled([busFactorMetric.calculateBusFactor(), 
                                                        rampUpMetric.getRampUpScore(), 
                                                        licenseMetric.getRepoLicense(), 
                                                        maintainerMetric.getMaintainerScore(), 
                                                        correctnessMetric.getCorrectnessScore(), 
                                                        pullRequestMetric.getPullRequest()]);
        const metricScores = metricResults.map((result) => {
            if(result.status === 'fulfilled') {
                return (result as PromiseFulfilledResult<number>).value; // Get the fulfilled value
            }
            else {
                return 0; // Set the value to 0 if the promise was rejected
            }
        });

        let netLatency = (performance.now() - NetStartTime) / 1000;

        // Divide the metric scores into their respective variables (for readability)
        let busFactorValue = metricScores[0];
        let rampUpValue = metricScores[1];
        let licenseValue = metricScores[2];
        let maintainerValue = metricScores[3];
        let correctnessValue = metricScores[4];
        let pullRequestValue = metricScores[5];
    

        let busFactorLatency = busFactorMetric.getLatency();
        let rampUpLatency = rampUpMetric.getLatency();
        let licenseLatency = licenseMetric.getLatency();
        let maintainerLatency = maintainerMetric.getLatency();
        let correctnessLatency = correctnessMetric.getLatency();
        let pullRequestLatency = pullRequestMetric.getLatency();
        
        let startTime = performance.now()
        await processPackages(this.owner, this.repoName, dependencyMetric);
        const packageMetadata = await getPackageJson(this.owner, this.repoName);
        const packageName = packageMetadata.name;
        const version = packageMetadata.version;
        let dependencyValue = dependencyMetric.getPackageScore(packageName, version);
        let dependencyLatency = (performance.now() - startTime) / 1000;
        netLatency += dependencyLatency;

        // Calculate the net score
        let netScore = (0.25*busFactorValue + 0.15*correctnessValue + 0.15*rampUpValue + 0.2*maintainerValue + 0.15*pullRequestValue + 0.1*dependencyValue) * licenseValue;

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
            pullRequestLatency: parseFloat(pullRequestLatency.toFixed(3)),
            dependencyValue: parseFloat(dependencyValue.toFixed(3)),
            dependencyLatency: parseFloat(dependencyLatency.toFixed(3))
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

