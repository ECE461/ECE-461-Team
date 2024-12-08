import { PackageUpdateService } from './PackageUpdateService';
import { PackageUploadService } from './PackageUploadService';
import { PackageDeleteService } from './PackageDeleteService';
import { PackageDownloadService } from './PackageDownloadService';
import { PackageCostService } from './PackageCostService';
import { Database } from '../../database_pg';
import { PackageData } from '../../models/package/PackageData';
import { PackageID } from '../../models/package/PackageID';
import { PackageRating } from '../../models/package/PackageRating';
import { PackageMetadata } from '../../models/package/PackageMetadata';
import { PackageQuery } from "../../models/package/PackageQuery";
import { S3 } from '../../utils/S3';
import { Package } from '../../models/package/Package';
import { Logger } from '../../utils/Logger';
import { MetricManager } from '../../services/metrics/MetricManager';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { TokenUrlParameterKey } from 'aws-sdk/clients/glue';
import { DeleteBucketAnalyticsConfigurationCommand } from '@aws-sdk/client-s3';
import * as semver from 'semver';

export class PackageService {
    private db: Database;

    constructor() {
        this.db = Database.getInstance();
    }

    async getPackagesByRegex(regex: string): Promise<PackageMetadata[]> {
        try {
            const allPackagesMetadataList : PackageMetadata[] = await this.db.getPackagesByRegex(regex);
            return allPackagesMetadataList;
        } catch (error: any) {
            Logger.logError('Error in PackageService getPackagesByQuery:', error);

            if (error instanceof Error && error.message.includes('invalid regular expression')) {
                // throw new Error('400: Invalid regular expression');
                return [];
              }
            throw new Error('Failed to fetch packages');
        }
    }

    async getPackagesByQuery(packageQueries: any[], offset: number) {
        try {
            const maxItemsPerPage = 20;
            const allPackagesMetadataList : PackageMetadata[] = await this.db.getAllPackageMetadata();
            const matchingPackages = [];

            for (const metadata of allPackagesMetadataList) {
                for (const query of packageQueries) {
                    const version = query.Version ? query.Version : "*";
                    const packageQuery = new PackageQuery(query.Name, version);
                    if (packageQuery.checkMatches(metadata)) {
                        matchingPackages.push(metadata.getJson());
                        break;
                    }
                }
            }
            return matchingPackages.slice(Number(offset), Number(offset)+maxItemsPerPage);
        } catch (error) {
            Logger.logError('Error in PackageService getPackagesByQuery:', error);
            throw new Error('Failed to fetch packages');
        }
    }

    async getPackageById(packageID: string, downloadUser: string) {
        try{
            let packageExist: any = await this.db.packageExists(packageID); 
            Logger.logInfo(`Checking if package exists in database: ${packageExist}`);
            
            if(!packageExist){
                throw new Error("404: Package does not exist"); 
            }
            
            let details: any = await this.db.getDetails(packageID); 

            if(details == null){
                throw new Error("404: Package does not exist");
            }

            //metadata
            let metadata: PackageMetadata = new PackageMetadata(details.name, details.version);
            
            let file = await S3.getFileByKey(packageID);

            // Check permissions with JSProgram
            // If the program exits with a non-zero code, the download of the module should be rejected with an appropriate error message that includes the stdout from the program
            if (details.jsprogram != "") {
                // TODO: Check permissions with JSProgram
                // Run program remotely with arguments: details.name details.version details.user downloadUser zip_file_path
            }

            

            if(file == null){
                throw new Error("404: Package does not exist");
            }
            
            //data
            let data: any = await PackageData.create(file, details.jsprogram, details.uploadUrl);
        
            const pack = new Package(metadata, data);
            Logger.logInfo("Successfully retrieved package from S3.");
            return pack;
        } catch(err: any){ 
            throw err; 
        }  
    }

