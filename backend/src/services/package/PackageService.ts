import { PackageUpdateService } from './PackageUpdateService';
import { PackageUploadService } from './PackageUploadService';
import { PackageDeleteService } from './PackageDeleteService';
import { PackageDownloadService } from './PackageDownloadService';
import { Database } from '../../database_pg';
import { PackageData } from '../../models/package/PackageData';
import { PackageID } from '../../models/package/PackageID';
import { PackageRating } from '../../models/package/PackageRating';
import { PackageMetadata } from '../../models/package/PackageMetadata';
import { S3 } from '../../utils/S3';
import { Package } from '../../models/package/Package';
import { Logger } from '../../utils/Logger';
import {MetricManager} from '../../services/metrics/MetricManager';

export class PackageService {
    private db: Database;

    constructor() {
        this.db = Database.getInstance();
    }

    async getPackagesByRegex() {
    }

    async getPackagesByQuery(packageQueries: any[], offset: number) {
        try {
            const maxItemsPerPage = 20;

            // TODO: Implement logic to search for packages based on pacakgeQueries and offset
            const mockPackages = [
                { Version: '1.2.3', Name: 'Underscore', ID: 'underscore' },
                { Version: '1.2.3-2.1.0', Name: 'Lodash', ID: 'lodash' },
                { Version: '^1.2.3', Name: 'React', ID: 'react' }
            ];

            return mockPackages.slice(Number(offset), Number(offset)+maxItemsPerPage);
        } catch (error) {
            console.error('Error in PackageService:', error);
            throw new Error('Failed to fetch packages');
        }
    }

    async getPackageById(packageID: string) {
        try{
            let packageExist: any = await this.db.packageExists(packageID); 
            
            if(!packageExist){
                throw new Error("404: Package does not exist"); 
            }
            
            let details: any = await this.db.getDetails(packageID); 

            if(details == null){
                throw new Error("404: Package does not exist");
            }

            //metadata
            let metadata: PackageMetadata = new PackageMetadata(details.name, details.readme);
            
            let file = await S3.getFileByKey(packageID);

            if(file == null){
                throw new Error("404: Package does not exist");
            }
            
            //data
            let data: any = await PackageData.create(file, details.jsprogram);
        
            const pack = new Package(metadata, data);
            Logger.logInfo("Successfully retrieved package from S3.");
            return pack;
        } catch(err: any){ 
            throw err; 
        }  
    }

    async uploadPackage(packageData: PackageData) {
        try {
            Logger.logInfo("Extracting package metadata");
            const packageMetadata : PackageMetadata = PackageUploadService.extractPackageInfo(packageData);

            // Upload metadata and readme to RDS (SQLite (later PostgreSQL)) -----------------------------------------
            // If pacakge does not exist already:
            if (await this.db.packageExists(packageMetadata.getId())) {
                throw new Error('409: Package already exists');
            }
            await this.db.addPackage(packageMetadata.getId(), packageMetadata.getName(), packageMetadata.getVersion(), packageMetadata.getReadMe(), packageMetadata.getUrl(), packageData.getJSProgram());

            // Upload to S3 Database
            Logger.logInfo("Uploading package to S3"); //---------------------------------------------------------------
            if (await S3.checkIfPackageExists(packageMetadata.getId())) {
                throw new Error('409: Package already exists');
            }
            await S3.uploadBase64Zip(packageData.getContent(), packageMetadata.getId());

            const pack = new Package(packageMetadata, packageData);
            return pack;
        } catch (error : any) {
            Logger.logInfo("Error uploading package");
            Logger.logDebug(error);
            throw error;
        }

    }

    async updatePackage() {
    }

    async getRating(package_id: string) {
        const package_url = await this.db.getPackageURL(package_id);
        const packageManager = new MetricManager(package_url);
        await packageManager.setProperties(); // Set properties of package manager (MUST DO THIS BEFORE GETTING METRICS)

        try {
            const packageRating = await packageManager.getMetrics(); // Get metrics from package manager
            // TO-DO: Add the following to the packageRating object: goodPinningPractice, pullRequest
            const metricRating = new PackageRating(packageRating.busFactorValue, packageRating.correctnessValue, packageRating.rampUpValue, packageRating.maintainerValue, packageRating.licenseValue, 0, 0, packageRating.netScore); // Convert to PackageRating object to JSON-ify later
            return metricRating;
        } catch (error) {
            Logger.logInfo("Error fetching package ratings");
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
    }

    async deletePackageByName() {
    }

    async deletePackageById() { // NON-BASELINE
    }

    async getPackageHistoryByName() { // NON-BASELINE
    }

    async createAccessToken() { // Non-baseline --> add to user/authenticate endpoint or not
    }
}