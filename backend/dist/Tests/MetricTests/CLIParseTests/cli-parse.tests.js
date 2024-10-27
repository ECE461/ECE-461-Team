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
const CLIParser_1 = require("../../../src/services/metrics/CLIParser");
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
jest.mock('axios');
jest.mock('../../../src/services/metrics/MetricManager');
describe('CLI parse Tests', () => {
    jest.setTimeout(30000);
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Sanitize Git URL', () => {
        const url = 'https:://github.com/owner/repo;;`<>';
        const cliParser = new CLIParser_1.CLIParser();
        const sanitizedUrl = cliParser.sanitizeGitUrl(url);
        expect(sanitizedUrl).toBe('https:://github.com/owner/repo');
    });
    test('Get Repo Link - GitHub URL', () => __awaiter(void 0, void 0, void 0, function* () {
        const url = 'https://github.com/owner/repo';
        const cliParser = new CLIParser_1.CLIParser();
        const repoLink = yield cliParser.getRepoLink(url);
        expect(repoLink).toBe(url);
    }));
    test('Get Repo Link - NPM URL with repository', () => __awaiter(void 0, void 0, void 0, function* () {
        const url = 'https://www.npmjs.com/package/browserify';
        const repoUrl = 'https://github.com/browserify/browserify';
        const cliParser = new CLIParser_1.CLIParser();
        axios_1.default.get.mockResolvedValueOnce({
            data: {
                repository: {
                    url: repoUrl
                }
            }
        });
        const repoLink = yield cliParser.getRepoLink(url);
        expect(repoLink).toBe(repoUrl);
    }));
    test('Get Repo Link - NPM URL without repository', () => __awaiter(void 0, void 0, void 0, function* () {
        const url = 'https://www.npmjs.com/package/nonexistent-package';
        const cliParser = new CLIParser_1.CLIParser();
        axios_1.default.get.mockResolvedValueOnce({
            data: {}
        });
        const repoLink = yield cliParser.getRepoLink(url);
        expect(repoLink).toBeNull();
    }));
    test('Get Repo Link - Invalid URL', () => __awaiter(void 0, void 0, void 0, function* () {
        const url = 'https://invalid-url.com/package';
        const cliParser = new CLIParser_1.CLIParser();
        const repoLink = yield cliParser.getRepoLink(url);
        expect(repoLink).toBeNull();
    }));
    test('Get Repo Link - Error fetching npm package information', () => __awaiter(void 0, void 0, void 0, function* () {
        const url = 'https://www.npmjs.com/package/browserify';
        const cliParser = new CLIParser_1.CLIParser();
        axios_1.default.get.mockRejectedValueOnce(new Error('Network Error'));
        const repoLink = yield cliParser.getRepoLink(url);
        expect(repoLink).toBeNull();
    }));
    test('CLI Action - Invalid GitHub token', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.GITHUB_TOKEN = 'invalid_token';
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit: Invalid GitHub token'); });
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        const cliParser = new CLIParser_1.CLIParser();
        const program = cliParser['program'];
        yield expect(program.parseAsync(['node', 'CLIParser', 'https://github.com/owner/repo'])).rejects.toThrow('process.exit: Invalid GitHub token');
        expect(mockConsoleError).toHaveBeenCalledWith('Invalid GitHub token');
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    }));
    /*
        test('CLI Action - Valid GitHub token and valid URL', async () => {
            process.env.GITHUB_TOKEN = 'valid_token';
            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200
            });
    
            const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    
            // Mock MetricManager methods
            const mockGetMetrics = jest.fn().mockResolvedValue({
                netScore: 0.6,
                netLatency: 0.152,
                rampUpValue: 0.5,
                rampUpLatency: 0.003,
                correctnessValue: 0.7,
                correctnessLatency: 0.109,
                busFactorValue: 0.3,
                busFactorLatency: 0.004,
                maintainerValue: 0.2,
                maintainerLatency: 0.013,
                licenseValue: 1,
                licenseLatency: 0.023
            });
            (MetricManager as jest.Mock).mockImplementation(() => {
                return {
                    getMetrics: mockGetMetrics
                };
            });
    
            const cliParser = new CLIParser();
            const program = cliParser['program'];
            await expect(program.parseAsync(['node', 'CLIParser', 'https://github.com/owner/repo'])).rejects.toThrow('process.exit');
            expect(mockConsoleLog).toHaveBeenCalled();
            expect(mockGetMetrics).toHaveBeenCalled();
            mockConsoleLog.mockRestore();
            mockConsoleError.mockRestore();
            mockExit.mockRestore();
        });*/
});
