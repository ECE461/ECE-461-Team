import Joi from 'joi';
import { createContext, runInContext } from 'vm';
import axios from 'axios';
import { Base64 } from 'js-base64';
import fs from 'fs';
import { MetricManager } from '../../services/metrics/MetricManager';
import { URLHandler } from '../../utils/URLHandler';
import { Logger } from '../../utils/Logger';
import { Request } from 'express';
import { PackageName } from './PackageName';
import { PackageVersion } from './PackageVersion';
import { PackageID } from './PackageID';
import * as zlib from 'zlib';
import * as tar from 'tar';
import archiver from 'archiver';
import * as stream from 'stream';
import * as path from 'path';
import * as rimraf from 'rimraf';

/* PackageData : Class to handle package data
 * @method: create - constructor
 * @method: isValidJavaScript
 * @method: isValidBase64Zip
 * @method: setContentFromURL
 * @method: isValidUploadRequestBody
 * @method: isValidUpdateRequestBody
 * @method: metricCheck
 * @method: downloadGithubPackage
 * @method: downloadNpmPackage
 * @method: createZip
 * @method: cleanupTempDirectory
 * @method: hasValidURL
 * @method: getJson()
 * @method: getUploadUrl
 * @method: getJSProgram
 * @method: getContent
 * @method: getSourceType
 */
export class PackageData {
    private content; // Zipped content converted to base-64
    private JSProgram; // TODO: Extension
    private uploadUrl;

