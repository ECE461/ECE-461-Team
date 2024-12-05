import { Database, PackageRow } from '../../database_pg';
import { S3 } from '../../utils/S3';
import { Logger } from '../../utils/Logger';
import { URLHandler } from '../../utils/URLHandler';
import axios, { all } from 'axios';
import { String } from 'aws-sdk/clients/acm';
import { parse } from 'path';
import JSZip, { JSZipObject } from 'jszip';
import { PackageVersion } from '../../models/package/PackageVersion';
import { rcompare, satisfies } from 'semver'

export class PackageCostService {
    private db: Database;

    constructor() {
        this.db = Database.getInstance();
    }

    async getStandaloneCost(packageId: string) : Promise<number> {
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

            const padding = (zipBuffer.match(/=+$/) || [''])[0].length; // count the amount of padding characters
            const standaloneCost = (zipBuffer.length * 3 / 4) - padding; // Estimate the standalone cost of the package

            return standaloneCost;
        } catch (error) {
            Logger.logError("Error fetching package cost: ", error);
            throw error;
        }
    }

    async getTotalCost(packageId: string) : Promise<{}> {
        try {
            let returnDict: { [key: string]: any } = {};

            // Get the package cost
            await this.getTotalCostHelper(packageId, returnDict);
            return returnDict;

        } catch (error) {
            Logger.logError("Error fetching package cost: ", error);
            throw error;
        }
    }

    async getTotalCostHelper(packageId: string, returnDict: { [key:string] : {standaloneCost: number, totalCost: number}}) : Promise<number>
    {
        let totalCost = 0;
        // Check if ID exists in visitedDependencies
        if(packageId in returnDict){
            return totalCost; // 0
        }

        // Check if ID is in the database
        if(!await this.db.packageExists(packageId)) {
            Logger.logDebug(`Package ${packageId} not found in database`);
            return totalCost; // 0
        }

        // Add ID to visitedDependencies
        returnDict[packageId as string] = { standaloneCost: 0, totalCost: 0};

        // Get the individual package cost
        const standaloneCost = await this.getStandaloneCost(packageId);
        returnDict[packageId]["standaloneCost"] = standaloneCost;
        totalCost += standaloneCost;

        // Find the dependencies of the package
        const dependencies = await this.getDependencies(packageId);

        // Iterate through the dependencies
        for(const dependency in dependencies)
        {
            // Find a compatible version in the database
            const dependencyId = await this.findCompatibleVersion(dependency, dependencies[dependency]);
            if(dependencyId == '') // did not find a compatible version
            {
                continue;
            }
            // Get the cost of the dependency
            totalCost += await this.getTotalCostHelper(dependencyId, returnDict);
        }

        returnDict[packageId]["totalCost"] = totalCost;

        return totalCost
    }

    private async findCompatibleVersion(packageName: string, versionCompatibility: string) : Promise<string> {
        // Check that a version of the package does exist in the database
        let rows = await this.db.getPackageVersionsByName(packageName);
        if(rows.length == 0)  // This package does not exist in the database
        {
            return '';
        }

        // Determine which packages are compatible with the versioning
        rows = rows.filter(pkg => satisfies(pkg.version, versionCompatibility));
        if(rows.length == 0) // No compatible versions found
        {
            return '';
        }

        // Sort by the newest to oldest
        rows.sort((pkg1, pkg2) => rcompare(pkg1.version, pkg2.version));
        return rows[0].id;  // Return ID of newest compatible package
    }

    async getDependencies(packageId: string) : Promise<string []>{
        try {
            // Check if the package exists
            if (!await this.db.packageExists(packageId)) {
                throw new Error('404: Package not found');
            }

            // Get the zip information for the package
            const zipBuffer = await S3.getFileByKey(packageId);
            if(zipBuffer == null){ 
                throw new Error('404: Package not found');
            }

            // Convert package to binary string
            const binaryString = atob(zipBuffer); // convert base64 to binary string
            const byteArray = new Uint8Array(binaryString.length); // create a byte array
            for(let i = 0; i < binaryString.length; i++){
                byteArray[i] = binaryString.charCodeAt(i);
            }

            // Create a JSZip object
            const jsZip = new JSZip();
            const unzipped = await jsZip.loadAsync(byteArray);

            // Get the package.json file
            let packageJsonFile: JSZipObject | null = null;
            unzipped.forEach((relativePath, file) => {
                if(relativePath.endsWith('package.json')){
                    packageJsonFile = file;
                }
            });


            if (packageJsonFile != null)
            {
                const packageJsonString = await (packageJsonFile as JSZipObject).async('text');
                const packageJson = JSON.parse(packageJsonString);

                // Get the dependencies
                const dependencies = packageJson.dependencies || {};
                const devDependencies = packageJson.devDependencies || {};
                const allDependencies = {...dependencies, ...devDependencies};

                return allDependencies;
            }
            else
            {
                throw new Error('404: Package.json not found');
            }
        } catch (error) {  // Do NOT want to throw an error, just return an empty list if there are no dependencies found
            return [];
        }
    }
}