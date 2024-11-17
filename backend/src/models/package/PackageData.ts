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

export class PackageData {
    private content; // Zipped content converted to base-64
    private JSProgram; // TODO: Extension
    private uploadUrl;

    private static packageUploadSchema = Joi.object({
        Content: Joi.string()
            .custom((value, helpers) => {
                if (!PackageData.isValidBase64Zip(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            }),
        URL: Joi.string().uri(),
        debloat: Joi.boolean()
            .when('Content', { is: Joi.exist(), then: Joi.required() }), // debloat is required only if Content exists
        Name: Joi.string()
            .custom((value, helpers) => {
                if (!PackageName.isValidName(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
            .when('Content', { is: Joi.exist(), then: Joi.required() }), // Name is required only if Content exists
        JSProgram: Joi.string().optional()
            .custom((value, helpers) => {
                if (value && !PackageData.isValidJavaScript(value)) {
                    return helpers.error('any.invalid');
                }
            })
    }).xor('Content', 'URL').required();

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
                }),
            ID: Joi.string().required()
                .custom((value, helpers) => {
                    if (!PackageID.isValidID(value)) {
                        return helpers.error('any.invalid');
                    }
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
            URL: Joi.string().uri(),
            debloat: Joi.boolean().when('Content', { is: Joi.exist(), then: Joi.required() }),
            JSProgram: Joi.string().optional()
                .custom((value, helpers) => {
                    if (value && !PackageData.isValidJavaScript(value)) {
                        return helpers.error('any.invalid');
                    }
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
     */
    static async create(source: string, jsProgram : string, uploadUrl="") {
        // Create new instance
        const instance = new PackageData("", jsProgram, uploadUrl);

        // If Content has not been set from URL
        if (source == "" && instance.hasValidURL()) {
            Logger.logInfo(`Checking URL Metrics: ${source}`);
            // Need to check that URL passes rating stuff:
            if (!await PackageData.metricCheck(source)) {
                throw new Error("Package is not uploaded due to the disqualified rating.");
            }

            Logger.logInfo(`Setting content from URL: ${source}`);
            await instance.setContentFromURL(source);
        } else {
            Logger.logInfo(`Content not being updated from URL`);
        }
        return instance;
    }

    static async metricCheck(url: string) : Promise<boolean> {
        try {
            const Metrics = new MetricManager(url);
            const metrics = await Metrics.getMetrics();

            // TODO: need to add two other scores
            if (metrics.netScore >= 0.5 && metrics.busFactorValue >= 0.5 && metrics.correctnessValue >= 0.5 && metrics.maintainerValue >= 0.5 && metrics.licenseValue >= 0.5) {
                return true;
            }
            return false;
        } catch (error) {
            throw new Error("Internal Error: Could not get metrics");
        } 
    }

    // hasValidURL : Checks if URL is valid
    // @param url: string - URL to check
    private hasValidURL(): boolean {
        try {
            new URL(this.uploadUrl);
            return true;
        } catch (e) {
            return false;
        }
    }

    static isValidUploadRequestBody(reqBody: Request): boolean {
        const { error } = PackageData.packageUploadSchema.validate(reqBody);
        if (error) {
            return false;
        }
        return true;
    }

    static isValidUpdateRequestBody(reqBody: Request): boolean {
        const { error } = PackageData.packageUpdateSchema.validate(reqBody);
        if (error) {
            return false;
        }
        return true;
    }

    static isValidJavaScript(script: string): boolean {
        try {
            const context = createContext();
            runInContext(script, context);
            return true; // Script is valid
        } catch (error) {
            return false; // Script is not valid
        }
    }

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

    /* setContentFromURL : sets content from URL by getting 
    */
    private async setContentFromURL(url: string) {
        try {
            // TODO: need to get zipped content (without .git folder) from github or wherever and convert to base-64
            const urlHandler = new URLHandler(url);
            const owner = urlHandler.getOwnerName();
            const repo = urlHandler.getRepoName();

            const urlDownload = `https://api.github.com/${owner}/${repo}/zipball/`;

            const response = await axios.get(url, { responseType: 'arraybuffer' });

            this.content = Base64.fromUint8Array(new Uint8Array(response.data));
        } catch (error) {
            throw new Error("Error fetching content from URL");
        }
    }

    getContent() {
        return this.content;
    }

    getJSProgram() {
        return this.JSProgram;
    }

    getJson() {
        const json: {[key:string]: any} = {
            Content: this.content,
            JSProgram: this.JSProgram // TODO: might not need to include if empty string
        }

        if (this.uploadUrl != "") {
            json.URL = this.uploadUrl;
        }

        return json;
    }
}