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
            this.db.addPackage(packageMetadata.getId(), packageMetadata.getName(), packageMetadata.getVersion(), packageMetadata.getReadMe(), packageMetadata.getUrl());

            // Upload to S3 Database
            Logger.logInfo("Uploading package to S3"); //---------------------------------------------------------------
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

    async getRating() {
    }

    async reset() {
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