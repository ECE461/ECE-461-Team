import axios from 'axios';
import { Logger } from '../../utils/Logger';

const GITHUB_API = 'https://raw.githubusercontent.com';

export class License {
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
   * getFileContent returns a boolean if the file contains LGPLv2.1
   * 
   * @returns a boolean if the LGPLv2.1 is in the file, null if there is an error
   */
  private async getFileContent(path: string, default_branch: string) : Promise<boolean | null> {
    try {
      const url = `${GITHUB_API}/${this.owner}/${this.repoName}/${default_branch}/${path}`;
      const license_list = ['lgpl v2.1', 'mit license', 'apache license 2.0', 'bsd 3-clause license', 'lesser general public license version 2.1']
      const response = await axios.get(url, 
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
          }
        }
      );
      let hasLicense = license_list.some(license => response.data.toLowerCase().includes(license));
      return hasLicense;

    } catch (error) {
      return null;
    }
  }

  /**
   * getRepoLicense returns the license of the package
   * 
   * @returns 1 if the license is LGPLv2.1, 0 otherwise
   */
  async getRepoLicense() : Promise<number> {
    try {
      let startTime = performance.now();
      // get the default branch of the repository
      const default_url = `https://api.github.com/repos/${this.owner}/${this.repoName}`;
      const default_response = await axios.get(default_url, 
      {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
          }
      });
      let default_branch: string = default_response.data.default_branch;

      // gets booleans of LICENSE and README.md files
      const [licenseFile, readMeFile] = await Promise.all([
        this.getFileContent('LICENSE', default_branch),
        this.getFileContent('README.md', default_branch)
      ]);
      
      // checks if one or the other contains LGPLv2.1
      if (licenseFile || readMeFile) {
        return 1;
      }
      this.latency = (performance.now() - startTime) / 1000;
      return 0;

    } catch (error) {
      Logger.logDebug('Error fetching license:' + error);
      return 0;
    }
  }

  /**
   * getLatency returns the latency of the license metric
   * 
   * @returns the latency of the license metric
   */
  public getLatency(): number {
    return this.latency;
  }


}