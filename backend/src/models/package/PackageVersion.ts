import * as semver from 'semver';

export class PackageVersion {
    private version: string;
    
    constructor(version: string) {
        this.version = version.replace(/\s+/g, '');
    }

    static isValidVersion(version: string): boolean {
        const exactPattern = /^\d+\.\d+\.\d+$/;

        return Boolean(exactPattern.test(version) && semver.valid(version));
    }

    matches(otherVersion: PackageVersion): boolean {
        return this.version === otherVersion.getVersion() ? true : false;
    }

    getVersion(): string {
        return this.version;
    }
}