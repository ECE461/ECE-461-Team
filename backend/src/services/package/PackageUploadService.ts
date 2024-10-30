import { Base64 } from 'js-base64';
import AdmZip from 'adm-zip';
import fs from 'fs';
import { PackageMetadata } from '../../models/package/PackageMetadata';
import { PackageData } from '../../models/package/PackageData';
import { S3 } from '../../utils/S3';

export class PackageUploadService {
    public async uploadPackage() {
    }

    public static extractPackageInfo(packageData: PackageData) : PackageMetadata {
        const zipBuffer = Buffer.from(packageData.getContent(), 'base64');
        const zip = new AdmZip(zipBuffer);
        let packageMetadata: PackageMetadata | null = null;
        let readmeContent: string = '';

        zip.getEntries().forEach((entry) => {
            const fileName = entry.entryName;
            console.log(fileName);
            if (fileName.includes('package.json')) {  // Use includes instead of endsWith to handle nested file structures
                console.log('Found package.json');
                const packageJsonContent = entry.getData().toString('utf8');
                const packageInfo = JSON.parse(packageJsonContent);

                packageMetadata = new PackageMetadata(packageInfo.name, packageInfo.version);
                packageMetadata.setUrl(packageInfo.repository?.url);
                console.log(packageMetadata.getUrl());
            }

            // TODO: What to do if no readme is found?
            if (fileName.toLowerCase().includes('readme.md')) {
                readmeContent = entry.getData().toString('utf8');
            }
        });

        if (packageMetadata === null) {
            throw new Error('400: No package.json found in the uploaded package');
        }

        if (packageMetadata && readmeContent) {
            (packageMetadata as PackageMetadata).setReadMe(readmeContent);
        }
        return packageMetadata;
    }

    public static async uploadToS3(packageData: PackageData, packageId: string) {
        try {
            const buffer = Buffer.from(packageData.getContent(), 'base64');


        } catch (error) {
            console.error('Error uploading package to S3:', error);
        }
    }
}