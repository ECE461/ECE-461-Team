import { Base64 } from 'js-base64';
import AdmZip from 'adm-zip';
import fs from 'fs';
import { PackageMetadata } from '../../models/package/PackageMetadata';
import { PackageData } from '../../models/package/PackageData';
import { S3 } from '../../utils/S3';
import { Logger } from '../../utils/Logger';

export class PackageUploadService {
    public async uploadPackage() {
    }

    public static extractPackageInfo(packageData: PackageData) : PackageMetadata {
        Logger.logInfo("Extracting package metadata");
        const zipBuffer = Buffer.from(packageData.getContent(), 'base64');
        const zip = new AdmZip(zipBuffer);
        let packageMetadata: PackageMetadata | null = null;
        let readmeContent: string = '';
        let readmePathParts = 0; // Used to keep track of readme file path

        Logger.logInfo("Looping through files in repository")
        zip.getEntries().forEach((entry) => {
            const fileName = entry.entryName;

            const pathParts = fileName.split('/');
            if (fileName.endsWith('package.json') && pathParts.length === 2) {
                const packageJsonContent = entry.getData().toString('utf8');
                const packageInfo = JSON.parse(packageJsonContent);

                packageMetadata = new PackageMetadata(packageInfo.name, packageInfo.version);
                if(!packageInfo.repository?.url) {
                    throw new Error("400: No url found in the uploaded package's package.json");
                }
                packageMetadata.setUrl(packageInfo.repository?.url);
            }

            // TODO: What to do if no readme is found?
            if (fileName.toLowerCase().endsWith('readme.md')) {
                if (readmePathParts != 0) {
                    if (pathParts.length < readmePathParts) {
                        readmeContent = entry.getData().toString('utf8');
                        readmePathParts = pathParts.length;
                    }
                } else {
                    readmeContent = entry.getData().toString('utf8');
                    readmePathParts = pathParts.length;
                }
            }
        });

        if (packageMetadata === null) {
            Logger.logInfo("No package.json found in the uploaded package");
            throw new Error('400: No package.json found in the uploaded package');
        }
        else {
            // Set readme content if found
            if (readmeContent) {
                (packageMetadata as PackageMetadata).setReadMe(readmeContent);
            }
            else {
                Logger.logInfo("No README.md found in the uploaded package");
                throw new Error('400: No README.md found in the uploaded package');
            }
        }
        return packageMetadata;
    }
}