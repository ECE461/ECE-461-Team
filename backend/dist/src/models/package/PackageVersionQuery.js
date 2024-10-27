"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageVersionQuery = void 0;
const PackageVersion_1 = require("./PackageVersion");
const semver_1 = __importDefault(require("semver"));
class PackageVersionQuery {
    constructor(versionQuery) {
        // Set version query with no spaces
        this.versionQuery = versionQuery.replace(/\s/g, '');
    }
    static isValidVersionQuery(versionQuery) {
        const rangePattern = /^\d+\.\d+\.\d+\s*-\s*\d+\.\d+\.\d+$/;
        if (PackageVersion_1.PackageVersion.isValidVersion(versionQuery)) {
            return true; // Exact version (e.g., '1.2.3')
        }
        if (versionQuery.startsWith('^') && PackageVersion_1.PackageVersion.isValidVersion(versionQuery.slice(1))) {
            return true; // Caret version (e.g., '^1.2.3')
        }
        if (versionQuery.startsWith('~') && PackageVersion_1.PackageVersion.isValidVersion(versionQuery.slice(1))) {
            return true; // Tilde version (e.g., '~1.2.3')
        }
        if (rangePattern.test(versionQuery)) {
            const [leftVersion, rightVersion] = versionQuery.split('-').map(v => v.trim());
            // Ensure both versions are valid and left is less than or equal to right
            if (PackageVersion_1.PackageVersion.isValidVersion(rightVersion) && PackageVersion_1.PackageVersion.isValidVersion(leftVersion) && semver_1.default.lte(leftVersion, rightVersion)) {
                return true;
            }
        }
        return false; // Invalid format
    }
    getVersionQueryType() {
        // Should have checked validity somewhere before calling this function
        if (this.versionQuery.startsWith("^"))
            return "Carat";
        if (this.versionQuery.startsWith("~"))
            return "Tilde";
        if (this.versionQuery.includes("-"))
            return "Range";
        return "Exact";
    }
    matches(version) {
        return semver_1.default.satisfies(version, this.versionQuery);
    }
    getVersionQuery() {
        return this.versionQuery;
    }
}
exports.PackageVersionQuery = PackageVersionQuery;
