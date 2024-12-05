import { Base64 } from 'js-base64';
import AdmZip from 'adm-zip';
import fs from 'fs';
import { PackageMetadata } from '../../models/package/PackageMetadata';
import { PackageData } from '../../models/package/PackageData';
import { S3 } from '../../utils/S3';
import { Logger } from '../../utils/Logger';
import { URLHandler } from '../../utils/URLHandler';

export class PackageUploadService {

    public static debloatPackage(packageData: PackageData) : PackageData {
        // TODO: Implement debloating

        return packageData;
    }

    public static extractPackageInfo(packageData: PackageData, isUpdateByContent: boolean) : PackageMetadata {
        Logger.logInfo("Extracting package metadata");

        // Unzip the package
        const zipBuffer = Buffer.from(packageData.getContent(), 'base64');
        const zip = new AdmZip(zipBuffer);

        let packageMetadata: PackageMetadata | null = null;
        let readmeContent: string = '';
        let readmePathParts = 0; // Used to keep track of readme file path

        Logger.logInfo("Looping through files in repository")
        zip.getEntries().forEach((entry) => {
            const fileName = entry.entryName;
            Logger.logDebug(`File: ${fileName}`);

            const pathParts = fileName.split('/');
            
            if (fileName.endsWith('package.json') && pathParts.length === 2) {
                const packageJsonContent = entry.getData().toString('utf8');
                const packageInfo = JSON.parse(packageJsonContent);

                if (!packageInfo.name) {
                    throw new Error("400: No name or version found in the uploaded package's package.json");
                }

                if (!packageInfo.version && !isUpdateByContent) {
                    throw new Error("400: No version found in the uploaded package's package.json");
                } else if (!packageInfo.version) {
                    packageInfo.version = "1.0.0";
                }

                packageMetadata = new PackageMetadata(packageInfo.name, packageInfo.version);
                
                if (packageInfo.repository?.homepage && packageInfo.repository?.homepage.includes('github.com')) {
                    const url = URLHandler.convertGithubURLToHttps(packageInfo.repository?.homepage);
                    packageMetadata.setUrl(url);
                }
                else if (packageInfo.repository?.url && packageInfo.repository?.url.includes('github.com')) {
                    const url = URLHandler.convertGithubURLToHttps(packageInfo.repository?.url);
                    packageMetadata.setUrl(url);
                }
                else {
                    throw new Error("400: No url found in the uploaded package's package.json");
                }
                
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
            // If no package.json found, ABORT MISSION
            throw new Error("400: No package.json found in the uploaded package");
        }
        else {
            // Set readme content if found
            if (readmeContent) {
                (packageMetadata as PackageMetadata).setReadMe(readmeContent);
            }
            else {
                Logger.logInfo("No README.md found in the uploaded package");
                throw new Error('400: No README.md found in the uploaded package');
                // or (packageMetadata as PackageMetadata).setReadMe("");
            }
        }
        return packageMetadata;
    }
}