    /* Schema for verifying upload request body */
    private static packageUploadSchema = Joi.object({
        Content: Joi.string()
            .custom((value, helpers) => {
                if (!PackageData.isValidBase64Zip(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            }),
        URL: Joi.string().uri(),
        debloat: Joi.boolean().optional(), // debloat is required only if Content exists
        Name: Joi.string()
            .custom((value, helpers) => {
                if (!PackageName.isValidName(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
            .required(),
        JSProgram: Joi.string().optional()
            .custom((value, helpers) => {
                if (value && !PackageData.isValidJavaScript(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            }),
        Version: Joi.string().required()
            .custom((value, helpers) => {
                if (!PackageVersion.isValidVersion(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
    }).xor('Content', 'URL').required();

    /* packageUpdateSchema : Schema for verifying update request body */
    private static packageUpdateSchema = Joi.object({
        metadata: Joi.object({
            Name: Joi.string().required()
                .custom((value, helpers) => {
                    if (!PackageName.isValidName(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
            Version: Joi.string().required()
                .custom((value, helpers) => {
                    if (!PackageVersion.isValidVersion(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
            ID: Joi.string().required()
                .custom((value, helpers) => {
                    if (!PackageID.isValidID(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
        }).required(),
        data: Joi.object({
            Name: Joi.string().when('Content', { is: Joi.exist(), then: Joi.required() })
                .custom((value, helpers) => {
                    if (!PackageName.isValidName(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
            Content: Joi.string()
                .custom((value, helpers) => {
                    if (!PackageData.isValidBase64Zip(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
            Version: Joi.string().required()
                .custom((value, helpers) => {
                    if (!PackageVersion.isValidVersion(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
            URL: Joi.string().uri(),
            debloat: Joi.boolean().optional(),
            JSProgram: Joi.string().optional()
                .custom((value, helpers) => {
                    if (value && !PackageData.isValidJavaScript(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                })
        }).xor('Content', 'URL').required()
        
    }).required();

    /* Private Constructor : (only can be used in create method)
     * - Uses create method becasue setContentFromURL is async 
     *
     * @param source: string - initially "" to initialize "content", "content" will be set in create method
     * @param jsProgram: string - jsProgram for sensitive data
     */
    private constructor(source: string, jsProgram: string, uploadUrl: string) {
        //TODO: might change this to take in an object?? to check that Content/URL not set at same time
        this.JSProgram = jsProgram;
        this.content = source;
        this.uploadUrl = uploadUrl;
    }

    /* create : Static method to create an instance
     * - Uses create method becasue setContentFromURL is async
     * 
     * @param source: string - URL or base-64 encoded content
     * @param jsProgram: string - jsProgram for sensitive data
     * @returns Promise
     * 
     * Three ways of setting this:
     * (1) Upload/Update with URL: source is URL, no uploadUrl given -> uploadUrl=source, content will be set from URL
     * (2) Upload/Update/Download with Content: source is base-64 encoded content & no uploadUrl given -> content=source, uploadUrl=""
     * (3) Download with URL: source is Content, uploadUrl is given -> content=source, uploadUrl=uploadUrl
     */
    static async create(source: string, jsProgram : string, uploadUrl="") {
        // Create new instance
        const instance = new PackageData(source, jsProgram, uploadUrl);

        // If Content has not been set from URL
        if (URLHandler.isValidURL(source) && uploadUrl == "") {
            // Set uploadUrl to url source
            instance.uploadUrl = source;

            // Update content with base-64 encoding from URL
            Logger.logInfo(`Setting content from URL: ${source}`);
            await instance.setContentFromURL(source);
        } else if (!URLHandler.isValidURL(source)) {
            Logger.logInfo(`Content being set from source.`);
            if (uploadUrl != "") {
                Logger.logInfo(`Content and URL both set: Used for Download of package which was uploaded with URL.`);
            }
        }
        return instance;
    }

    static async metricCheck(url: string) : Promise<boolean> {
        try {
            const urlH = await URLHandler.create(url);
            const Metrics : MetricManager = await MetricManager.create(URLHandler.standardizeGitHubURL(urlH.getRepoURL()));
            const metrics = await Metrics.getMetrics();

            // Check if scores are above threshold
            if (
                metrics.netScore >= 0.5 
                && metrics.busFactorValue >= 0.5 
                && metrics.correctnessValue >= 0.5 
                && metrics.maintainerValue >= 0.5 
                && metrics.licenseValue >= 0.5
                && metrics.pullRequestValue >= 0.5
                && metrics.rampUpValue >= 0.5
                && metrics.dependencyValue >= 0.5
            ) {
                return true;
            }
            Logger.logDebug("Metrics did not pass rating: " + JSON.stringify(metrics));
            return true;
        } catch (error) {
            throw new Error("Internal Error: Could not get metrics");
        } 
    }

    /* hasValidURL : Checks if URL is valid
     * @param url: string - URL to check
     * @returns boolean - true if URL
     */
    private hasValidURL(): boolean {
        try {
            new URL(this.uploadUrl);
            return true;
        } catch (e) {
            return false;
        }
    }

    /*
     * isValidUploadRequestBody : Checks if request body is valid
     * @param reqBody: Request - request body
     * @returns boolean - true if valid
     */
    static isValidUploadRequestBody(reqBody: Request): boolean {
        const { error } = PackageData.packageUploadSchema.validate(reqBody);
        if (error) {
            Logger.logDebug(`Error matching UPLOAD request body: ${error}`);
            return false;
        }
        return true;
    }

    /*
     * isValidUpdateRequestBody : Checks if request body is valid for update
     * @param reqBody: Request - request body
     * @returns boolean - true if valid
     */
    static isValidUpdateRequestBody(reqBody: Request): boolean {
        const { error } = PackageData.packageUpdateSchema.validate(reqBody);
        if (error) {
            Logger.logDebug(`Error matching UPDATE request body: ${error}`);
            return false;
        }
        return true;
    }

    /* isValidJavaScript : Checks if script is valid
     * @param script: string - script to check
     * @returns boolean - true if valid
     */
    static isValidJavaScript(script: string): boolean {
        try {
            const context = createContext();
            runInContext(script, context);
            return true; // Script is valid
        } catch (error) {
            return false; // Script is not valid
        }
    }

    /* isValidBase64Zip : Checks if base64 string is valid
     * @param base64String: string - base64 string to check
     * @returns boolean - true if valid
     */
    static isValidBase64Zip(base64String: string): boolean{
        // Check if the string is base64
        const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
        if (!base64Pattern.test(base64String)) {
            return false; // Not a valid base64 string
        }
    
        // Decode the base64 string
        const buffer = Buffer.from(base64String, 'base64');
    
        // Check if the buffer starts with the ZIP file signature (PK\x03\x04)
        const zipSignature = Uint8Array.from([0x50, 0x4b, 0x03, 0x04]);
        return buffer.slice(0, 4).equals(zipSignature);
    }

    /* setContentFromURL : sets content from URL
     * @param url: string - URL to get content from
     */
    private async setContentFromURL(url: string) {
        try {
            // TODO: need to get zipped content (without .git folder) from github or wherever and convert to base-64
            const urlHandler = await URLHandler.create(url);
            
            const owner = urlHandler.getOwnerName();
            const repo = urlHandler.getRepoName();

            // Version: 4 cases
            // (1) default=package.json
            // (2) Plain github: https://github.com/{owner}/{repo}
            // (3) Plain npm: https://www.npmjs.com/package/{package}
            // (4) Version from github tags: https://github.com/lodash/lodash/tree/4.17.21
            // (5) Version from github releases (w/ associated tag): https://github.com/facebook/react/releases/tag/v17.0.2
            // (6) Version from npm: https://www.npmjs.com/package/underscore/v/1.7.0 
            // (7) No version found: version=1.0.0

            // Case 4: Version from github tags -- must be before plain github
            const regexTag = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/tree\/([\w.-]+)$/;
            const matchGithubTag = (urlHandler.getURL()).match(regexTag);
            if (matchGithubTag) {
                const rawVersion = matchGithubTag[3];
                const urlDownload = `https://api.github.com/repos/${owner}/${repo}/zipball/${rawVersion}`;
                Logger.logDebug(urlDownload);
                this.content = await this.downloadGithubPackage(urlDownload);
                return;
            }

            // Case 5: Version from github releases - must be before plain github
            
            const regexRelease = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/releases\/tag\/([\w.-]+)$/;
            const matchGithubRelease = (urlHandler.getURL()).match(regexRelease);
            if (matchGithubRelease) {
                const rawVersion = matchGithubRelease[3];
                const urlDownload = `https://api.github.com/repos/${owner}/${repo}/zipball/${rawVersion}`;
                Logger.logDebug(urlDownload);
                this.content = await this.downloadGithubPackage(urlDownload);
                return;
            }

            // Case 2: Plain github
            const regexPlainGithub = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)$/;
            const matchPlainGithub = (urlHandler.getURL()).match(regexPlainGithub);
            if (matchPlainGithub) {
                const urlDownload = `https://api.github.com/repos/${owner}/${repo}/zipball/`;
                Logger.logDebug(urlDownload);
                this.content = await this.downloadGithubPackage(urlDownload);
                return;
            }

            // Case 6: Version from npm - must be before plain npm
            const regexNpmVersion = /^https:\/\/www\.npmjs\.com\/package\/([\w.-]+)\/v\/([\w.-]+)$/;
            const matchNpmVersion = (urlHandler.getURL()).match(regexNpmVersion);
            if (matchNpmVersion) {
                const rawVersion = matchNpmVersion[2];
                const packageName = matchNpmVersion[1];
                this.content = await this.downloadNpmPackage(packageName, rawVersion);
                return;
            }

            // Case 3: Plain npm
            const regexPlainNpm = /^https:\/\/www\.npmjs\.com\/package\/([\w@./-]+)$/;
            const matchPlainNpm = (urlHandler.getURL()).match(regexPlainNpm);
            if (matchPlainNpm) {
                const packageName = matchPlainNpm[1];
                this.content = await this.downloadNpmPackage(packageName);
                return;
                // urlDownload = `https://api.github.com/${owner}/${repo}/zipball/`;   
            }

            // Case 7: Does not match one of the following cases
            throw new Error("Error 400: URL does not match any of the supported formats.");

            
        } catch (error) {
            throw new Error("Error fetching content from URL" + error);
        }
    }

    /* downloadGithubPackage : Downloads package from github
     * @param urlDownload: string - URL to download from
     * @returns Promise
     */
    private async downloadGithubPackage(urlDownload: string) {
        const response = await axios.get(urlDownload, { responseType: 'arraybuffer', headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
        }});

        return Base64.fromUint8Array(new Uint8Array(response.data));
    }

    /* downloadNpmPackage : Downloads package from npm by converting npm tgz to zip file
     * @param packageName: string - name of package
     * @param version: string - version of package
     * @returns Promise
     */
    private async downloadNpmPackage(packageName: string, version: string = 'latest') {
        try {
            // Fetch metadata from npm
            Logger.logDebug(`Fetching metadata for package "${packageName}" from npm...`);
            const metadataUrl = `https://registry.npmjs.org/${packageName}`;
            const metadataResponse = await axios.get(metadataUrl);
            const metadata = metadataResponse.data;

            // Get tarball URL for the specified version
            if ( version === 'latest') {
                version = metadata['dist-tags'].latest;
            }
            const versionInfo = metadata.versions[version];
            if (!versionInfo) {
                throw new Error(`Version "${version}" not found for package "${packageName}".`);
            }
            const tarballUrl = versionInfo.dist.tarball;
            Logger.logInfo(`Downloading tarball for ${packageName}@${version} from ${tarballUrl}`);

            // Download tarball as a buffer
            const tarballResponse = await axios.get(tarballUrl, { responseType: 'arraybuffer' });
            const tarballBuffer = Buffer.from(tarballResponse.data);

            // Step 4: Save the tarball buffer to a temporary file
            const tarballFilePath = path.join(__dirname, 'temp.tar.gz');
            fs.writeFileSync(tarballFilePath, tarballBuffer);

            // Step 5: Extract the tarball (.tgz) into files
            const tempDir = path.join(__dirname, 'temp');  // Temporary directory for extracted files

            // Create the temporary directory if it doesn't exist
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            // Extract the tarball file to the temp directory
            await tar.x({
                file: tarballFilePath,
                cwd: tempDir,
            });

            // Step 6: Create a .zip archive
            const zipBuffer = await this.createZip(tempDir);

            // Step 7: Encode the .zip buffer as Base64
            const base64Zip = zipBuffer.toString('base64');

            console.log(`Successfully fetched and converted ${packageName}@${version} to Base64 .zip.`);

            // Cleanup: Remove the temporary directory and its contents
            this.cleanupTempDirectory(tempDir);
            fs.unlinkSync(tarballFilePath);  // Delete the tarball file after extraction

            return base64Zip;
        } catch (error) {
            // Cleanup in case of an error as well
            this.cleanupTempDirectory(path.join(__dirname, 'temp'));
            throw new Error(`Failed to download package "${packageName}@${version}" from npm: ${error}`);
        }
    }

    /* cleanupTempDirectory : Recursively deletes a directory and its contents
     * @param dirPath: string - path to the directory to delete
     */
    private async cleanupTempDirectory(dirPath: string) {
        try {
            rimraf.sync(dirPath);
            Logger.logDebug(`Deleted temporary directory: ${dirPath}`);
        } catch (err) {
            throw new Error(`Failed to delete temporary directory: ${dirPath}, ${err}`);
        }
    }

    /* createZip : Creates a .zip archive from a directory
     * @param sourceDir: string - path to the directory to archive
     * @returns Promise
     */

    private async createZip(sourceDir: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const archive = archiver('zip', {
                zlib: { level: 9 }, // Maximum compression
            });
    
            archive.on('data', (chunk) => {
                chunks.push(chunk);
            });
    
            archive.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
    
            archive.on('error', reject);
    
            // Add files from the source directory
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    getContent() {
        return this.content;
    }

    getJSProgram() {
        return this.JSProgram;
    }

    getUploadUrl() {
        return this.uploadUrl;
    }

    getSourceType() {
        if (this.uploadUrl.trim() !== "" && this.uploadUrl !== "\"\"") {
            return "URL";
        } else {
            return "Content";
        }
    }

    /* getJson : Returns JSON representation of the package data
     * @returns JSON object
     */
    getJson() {
        const json: {[key:string]: any} = {
            Content: this.content,
        }

        if (this.JSProgram.trim() !== "" && this.JSProgram !== "\"\"") {
            json.JSProgram = this.JSProgram; // TODO: might not need to include if empty string
        }
        if (this.uploadUrl.trim() !== "" && this.uploadUrl !== "\"\"") {
            json.URL = this.uploadUrl;
        }

        return json;
    }
}