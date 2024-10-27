"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageRating = void 0;
class PackageRating {
    constructor(busFactor, correctness, rampUp, responsiveMaintainter, licenseScore, goodPinningPractice, pullRequest, netScore) {
        // TODO: might change this to just take in the PackageID and set scores from database
        this.busFactor = busFactor;
        this.correctness = correctness;
        this.rampUp = rampUp;
        this.responsiveMaintainter = responsiveMaintainter;
        this.licenseScore = licenseScore;
        this.goodPinningPractice = goodPinningPractice;
        this.pullRequest = pullRequest;
        this.netScore = netScore;
    }
    getJson() {
        return {
            BusFactor: this.busFactor,
            Correctness: this.correctness,
            RampUp: this.rampUp,
            ResponsiveMaintainter: this.responsiveMaintainter,
            LicenseScore: this.licenseScore,
            GoodPinningPractice: this.goodPinningPractice,
            PullRequest: this.pullRequest,
            NetScore: this.netScore
        };
    }
}
exports.PackageRating = PackageRating;