    async uploadPackage(packageData: PackageData, debloat: boolean, name: string, version: string, user: string) {
        try {

            // Debloat package if necessary
            if (debloat) {
                Logger.logInfo("Debloating package");
                // TODO: Need to implement debloating
                packageData = await PackageUploadService.debloatPackage(packageData);
            }

            Logger.logInfo("Extracting package metadata");
            const isUploadByContent = packageData.getSourceType() === "Content";
            let packageMetadata : PackageMetadata = await PackageUploadService.extractPackageInfo(packageData, isUploadByContent, packageData.getUploadUrl());

            // Check that Request Body "name" matches package.json's name
            // if (packageMetadata.getName() !== name && name !== "") {
            //     throw new Error(`400: Package name does not match: ${packageMetadata.getName()} !== ${name}`);
            // }
            packageMetadata.setName(name);
            
            // Check that Request Body "version" matches package.json's version
            // if (packageMetadata.getVersion() !== version && version !== "") {
            //     throw new Error(`400: Package version does not match: ${packageMetadata.getVersion()} !== ${version}`);
            // }
            // Set version to version from parameter:
            packageMetadata.setVersion(version);

            // If package does already exists:
            Logger.logInfo("Checking if package exists");
            if (await this.db.packageExistsbyName(packageMetadata.getName())) {
                throw new Error('409: Package already exists');
            }
            if (await S3.checkIfPackageExists(packageMetadata.getId())) {
                throw new Error('409: Package already exists');
            }

            Logger.logInfo(`Checking URL Metrics: ${packageData.getUploadUrl()}`);
            // Need to check that URL passes rating stuff:
            if (packageData.getSourceType() === "URL" && !await PackageData.metricCheck(packageData.getUploadUrl())) {
                throw new Error("Error 424: Package is not uploaded due to the disqualified rating.");
            }

            // Upload metadata and readme to RDS -----------------------------------------
            Logger.logInfo("Uploading package metadata to RDS");
            await this.db.addPackage(packageMetadata.getId(), packageMetadata.getName(), packageMetadata.getVersion(), packageMetadata.getReadMe(), packageMetadata.getUrl(), packageData.getJSProgram(), packageData.getUploadUrl(), user);

            // Upload to S3 Database
            Logger.logInfo("Uploading package to S3");
            await S3.uploadBase64Zip(packageData.getContent(), packageMetadata.getId());

            const pack = new Package(packageMetadata, packageData);
            return pack;
        } catch (error : any) {
            Logger.logError("Error uploading package: ", error);
            throw error;
        }

    }

    async updatePackage(packageData: PackageData, debloat: boolean, name: string, version: string, oldID: string, user: string) {
        try {
            if (debloat) {
                Logger.logInfo("Debloating package");
                packageData = await PackageUploadService.debloatPackage(packageData);
            }

            Logger.logInfo("Extracting package metadata");
            let packageMetadata : PackageMetadata = await PackageUploadService.extractPackageInfo(packageData, false, packageData.getUploadUrl());

            // Check that Request Body "name" matches package.json's name
            // if (packageMetadata.getName() !== name && name !== "") {
            //     throw new Error('400: Package name does not match');
            // }
            packageMetadata.setName(name);

            // // Check that Request Body "version" matches package.json's version
            // if (packageMetadata.getVersion() !== version && version !== "") {
            //     throw new Error('400: Package version does not match');
            // }
            packageMetadata.setVersion(version);

            // Check if package exists
            Logger.logInfo("Checking if package exists");
            if (await this.db.packageExists(packageMetadata.getId())) {
                throw new Error('409: Package already exists');
            }

            // Check: packages uploaded with Content must be updated with Content
            Logger.logDebug(packageMetadata.getId());
            if (packageData.getSourceType() !== await this.db.getSourceType(oldID)) {
                throw new Error('400: Cannot update with different source type');
            }

            // Check: if uploaded with Content, new version must not be an old Patch version
            if (packageData.getSourceType() === "Content") {
                Logger.logInfo("Validating versioning rule for uploaded content");
                const existingVersions = await this.db.getVersions(packageMetadata.getName());

                // Find the latest version
                const latestVersion = existingVersions.sort((a: string, b: string) => semver.compare(b, a))[0]; // Use `semver.compare` for semantic version comparison

                if (semver.lt(packageMetadata.getVersion(), latestVersion)) {
                    throw new Error('400: New version cannot be older than the latest patch release');
                }

            }

            // Update metadata and readme to RDS -----------------------------------------
            Logger.logInfo("Uploading package metadata to RDS");
            await this.db.addPackage(packageMetadata.getId(), packageMetadata.getName(), packageMetadata.getVersion(), packageMetadata.getReadMe(), packageMetadata.getUrl(), packageData.getJSProgram(), packageData.getUploadUrl(), user);

            // Upload to S3 Database
            Logger.logInfo("Uploading package to S3");
            await S3.uploadBase64Zip(packageData.getContent(), packageMetadata.getId());


        } catch (error) {
            Logger.logError("Error updating package: ", error);
            throw error;
        }
    }

    async checkPackageIDExists(packageID: string) {
        return await this.db.packageExists(packageID);
    }

    async getRating(packageId: string) {
        // Check that package exists
        if (!await this.db.packageExists(packageId)) {
            throw new Error('404: Package not found');
        }

        const package_url = await this.db.getPackageURL(packageId);
        if (package_url === "") {
            throw new Error('Package URL not found in databases');
        }

        const packageManager = await MetricManager.create(package_url);

        try {
            const packageRating = await packageManager.getMetrics(); // Get metrics from package manager
            const metricRating = new PackageRating(packageRating); // Convert to PackageRating object to JSON-ify later
            Logger.logInfo(`Package Ratings: ${JSON.stringify(packageRating)}`);
            return metricRating;
        } catch (error) {
            Logger.logInfo("Error fetching package ratings");
            Logger.logDebug(error);
            throw error;
        }
    }

