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
exports.BusFactor = void 0;
const axios_1 = __importDefault(require("axios"));
class BusFactor {
    constructor(repoOwner, repoName) {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
    }
    calculateBusFactor() {
        return __awaiter(this, void 0, void 0, function* () {
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
            const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/commits?since=${twoYearsAgo.toISOString()}`;
            //console.log(url);
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`
                    }
                });
                const contributors = new Set();
                // Extract the author name from each commit
                response.data.forEach((commit) => {
                    contributors.add(commit.commit.author.name);
                });
                //return Array.from(contributors);
                const numberOfContributors = contributors.size;
                const score = this.calculateBusFactorScore(numberOfContributors);
                return parseFloat(score.toFixed(3));
            }
            catch (error) {
                console.error('BusFactor -> Error fetching commits:', error.message);
                process.exit(1);
            }
        });
    }
    calculateBusFactorScore(contributors) {
        // Calculate the bus factor score based on the number of contributors
        let score = 0;
        if (contributors >= 10) {
            score = 1;
        }
        else if (contributors >= 5) {
            score = 0.500;
        }
        else if (contributors >= 2) {
            score = 0.300;
        }
        else if (contributors >= 1) {
            score = 0.100;
        }
        else {
            score = 0.000;
        }
        return parseFloat(score.toFixed(3));
    }
}
exports.BusFactor = BusFactor;
