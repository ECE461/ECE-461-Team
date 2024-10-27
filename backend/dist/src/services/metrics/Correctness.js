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
exports.Correctness = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
require("es6-promise/auto");
const dotenv = __importStar(require("dotenv"));
const git = __importStar(require("isomorphic-git"));
const node_1 = __importDefault(require("isomorphic-git/http/node"));
dotenv.config();
class Correctness {
    constructor(owner, repoName) {
        this.owner = owner;
        this.repoName = repoName;
        this.repoDir = path.join('/tmp', `${this.repoName}-${Date.now()}`);
        this.repoContents = [];
    }
    getCorrectnessScore() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchRepoContents();
            // Run checks concurrently
            const [readme, stability, tests, linters, dependencies] = yield Promise.all([
                this.checkReadme().then(result => result ? 1 : 0),
                this.checkStability().then(result => result ? 1 : 0),
                this.checkTests().then(result => result ? 1 : 0),
                this.checkLinters().then(result => result ? 1 : 0),
                this.checkDependencies().then(result => result ? 1 : 0)
            ]);
            // Assign weights and calculate score
            const readmeWeight = 0.2;
            const stabilityWeight = 0.25;
            const testsWeight = 0.3;
            const lintersWeight = 0.1;
            const dependenciesWeight = 0.15;
            const finalScore = (readme * readmeWeight +
                stability * stabilityWeight +
                tests * testsWeight +
                linters * lintersWeight +
                dependencies * dependenciesWeight);
            // Clean up repository
            yield this.cleanup();
            return parseFloat(finalScore.toFixed(3));
        });
    }
    fetchRepoContents() {
        return __awaiter(this, void 0, void 0, function* () {
            const dir = this.repoDir;
            const url = `https://github.com/${this.owner}/${this.repoName}`;
            if (!fs.existsSync(dir)) {
                yield git.clone({
                    fs,
                    http: node_1.default,
                    dir,
                    url,
                    singleBranch: true,
                    depth: 1
                });
            }
            this.repoContents = yield git.listFiles({ fs, dir });
        });
    }
    checkReadme() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repoContents.some(file => file.toLowerCase() === 'readme.md');
        });
    }
    checkStability() {
        return __awaiter(this, void 0, void 0, function* () {
            const releasesUrl = `https://api.github.com/repos/${this.owner}/${this.repoName}/releases`;
            try {
                const response = yield fetch(releasesUrl, {
                    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                });
                const releases = yield response.json();
                return releases.length > 1;
            }
            catch (error) {
                console.error('Error fetching releases:', error);
                return false;
            }
        });
    }
    checkTests() {
        return __awaiter(this, void 0, void 0, function* () {
            const testPatterns = [/test/i, /spec/i, /^__tests__$/i];
            return this.repoContents.some(file => testPatterns.some(pattern => pattern.test(file)));
        });
    }
    checkLinters() {
        return __awaiter(this, void 0, void 0, function* () {
            const linterFiles = [
                '.eslintrc', '.eslintrc.json', '.eslintrc.js',
                '.eslintignore', '.stylelintrc',
                '.stylelintrc.json', '.stylelintrc.js',
                '.stylelintignore'
            ];
            return this.repoContents.some(file => linterFiles.includes(file.toLowerCase()));
        });
    }
    checkDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            const packageJsonFile = this.repoContents.find(file => file.toLowerCase() === 'package.json');
            if (!packageJsonFile) {
                return false;
            }
            try {
                const packageJsonPath = path.join(this.repoDir, packageJsonFile);
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                return Object.keys(packageJson.dependencies || {}).length > 0;
            }
            catch (error) {
                console.error('Error reading package.json:', error);
                return false;
            }
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                fs.rmSync(this.repoDir, { recursive: true });
            }
            catch (error) {
                console.error('Error removing repository directory:', error);
            }
        });
    }
    runChecks() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchRepoContents();
            const checks = yield Promise.all([
                this.checkReadme(),
                this.checkStability(),
                this.checkTests(),
                this.checkLinters(),
                this.checkDependencies()
            ]);
            console.log('README exists:', checks[0]);
            console.log('Stability (version exists):', checks[1]);
            console.log('Tests defined:', checks[2]);
            console.log('Linters defined:', checks[3]);
            console.log('Dependencies defined:', checks[4]);
            yield this.cleanup();
        });
    }
}
exports.Correctness = Correctness;
