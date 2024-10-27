import { PackageUpdateService } from './PackageUpdateService';
import { PackageUploadService } from './PackageUploadService';
import { PackageDeleteService } from './PackageDeleteService';
import { PackageDownloadService } from './PackageDownloadService';
import { Database } from '../../database_pg';
import { PackageData } from '../../models/package/PackageData';
import { PackageID } from '../../models/package/PackageID';
import { PackageMetadata } from '../../models/package/PackageMetadata';
import { S3 } from '../../utils/S3';
import { Package } from '../../models/package/Package';
import { Logger } from '../../utils/Logger';
import {MetricManager} from '../../services/metrics/MetricManager';
import { PackageRating } from '../../models/package/PackageRating';

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

    async getPackageById() {
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
            await this.db.addPackage(packageMetadata.getId(), packageMetadata.getName(), packageMetadata.getVersion(), packageMetadata.getReadMe(), packageMetadata.getUrl());

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

    async getRating(packageID: string) {
        // get the URL of the package from the database
        // TODO: Implement this method in Database class
        // const url = await this.db.getPackageURL(packageID.getId());
        const url = "https://github.com/cloudinary/cloudinary_npm";

        // use the Metric Manager class to get the rating
        try
        {
            const metricManager = new MetricManager(url);
            const rating = await metricManager.getMetrics();
            const package_rating = new PackageRating(rating.busFactorValue, rating.correctnessValue, rating.rampUpValue, rating.maintainerValue, rating.licenseValue, 0, 0, rating.netScore);
            return package_rating.getJson();
        }
        catch (error)
        {
            console.error('Error in getRating:', error);
            throw new Error('Failed to fetch rating');
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