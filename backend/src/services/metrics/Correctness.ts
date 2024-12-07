import * as fs from 'fs';
import * as path from 'path';
import 'es6-promise/auto';
import * as dotenv from 'dotenv';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { Logger } from '../../utils/Logger';

dotenv.config();

export class Correctness {
  private owner: string;
  private repoName: string;
  private repoDir: string;
  private repoContents: string[];
  private latency: number = 0;

  constructor(owner: string, repoName: string) {
    this.owner = owner;
    this.repoName = repoName;
    this.repoDir = path.join('/tmp', `${this.repoName}-${Date.now()}`);
    this.repoContents = [];
  }

  public async getCorrectnessScore(): Promise<number> {
    let startTime = performance.now();

    // await this.fetchRepoContents();

    // Run checks concurrently
    const [readme, stability, tests, linters, dependencies] = await Promise.all([
      this.checkReadme().then(result => result ? 1 : 0),
      this.checkStability().then(result => result ? 1 : 0),
      this.checkTests().then(result => result ? 1 : 0),
      this.checkLinters().then(result => result ? 1 : 0),
      this.checkDependencies().then(result => result ? 1 : 0)
    ]);

    // Assign weights and calculate score
    const readmeWeight = 0.35; // Readme needs to be present
    const stabilityWeight = 0.15;  // Smaller repos may not have multiple releases
    const testsWeight = 0.3;  // Tests will help ensure correctness
    const lintersWeight = 0.1;  // Linters will help ensure code quality
    const dependenciesWeight = 0.10;  // Dependencies are important for functionality

    const finalScore = (
      readme * readmeWeight + 
      stability * stabilityWeight + 
      tests * testsWeight + 
      linters * lintersWeight + 
      dependencies * dependenciesWeight
    );

    // Clean up repository
    await this.cleanup();

    this.latency = performance.now() - startTime;

    return parseFloat(finalScore.toFixed(3));
  }

  private async fetchRepoContents(): Promise<void> {
    const dir = this.repoDir;
    const url = `https://github.com/${this.owner}/${this.repoName}`;

    if (!fs.existsSync(dir)) {
      await git.clone({
        fs,
        http,
        dir,
        url,
        singleBranch: true,
        depth: 1
      });
    }

    this.repoContents = await git.listFiles({ fs, dir });
  }

  private async checkReadme(): Promise<boolean> {
    return this.repoContents.some(file => file.toLowerCase() === 'readme.md');
  }

  private async checkStability(): Promise<boolean> {
    const releasesUrl = `https://api.github.com/repos/${this.owner}/${this.repoName}/releases`;
    try {
      const response = await fetch(releasesUrl, {
        headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      });
      const releases = await response.json();
      return releases.length > 1;
    } catch (error) {
      Logger.logDebug('Error fetching releases:' +  error);
      return false;
    }
  }

  private async checkTests(): Promise<boolean> {
    const testPatterns = [/test/i, /spec/i, /^__tests__$/i];
    return this.repoContents.some(file => testPatterns.some(pattern => pattern.test(file)));
  }

  private async checkLinters(): Promise<boolean> {
    const linterFiles = [
      '.eslintrc', '.eslintrc.json', '.eslintrc.js', 
      '.eslintignore', '.stylelintrc', 
      '.stylelintrc.json', '.stylelintrc.js', 
      '.stylelintignore'
    ];
    return this.repoContents.some(file => linterFiles.includes(file.toLowerCase()));
  }

  private async checkDependencies(): Promise<boolean> {
    const packageJsonFile = this.repoContents.find(file => file.toLowerCase() === 'package.json');
    if (!packageJsonFile) {
      return false;
    }
    try {
      const packageJsonPath = path.join(this.repoDir, packageJsonFile);
      console.log("HELLO" + packageJsonPath);
      console.log("TESTING" + fs.readFileSync(packageJsonPath, 'utf8'));

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      console.log("HELLO" + packageJson.dependencies);
      return Object.keys(packageJson.dependencies || {}).length > 0;
    } catch (error) {
      Logger.logDebug('Error reading package.json:' + error);
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      fs.rmSync(this.repoDir, { recursive: true });
    } catch (error) {
      Logger.logDebug('Error removing repository directory:' + error);
    }
  }

  public async runChecks(): Promise<void> {
    await this.fetchRepoContents();
    
    const checks = await Promise.all([
      this.checkReadme(),
      this.checkStability(),
      this.checkTests(),
      this.checkLinters(),
      this.checkDependencies()
    ]);

    Logger.logDebug('README exists:' + checks[0]);
    Logger.logDebug('Stability (version exists):' + checks[1]);
    Logger.logDebug('Tests defined:' + checks[2]);
    Logger.logDebug('Linters defined:' + checks[3]);
    Logger.logDebug('Dependencies defined:' + checks[4]);

    await this.cleanup();
  }

  public getLatency(): number {
    return this.latency;
  }
}
