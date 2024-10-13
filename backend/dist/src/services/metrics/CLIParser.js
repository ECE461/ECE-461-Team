"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.CLIParser = void 0;
const commander_1 = require("commander");
const url_1 = require("url");
const MetricManager_1 = require("./MetricManager");
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class CLIParser {
    constructor() {
        this.program = new commander_1.Command();
        this.configureProgram();
    }
    configureProgram() {
        this.program
            .name('CLIParser')
            .description('CLI program to parse URL and output measured metrics')
            .version('0.0.1');
        this.program
            .arguments('<url>')
            .description('CLI program takes in URL of a package and outputs measured metrics')
            .action((urlString) => __awaiter(this, void 0, void 0, function* () {
            yield this.handleAction(urlString);
        }));
    }
    run(argv) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.program.parseAsync(argv);
        });
    }
    handleAction(urlString) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isTokenValid = yield this.checkGitHubToken(process.env.GITHUB_TOKEN);
                if (!isTokenValid) {
                    console.error('Invalid GitHub token');
                    process.exit(1);
                }
                // Sanitize the URL to prevent command injection
                const sanitized_urlString = this.sanitizeGitUrl(urlString);
                const repoLink = yield this.getRepoLink(sanitized_urlString);
                if (!repoLink) {
                    console.error('Invalid URL:', urlString);
                    process.exit(1);
                }
                // Parse the URL
                const parsedUrl = new url_1.URL(repoLink);
                // Extract owner and repository name and get metrics
                let Metrics = new MetricManager_1.MetricManager(parsedUrl.pathname);
                const metrics = yield Metrics.getMetrics();
                const result = {
                    URL: repoLink,
                    NetScore: metrics.netScore,
                    NetScore_Latency: metrics.netLatency,
                    RampUp: metrics.rampUpValue,
                    RampUp_Latency: metrics.rampUpLatency,
                    Correctness: metrics.correctnessValue,
                    Correctness_Latency: metrics.correctnessLatency,
                    BusFactor: metrics.busFactorValue,
                    BusFactor_Latency: metrics.busFactorLatency,
                    ResponsiveMaintainer: metrics.maintainerValue,
                    ResponsiveMaintainer_Latency: metrics.maintainerLatency,
                    License: metrics.licenseValue,
                    License_Latency: metrics.licenseLatency
                };
                console.log(JSON.stringify(result));
            }
            catch (error) {
                console.error('Invalid URL:', error.message);
                process.exit(1);
            }
        });
    }
    checkGitHubToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!token) {
                return false;
            }
            try {
                const response = yield axios_1.default.get('https://api.github.com/user', {
                    headers: {
                        Authorization: `token ${token}`
                    }
                });
                return response.status === 200;
            }
            catch (error) {
                return false;
            }
        });
    }
    sanitizeGitUrl(url) {
        return url.replace(/[;`<>]/g, '');
    }
    getRepoLink(url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const npmRegex = /^https?:\/\/(www\.)?npmjs\.com\/package\/([^\/]+)$/;
            const githubRegex = /^https?:\/\/(www\.)?github\.com\/([^\/]+\/[^\/]+)$/;
            if (githubRegex.test(url)) {
                return url;
            }
            else if (npmRegex.test(url)) {
                const match = url.match(npmRegex);
                if (match) {
                    const packageName = match[2];
                    const npmApiUrl = `https://registry.npmjs.org/${packageName}`;
                    try {
                        const response = yield axios_1.default.get(npmApiUrl, {
                            headers: {
                                Authorization: `token ${process.env.GITHUB_TOKEN}`
                            }
                        });
                        const repoUrl = (_a = response.data.repository) === null || _a === void 0 ? void 0 : _a.url;
                        if (repoUrl) {
                            // Convert git+https URLs to https URLs
                            const sanitizedRepoUrl = repoUrl.replace(/^git\+/, '');
                            if (sanitizedRepoUrl.endsWith('.git')) {
                                return sanitizedRepoUrl.slice(0, -4);
                            }
                            return sanitizedRepoUrl;
                        }
                        else {
                            console.error('No repository found for npm package:', packageName);
                        }
                    }
                    catch (error) {
                        console.error('Error fetching npm package information:', error);
                    }
                }
            }
            else {
                console.error('Invalid URL:', url);
            }
            return null;
        });
    }
}
exports.CLIParser = CLIParser;
// If this file is run directly, execute the CLI
if (require.main === module) {
    const cliParser = new CLIParser();
    cliParser.run(process.argv);
}
