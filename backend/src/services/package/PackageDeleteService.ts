import { PackageUpdateService } from './PackageUpdateService';
import { PackageUploadService } from './PackageUploadService';
import { PackageService } from './PackageService';
import { PackageDownloadService } from './PackageDownloadService';
import { Database } from '../../database_pg';
import { PackageData } from '../../models/package/PackageData';
import { PackageID } from '../../models/package/PackageID';
import { PackageMetadata } from '../../models/package/PackageMetadata';
import { S3 } from '../../utils/S3';
import { Package } from '../../models/package/Package';
import { Logger } from '../../utils/Logger';



export class PackageDeleteService {
    
    public async deletePackageByName() {
    }

    public async deletePackageById() {
    }
}