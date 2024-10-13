import axios from 'axios'; 


import { Logger } from '../../utils/Logger';
import { MetricManager } from './MetricManager';
import {URL} from 'url' 
import { log } from 'console';


/**
 * @class
 * 
 * @private @method getEndpoint(): returnsrelevant API endpoint 
 * 
 * @private @method getDetails(): returns lines changed from one pull request 
 * 
 * @private @method getPRChanges(): returns total lines changed from pull requests
 * 
 * @private @method getTotalChanges(): returns total lines changed on repo 
 * 
 * @public @method calculatePullRequest(): returns fraction of code from pull requests
 * 
*/

export class PullRequest{

    private repoOwner: string; 
    private repoName: string; 

    constructor (_repoOwner: string, _repoName: string){
        this.repoOwner = _repoOwner; 
        this.repoName = _repoName; 
    }


    /**
     * 
     * @param type
     * @param pr_number: optional
     * @returns github endpoint for all pull requests, or for a certain number pull request see @example
     *
     * @example
     * getEndpoint('all'); all pull requests 
     * getEndpoint('total lines'); api endpoint to parse through line changes
     * getEndpoint('number', 1437); where 1437 is a dummy number, details of pull rq 1437
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
     * @return string: number of lines changed from a certain pull request
     */
    private async getDetails(pr_number: number): Promise<number>{
        
        try{

            const response = await axios.get(this.getEndpoint('number', pr_number), {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}});
            const data = response.data; 

            return data.additions - data.deletions; 

        } catch(Error){
            Logger.logDebug(Error); 
        }
        return 0; 
    }
    
    private async getPRChanges(): Promise<number | null>{

        try{
            const response = await axios.get(this.getEndpoint('all'), {headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}});
            const data = response.data;

            let pr_lines: number = 0;

            //TODO: implement pagination?
            for(const pull_request of data){
                pr_lines += await this.getDetails(pull_request.number);
            }
        
            return pr_lines; 

        }catch(Error){
            
            Logger.logDebug(Error);
        }
        return null;
    }


    /**
     * 
     * @returns total @number of lines changed 
     */
    private async getTotalChanges(): Promise<number | null>{
        
        try{
            
            const response = await axios.get(this.getEndpoint('total lines'), {headers: {'Authorization': `token ${process.env.GITHUB_TOKEN}`}})
            const data = response.data; 
            
            let total: number = 0; 
            
            for (const contributor of data){
                for(const week of contributor.weeks){
                    total += week.a - week.d;
                }
            }

            return total; 

        } catch(Error){
            Logger.logDebug(Error); 
        }
        
        return null;
    }

    

    /**
     * @return : calculates pull request 
     */
    public async calculatePullRequest(): Promise<number>{
        
        
        try{
            
            const values = await Promise.all([this.getPRChanges(), this.getTotalChanges()]);
    
            return (values[0] == null || values[1] == null) ? 0 : values[0] / values[1];

        } catch(Error){
            Logger.logDebug(Error);
        }

        return 0;
    }

}

async function dummy(){
    
    //must declare url object. 
    const url = new URL('https://github.com/nullivex/nodist');
    
    let metric = new MetricManager(url.pathname);

    let pr_fraction = new PullRequest(metric.getOwner(), metric.getRepoName());
   
    pr_fraction.calculatePullRequest().then(
        result =>{console.log(result)}
    ).catch(error => {
        console.log(error);
    });

}
 
dummy();