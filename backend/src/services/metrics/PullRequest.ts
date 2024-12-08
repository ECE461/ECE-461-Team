import axios from 'axios'; 
import { Logger } from '../../utils/Logger';
import { MetricManager } from './MetricManager';
import {URL} from 'url' 
import { hasUncaughtExceptionCaptureCallback } from 'process';
import { performance } from 'perf_hooks';



/**
 * @class
 * 
 * @private @method getEndpoint(): returnsrelevant API endpoint 
 * 
 * @private @method getDetails(): @returns {Promise<number>} lines changed from one pull request 
 * 
 * @private @method getPRChanges(): @returns {Promise <number | null>} returns total lines changed from pull requests
 * 
 * @private @method getTotalChanges(): @returns {Promise <number | null>} total lines changed on repo, or null for error
 * 
 * @public @method calculatePullRequest(): @returns {Promise <number | null>} fraction of code from pull requests, or null for error
 * 
*/

/**
 * @brief determine the number of closed pull requests made vs the number of pull requests with an accompanying code review. 
 *        for both existence of pull request and pull requests with code review. increment the number of commits tied with that pull request to add weight to certain pull requests that have had changes made
 *        
 *        (commits with code review) / (total commits from merged pr)
 */       
export class PullRequest{

    private repoOwner: string; 
    private repoName: string; 
    private prefix: string;
    private latency: number = 0;

    constructor (_repoOwner: string, _repoName: string){
        this.repoOwner = _repoOwner; 
        this.repoName = _repoName; 
        this.prefix = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/`;
    }

    
    private async getClosedPR(){

        try {
            const response = await axios.get(this.prefix + 'pulls?state=closed', {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}});
            return response;

        } catch (err: any) {
            throw err;
        }
    }


    private async getPRDetails(){
        try { 
            

        } catch (err: any) {
            throw err;
        }
    }
    /**
     * @return {Promise } : calculates pull request 
     */
    public async getPullRequest(): Promise<number>{
        try{

            let startTime = performance.now();
            
            //fetch the total number of closed pull requests
            let merged_pr = 0; 
            let rev_pr = 0; //merged pr with code review 

            let response = await axios.get(this.prefix + 'pulls?state=closed', {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}});

            let pr_details: Promise<any>[] = [];

            response.data.forEach((pr: any) => {
                pr_details.push(axios.get(pr.url, {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}}));
            });
            
           
            await Promise.allSettled(pr_details)
                .then(results => {
                    results.forEach((details : any) => {
                        let detail = details.value.data;
   
                        merged_pr = detail.merged_at ? merged_pr + detail.commits : merged_pr; 
                        rev_pr = detail.review_comments ? rev_pr + detail.commits: rev_pr; 

                        console.log(`merged_pr: ${merged_pr}, rev_pr: ${rev_pr}\n`);
                    });
                })
                .catch((err) => {
                    throw err;
                });
    

            this.latency = (performance.now() - startTime) / 1000;
            return rev_pr / merged_pr; 
            
        } catch(Error){
            Logger.logDebug(Error);
        }

        return 0;
    }

    /**
   * getLatency returns the latency of the pull request metric
   * 
   * @returns the latency of the pull request metric
   */
  public getLatency(): number {
    return this.latency;
  }

};
