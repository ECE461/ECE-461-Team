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
exports.Maintainer = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const GITHUB_API = 'https://api.github.com';
class Maintainer {
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
     * Calculates the maintainer score of the repository
     *
     * @returns the maintainer score
     */
    getMaintainerScore() {
        return __awaiter(this, void 0, void 0, function* () {
            // get the date of last commit
            const lastCommitDateStr = yield this.getLastCommit();
            const lastCommitDate = new Date(lastCommitDateStr);
            const todayDate = new Date();
            // calculate difference in days between the last commit and today
            const dateDiff = Math.abs(todayDate.getTime() - lastCommitDate.getTime());
            const daysDiff = Math.ceil(dateDiff / (1000 * 3600 * 24));
            //console.log('Days Diff: ', daysDiff);
            // find open to total issue ratio
            const openIssueRatio = yield this.getOpenIssueRatioCount();
            //console.log("Open Issue Ratio: ", openIssueRatio);
            // calculate score (0-1) based on how long ago last commit was & open to total issue ratio
            let score = 0;
            if (daysDiff < 73 && openIssueRatio < 0.02) {
                score = 1.000;
            }
            else if (daysDiff < 146 && openIssueRatio < 0.04) {
                score = 0.800;
            }
            else if (daysDiff < 219 && openIssueRatio < 0.06) {
                score = 0.600;
            }
            else if (daysDiff < 292 && openIssueRatio < 0.08) {
                score = 0.400;
            }
            else if (daysDiff < 365 && openIssueRatio < 0.1) {
                score = 0.200;
            }
            else {
                score = 0.000;
            }
            return parseFloat(score.toFixed(3));
        });
    }
    /**
     * Fetches the open issue count of the repository
     *
     * @returns the open issue count
     */
    getOpenIssueRatioCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${GITHUB_API}/repos/${this.owner}/${this.repoName}`;
            const closedUrl = `${GITHUB_API}/repos/${this.owner}/${this.repoName}/issues`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                });
                const openIssues = response.data.open_issues_count; // this number includes open pull requests
                //console.log('Open Issue Count: ', openIssues);
                const closedResponse = yield axios_1.default.get(closedUrl, {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                });
                var closedIssues = 0;
                if (closedResponse.data[0] != undefined) {
                    closedIssues = closedResponse.data[0].number; // this number also includes pull requests
                    //console.log('Closed Issue Count: ', closedIssues);
                }
                // console.log('Open Issue Count: ', openIssues);
                // console.log('Closed Issue Count: ', closedIssues);
                if (closedIssues + openIssues === 0) {
                    return 0;
                }
                else if (closedIssues === undefined) {
                    return openIssues;
                }
                const ratio = openIssues / (openIssues + closedIssues);
                return ratio;
            }
            catch (error) {
                console.error('Error when fetching open issue ratio count: ', error.message);
                throw new Error('Error when fetching open issue ratio count');
            }
        });
    }
    /**
     * Fetches the last commit date of the repository
     *
     * @returns the date of the last commit
     */
    getLastCommit() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${GITHUB_API}/repos/${this.owner}/${this.repoName}/commits`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                });
                const lastCommit = response.data[0];
                // console.log('Last Commit Data: ', lastCommit.commit.author.date);
                return lastCommit.commit.author.date;
            }
            catch (error) {
                console.error('Error when fetching last commit data: ', error.message);
                throw new Error('Error when fetching last commit data');
            }
        });
    }
    correctnessChecker() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Correctness Checker:');
            console.log('Maintainer Score: ', yield this.getMaintainerScore());
        });
    }
}
exports.Maintainer = Maintainer;
// Testing
// test repo 1 (N/A)
// const maintainerChecker = new Maintainer('hasansultan92', 'watch.js'); // score is 0.4 (0 open issues)
// test repo 2 (should have high score)
// const maintainerChecker = new Maintainer('mrdoob', 'three.js'); //score is 1 (ratio is 0.0175)
// test repo 3 (should have medium score)
// const maintainerChecker = new Maintainer('socketio', 'socket.io'); // score is 0.8 (ratio is 0.0333)
// test repo 4 (N/A)
// const maintainerChecker = new Maintainer('prathameshnetake', 'libvlc'); // score is 0 (0 open issues)
// test repo 5 (should have high score)
// const maintainerChecker = new Maintainer('facebook', 'react'); // score is 0.8 (ratio is 0.0255)
// test repo 6 (N/A)
// const maintainerChecker = new Maintainer('ryanve', 'unlicensed'); // score is 0 (0 open issues)
// uncomment this to run test
// maintainerChecker.correctnessChecker();
