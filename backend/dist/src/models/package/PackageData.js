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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageData = void 0;
const joi_1 = __importDefault(require("joi"));
const vm_1 = require("vm");
const axios_1 = __importDefault(require("axios"));
const js_base64_1 = require("js-base64");
const MetricManager_1 = require("../../services/metrics/MetricManager");
const URLHandler_1 = require("../../utils/URLHandler");
const Logger_1 = require("../../utils/Logger");
class PackageData {
    /* Private Constructor : (only can be used in create method)
     * - Uses create method becasue setContentFromURL is async
     *
     * @param source: string - initially "" to initialize "content", "content" will be set in create method
     * @param jsProgram: string - jsProgram for sensitive data
     */
    constructor(source, jsProgram) {
        //TODO: might change this to take in an object?? to check that Content/URL not set at same time
        this.JSProgram = jsProgram;
        this.content = source;
    }
    /* create : Static method to create an instance
     * - Uses create method becasue setContentFromURL is async
     *
     * @param source: string - URL or base-64 encoded content
     * @param jsProgram: string - jsProgram for sensitive data
     * @returns Promise
     */
    static create(source, jsProgram) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new PackageData("", jsProgram);
            if (instance.isValidURL(source)) {
                Logger_1.Logger.logInfo(`Checking URL Metrics: ${source}`);
                // Need to check that URL passes rating stuff:
                if (!(yield PackageData.metricCheck(source))) {
                    throw new Error("Package is not uploaded due to the disqualified rating.");
                }
                Logger_1.Logger.logInfo(`Setting content from URL: ${source}`);
                yield instance.setContentFromURL(source);
            }
            else {
                Logger_1.Logger.logInfo(`Setting content from base-64 encoded string`);
                instance.content = source;
            }
            return instance;
        });
    }
    static metricCheck(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const Metrics = new MetricManager_1.MetricManager(url);
                const metrics = yield Metrics.getMetrics();
                // TODO: need to add two other scores
                if (metrics.netScore >= 0.5 && metrics.busFactorValue >= 0.5 && metrics.correctnessValue >= 0.5 && metrics.maintainerValue >= 0.5 && metrics.licenseValue >= 0.5) {
                    return true;
                }
                return false;
            }
            catch (error) {
                throw new Error("Internal Error: Could not get metrics");
            }
        });
    }
    // isValidURL : Checks if URL is valid
    // @param url: string - URL to check
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static isValidUploadOrUpdateRequest(reqBody) {
        const { error } = PackageData.packageUploadSchema.validate(reqBody);
        if (error) {
            return false;
        }
        return true;
    }
    static isValidJavaScript(script) {
        try {
            const context = (0, vm_1.createContext)();
            (0, vm_1.runInContext)(script, context);
            return true; // Script is valid
        }
        catch (error) {
            return false; // Script is not valid
        }
    }
    static isValidBase64Zip(base64String) {
        // Check if the string is base64
        const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
        if (!base64Pattern.test(base64String)) {
            return false; // Not a valid base64 string
        }
        // Decode the base64 string
        const buffer = Buffer.from(base64String, 'base64');
        // Check if the buffer starts with the ZIP file signature (PK\x03\x04)
        const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
        return buffer.slice(0, 4).equals(zipSignature);
    }
    /* setContentFromURL : sets content from URL by getting
    */
    setContentFromURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // TODO: need to get zipped content (without .git folder) from github or wherever and convert to base-64
                const urlHandler = new URLHandler_1.URLHandler(url);
                const owner = urlHandler.getOwnerName();
                const repo = urlHandler.getRepoName();
                const urlDownload = `https://api.github.com/${owner}/${repo}/zipball/`;
                const response = yield axios_1.default.get(url, { responseType: 'arraybuffer' });
                const zipBuffer = Buffer.from(response.data, 'binary');
                this.content = js_base64_1.Base64.fromUint8Array(new Uint8Array(zipBuffer));
            }
            catch (error) {
                throw new Error("Error fetching content from URL");
            }
        });
    }
    getContent() {
        return this.content;
    }
    getJSProgram() {
        return this.JSProgram;
    }
    getJson() {
        // API never sends URL back as response
        return {
            Content: this.content,
            JSProgram: this.JSProgram // TODO: might not need to include if empty string
        };
    }
}
exports.PackageData = PackageData;
PackageData.packageUploadSchema = joi_1.default.object({
    Content: joi_1.default.string()
        .custom((value, helpers) => {
        if (!PackageData.isValidBase64Zip(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }),
    URL: joi_1.default.string().uri(),
    JSProgram: joi_1.default.string().optional()
        .custom((value, helpers) => {
        if (value && !PackageData.isValidJavaScript(value)) {
            return helpers.error('any.invalid');
        }
    })
}).xor('Content', 'URL');
