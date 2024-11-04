export class PackageRating {
    private busFactor: number;
    private correctness: number;
    private rampUp: number;
    private responsiveMaintainter: number;
    private licenseScore: number;
    private goodPinningPractice: number;
    private pullRequest: number;
    private netScore: number;

    constructor(busFactor: number, correctness: number, rampUp: number, responsiveMaintainter: number, licenseScore: number, goodPinningPractice: number, pullRequest: number, netScore: number) {
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
        }
    }
}