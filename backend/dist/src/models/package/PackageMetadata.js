"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageMetadata = void 0;
const PackageName_1 = require("./PackageName");
const PackageVersion_1 = require("./PackageVersion");
const PackageID_1 = require("./PackageID");
/* PackageMetadata: Class to represent package metadata
 * Contains: name, version, and id
 */
class PackageMetadata {
    /* Constructor
     * @param name: string - name of the package
     * @param version: string - version of the package
     */
    constructor(name, version) {
        this.name = new PackageName_1.PackageName(name);
        this.version = new PackageVersion_1.PackageVersion(version);
        this.id = new PackageID_1.PackageID(name, version);
    }
    setUrl(url) {
        if (!url) {
            throw new Error('URL cannot be empty');
        }
        this.url = url;
    }
    setReadMe(readMe) {
        this.readMe = readMe;
    }
    // getName : Returns name of the package
    getName() {
        return this.name.getName();
    }
    // getVersion : Returns version of the package
    getVersion() {
        return this.version.getVersion();
    }
    // getId : Returns ID of the package
    getId() {
        return this.id.getId();
    }
    // getJson : Returns JSON representation of the package metadata
    getJson() {
        return {
            Name: this.name.getName(),
            Version: this.version.getVersion(),
            ID: this.id.getId()
        };
    }
    getUrl() {
        if (!this.url) {
            throw new Error('URL not set');
        }
        return this.url;
    }
    getReadMe() {
        if (!this.readMe) {
            throw new Error('ReadMe not set');
        }
        return this.readMe;
    }
}
exports.PackageMetadata = PackageMetadata;
