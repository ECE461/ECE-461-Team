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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricManager = void 0;
// takes info from API and outputs metrics
const BusFactor_1 = require("./BusFactor");
const Maintainer_1 = require("./Maintainer");
const RampUp_1 = require("./RampUp");
const License_1 = require("./License");
const Correctness_1 = require("./Correctness");
const dotenv = __importStar(require("dotenv"));
const perf_hooks_1 = require("perf_hooks");
dotenv.config();
class MetricManager {
    /**
     * constructs a metrics manager for a GitHub repository
     *
     * @param path the path from the URL of the GitHub repository
     */
    constructor(path) {
        // extracts owner and repository name from the URL
        let pathParts = path.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
            this.owner = pathParts[0];
            this.repoName = pathParts[1];
        }
        else {
            throw new Error('Invalid GitHub repository URL');
        }
    }
    /**
     * get metrics calls all the metric classes and returns the net score of the package
     *
     * @returns the net score of the package
     */
    getMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Need to calculate in parrallel
            let NetStartTime = perf_hooks_1.performance.now();
            let startTime = perf_hooks_1.performance.now();
            let busFactorMetric = new BusFactor_1.BusFactor(this.owner, this.repoName);
            let busFactorValue = yield busFactorMetric.calculateBusFactor();
            let busFactorLatency = (perf_hooks_1.performance.now() - startTime) / 1000;
            startTime = perf_hooks_1.performance.now();
            let rampUpMetric = new RampUp_1.RampUp(this.owner, this.repoName);
            let rampUpValue = yield rampUpMetric.getRampUpScore();
            let rampUpLatency = (perf_hooks_1.performance.now() - startTime) / 1000;
            startTime = perf_hooks_1.performance.now();
            let licenseMetric = new License_1.License(this.owner, this.repoName);
            let licenseValue = yield licenseMetric.getRepoLicense();
            let licenseLatency = (perf_hooks_1.performance.now() - startTime) / 1000;
            startTime = perf_hooks_1.performance.now();
            let maintainerMetric = new Maintainer_1.Maintainer(this.owner, this.repoName);
            let maintainerValue = yield maintainerMetric.getMaintainerScore();
            let maintainerLatency = (perf_hooks_1.performance.now() - startTime) / 1000;
            startTime = perf_hooks_1.performance.now();
            let correctnessMetric = new Correctness_1.Correctness(this.owner, this.repoName);
            let correctnessValue = yield correctnessMetric.getCorrectnessScore();
            let correctnessLatency = (perf_hooks_1.performance.now() - startTime) / 1000;
            //console.log(`The Correctness Score is: ${correctnessValue}`);
            // Calculate the net score
            // (0.3 * busFactor + 0.2 * correctness + 0.2 * rampup + 0.3 * maintainer) * license
            let netScore = (0.3 * busFactorValue + 0.2 * correctnessValue + 0.2 * rampUpValue + 0.3 * maintainerValue) * licenseValue;
            let netLatency = (perf_hooks_1.performance.now() - NetStartTime) / 1000;
            //console.log(busFactorValue);
            // parseFloat(score.toFixed(3));
            return {
                netScore: parseFloat(netScore.toFixed(3)),
                netLatency: parseFloat(netLatency.toFixed(3)),
                rampUpValue: parseFloat(rampUpValue.toFixed(3)),
                rampUpLatency: parseFloat(rampUpLatency.toFixed(3)),
                correctnessValue: parseFloat(correctnessValue.toFixed(3)),
                correctnessLatency: parseFloat(correctnessLatency.toFixed(3)),
                busFactorValue: parseFloat(busFactorValue.toFixed(3)),
                busFactorLatency: parseFloat(busFactorLatency.toFixed(3)),
                maintainerValue: parseFloat(maintainerValue.toFixed(3)),
                maintainerLatency: parseFloat(maintainerLatency.toFixed(3)),
                licenseValue: parseFloat(licenseValue.toFixed(3)),
                licenseLatency: parseFloat(licenseLatency.toFixed(3))
            };
            // return `
            // URL: ${this.owner}/${this.repoName}
            // busFactorValue: ${parseFloat(busFactorValue.toFixed(3))} (Latency: ${busFactorLatency.toFixed(3)} s)
            // rampUpValue: ${parseFloat(rampUpValue.toFixed(3))} (Latency: ${rampUpLatency.toFixed(3)} s)
            // licenseValue: ${parseFloat(licenseValue.toFixed(3))} (Latency: ${licenseLatency.toFixed(3)} s)
            // maintainerValue: ${parseFloat(maintainerValue.toFixed(3))} (Latency: ${maintainerLatency.toFixed(3)} s)
            // correctnessValue: ${parseFloat(correctnessValue.toFixed(3))} (Latency: ${correctnessLatency.toFixed(3)} s)
            // Net Score: ${parseFloat(netScore.toFixed(3))} (Latency: ${netLatency.toFixed(3)} s)
            // `;
            // return '\nbusFactorValue: ' + parseFloat(busFactorValue.toFixed(3)) + 
            // '\n ' + 'rampUpValue: ' + parseFloat(rampUpValue.toFixed(3))
            // + '\n ' + 'liscenseValue: ' + parseFloat(licenseValue.toFixed(3))
            // + '\n ' + 'maintainerValue: ' + parseFloat(maintainerValue.toFixed(3))
            // + '\n ' + 'correctnessValue: ' + parseFloat(correctnessValue.toFixed(3))
            // + '\n ' + 'Net Score: ' + parseFloat(netScore.toFixed(3));
        });
    }
    /**
     * getOwnwer returns the bus factor of the package
     *
     * @returns the Owner of the package
     */
    getOwner() {
        return this.owner;
    }
    /**
     * getRepoName returns the repository name
     *
     * @returns the repository name
     */
    getRepoName() {
        return this.repoName;
    }
}
exports.MetricManager = MetricManager;
