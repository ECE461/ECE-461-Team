export class PackageRating {
    private packageRating: any;

    // Set up with the getMetrics 
    constructor(packageRating: any) {
        this.packageRating = packageRating
    }

    getJson() {
        return {
            BusFactor: this.packageRating.busFactorValue,
            BusFactorLatency: this.packageRating.busFactorLatency,
            Correctness: this.packageRating.correctnessValue,
            CorrectnessLatency: this.packageRating.correctnessLatency,
            RampUp: this.packageRating.rampUpValue,
            RampUpLatency:this.packageRating.rampUpLatency,
            ResponsiveMaintainter: this.packageRating.maintainerValue,
            ResponsiveMaintainerLatency: this.packageRating.maintainerLatency,
            LicenseScore: this.packageRating.licenseValue,
            LicenseScoreLatency: this.packageRating.licenseLatency,
            GoodPinningPractice: this.packageRating.dependencyValue,
            GoodPinningPracticeLatency: this.packageRating.dependencyLatency,
            PullRequest: this.packageRating.pullRequestValue,
            PullRequestLatency: this.packageRating.pullRequestLatency,
            NetScore: this.packageRating.netScore,
            NetScoreLatency: this.packageRating.netLatency
        }
    }
}