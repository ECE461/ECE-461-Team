import * as fs from 'fs';
import * as path from 'path';
import 'es6-promise/auto';
import * as dotenv from 'dotenv';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

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

    await this.fetchRepoContents();

    // Run checks concurrently
    const [readme, stability, tests, linters, dependencies] = await Promise.all([
      this.checkReadme().then(result => result ? 1 : 0),
      this.checkStability().then(result => result ? 1 : 0),
      this.checkTests().then(result => result ? 1 : 0),
      this.checkLinters().then(result => result ? 1 : 0),
      this.checkDependencies().then(result => result ? 1 : 0)
    ]);

    // Assign weights and calculate score
    const readmeWeight = 0.2;
    const stabilityWeight = 0.25;
    const testsWeight = 0.3;
    const lintersWeight = 0.1;
    const dependenciesWeight = 0.15;

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
      console.error('Error fetching releases:', error);
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
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return Object.keys(packageJson.dependencies || {}).length > 0;
    } catch (error) {
      console.error('Error reading package.json:', error);
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      fs.rmSync(this.repoDir, { recursive: true });
    } catch (error) {
      console.error('Error removing repository directory:', error);
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

    console.log('README exists:', checks[0]);
    console.log('Stability (version exists):', checks[1]);
    console.log('Tests defined:', checks[2]);
    console.log('Linters defined:', checks[3]);
    console.log('Dependencies defined:', checks[4]);

    await this.cleanup();
  }

  public getLatency(): number {
    return this.latency;
  }
}
