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
exports.License = void 0;
const axios_1 = __importDefault(require("axios"));
const GITHUB_API = 'https://raw.githubusercontent.com';
// const NPM_API = 'https://registry.npmjs.org';
class License {
    /**
     * constructs a metrics manager for a GitHub repository
     *
     * @param owner the owner of the repository
     * @param repoName the name of the repository
     */
    constructor(owner, repoName) {
        this.owner = owner;
        this.repoName = repoName;
    }
    /**
     * getFileContent returns a boolean if the file contains LGPLv2.1
     *
     * @returns a boolean if the LGPLv2.1 is in the file, null if there is an error
     */
    getFileContent(path, default_branch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = `${GITHUB_API}/${this.owner}/${this.repoName}/${default_branch}/${path}`;
                const license_list = ['lgpl v2.1', 'mit license', 'apache license 2.0', 'bsd 3-clause license', 'lesser general public license version 2.1'];
                const response = yield axios_1.default.get(url, {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                });
                let hasLicense = license_list.some(license => response.data.toLowerCase().includes(license));
                //console.log(hasLicense); 
                return hasLicense;
            }
            catch (error) {
                //console.error(`findLicense -> Error when fetching file content in ${this.owner}/${this.repoName}  ${path}: ${error}`);
                //console.log(path);
                return null;
            }
        });
    }
    /**
     * getRepoLicense returns the license of the package
     *
     * @returns 1 if the license is LGPLv2.1, 0 otherwise
     */
    getRepoLicense() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // get the default branch of the repository
                const default_url = `https://api.github.com/repos/${this.owner}/${this.repoName}`;
                const default_response = yield axios_1.default.get(default_url, {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                });
                let default_branch = default_response.data.default_branch;
                //console.log(default_branch);
                // gets booleans of LICENSE and README.md files
                const [licenseFile, readMeFile] = yield Promise.all([
                    this.getFileContent('LICENSE', default_branch),
                    this.getFileContent('README.md', default_branch)
                ]);
                // checks if one or the other contains LGPLv2.1
                if (licenseFile || readMeFile) {
                    //console.log('License Found: LGPLv2.1');
                    return 1;
                }
                //console.log('License Not Found');
                return 0;
            }
            catch (error) {
                console.error(`getRepoLicense -> Error when fetching license in ${this.owner}/${this.repoName}:`, error.message);
                return 0;
            }
        });
    }
}
exports.License = License;
