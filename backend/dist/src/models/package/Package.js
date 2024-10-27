"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
/* Package : Class to represent package data
 * Contains metadata and data
 */
class Package {
    /* Constructor
     * @param metadata: PackageMetadata - metadata of the package
     * @param data: PackageData - data of the package
     */
    constructor(metadata, data) {
        this.metadata = metadata;
        this.data = data;
    }
    // getJson : Returns JSON representation of the package (metadata and data)
    getJson() {
        return {
            metadata: this.metadata.getJson(),
            data: this.data.getJson()
        };
    }
}
exports.Package = Package;
