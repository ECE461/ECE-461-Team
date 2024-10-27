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
exports.URLHandler = void 0;
const axios_1 = __importDefault(require("axios"));
const Logger_1 = require("./Logger");
/**
 * @class URLHandler
 * @description
 * The URLHandler class is responsible for handling URL-related operations,
 * such as validating URLs, checking if a URL exists, extracting GitHub repository
 * URLs from npm package URLs, and constructing base API URLs for GitHub repositories.
 *
 * This class provides methods to interact with URLs and perform various operations
 * like setting repository URLs, getting base API URLs, and extracting repository names.
 *
 * @example
 * // Creating an instance of URLHandler
 * const urlHandler = new URLHandler('https://github.com/user/repo');
 *
 * // Setting the repository URL
 * await urlHandler.setRepoURL();
 *
 * // Getting the repository URL
 * const repoURL = urlHandler.getRepoURL();
 *
 * // Getting the base API URL
 * const baseAPI = urlHandler.getBaseAPI();
 *
 * @param {string} url - The URL to be handled.
 *
 * @method getRepoURL(): string
 * Returns the GitHub repository URL if set, otherwise an empty string.
 *
 * @method getBaseAPI(): string
 * Returns the base API URL for the GitHub repository if set, otherwise an empty string.
 *
 * @method getURL(): string
 * Returns the original URL.
 *
 * @method setRepoURL(): Promise<void>
 * Sets the GitHub repository URL and base API URL if the original URL is valid and exists.
 *
 * @method getRepoName(): string
 * Extracts and returns the repository name from the URL.
 *
 * @method static isValidURL(url: string): boolean
 * Checks if the provided URL is valid.
 *
 * @method static checkUrlExists(url: string): Promise<boolean>
 * Checks if the provided URL exists by making a HEAD request.
 *
 * @method static convertGithubURLToHttps(url: string): string
 *
 * @method static getGithubURLFromNpmURL(url: string): Promise<string | null>
 * Extracts and returns the GitHub repository URL from an npm package URL.
 */
