import { PackageVersion } from "./PackageVersion";
import semver from 'semver';

export class PackageVersionQuery {
    private versionQuery: string;
    
    constructor(versionQuery: string) {
        // Set version query with no spaces
        this.versionQuery = versionQuery.replace(/\s/g, '');
    }

    static isValidVersionQuery(versionQuery: string): boolean {
        const rangePattern = /^\d+\.\d+\.\d+\s*-\s*\d+\.\d+\.\d+$/;

        if (PackageVersion.isValidVersion(versionQuery)) {
            return true; // Exact version (e.g., '1.2.3')
        }
        if (versionQuery.startsWith('^') && PackageVersion.isValidVersion(versionQuery.slice(1))) {
            return true; // Caret version (e.g., '^1.2.3')
        }
        if (versionQuery.startsWith('~') && PackageVersion.isValidVersion(versionQuery.slice(1))) {
            return true; // Tilde version (e.g., '~1.2.3')
        }
        if (rangePattern.test(versionQuery)) {
            const [leftVersion, rightVersion] = versionQuery.split('-').map(v => v.trim());
            
            // Ensure both versions are valid and left is less than or equal to right
            if (PackageVersion.isValidVersion(rightVersion) && PackageVersion.isValidVersion(leftVersion) && semver.lte(leftVersion, rightVersion)) {
                return true;
            }
        }
        return false; // Invalid format
    }

    getVersionQueryType(): string {
        // Should have checked validity somewhere before calling this function
        if (this.versionQuery.startsWith("^")) return "Carat";
        if (this.versionQuery.startsWith("~")) return "Tilde";
        if (this.versionQuery.includes("-")) return "Range";
        return "Exact";
    }

    matches(version: string): boolean {
        return semver.satisfies(version, this.versionQuery);
    }

    getVersionQuery(): string {
        return this.versionQuery;
    }

}