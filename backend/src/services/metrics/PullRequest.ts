import axios from 'axios'; 


import { Logger } from '../../utils/Logger';
import { MetricManager } from './MetricManager';
import {URL} from 'url' 
import { log } from 'console';
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

export class PullRequest{

    private repoOwner: string; 
    private repoName: string; 
    private latency: number = 0;

    constructor (_repoOwner: string, _repoName: string){
        this.repoOwner = _repoOwner; 
        this.repoName = _repoName; 
    }


    /**
     * 
     * @param type
     * @param {optional} pr_number 
     * @returns github endpoint for all pull requests, or for a certain number pull request see @example
     *
     * @example
     * getEndpoint('all'); all pull requests
     * getEndpoint('total lines'); api endpoint to parse through line changes
     * getEndpoint('number', {n}); where n is any pull request, returns details of pull request #n
     * 
     */
    private getEndpoint(type: string, pr_number?: number): string{
        const prefix = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/`;

        if (type == 'all'){
            return prefix + 'pulls?state=all';
        }
        else if(type == 'total lines'){
            return prefix + 'stats/contributors'
        }
        else if (type == 'number' && pr_number){
            return prefix + `pulls/${pr_number}`;
        }
        else{
            return ' ';
        }
    }


    /**
     * @param pr_number
     * @return {Promise<number>}: number of lines changed from a certain pull request
     */
    private async getDetails(pr_number: number, arr: [number | null, number | null]): Promise<void>{

        try{
            
            if (arr[0] == null || arr[1] == null){
                throw new Error('getDetails(): your array values are null')
            }

            const response = await axios.get(this.getEndpoint('number', pr_number), {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}});
            const data = response.data; 
           
            //check to see if code review exists 
            const response2 = await axios.get(this.getEndpoint('number', pr_number) + '/reviews', {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}});
            const review = response2.data; 

            // console.log(`is data merged for #${pr_number}? ${data.merged}\nis there a code review? ${review.length ? 'yes' : 'no'}`);
            //only count line contribution if the pull request has been merged and if a code review exists 
            if(data.merged && review.length){
                arr[0] += data.additions; 
                arr[1] += data.deletions;
                return;
            }

        } catch(Error){
            Logger.logDebug(Error); 
        }
    }
    
    
    private async getPRChanges(): Promise<[number | null, number | null]>{

        try{
            
            let line_changes: [number, number] = [0, 0]; 
            let page_number: number = 1; 
            // let next_page_exists: any; 

            // do{
                //this endpoint only provides nth pull request
                const response = await axios.get(this.getEndpoint('all') + `&per_page=25&page=${page_number++}`, {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}});
                const data = response.data;
                
                //obtain details (line changes) of every pull request number
                for(const pull_request of data){
                    await this.getDetails(pull_request.number, line_changes);
                }

            //     //check the "next" page, the one that has been incremented before you decide to iterate through the loop. hence for 'N' number of pages, function will make N + 1 API Calls
            //     //? what about rate limiting here 
            //     const check = await axios.get(this.getEndpoint('all') + `&per_page=100&page=${page_number}`, {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}})
            //     next_page_exists = check.data.length;

            // } while(next_page_exists)
        
            return line_changes; 

        }catch(Error){
                
            Logger.logDebug(Error);
        }

        return [null, null];
    }


    /**
     * 
     * @returns total @number of lines changed 
     */
    private async getTotalChanges(): Promise<[number | null, number | null]>{
        
        try{
            
            const response = await axios.get(this.getEndpoint('total lines'), {headers: {'Authorization': `token ${process.env.GITHUB_TOKEN}`}})
            const data = response.data; 
            
            let add: number = 0; 
            let del: number = 0; 

            for (const contributor of data){
                for(const week of contributor.weeks){
                    add += week.a; 
                    del += week.d;
                }
            }

            return [add, del];

        } catch(Error){
            Logger.logDebug(Error); 
        }
        
        return [null, null];
    }

    

    /**
     * @return {Promise } : calculates pull request 
     */
    public async getPullRequest(): Promise<number>{
        try{
            let startTime = performance.now();

            //remember that each of these functions return [add, deleted]
            const values = await Promise.all([this.getPRChanges(), this.getTotalChanges()]);

            //assign to values to make operations easier to read and write
            const pr_changes = values[0]; 
            const total_changes = values[1]; 

            //arr.includes(null) still throws an error
            if(pr_changes[0] == null || pr_changes[1] == null || total_changes[0] == null || total_changes[1] == null){
                throw new Error("calculatePullRequest(): error fetching pull request changes and/or total changes. unable to proceed with metric calculation");
            }
            
            //0 = add, 1 = del
            let pr = pr_changes[0] + pr_changes[1];
            let total = total_changes[0] + total_changes[1];

            this.latency = (performance.now() - startTime) / 1000;
            return pr/total;

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

}

// async function dummy(){
    
//     let startTime = performance.now(); 

//     //must declare url object. 
//     const url = new URL('https://github.com/lodash/lodash');
    
//     let metric = new MetricManager(url.pathname);

//     let pr_fraction = new PullRequest(metric.getOwner(), metric.getRepoName());
   
//     pr_fraction.getPullRequest().then(
//         result =>{
//             console.log(result)
//             console.log(`latency = ${performance.now() - startTime}`);
//         }

//     ).catch(error => {
//         console.log(error);
//     });

// }

// dummy(); 

