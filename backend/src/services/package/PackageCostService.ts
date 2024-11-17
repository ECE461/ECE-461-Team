import { Database } from '../../database_pg';
import { S3 } from '../../utils/S3';
import { Logger } from '../../utils/Logger';
import { URLHandler } from '../../utils/URLHandler';
import axios from 'axios';
import { String } from 'aws-sdk/clients/acm';
import { parse } from 'path';

export class PackageCostService {
    private db: Database;

    constructor() {
        this.db = Database.getInstance();
    }


    async getCost(packageId: string, dependency: boolean) {
        try {
            // Get the package cost from the database
            if(!await this.db.packageExists(packageId)) {
                throw new Error('404: Package not found');
            }

            if (!await S3.checkIfPackageExists(packageId)) {
                throw new Error('404: Package not found');
            }

            // Retreive the ZIP info from S3
            const zipBuffer = await S3.getFileByKey(packageId);
            if(zipBuffer == null){
                throw new Error('404: Package not found');
            }

            // Estimate the standalone cost of the package
            const standaloneCost =  Math.floor((zipBuffer.length *3) / 4); // Based on ratio of base64 encoding
            if(!dependency) {
                return standaloneCost;
            }

            // Estimate the cost of the package with dependencies
            // Setup the package URL
            const packageUrl = await this.db.getPackageURL(packageId);
            const urlHandler = new URLHandler(packageUrl);
            await urlHandler.setRepoURL();

            // Fetch the package.json file from the GitHub repository
            const url = `https://api.github.com/repos/${urlHandler.getOwnerName()}/${urlHandler.getRepoName()}/contents/package.json`;
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/vnd.github.v3.raw' }
            });
            const packageJson = response.data;

            const dependencies = packageJson.dependencies || {};
            const devDependencies = packageJson.devDependencies || {};

            Logger.logDebug(`Dependencies: ${dependencies}`);
            Logger.logDebug(`Dev Dependencies: ${devDependencies}`);

            // Estimate the cost of the dependencies
            let dependencyCost = 0;
            for (const [packageName, packageVersion] of Object.entries(dependencies)) {
                dependencyCost += await this.getDependencyCost(packageName, packageVersion as string);
            }
            for (const [packageName, packageVersion] of Object.entries(devDependencies)) {
                dependencyCost += await this.getDependencyCost(packageName, packageVersion as string);
            }

            return standaloneCost + dependencyCost;
        } catch (error) {
            Logger.logError("Error fetching package cost: ", error);
            throw error;
        }
    }

    private cleanVersion(version: string): string{
        return version.replace('^', '').replace('~', '');
    }

    async getDependencyCost(packageName: string, packageVersion: string) {
        try {
            Logger.logDebug(`Fetching dependency:  ${packageName}, ${packageVersion}`);

            // Get the tar file from npm registry
            packageVersion = this.cleanVersion(packageVersion);
            const npmUrl = `https://registry.npmjs.org/${packageName}/${packageVersion}`;
            const response = await axios.get(npmUrl);
            const tarFile = response.data.dist.tarball;
            
            // Estimate the package size
            const tarData = await axios.get(tarFile, {responseType: 'arraybuffer'});

            const tarSize = tarData.data.byteLength;

            Logger.logDebug(`Tar Size: ${tarSize}`);
            return tarSize;
        } catch (error) {  // Do NOT want to throw an error, just return 0 if unable to locate the dependency
            return 0;
        }
    }
}