    async getCost(packageId: string, dependencies: boolean)
    {
        try {
            let returnDict: { [key: string]: any } = {};
            const packageCostService= new PackageCostService()
            const standaloneCost = await packageCostService.getStandaloneCost(packageId);
            if(!dependencies)
            {
                returnDict[packageId as string] = {totalCost : standaloneCost};
                return returnDict;
            }

            returnDict = await packageCostService.getTotalCost(packageId);
            return returnDict;
        }
        catch(error) {
            Logger.logInfo("Error fetching package cost");
            Logger.logDebug(error);
            throw error;
        }
        
    }

    async reset() {
        // Delete all packages from RDS
        await this.db.deleteAllPackages();

        // Delete all packages from S3
        await S3.deleteAllPackages();

        // TODO: Delete users?
        await this.db.deleteAllUsers();
    }

    async deletePackageByName(packageName: string) {

        try{
            let packageExist: any = await this.db.packageExistsbyName(packageName); 
            
            if(!packageExist){
                throw new Error("404: Package does not exist.")
            }
            
            //packageID returns an array of [{id: blahbalbh}, {id:blahb}]
            Logger.logInfo("Deleting package from RDS...");
            let packageIDs = await this.db.deletePackagebyName(packageName);
            
            if(!packageIDs){
                throw new Error("404: Package does not exist.")
            }

            Logger.logInfo("Deleting package from S3...");

            packageIDs.forEach(async(obj) =>{

                await S3.deletePackagebyID(obj.id); 

            });
            
        }catch(err: any){
            throw err;
        }
    }

    async deletePackageById(packageID: string) { // NON-BASELINE
        try{
            
            let packageExist: any = await this.db.packageExists(packageID); 
            
            if(!packageExist){
                throw new Error("404: Package does not exist.")
            }     

            Logger.logInfo("Deleting package data from RDS...");
            await this.db.deletePackagebyID(packageID); 

            Logger.logInfo("Deleting package from S3...");
            await S3.deletePackagebyID(packageID);

        }catch(err: any){
            throw err;
        }
    }

    async getPackageHistoryByName() { // NON-BASELINE
    }

    async createAccessToken(username: string, pwInput: string, adminInput: boolean) { // Non-baseline --> add to user/authenticate endpoint or not
        // an access token is only created if the pw is correct
        try {

            //check if user exists 
            let user = await this.db.userExists(username); 
            if(!user){
                throw new Error("401: The user does not exist");
            }   

            //check if there  is a password associated with the username
            let pw = await this.db.getPW(username); 
            if(!pw){
                throw new Error("401: The password DNE in database");
            }

            //compare(plainText, hashed) passwords
            const pw_correct = await bcrypt.compare(pwInput, pw); 
            if(!pw_correct){
                throw new Error("401: The password is incorrect");
            }
            
            const isAdmin: boolean = await this.db.isAdmin(username);
            if(isAdmin != adminInput){
                throw new Error("401: Wrong permissions provided");
            }

            //generate token based on the above parameters
            const payload = {
                id: username, 
                admin: isAdmin, 
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60, 
            };

            //force throw error or it won't let me add stuff:(
            if (!(process.env.JWT_KEY)){
                throw new Error("501: JWT_KEY undefined. Check your environment variables.");
            }

            //sign the token with a jwt key
            const token = jwt.sign(payload, process.env.JWT_KEY);
            
            if (!token){
                throw new Error("501: Error creating token.")
            }

            Logger.logInfo("Successfully generated token.")

            this.db.addToken(token); 
            return `"bearer ${token}"`;

        } catch (err: any) {
            throw err; 
        }
    }

    async registerUser(username: string, is_admin: boolean, pw: string){
        try{
            
            const userExists = await this.db.userExists(username); 
            
            if(userExists){
                throw new Error("409: Please choose a unique username"); //put a continue block that allows the user t
            }

            await this.db.addUser(username, is_admin, pw); 

        } catch(err: any) {
            throw err; 
        }
    }

    //for testing purposes
    async addDefaultUser(){

        try{

            await this.registerUser('ece30861defaultadminuser', true, "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;");

        } catch (err: any) { 
            return;
        }
    }

    async dummyToken(){
        try{
            const token = await this.createAccessToken('ece30861defaultadminuser', "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;", true);
            Logger.logInfo(token);  
        } catch (err: any) { 
            return;
        }
    }

    async checkIDExists(packageID: string) {
        return await this.db.packageExists(packageID);
    }

    

}
