"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = void 0;
const PackageUploadService_1 = require("./PackageUploadService");
const database_pg_1 = require("../../database_pg");
const S3_1 = require("../../utils/S3");
const Package_1 = require("../../models/package/Package");
const Logger_1 = require("../../utils/Logger");
class PackageService {
    constructor() {
        this.db = database_pg_1.Database.getInstance();
    }
    getPackagesByRegex() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getPackagesByQuery(packageQueries, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const maxItemsPerPage = 20;
                // TODO: Implement logic to search for packages based on pacakgeQueries and offset
                const mockPackages = [
                    { Version: '1.2.3', Name: 'Underscore', ID: 'underscore' },
                    { Version: '1.2.3-2.1.0', Name: 'Lodash', ID: 'lodash' },
                    { Version: '^1.2.3', Name: 'React', ID: 'react' }
                ];
                return mockPackages.slice(Number(offset), Number(offset) + maxItemsPerPage);
            }
            catch (error) {
                console.error('Error in PackageService:', error);
                throw new Error('Failed to fetch packages');
            }
        });
    }
    getPackageById() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    uploadPackage(packageData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Logger_1.Logger.logInfo("Extracting package metadata");
                const packageMetadata = PackageUploadService_1.PackageUploadService.extractPackageInfo(packageData);
                // Upload metadata and readme to RDS (SQLite (later PostgreSQL)) -----------------------------------------
                // If pacakge does not exist already:
                if (yield this.db.packageExists(packageMetadata.getId())) {
                    throw new Error('409: Package already exists');
                }
                yield this.db.addPackage(packageMetadata.getId(), packageMetadata.getName(), packageMetadata.getVersion(), packageMetadata.getReadMe(), packageMetadata.getUrl());
                // Upload to S3 Database
                Logger_1.Logger.logInfo("Uploading package to S3"); //---------------------------------------------------------------
                if (yield S3_1.S3.checkIfPackageExists(packageMetadata.getId())) {
                    throw new Error('409: Package already exists');
                }
                yield S3_1.S3.uploadBase64Zip(packageData.getContent(), packageMetadata.getId());
                const pack = new Package_1.Package(packageMetadata, packageData);
                return pack;
            }
            catch (error) {
                Logger_1.Logger.logInfo("Error uploading package");
                Logger_1.Logger.logDebug(error);
                throw error;
            }
        });
    }
    updatePackage() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getRating() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            // Delete all packages from RDS
            yield this.db.deleteAllPackages();
            // Delete all packages from S3
            yield S3_1.S3.deleteAllPackages();
            // TODO: Delete users?
        });
    }
    deletePackageByName() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    deletePackageById() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getPackageHistoryByName() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    createAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.PackageService = PackageService;