class URLHandler {
    constructor(url) {
        this.githubURL = null; // the GitHub repository URL
        this.baseAPI = null; // the base API URL
        this.url = url;
    }
    /**
     * @method getRepoURL
     * @return {string} The GitHub repository URL if set, otherwise an empty string.
     * @description
     * This method returns the GitHub repository URL if set, otherwise an empty string.
     */
    getRepoURL() {
        if (this.githubURL === null) {
            return "";
        }
        return this.githubURL;
    }
    /**
     * @method getBaseAPI
     * @return {string} The base API URL for the GitHub repository if set, otherwise an empty string.
     * @description
     * This method returns the base API URL for the GitHub repository if set, otherwise an empty string.
     */
    getBaseAPI() {
        if (this.baseAPI === null) {
            return "";
        }
        return this.baseAPI;
    }
    /**
     * @method getURL
     * @return {string} The original URL.
     * @description
     * This method returns the original URL.
     */
    getURL() {
        return this.url;
    }
    /**
     * @method setRepoURL
     * @return {Promise<void>}
     * @description
     * This method sets the GitHub repository URL and base API URL if the original URL is valid and exists.
     */
    setRepoURL() {
        return __awaiter(this, void 0, void 0, function* () {
            if (URLHandler.isValidURL(this.url)) {
                const exists = yield URLHandler.checkUrlExists(this.url); // check URL is valid and exists
                if (!exists) {
                    return;
                }
                if (this.url.startsWith('https://www.npmjs.com/package/')) { // convert npm URL to github URL
                    this.githubURL = yield URLHandler.getGithubURLFromNpmURL(this.url);
                }
                else if (this.url.startsWith('https://github.com/')) { // set github URL directly
                    this.githubURL = this.url;
                }
                if (this.githubURL !== null) { // set base API URL if github URL is set
                    const urlParts = this.githubURL.split('github.com/')[1].split('/'); // divide the github URL into parts
                    const repoAuthority = urlParts[0]; // can be either the owner or the organization of the repo
                    const repoName = urlParts[1]; // name of the repository
                    this.baseAPI = `https://api.github.com/repos/${encodeURIComponent(repoAuthority)}/${encodeURIComponent(repoName)}`; // base API URL
                }
            }
        });
    }
    /**
     * @method getRepoName
     * @return {string} The repository name extracted from the URL.
     * @description
     * This method extracts and returns the repository name from the URL.
     * If the URL does not contain a repository name, it returns an empty string.
     */
    getRepoName() {
        const match = this.url.match(/\/([^\/]+?)(?:\.git)?$/);
        if (match && match.length > 1) {
            return match[1];
        }
        return "";
    }
    /**
    * @method getOwnerName
    * @return {string} The repository owner extracted from the github repository URL.
    * @description
    * This method extracts and returns the repository owner from the github repository URL.
    * If the URL does not contain a repository owner, it returns an empty string.
    */
    getOwnerName() {
        try {
            const parsedUrl = new URL(this.getRepoURL());
            const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0);
            if (pathParts.length >= 2) {
                return pathParts[0];
            }
        }
        catch (error) {
            Logger_1.Logger.logDebug(`Invalid URL or format: ${this.getRepoURL()} ${error}`);
        }
        return "";
    }
    /**
     * @method isValidURL
     * @param {string} url - The URL to be validated.
     * @return {boolean} True if the URL is valid, otherwise false.
     * @description
     * This static method checks if the provided URL is valid.
     */
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        }
        catch (error) {
            Logger_1.Logger.logDebug('Invalid URL format:' + error);
            return false;
        }
    }
    /**
     * @method checkUrlExists
     * @param {string} url - The URL to be checked.
     * @return {Promise<boolean>} True if the URL exists, otherwise false.
     * @description
     * This static method checks if the provided URL exists by making a HEAD request.
     */
    static checkUrlExists(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url, { method: 'HEAD' });
                return response.ok;
            }
            catch (error) {
                Logger_1.Logger.logInfo('Error checking URL:' + error);
                return false;
            }
        });
    }
    /**
     * @method staticGithubURLToHttps
     * @param {string} url - The URL to be converted
     * @return {Promise<boolean>} The https formatted version of the URL.
     * @description
     * This static method converts the provided GitHub URL to an https formatted URL.
     */
    static convertGithubURLToHttps(url) {
        let httpsUrl = url.replace(/^git\+/, '').replace(/\.git$/, '');
        if (httpsUrl.startsWith('git://')) {
            httpsUrl = httpsUrl.replace('git://', 'https://');
        }
        else if (httpsUrl.startsWith('git@')) {
            httpsUrl = httpsUrl.replace('git@', 'https://').replace(':', '/');
        }
        return httpsUrl;
    }
    /**
     * @method getGithubURLFromNpmURL
     * @param {string} url - The npm package URL.
     * @return {Promise<string | null>} The GitHub repository URL if found, otherwise null.
     * @description
     * This static method extracts and returns the GitHub repository URL from an npm package URL.
     * If the GitHub repository URL cannot be found, it returns null.
     */
    static getGithubURLFromNpmURL(url) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Get github repository URL from npm package URL
            try {
                // Extract package name from npm URL
                const regex = /\/package\/([^\/]+)/;
                const match = url.match(regex);
                const packageName = match ? match[1] : '';
                // Check package.json of npmjs package from registry.npmjs.org
                const response = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
                // Check that repository is a git repository
                if (((_a = response.data.repository) === null || _a === void 0 ? void 0 : _a.type) !== 'git') {
                    return null;
                }
                // Convert git repository URL to https format
                const githubURL = URLHandler.convertGithubURLToHttps(((_b = response.data.repository) === null || _b === void 0 ? void 0 : _b.url) || "");
                // Return null if no github URL found
                if (githubURL == "") {
                    return null;
                }
                return githubURL;
            }
            catch (error) {
                Logger_1.Logger.logInfo('Error getting github URL from npm package');
                Logger_1.Logger.logDebug(error);
            }
            return null;
        });
    }
}
exports.URLHandler = URLHandler;
